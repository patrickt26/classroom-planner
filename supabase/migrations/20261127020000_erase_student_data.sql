alter table public.students add column anonymized_at timestamptz
  check (anonymized_at is null or archived_at is not null);

-- Keep the original guardian requirement until erasure, including when a
-- student is created and erased within the same transaction.
create or replace function private.check_new_student_guardian()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.students
    where workspace_id = new.workspace_id and id = new.id and anonymized_at is null
  ) and not exists (
    select 1 from public.student_guardians
    where workspace_id = new.workspace_id and student_id = new.id
  ) then
    raise exception using errcode = '23514', message = 'student_guardian_required';
  end if;
  return null;
end;
$$;

create or replace function private.check_remaining_student_guardian()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Serialize removals for this student. Writing the row also forces a
  -- serialization failure for a concurrent removal at repeatable read.
  update public.students
  set updated_at = pg_catalog.now()
  where workspace_id = old.workspace_id and id = old.student_id and anonymized_at is null;

  -- A cascading delete from the student or workspace needs no remaining link.
  if found and not exists (
    select 1 from public.student_guardians
    where workspace_id = old.workspace_id and student_id = old.student_id
  ) then
    raise exception using errcode = '23514', message = 'student_guardian_required';
  end if;
  return null;
end;
$$;

