alter table public.grades add column archived_at timestamptz;
alter table public.subjects add column archived_at timestamptz;

-- Keep the teacher-only RLS policies for reads, including historical joins.
revoke insert, delete on public.grades, public.subjects from authenticated;
grant insert (workspace_id, name), update (archived_at)
  on public.grades, public.subjects to authenticated;

create unique index grades_workspace_normalized_name_key
  on public.grades (workspace_id, lower(trim(name)));
create unique index subjects_workspace_normalized_name_key
  on public.subjects (workspace_id, lower(trim(name)));

create function public.check_active_grade()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.grade_id is null then
    return null;
  end if;
  if tg_op = 'UPDATE' and (new.workspace_id, new.grade_id) = (old.workspace_id, old.grade_id) then
    return null;
  end if;

  perform 1 from public.grades
  where workspace_id = new.workspace_id and id = new.grade_id and archived_at is null
  for share;
  if not found then
    raise exception using errcode = '23503', message = 'grade_unavailable';
  end if;
  return null;
end;
$$;

create function public.check_active_subject()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.subject_id is null then
    return null;
  end if;
  if tg_op = 'UPDATE' and (new.workspace_id, new.subject_id) = (old.workspace_id, old.subject_id) then
    return null;
  end if;

  -- Generated occurrences and makeups inherit the subject of an existing record.
  if tg_table_name = 'lessons' and tg_op = 'INSERT' then
    if exists (
      select 1 from public.recurrences
      where workspace_id = new.workspace_id and id = new.recurrence_id
        and student_id = new.student_id and subject_id = new.subject_id
    ) or exists (
      select 1 from public.lessons
      where workspace_id = new.workspace_id and id = new.rescheduled_from_id
        and student_id = new.student_id and subject_id = new.subject_id
    ) then
      return null;
    end if;
  end if;

  perform 1 from public.subjects
  where workspace_id = new.workspace_id and id = new.subject_id and archived_at is null
  for share;
  if not found then
    raise exception using errcode = '23503', message = 'subject_unavailable';
  end if;
  return null;
end;
$$;

-- AFTER leaves existing student-subject links untouched by INSERT ... ON CONFLICT DO NOTHING.
create trigger check_active_grade
  after insert or update of workspace_id, grade_id on public.students
  for each row execute function public.check_active_grade();
create trigger check_active_subject
  after insert or update of workspace_id, subject_id on public.student_subjects
  for each row execute function public.check_active_subject();
create trigger check_active_subject
  after insert or update of workspace_id, subject_id on public.recurrences
  for each row execute function public.check_active_subject();
create trigger check_active_subject
  after insert or update of workspace_id, subject_id on public.lessons
  for each row execute function public.check_active_subject();

revoke all on function public.check_active_grade(), public.check_active_subject()
  from public, anon, authenticated;
