create function public.save_student_guardian(
  target_workspace_id uuid,
  target_student_id uuid,
  guardian_name text,
  guardian_relationship text,
  financial_guardian boolean,
  guardian_phone text default null,
  target_guardian_id uuid default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- The student row serializes changes to its guardian links.
  perform 1 from public.students
  where workspace_id = target_workspace_id and id = target_student_id
  for update;

  if not found then
    return false;
  end if;

  if target_guardian_id is not null and not exists (
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
      and is_financial_guardian
      and guardian_id is distinct from target_guardian_id;
  end if;

  if target_guardian_id is null then
    insert into public.guardians (workspace_id, name, phone)
    values (target_workspace_id, guardian_name, guardian_phone)
    returning id into target_guardian_id;

    insert into public.student_guardians (
      workspace_id, student_id, guardian_id, relationship, is_financial_guardian
    )
    values (
      target_workspace_id, target_student_id, target_guardian_id,
      guardian_relationship, financial_guardian
    );
  else
    update public.guardians
    set name = guardian_name, phone = guardian_phone
    where workspace_id = target_workspace_id and id = target_guardian_id;

    update public.student_guardians
    set relationship = guardian_relationship, is_financial_guardian = financial_guardian
    where workspace_id = target_workspace_id and student_id = target_student_id
      and guardian_id = target_guardian_id;
  end if;

  return true;
end;
$$;

create function public.remove_student_guardian(
  target_workspace_id uuid,
  target_student_id uuid,
  target_guardian_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform 1 from public.students
  where workspace_id = target_workspace_id and id = target_student_id
  for update;

  if not found then
    return false;
  end if;

  -- Lock the guardian before checking links so concurrent removals or inserts
  -- cannot leave an orphan or cause a new link to be deleted by cascade.
  perform 1 from public.guardians
  where workspace_id = target_workspace_id and id = target_guardian_id
  for update;

  delete from public.student_guardians
  where workspace_id = target_workspace_id and student_id = target_student_id
    and guardian_id = target_guardian_id;

  if not found then
    return false;
  end if;

  delete from public.guardians as guardian
  where guardian.workspace_id = target_workspace_id and guardian.id = target_guardian_id
    and not exists (
      select 1 from public.student_guardians as link
      where link.workspace_id = guardian.workspace_id and link.guardian_id = guardian.id
    );

  return true;
end;
$$;

revoke all on function public.save_student_guardian(uuid, uuid, text, text, boolean, text, uuid)
from public, anon, authenticated;
grant execute on function public.save_student_guardian(uuid, uuid, text, text, boolean, text, uuid)
to authenticated;

revoke all on function public.remove_student_guardian(uuid, uuid, uuid)
from public, anon, authenticated;
grant execute on function public.remove_student_guardian(uuid, uuid, uuid)
to authenticated;
