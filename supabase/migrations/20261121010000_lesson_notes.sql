create table public.lesson_notes (
  id bigint generated always as identity primary key,
  workspace_id uuid not null,
  lesson_id uuid not null,
  worked_on text not null check (char_length(btrim(worked_on)) between 1 and 4000),
  difficulties text not null default '' check (char_length(difficulties) <= 4000),
  next_steps text not null default '' check (char_length(next_steps) <= 4000),
  supersedes_id bigint,
  created_at timestamptz not null default clock_timestamp(),
  unique (workspace_id, lesson_id, id),
  -- A lesson has one first version, and each version can have only one successor.
  unique nulls not distinct (workspace_id, lesson_id, supersedes_id),
  foreign key (workspace_id, lesson_id) references public.lessons (workspace_id, id),
  foreign key (workspace_id, lesson_id, supersedes_id)
    references public.lesson_notes (workspace_id, lesson_id, id),
  check (supersedes_id < id)
);

alter table public.lesson_notes enable row level security;
create policy teacher_read on public.lesson_notes for select to authenticated
using (public.has_role(workspace_id, 'teacher'));
create policy teacher_append on public.lesson_notes for insert to authenticated
with check (public.has_role(workspace_id, 'teacher'));

revoke all on public.lesson_notes from public, anon, authenticated;
grant select on public.lesson_notes to authenticated;
grant insert (workspace_id, lesson_id, worked_on, difficulties, next_steps, supersedes_id)
on public.lesson_notes to authenticated;

create function public.save_lesson_note(
  target_workspace_id uuid,
  target_lesson_id uuid,
  note_worked_on text,
  note_difficulties text,
  note_next_steps text,
  previous_note_id bigint default null
)
returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.has_role(target_workspace_id, 'teacher') then
    return false;
  end if;

  if previous_note_id is null then
    -- Lock the lesson through the status update before adding its first note.
    update public.lessons set status = 'realizada'
    where workspace_id = target_workspace_id and id = target_lesson_id
      and status in ('agendada', 'confirmada', 'realizada');
    if not found then
      return false;
    end if;
  end if;

  insert into public.lesson_notes (workspace_id, lesson_id, worked_on, difficulties, next_steps, supersedes_id)
  values (target_workspace_id, target_lesson_id, note_worked_on, note_difficulties, note_next_steps, previous_note_id);
  return true;
end;
$$;

revoke all on function public.save_lesson_note(uuid, uuid, text, text, text, bigint)
from public, anon, authenticated;
grant execute on function public.save_lesson_note(uuid, uuid, text, text, text, bigint)
to authenticated;

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
  );
$$;
