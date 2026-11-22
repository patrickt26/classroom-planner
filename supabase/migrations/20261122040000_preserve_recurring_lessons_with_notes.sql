create or replace function public.refresh_recurrence() returns trigger language plpgsql
security definer set search_path = '' as $$
declare
  zone text;
begin
  if tg_op = 'UPDATE' then
    select time_zone into strict zone from public.workspaces where workspace_id = new.workspace_id;
    -- Keep history, individual exceptions and lessons with plans or notes.
    delete from public.lessons where workspace_id = new.workspace_id and recurrence_id = new.id
      and starts_at >= now() and status in ('agendada','confirmada')
      and (new.ended_at is not null or extract(dow from starts_at at time zone zone) <> new.day_of_week
        or (starts_at at time zone zone)::time <> new.start_time
        or (starts_at at time zone zone)::date < new.start_date or (starts_at at time zone zone)::date > new.end_date)
      and not exists (select from public.lessons child where child.workspace_id = new.workspace_id
        and child.rescheduled_from_id = lessons.id)
      and not exists (select from public.lesson_plans plan where plan.workspace_id = new.workspace_id
        and plan.lesson_id = lessons.id)
      and not exists (select from public.lesson_notes note where note.workspace_id = new.workspace_id
        and note.lesson_id = lessons.id);
    update public.lessons set subject_id = new.subject_id, duration_minutes = new.duration_minutes,
      modality = new.modality, meeting_url = new.meeting_url
    where workspace_id = new.workspace_id and recurrence_id = new.id and starts_at >= now()
      and status in ('agendada','confirmada');
  end if;
  perform public.generate_recurrence(new, 8);
  return null;
end;
$$;
