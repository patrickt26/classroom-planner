-- Keep the rate that applied before each change, in the workspace's local calendar.
create table public.student_rate_history (
  workspace_id uuid not null,
  student_id uuid not null,
  changed_on date not null,
  previous_hourly_rate integer not null check (previous_hourly_rate >= 0),
  primary key (workspace_id, student_id, changed_on),
  foreign key (workspace_id, student_id) references public.students (workspace_id, id)
);

alter table public.student_rate_history enable row level security;
create policy teacher_read on public.student_rate_history for select to authenticated
using (public.has_role(workspace_id, 'teacher'));
revoke all on public.student_rate_history from public, anon, authenticated;
grant select on public.student_rate_history to authenticated;

create function private.record_student_rate_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.student_rate_history (workspace_id, student_id, changed_on, previous_hourly_rate)
  select old.workspace_id, old.id, (statement_timestamp() at time zone ws.time_zone)::date, old.hourly_rate
  from public.workspaces as ws where ws.workspace_id = old.workspace_id
  on conflict (workspace_id, student_id, changed_on) do nothing;
  return null;
end;
$$;
revoke all on function private.record_student_rate_change() from public, anon, authenticated;
create trigger record_student_rate_change after update of hourly_rate on public.students
for each row when (old.hourly_rate <> new.hourly_rate)
execute function private.record_student_rate_change();

create table public.charges (
  workspace_id uuid not null,
  lesson_id uuid not null,
  student_id uuid not null,
  hourly_rate integer not null check (hourly_rate > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  -- Round once to the nearest cent, including half-cent ties.
  amount_cents bigint generated always as ((hourly_rate::bigint * duration_minutes + 30) / 60) stored not null,
  payment_id uuid,
  primary key (workspace_id, lesson_id),
  foreign key (workspace_id, student_id, lesson_id)
    references public.lessons (workspace_id, student_id, id) on delete no action
);

alter table public.charges enable row level security;
create policy teacher_read on public.charges for select to authenticated
using (public.has_role(workspace_id, 'teacher'));
revoke all on public.charges from public, anon, authenticated;
grant select on public.charges to authenticated;

-- Release an unpaid charge before checking the lesson/student foreign key.
create function private.release_pending_lesson_charge() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.charges
  where workspace_id = old.workspace_id and lesson_id = old.id and payment_id is null;
  return new;
end;
$$;
revoke all on function private.release_pending_lesson_charge() from public, anon, authenticated;
create trigger release_pending_lesson_charge before update of status, student_id on public.lessons
for each row when (old.status = 'realizada' and (new.status <> old.status or new.student_id <> old.student_id))
execute function private.release_pending_lesson_charge();

create function private.bill_completed_lesson() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  rate integer;
  zone text;
  lesson_day date;
begin
  select ws.time_zone into strict zone from public.workspaces as ws where ws.workspace_id = new.workspace_id;
  lesson_day := (new.starts_at at time zone zone)::date;
  if tg_op = 'UPDATE' and old.status = 'realizada' and old.student_id = new.student_id
      and (old.starts_at at time zone zone)::date = lesson_day then
    if old.duration_minutes <> new.duration_minutes then
      update public.charges set duration_minutes = new.duration_minutes
      where workspace_id = new.workspace_id and lesson_id = new.id and payment_id is null;
    end if;
    return null;
  end if;

  select coalesce((
    select history.previous_hourly_rate from public.student_rate_history as history
    where history.workspace_id = student.workspace_id and history.student_id = student.id
      and history.changed_on > lesson_day
    order by history.changed_on limit 1
  ), student.hourly_rate) into strict rate
  from public.students as student
  where student.workspace_id = new.workspace_id and student.id = new.student_id;

  if rate > 0 then
    insert into public.charges (workspace_id, lesson_id, student_id, hourly_rate, duration_minutes)
    values (new.workspace_id, new.id, new.student_id, rate, new.duration_minutes)
    on conflict (workspace_id, lesson_id) do update
    set hourly_rate = excluded.hourly_rate, duration_minutes = excluded.duration_minutes
    where charges.payment_id is null;
  else
    delete from public.charges
    where workspace_id = new.workspace_id and lesson_id = new.id and payment_id is null;
  end if;
  return null;
end;
$$;
revoke all on function private.bill_completed_lesson() from public, anon, authenticated;
create trigger bill_completed_lesson after insert or update of status, student_id, starts_at, duration_minutes on public.lessons
for each row when (new.status = 'realizada') execute function private.bill_completed_lesson();

create or replace function public.can_delete_lesson(target_workspace_id uuid, target_lesson_id uuid)
returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (
    select from public.lessons as lesson
    where lesson.workspace_id = target_workspace_id
      and lesson.id = target_lesson_id
      and public.has_role(lesson.workspace_id, 'teacher')
      and lesson.status in ('agendada', 'confirmada')
      and lesson.recurrence_id is null
      and lesson.rescheduled_from_id is null
      and not exists (
        select from public.lessons as makeup
        where makeup.workspace_id = lesson.workspace_id
          and makeup.rescheduled_from_id = lesson.id
      )
      and not exists (
        select from public.lesson_plans as plan
        where plan.workspace_id = lesson.workspace_id and plan.lesson_id = lesson.id
      )
      and not exists (
        select from public.lesson_notes as note
        where note.workspace_id = lesson.workspace_id and note.lesson_id = lesson.id
      )
      and not exists (
        select from public.charges as charge
        where charge.workspace_id = lesson.workspace_id and charge.lesson_id = lesson.id
      )
  );
$$;
