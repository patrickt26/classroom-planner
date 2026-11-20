create type public.lesson_modality as enum ('presencial', 'online');

create type public.lesson_status as enum (
  'agendada', 'confirmada', 'realizada', 'cancelada', 'falta', 'reposicao_pendente'
);

create table public.recurrences (
  workspace_id uuid not null references public.workspaces on delete cascade,
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  -- Sunday = 0, matching Postgres extract(dow from date).
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time without time zone not null check (start_time < time '24:00'),
  duration_minutes integer not null check (duration_minutes > 0),
  modality public.lesson_modality not null,
  meeting_url text check (meeting_url ~ '^https://meet[.]google[.]com/[^[:space:]]+$'),
  start_date date not null check (isfinite(start_date)),
  end_date date check (isfinite(end_date) and end_date >= start_date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  unique (workspace_id, student_id, id),
  foreign key (workspace_id, student_id) references public.students (workspace_id, id)
);

create table public.lessons (
  workspace_id uuid not null references public.workspaces on delete cascade,
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  subject_id uuid not null,
  starts_at timestamptz not null check (isfinite(starts_at)),
  duration_minutes integer not null check (duration_minutes > 0),
  modality public.lesson_modality not null,
  meeting_url text check (meeting_url ~ '^https://meet[.]google[.]com/[^[:space:]]+$'),
  recurrence_id uuid,
  status public.lesson_status not null default 'agendada',
  rescheduled_from_id uuid check (rescheduled_from_id <> id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  unique (workspace_id, student_id, id),
  foreign key (workspace_id, student_id) references public.students (workspace_id, id),
  foreign key (workspace_id, subject_id) references public.subjects (workspace_id, id),
  foreign key (workspace_id, student_id, recurrence_id)
    references public.recurrences (workspace_id, student_id, id),
  foreign key (workspace_id, student_id, rescheduled_from_id)
    references public.lessons (workspace_id, student_id, id)
);

create index lessons_workspace_starts_at_idx on public.lessons (workspace_id, starts_at);

alter table public.recurrences enable row level security;
create policy teacher_access on public.recurrences for all to authenticated
using (public.has_role(workspace_id, 'teacher'))
with check (public.has_role(workspace_id, 'teacher'));
revoke all on public.recurrences from public, anon, authenticated;
grant select, insert on public.recurrences to authenticated;
grant update (student_id, day_of_week, start_time, duration_minutes, modality, meeting_url, start_date, end_date)
on public.recurrences to authenticated;

create trigger set_updated_at before update on public.recurrences
for each row execute function public.set_updated_at();

alter table public.lessons enable row level security;
create policy teacher_access on public.lessons for all to authenticated
using (public.has_role(workspace_id, 'teacher'))
with check (public.has_role(workspace_id, 'teacher'));
revoke all on public.lessons from public, anon, authenticated;
grant select, insert on public.lessons to authenticated;
grant update (student_id, subject_id, starts_at, duration_minutes, modality, meeting_url, recurrence_id, status, rescheduled_from_id)
on public.lessons to authenticated;

create trigger set_updated_at before update on public.lessons
for each row execute function public.set_updated_at();
