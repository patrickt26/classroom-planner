create function public.can_delete_lesson(target_workspace_id uuid, target_lesson_id uuid)
returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (
    select from public.lessons as lesson
    where lesson.workspace_id = target_workspace_id
      and lesson.id = target_lesson_id
      -- Also enforce the teacher policy when called inside delete_lesson.
      and public.has_role(lesson.workspace_id, 'teacher')
      and lesson.status in ('agendada', 'confirmada')
      and lesson.recurrence_id is null
      and lesson.rescheduled_from_id is null
      and not exists (
        select from public.lessons as makeup
        where makeup.workspace_id = lesson.workspace_id
          and makeup.rescheduled_from_id = lesson.id
      )
  );
$$;

create function public.delete_lesson(target_workspace_id uuid, target_lesson_id uuid)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  deleted_start timestamptz;
begin
  -- The definer can delete, so apply the same teacher check as lessons RLS.
  if not public.has_role(target_workspace_id, 'teacher') then
    return null;
  end if;

  perform 1 from public.lessons
  where workspace_id = target_workspace_id and id = target_lesson_id
  for update;

  if not found or not public.can_delete_lesson(target_workspace_id, target_lesson_id) then
    return null;
  end if;

  delete from public.lessons
  where workspace_id = target_workspace_id and id = target_lesson_id
  returning starts_at into deleted_start;

  return deleted_start;
exception when foreign_key_violation then
  return null;
end;
$$;

-- When adding lesson plans, notes or charges, use non-cascading foreign keys
-- to lessons and include those references in can_delete_lesson.
revoke all on function public.can_delete_lesson(uuid, uuid), public.delete_lesson(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.can_delete_lesson(uuid, uuid), public.delete_lesson(uuid, uuid)
to authenticated;