create or replace function public.save_student(
  target_workspace_id uuid,
  student_name text,
  student_hourly_rate integer,
  student_is_free boolean,
  selected_subject_ids uuid[],
  target_student_id uuid default null,
  student_birth_date date default null,
  student_grade_id uuid default null,
  student_school text default null,
  student_notes text default null,
  existing_guardian_id uuid default null,
  guardian_name text default null,
  guardian_phone text default null,
  guardian_relationship text default null,
  financial_guardian boolean default false,
  guardian_consent_confirmed boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_student_id uuid;
  guardian_saved boolean;
begin
  if not public.has_role(target_workspace_id, 'teacher') then
    raise exception using errcode = '42501', message = 'teacher_required';
  end if;

  if target_student_id is null then
    if guardian_consent_confirmed is not true then
      raise exception using errcode = '23514', message = 'guardian_consent_required';
    end if;
    if nullif(trim(guardian_relationship), '') is null
      or (existing_guardian_id is null and nullif(trim(guardian_name), '') is null) then
      raise exception using errcode = '23514', message = 'student_guardian_required';
    end if;

    insert into public.students (workspace_id, name, birth_date, grade_id, school, hourly_rate, is_free, notes, guardian_consent_at)
    values (target_workspace_id, student_name, student_birth_date, student_grade_id, student_school,
      student_hourly_rate, student_is_free, student_notes, pg_catalog.now())
    returning id into saved_student_id;

    if existing_guardian_id is null then
      guardian_saved := public.save_student_guardian(
        target_workspace_id, saved_student_id, guardian_name, guardian_relationship,
        financial_guardian, guardian_phone
      );
    else
      guardian_saved := public.link_existing_student_guardian(
        target_workspace_id, saved_student_id, existing_guardian_id,
        guardian_relationship, financial_guardian
      );
    end if;

    if not guardian_saved then
      raise exception using errcode = '23503', message = 'student_guardian_unavailable';
    end if;
  else
    update public.students
    set name = student_name, birth_date = student_birth_date, grade_id = student_grade_id,
      school = student_school, hourly_rate = student_hourly_rate, is_free = student_is_free, notes = student_notes
    where workspace_id = target_workspace_id and id = target_student_id and anonymized_at is null
    returning id into saved_student_id;

    if not found then
      return false;
    end if;
  end if;

  delete from public.student_subjects
  where workspace_id = target_workspace_id and student_id = saved_student_id
    and not (subject_id = any(selected_subject_ids));

  insert into public.student_subjects (workspace_id, student_id, subject_id)
  select target_workspace_id, saved_student_id, subject_id
  from pg_catalog.unnest(selected_subject_ids) as subject_id
  on conflict (workspace_id, student_id, subject_id) do nothing;

  return true;
end;
$$;

-- An erased profile is read-only, including writes from existing definer RPCs.
create function private.reject_erased_student_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception using errcode = '23514', message = 'student_anonymized';
end;
$$;
revoke all on function private.reject_erased_student_update() from public, anon, authenticated;
create trigger reject_erased_student_update before update on public.students
for each row when (old.anonymized_at is not null)
execute function private.reject_erased_student_update();

revoke update (archived_at) on public.students from authenticated;
create function public.set_student_archived(target_workspace_id uuid, target_student_id uuid, archive boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_role(target_workspace_id, 'teacher') then
    raise exception using errcode = '42501', message = 'teacher_required';
  end if;
  update public.students set archived_at = case when archive then now() end
  where workspace_id = target_workspace_id and id = target_student_id
    and anonymized_at is null and (archived_at is null) = archive;
  return found;
end;
$$;
revoke all on function public.set_student_archived(uuid, uuid, boolean) from public, anon, authenticated, service_role;
grant execute on function public.set_student_archived(uuid, uuid, boolean) to authenticated;

-- Serialize child writes with erasure. A stale form must not recreate a
-- guardian link, a lesson, pedagogical text or a payment note after erasure.
create function private.require_identifiable_student() returns trigger
language plpgsql set search_path = '' as $$
declare
  erased_at timestamptz;
begin
  if tg_table_name in ('lesson_notes', 'lesson_plans') then
    select s.anonymized_at into erased_at from public.students s
    join public.lessons l on (l.workspace_id, l.student_id) = (s.workspace_id, s.id)
    where (l.workspace_id, l.id) = (new.workspace_id, new.lesson_id) for share of s;
  else
    -- Reassigning a billed lesson can move its pending charge. Check the
    -- original student as well as the destination before allowing the move.
    if tg_table_name = 'lessons' and tg_op = 'UPDATE' and old.student_id <> new.student_id then
      select s.anonymized_at into erased_at from public.students s
      where (s.workspace_id, s.id) = (old.workspace_id, old.student_id) for share;
      if erased_at is not null then
        raise exception using errcode = '23514', message = 'student_anonymized';
      end if;
    end if;
    select s.anonymized_at into erased_at from public.students s
    where (s.workspace_id, s.id) = (new.workspace_id, new.student_id) for share;
  end if;
  if erased_at is not null then
    raise exception using errcode = '23514', message = 'student_anonymized';
  end if;
  return new;
end;
$$;
revoke all on function private.require_identifiable_student() from public, anon, authenticated;
create trigger require_identifiable_student before insert or update on public.student_guardians
for each row execute function private.require_identifiable_student();
create trigger require_identifiable_student before insert or update on public.student_subjects
for each row execute function private.require_identifiable_student();
create trigger require_identifiable_student before insert or update on public.lessons
for each row execute function private.require_identifiable_student();
create trigger require_identifiable_student before insert or update on public.recurrences
for each row execute function private.require_identifiable_student();
create trigger require_identifiable_student before insert or update on public.lesson_plans
for each row execute function private.require_identifiable_student();
create trigger require_identifiable_student before insert on public.lesson_notes
for each row execute function private.require_identifiable_student();
create trigger require_identifiable_student before insert or update of note on public.payments
for each row when (new.note <> '') execute function private.require_identifiable_student();

create function public.erase_student_data(target_workspace_id uuid, target_student_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  student public.students%rowtype;
  guardian_ids uuid[];
  deleted_notes integer := 0;
  deleted_plans integer := 0;
  deleted_subjects integer := 0;
  deleted_links integer := 0;
  deleted_guardians integer := 0;
  deleted_lessons integer := 0;
  deleted_recurrences integer := 0;
  cleared_lessons integer := 0;
  cleared_payments integer := 0;
  cleared_students integer := 0;
begin
  if not public.has_role(target_workspace_id, 'teacher') then
    raise exception using errcode = '42501', message = 'teacher_required';
  end if;
  select * into student from public.students
  where workspace_id = target_workspace_id and id = target_student_id for update;
  if not found or student.archived_at is null then
    raise exception using errcode = '23514', message = 'archived_student_required';
  end if;

  if student.anonymized_at is null then
    -- PostgREST supplies the fingerprint of the typed name with this request.
    -- Compare under the row lock so a rename invalidates a stale confirmation.
    if (nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-student-name-sha256')
      is distinct from encode(sha256(convert_to(student.name, 'UTF8')), 'hex') then
      raise exception using errcode = '23514', message = 'student_name_mismatch';
    end if;

    delete from public.lesson_notes n using public.lessons l
    where (n.workspace_id, n.lesson_id) = (l.workspace_id, l.id)
      and l.workspace_id = target_workspace_id and l.student_id = target_student_id;
    get diagnostics deleted_notes = row_count;
    delete from public.lesson_plans p using public.lessons l
    where (p.workspace_id, p.lesson_id) = (l.workspace_id, l.id)
      and l.workspace_id = target_workspace_id and l.student_id = target_student_id;
    get diagnostics deleted_plans = row_count;

    -- Detach retained rows first. A single DELETE can then remove all
    -- unbilled rescheduling chains, including their self-references.
    update public.lessons l set meeting_url = null, rescheduled_from_id = null, recurrence_id = null
    where l.workspace_id = target_workspace_id and l.student_id = target_student_id
      and (l.meeting_url is not null or l.rescheduled_from_id is not null or l.recurrence_id is not null)
      and exists (select from public.charges c where (c.workspace_id, c.lesson_id) = (l.workspace_id, l.id));
    get diagnostics cleared_lessons = row_count;
    delete from public.lessons l
    where l.workspace_id = target_workspace_id and l.student_id = target_student_id
      and not exists (select from public.charges c where (c.workspace_id, c.lesson_id) = (l.workspace_id, l.id));
    get diagnostics deleted_lessons = row_count;
    delete from public.recurrences where workspace_id = target_workspace_id and student_id = target_student_id;
    get diagnostics deleted_recurrences = row_count;
    update public.payments set note = ''
    where workspace_id = target_workspace_id and student_id = target_student_id and note <> '';
    get diagnostics cleared_payments = row_count;

    delete from public.student_subjects where workspace_id = target_workspace_id and student_id = target_student_id;
    get diagnostics deleted_subjects = row_count;
    update public.students set name = 'Aluno removido', birth_date = null, grade_id = null, school = null,
      notes = null, guardian_consent_at = null, anonymized_at = now()
    where workspace_id = target_workspace_id and id = target_student_id;
    get diagnostics cleared_students = row_count;

    -- Lock only this student's contacts, in stable order, before unlinking.
    select array_agg(locked.id) into guardian_ids from (
      select g.id from public.guardians g join public.student_guardians sg
        on (sg.workspace_id, sg.guardian_id) = (g.workspace_id, g.id)
      where sg.workspace_id = target_workspace_id and sg.student_id = target_student_id
      order by g.id for update of g
    ) locked;
    delete from public.student_guardians where workspace_id = target_workspace_id and student_id = target_student_id;
    get diagnostics deleted_links = row_count;
    delete from public.guardians g where g.workspace_id = target_workspace_id and g.id = any(guardian_ids)
      and not exists (select from public.student_guardians sg
        where (sg.workspace_id, sg.guardian_id) = (g.workspace_id, g.id));
    get diagnostics deleted_guardians = row_count;
  end if;

  return jsonb_build_object(
    'deleted', jsonb_build_object('lesson_notes', deleted_notes, 'lesson_plans', deleted_plans,
      'student_subjects', deleted_subjects, 'student_guardians', deleted_links, 'guardians', deleted_guardians,
      'lessons', deleted_lessons, 'recurrences', deleted_recurrences),
    'anonymized', jsonb_build_object('students', cleared_students, 'payments', cleared_payments, 'lessons', cleared_lessons)
  );
end;
$$;
revoke all on function public.erase_student_data(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.erase_student_data(uuid, uuid) to authenticated;
