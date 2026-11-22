create or replace function public.schedule_makeup(target_workspace_id uuid, original_id uuid, new_start timestamptz)
returns boolean language plpgsql set search_path = '' as $$
declare
  original public.lessons;
begin
  select * into original from public.lessons where workspace_id = target_workspace_id
    and id = original_id and status = 'reposicao_pendente' for update;
  if not found then return false; end if;
  if new_start < original.starts_at then
    raise exception using errcode = '22023', message = 'makeup_before_original';
  end if;
  insert into public.lessons(workspace_id, student_id, subject_id, starts_at, duration_minutes, modality, meeting_url, rescheduled_from_id)
  values (target_workspace_id, original.student_id, original.subject_id, new_start, original.duration_minutes,
    original.modality, original.meeting_url, original_id);
  update public.lessons set status = coalesce(original.pending_reason, 'cancelada') where workspace_id = target_workspace_id and id = original_id;
  return true;
end;
$$;
