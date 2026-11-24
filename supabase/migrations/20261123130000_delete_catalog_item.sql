-- A subject assigned to a student is in use, even without any lessons.
alter table public.student_subjects
  drop constraint student_subjects_workspace_id_subject_id_fkey,
  add foreign key (workspace_id, subject_id) references public.subjects (workspace_id, id);

create function public.delete_catalog_item(target_workspace_id uuid, catalog_table text, item_id uuid)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  deleted_id uuid;
begin
  if not public.has_role(target_workspace_id, 'teacher') then
    raise insufficient_privilege;
  end if;

  case catalog_table
    when 'grades' then
      delete from public.grades where workspace_id = target_workspace_id and id = item_id
      returning id into deleted_id;
    when 'subjects' then
      delete from public.subjects where workspace_id = target_workspace_id and id = item_id
      returning id into deleted_id;
    else
      raise invalid_parameter_value;
  end case;
  return deleted_id;
exception when foreign_key_violation then
  raise exception using errcode = '23503', message = 'Este item já está em uso; arquive em vez de excluir.';
end;
$$;

revoke all on function public.delete_catalog_item(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.delete_catalog_item(uuid, text, uuid) to authenticated;
