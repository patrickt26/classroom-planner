create table public.grades (
  workspace_id uuid not null references public.workspaces on delete cascade,
  id uuid not null default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  unique (workspace_id, name)
);

create table public.subjects (
  workspace_id uuid not null references public.workspaces on delete cascade,
  id uuid not null default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  unique (workspace_id, name)
);

create table public.students (
  workspace_id uuid not null references public.workspaces on delete cascade,
  id uuid not null default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  birth_date date,
  grade_id uuid,
  school text,
  hourly_rate integer not null,
  is_free boolean not null default false,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  foreign key (workspace_id, grade_id) references public.grades (workspace_id, id),
  check ((is_free and hourly_rate = 0) or (not is_free and hourly_rate > 0))
);

create table public.guardians (
  workspace_id uuid not null references public.workspaces on delete cascade,
  id uuid not null default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);

create table public.student_guardians (
  workspace_id uuid not null references public.workspaces on delete cascade,
  student_id uuid not null,
  guardian_id uuid not null,
  relationship text not null check (length(trim(relationship)) > 0),
  is_financial_guardian boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, student_id, guardian_id),
  foreign key (workspace_id, student_id) references public.students on delete cascade,
  foreign key (workspace_id, guardian_id) references public.guardians on delete cascade
);

create unique index student_guardians_financial_idx
  on public.student_guardians (workspace_id, student_id) where is_financial_guardian;

create table public.student_subjects (
  workspace_id uuid not null references public.workspaces on delete cascade,
  student_id uuid not null,
  subject_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, student_id, subject_id),
  foreign key (workspace_id, student_id) references public.students on delete cascade,
  foreign key (workspace_id, subject_id) references public.subjects on delete cascade
);

alter table public.grades enable row level security;
create policy teacher_access on public.grades for all to authenticated
using (public.has_role(workspace_id, 'teacher'))
with check (public.has_role(workspace_id, 'teacher'));
revoke all on public.grades from public, anon, authenticated;
grant select, insert, delete on public.grades to authenticated;
grant update (name) on public.grades to authenticated;

create trigger set_updated_at before update on public.grades
for each row execute function public.set_updated_at();

alter table public.subjects enable row level security;
create policy teacher_access on public.subjects for all to authenticated
using (public.has_role(workspace_id, 'teacher'))
with check (public.has_role(workspace_id, 'teacher'));
revoke all on public.subjects from public, anon, authenticated;
grant select, insert, delete on public.subjects to authenticated;
grant update (name) on public.subjects to authenticated;

create trigger set_updated_at before update on public.subjects
for each row execute function public.set_updated_at();

alter table public.students enable row level security;
create policy teacher_access on public.students for all to authenticated
using (public.has_role(workspace_id, 'teacher'))
with check (public.has_role(workspace_id, 'teacher'));
revoke all on public.students from public, anon, authenticated;
grant select, insert on public.students to authenticated;
grant update (name, birth_date, grade_id, school, hourly_rate, is_free, notes, archived_at) on public.students to authenticated;

create trigger set_updated_at before update on public.students
for each row execute function public.set_updated_at();

alter table public.guardians enable row level security;
create policy teacher_access on public.guardians for all to authenticated
using (public.has_role(workspace_id, 'teacher'))
with check (public.has_role(workspace_id, 'teacher'));
revoke all on public.guardians from public, anon, authenticated;
grant select, insert, delete on public.guardians to authenticated;
grant update (name, phone) on public.guardians to authenticated;

create trigger set_updated_at before update on public.guardians
for each row execute function public.set_updated_at();

alter table public.student_guardians enable row level security;
create policy teacher_access on public.student_guardians for all to authenticated
using (public.has_role(workspace_id, 'teacher'))
with check (public.has_role(workspace_id, 'teacher'));
revoke all on public.student_guardians from public, anon, authenticated;
grant select, insert, delete on public.student_guardians to authenticated;
grant update (relationship, is_financial_guardian) on public.student_guardians to authenticated;

create trigger set_updated_at before update on public.student_guardians
for each row execute function public.set_updated_at();

alter table public.student_subjects enable row level security;
create policy teacher_access on public.student_subjects for all to authenticated
using (public.has_role(workspace_id, 'teacher'))
with check (public.has_role(workspace_id, 'teacher'));
revoke all on public.student_subjects from public, anon, authenticated;
grant select, insert, delete on public.student_subjects to authenticated;

create trigger set_updated_at before update on public.student_subjects
for each row execute function public.set_updated_at();
