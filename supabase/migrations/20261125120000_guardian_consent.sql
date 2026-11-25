alter table public.students add column guardian_consent_at timestamptz;

-- New students must go through save_student. Existing column-level UPDATE
-- grants still allow editing the profile, without writing the consent date.
revoke insert on public.students from authenticated;
drop function public.save_student(uuid, text, integer, boolean, uuid[], uuid, date, uuid, text, text, uuid, text, text, text, boolean);

create function public.save_student(
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
    where workspace_id = target_workspace_id and id = target_student_id
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

revoke all on function public.save_student(uuid, text, integer, boolean, uuid[], uuid, date, uuid, text, text, uuid, text, text, text, boolean, boolean)
from public, anon, authenticated;
grant execute on function public.save_student(uuid, text, integer, boolean, uuid[], uuid, date, uuid, text, text, uuid, text, text, text, boolean, boolean)
to authenticated;

create function public.record_guardian_consent(target_workspace_id uuid, target_student_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_role(target_workspace_id, 'teacher') then
    raise exception using errcode = '42501', message = 'teacher_required';
  end if;

  update public.students
  set guardian_consent_at = pg_catalog.now()
  where workspace_id = target_workspace_id and id = target_student_id and guardian_consent_at is null;

  return found or exists (
    select 1 from public.students
    where workspace_id = target_workspace_id and id = target_student_id and guardian_consent_at is not null
  );
end;
$$;

revoke all on function public.record_guardian_consent(uuid, uuid) from public, anon, authenticated;
grant execute on function public.record_guardian_consent(uuid, uuid) to authenticated;
