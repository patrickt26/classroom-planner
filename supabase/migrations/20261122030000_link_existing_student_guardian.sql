create function public.link_existing_student_guardian(
  target_workspace_id uuid,
  target_student_id uuid,
  target_guardian_id uuid,
  guardian_relationship text,
  financial_guardian boolean
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Use the same lock order as removal, which can delete an unlinked contact.
  perform 1 from public.students
  where workspace_id = target_workspace_id and id = target_student_id
  for update;

  if not found then
    return false;
  end if;

  perform 1 from public.guardians
  where workspace_id = target_workspace_id and id = target_guardian_id
  for key share;

  if not found or exists (
    select 1 from public.student_guardians
    where workspace_id = target_workspace_id and student_id = target_student_id
      and guardian_id = target_guardian_id
  ) then
    return false;
  end if;

  if financial_guardian then
    update public.student_guardians
    set is_financial_guardian = false
    where workspace_id = target_workspace_id and student_id = target_student_id
      and is_financial_guardian;
  end if;

  insert into public.student_guardians (
    workspace_id, student_id, guardian_id, relationship, is_financial_guardian
  )
  values (
    target_workspace_id, target_student_id, target_guardian_id,
    guardian_relationship, financial_guardian
  );

  return true;
end;
$$;

revoke all on function public.link_existing_student_guardian(uuid, uuid, uuid, text, boolean)
from public, anon, authenticated;
grant execute on function public.link_existing_student_guardian(uuid, uuid, uuid, text, boolean)
to authenticated;
