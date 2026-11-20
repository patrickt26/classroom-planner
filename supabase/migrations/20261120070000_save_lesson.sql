create function public.save_lesson(
  target_workspace_id uuid,
  lesson_student_id uuid,
  lesson_subject_id uuid,
  lesson_starts_at timestamptz,
  lesson_duration_minutes integer,
  lesson_modality public.lesson_modality,
  lesson_status public.lesson_status,
  lesson_meeting_url text default null,
  target_lesson_id uuid default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_lesson_id uuid;
begin
  if not public.has_role(target_workspace_id, 'teacher') then
    raise insufficient_privilege;
  end if;

  if lesson_status not in ('agendada', 'confirmada', 'realizada', 'falta') then
    raise invalid_parameter_value;
  end if;

  -- Serialize agenda saves in the workspace so overlapping submissions see each other.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('save_lesson:' || target_workspace_id::text, 0)
  );

  if target_lesson_id is null then
    insert into public.lessons (workspace_id, student_id, subject_id, starts_at, duration_minutes, modality, meeting_url, status)
    values (target_workspace_id, lesson_student_id, lesson_subject_id, lesson_starts_at,
      lesson_duration_minutes, lesson_modality, lesson_meeting_url, lesson_status)
    returning id into saved_lesson_id;
  else
    update public.lessons
    set student_id = lesson_student_id,
      subject_id = lesson_subject_id,
      starts_at = lesson_starts_at,
      duration_minutes = lesson_duration_minutes,
      modality = lesson_modality,
      meeting_url = lesson_meeting_url,
      status = lesson_status
    where workspace_id = target_workspace_id and id = target_lesson_id
      and recurrence_id is null and rescheduled_from_id is null
      and status not in ('cancelada', 'reposicao_pendente')
    returning id into saved_lesson_id;

    if not found then
      return null;
    end if;
  end if;

  return exists (
    select 1 from public.lessons as other
    where other.workspace_id = target_workspace_id and other.id <> saved_lesson_id
      and other.status <> 'cancelada'
      and other.starts_at < lesson_starts_at + pg_catalog.make_interval(mins => lesson_duration_minutes)
      and lesson_starts_at < other.starts_at + pg_catalog.make_interval(mins => other.duration_minutes)
  );
end;
$$;

revoke all on function public.save_lesson(uuid, uuid, uuid, timestamptz, integer, public.lesson_modality, public.lesson_status, text, uuid)
from public, anon, authenticated;
grant execute on function public.save_lesson(uuid, uuid, uuid, timestamptz, integer, public.lesson_modality, public.lesson_status, text, uuid)
to authenticated;
