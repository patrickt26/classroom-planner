create table public.lesson_plans (
  workspace_id uuid not null references public.workspaces on delete cascade,
  lesson_id uuid not null,
  objective text not null check (char_length(btrim(objective)) between 1 and 2000),
  content text not null default '' check (char_length(content) <= 4000),
  activities text not null default '' check (char_length(activities) <= 4000),
  materials text not null default '' check (char_length(materials) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, lesson_id),
  foreign key (workspace_id, lesson_id) references public.lessons (workspace_id, id)
);

alter table public.lesson_plans enable row level security;
create policy teacher_access on public.lesson_plans for all to authenticated
using (public.has_role(workspace_id, 'teacher'))
with check (public.has_role(workspace_id, 'teacher'));

revoke all on public.lesson_plans from public, anon, authenticated;
grant select on public.lesson_plans to authenticated;
grant insert (workspace_id, lesson_id, objective, content, activities, materials),
  update (objective, content, activities, materials) on public.lesson_plans to authenticated;

create trigger set_updated_at before update on public.lesson_plans
for each row execute function public.set_updated_at();

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
  );
$$;

create or replace function public.refresh_recurrence() returns trigger language plpgsql
security definer set search_path = '' as $$
declare
  zone text;
begin
  if tg_op = 'UPDATE' then
    select time_zone into strict zone from public.workspaces where workspace_id = new.workspace_id;
    -- Keep history, individual exceptions and lessons with plans.
    delete from public.lessons where workspace_id = new.workspace_id and recurrence_id = new.id
      and starts_at >= now() and status in ('agendada','confirmada')
      and (new.ended_at is not null or extract(dow from starts_at at time zone zone) <> new.day_of_week
        or (starts_at at time zone zone)::time <> new.start_time
        or (starts_at at time zone zone)::date < new.start_date or (starts_at at time zone zone)::date > new.end_date)
      and not exists (select from public.lessons child where child.workspace_id = new.workspace_id
        and child.rescheduled_from_id = lessons.id)
      and not exists (select from public.lesson_plans plan where plan.workspace_id = new.workspace_id
        and plan.lesson_id = lessons.id);
    update public.lessons set subject_id = new.subject_id, duration_minutes = new.duration_minutes,
      modality = new.modality, meeting_url = new.meeting_url
    where workspace_id = new.workspace_id and recurrence_id = new.id and starts_at >= now()
      and status in ('agendada','confirmada');
  end if;
  perform public.generate_recurrence(new, 8);
  return null;
end;
$$;
