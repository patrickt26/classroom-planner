alter table public.workspaces add column time_zone text not null default 'America/Sao_Paulo';
alter table public.recurrences add column ended_at timestamptz;
grant update (ended_at) on public.recurrences to authenticated;

create unique index lessons_recurrence_start_key on public.lessons (workspace_id, recurrence_id, starts_at);
create unique index lessons_original_key on public.lessons (workspace_id, rescheduled_from_id)
where rescheduled_from_id is not null;

-- Remember whether a pending replacement was requested for a missed or cancelled lesson.
alter table public.lessons add column pending_reason public.lesson_status
  check (pending_reason in ('falta', 'cancelada'));

create function public.remember_pending_reason() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'reposicao_pendente' and old.status in ('falta', 'cancelada') then
    if exists (select from public.lessons where workspace_id = new.workspace_id and rescheduled_from_id = new.id) then
      raise check_violation using message = 'Lesson already has a replacement';
    end if;
    new.pending_reason := old.status;
  elsif new.status <> 'reposicao_pendente' then
    new.pending_reason := null;
  end if;
  return new;
end;
$$;
create trigger remember_pending_reason before update of status on public.lessons
for each row execute function public.remember_pending_reason();

-- Called only while the caller holds the recurrence row lock.
create function public.generate_recurrence(r public.recurrences, weeks integer)
returns void language sql set search_path = '' as $$
  with zone as (
    select time_zone, (now() at time zone time_zone)::date as today
    from public.workspaces where workspace_id = r.workspace_id
  ), slots as (
    select today + n + r.start_time as local_start, time_zone
    from zone cross join generate_series(0, weeks * 7 - 1) n
    where r.ended_at is null and today + n >= r.start_date
      and (r.end_date is null or today + n <= r.end_date)
      and extract(dow from today + n) = r.day_of_week
  )
  insert into public.lessons (workspace_id, student_id, subject_id, recurrence_id, starts_at, duration_minutes, modality, meeting_url)
  select r.workspace_id, r.student_id, r.subject_id, r.id, local_start at time zone time_zone,
    r.duration_minutes, r.modality, r.meeting_url from slots
  where local_start at time zone time_zone >= now()
    and (local_start at time zone time_zone) at time zone time_zone = local_start
  on conflict (workspace_id, recurrence_id, starts_at) do nothing;
$$;

create function public.generate_recurring_lessons(weeks integer default 8)
returns void language plpgsql set search_path = '' as $$
declare
  r public.recurrences;
begin
  if weeks is null or weeks not between 1 and 52 then raise invalid_parameter_value; end if;
  for r in select * from public.recurrences where ended_at is null
    and (end_date is null or end_date >= current_date - 1) order by workspace_id, id for update
  loop
    perform public.generate_recurrence(r, weeks);
  end loop;
end;
$$;

create function public.refresh_recurrence() returns trigger language plpgsql
security definer set search_path = '' as $$
declare
  zone text;
begin
  if tg_op = 'UPDATE' then
    select time_zone into strict zone from public.workspaces where workspace_id = new.workspace_id;
    -- Keep history and individual exceptions, and preserve ids of surviving slots.
    delete from public.lessons where workspace_id = new.workspace_id and recurrence_id = new.id
      and starts_at >= now() and status in ('agendada','confirmada')
      and (new.ended_at is not null or extract(dow from starts_at at time zone zone) <> new.day_of_week
        or (starts_at at time zone zone)::time <> new.start_time
        or (starts_at at time zone zone)::date < new.start_date or (starts_at at time zone zone)::date > new.end_date)
      and not exists (select from public.lessons child where child.workspace_id = new.workspace_id
        and child.rescheduled_from_id = lessons.id);
    update public.lessons set subject_id = new.subject_id, duration_minutes = new.duration_minutes,
      modality = new.modality, meeting_url = new.meeting_url
    where workspace_id = new.workspace_id and recurrence_id = new.id and starts_at >= now()
      and status in ('agendada','confirmada');
  end if;
  perform public.generate_recurrence(new, 8);
  return null;
end;
$$;
create trigger refresh_recurrence after insert or update on public.recurrences
for each row execute function public.refresh_recurrence();

revoke all on function public.generate_recurrence(public.recurrences, integer),
  public.generate_recurring_lessons(integer), public.refresh_recurrence(), public.remember_pending_reason()
from public, anon, authenticated;

create function public.schedule_makeup(target_workspace_id uuid, original_id uuid, new_start timestamptz)
returns boolean language plpgsql set search_path = '' as $$
declare
  original public.lessons;
begin
  select * into original from public.lessons where workspace_id = target_workspace_id
    and id = original_id and status = 'reposicao_pendente' for update;
  if not found then return false; end if;
  insert into public.lessons(workspace_id, student_id, subject_id, starts_at, duration_minutes, modality, meeting_url, rescheduled_from_id)
  values (target_workspace_id, original.student_id, original.subject_id, new_start, original.duration_minutes,
    original.modality, original.meeting_url, original_id);
  update public.lessons set status = coalesce(original.pending_reason, 'cancelada') where workspace_id = target_workspace_id and id = original_id;
  return true;
end;
$$;
revoke all on function public.schedule_makeup(uuid, uuid, timestamptz) from public, anon;
grant execute on function public.schedule_makeup(uuid, uuid, timestamptz) to authenticated;

create extension if not exists pg_cron;
select cron.schedule('generate-recurring-lessons', '15 3 * * *', 'select public.generate_recurring_lessons()');
select public.generate_recurring_lessons();
