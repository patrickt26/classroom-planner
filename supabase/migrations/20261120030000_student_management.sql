create function private.populate_student_defaults(target_workspace_id uuid)
returns void
language sql
set search_path = ''
as $$
  insert into public.grades (workspace_id, name)
  select target_workspace_id, year_number || 'º ano'
  from pg_catalog.generate_series(1, 9) as year_number
  on conflict (workspace_id, name) do nothing;

  insert into public.subjects (workspace_id, name)
  select target_workspace_id, name
  from pg_catalog.unnest(array['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia']) as name
  on conflict (workspace_id, name) do nothing;
$$;

create function private.set_student_defaults_on_workspace_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.populate_student_defaults(new.workspace_id);
  return new;
end;
$$;

revoke all on function private.populate_student_defaults(uuid) from public, anon, authenticated;
revoke all on function private.set_student_defaults_on_workspace_creation() from public, anon, authenticated;

create trigger set_student_defaults after insert on public.workspaces
for each row execute function private.set_student_defaults_on_workspace_creation();

select private.populate_student_defaults(workspace_id) from public.workspaces;

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
  student_notes text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_student_id uuid;
begin
  if target_student_id is null then
    insert into public.students (workspace_id, name, birth_date, grade_id, school, hourly_rate, is_free, notes)
    values (target_workspace_id, student_name, student_birth_date, student_grade_id, student_school,
      student_hourly_rate, student_is_free, student_notes)
    returning id into saved_student_id;
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

revoke all on function public.save_student(uuid, text, integer, boolean, uuid[], uuid, date, uuid, text, text)
from public, anon, authenticated;
grant execute on function public.save_student(uuid, text, integer, boolean, uuid[], uuid, date, uuid, text, text)
to authenticated;
