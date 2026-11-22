drop function public.create_lesson_days(uuid, uuid, jsonb);

create function public.create_lesson_days(
  target_workspace_id uuid, lesson_student_id uuid, lesson_days jsonb, allow_conflicts boolean default false
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  zone text;
  day jsonb;
  block_index integer := 0;
  first_start timestamptz;
  first_date date;
  slot_time time;
  weekday integer;
  duration integer;
  span interval;
  weekly boolean;
  last_date date;
  conflict boolean;
  has_conflicts boolean := false;
begin
  if not public.has_role(target_workspace_id, 'teacher') then
    raise insufficient_privilege;
  end if;
  if jsonb_typeof(lesson_days) is distinct from 'array' or jsonb_array_length(lesson_days) = 0 then
    raise invalid_parameter_value;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('save_lesson:' || target_workspace_id::text, 0));
  select time_zone into strict zone from public.workspaces where workspace_id = target_workspace_id;

  for day in select value from jsonb_array_elements(lesson_days) loop
    block_index := block_index + 1;
    first_start := (day->>'starts_at')::timestamptz;
    first_date := (first_start at time zone zone)::date;
    slot_time := (first_start at time zone zone)::time;
    weekday := extract(dow from first_date);
    duration := (day->>'duration_minutes')::integer;
    span := make_interval(mins => duration);
    weekly := (day->>'weekly')::boolean;
    last_date := (day->>'end_date')::date;

    -- Check concrete bookings, including later occurrences and previous blocks.
    if weekly then
      select exists (
        select from public.lessons l
        cross join lateral public.weekly_lesson_slots(weekday, slot_time, first_date, last_date,
          ((l.starts_at - span) at time zone zone)::date,
          ((l.starts_at + make_interval(mins => l.duration_minutes)) at time zone zone)::date, zone) s
        where l.workspace_id = target_workspace_id and l.status <> 'cancelada'
          and s < l.starts_at + make_interval(mins => l.duration_minutes) and l.starts_at < s + span
      ) into conflict;
    else
      conflict := public.has_lesson_conflict(target_workspace_id, first_start, duration);
    end if;

    -- A long weekly lesson can also overlap the following week of its own series.
    if weekly and not conflict and span >= interval '6 days' then
      select exists (select from (
        select s, lag(s) over (order by s) as previous_slot
        from public.weekly_lesson_slots(weekday, slot_time, first_date, last_date,
          first_date, coalesce(last_date, greatest(first_date, (now() at time zone zone)::date) + 366 + 7), zone) s
      ) slots where s < previous_slot + span) into conflict;
    end if;

    -- The generator materializes eight weeks. Also compare active schedules
    -- whose occurrences may still be outside that window. A stored occurrence
    -- (including a cancellation) takes precedence over its projected slot.
    if not conflict then
      select exists (
        select from public.recurrences r
        cross join lateral (
          select greatest(first_date, r.start_date, (now() at time zone zone)::date) as common_start,
            make_interval(mins => r.duration_minutes) as other_span
        ) bounds
        cross join lateral (
          select first_start as starts_at where not weekly
          union all
          select * from public.weekly_lesson_slots(weekday, slot_time, first_date, last_date,
            (common_start::timestamp - span)::date,
            -- Include exceptions already on file and a full seasonal clock cycle
            -- after both schedules start, even when neither has an end date.
            coalesce(least(last_date, r.end_date) + ceil(extract(epoch from other_span) / 86400)::int,
              greatest(common_start, (select max(l.starts_at) at time zone zone
                from public.lessons l where l.workspace_id = r.workspace_id and l.recurrence_id = r.id)::date) + 366 + 7),
            zone) where weekly
        ) incoming
        cross join lateral public.weekly_lesson_slots(r.day_of_week, r.start_time, r.start_date, r.end_date,
          ((incoming.starts_at - other_span) at time zone zone)::date,
          ((incoming.starts_at + span) at time zone zone)::date, zone) other_start
        where r.workspace_id = target_workspace_id and r.ended_at is null
          and other_start < incoming.starts_at + span and incoming.starts_at < other_start + other_span
          and not exists (select from public.lessons l where l.workspace_id = r.workspace_id
            and l.recurrence_id = r.id and l.starts_at = other_start)
      ) into conflict;
    end if;
    if conflict then
      if allow_conflicts is not true then
        raise exclusion_violation using message = 'lesson_day_conflict', detail = block_index::text;
      end if;
      has_conflicts := true;
    end if;

    if weekly then
      insert into public.recurrences (workspace_id, student_id, subject_id, day_of_week, start_time,
        start_date, end_date, duration_minutes, modality, meeting_url)
      values (target_workspace_id, lesson_student_id, (day->>'subject_id')::uuid, weekday, slot_time,
        first_date, last_date, duration, (day->>'modality')::public.lesson_modality, day->>'meeting_url');
    else
      insert into public.lessons (workspace_id, student_id, subject_id, starts_at, duration_minutes, modality, meeting_url)
      values (target_workspace_id, lesson_student_id, (day->>'subject_id')::uuid, first_start, duration,
        (day->>'modality')::public.lesson_modality, day->>'meeting_url');
    end if;
  end loop;
  return has_conflicts;
exception
  when exclusion_violation then raise;
  when data_exception or integrity_constraint_violation then
    raise exception using errcode = sqlstate, message = 'invalid_lesson_day', detail = block_index::text;
end;
$$;

revoke all on function public.create_lesson_days(uuid, uuid, jsonb, boolean) from public, anon;
grant execute on function public.create_lesson_days(uuid, uuid, jsonb, boolean) to authenticated;
