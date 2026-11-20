create type public.workspace_role as enum ('teacher', 'student', 'guardian');

create table public.workspaces (
  workspace_id uuid primary key default gen_random_uuid(),
  name text not null default 'Meu espaço' check (length(trim(name)) between 1 and 100),
  brand text not null default '' check (length(brand) <= 100),
  settings jsonb not null default '{}' check (jsonb_typeof(settings) = 'object'),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.workspaces
for each row execute function public.set_updated_at();

create table public.memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  role public.workspace_role not null,
  primary key (user_id, workspace_id)
);
create index memberships_workspace_idx on public.memberships(workspace_id);

alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
revoke all on public.workspaces, public.memberships from public, anon, authenticated;
grant select on public.workspaces, public.memberships to authenticated;
grant update (name, brand) on public.workspaces to authenticated;

create policy own_memberships on public.memberships for select to authenticated
using (user_id = (select auth.uid()));

create function public.is_workspace_member(ws uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists(select 1 from public.memberships
    where workspace_id = ws and user_id = (select auth.uid()));
$$;
create function public.has_role(ws uuid, required_role public.workspace_role) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists(select 1 from public.memberships where workspace_id = ws
    and user_id = (select auth.uid()) and role = required_role);
$$;
create policy read_workspace on public.workspaces for select to authenticated
using (public.is_workspace_member(workspace_id));
create policy edit_workspace on public.workspaces for update to authenticated
using (public.has_role(workspace_id, 'teacher'))
with check (public.has_role(workspace_id, 'teacher'));

create schema if not exists private;
create function private.create_teacher_workspace() returns trigger
language plpgsql security definer set search_path = '' as $$
declare ws uuid;
begin
  insert into public.workspaces default values returning workspace_id into ws;
  insert into public.memberships(user_id, workspace_id, role) values (new.id, ws, 'teacher');
  return new;
end;
$$;
revoke all on function private.create_teacher_workspace() from public, anon, authenticated;
create trigger provision_teacher after insert on auth.users
for each row execute function private.create_teacher_workspace();

-- Give accounts created before this migration the same initial workspace.
do $$
declare account_id uuid; ws uuid;
begin
  for account_id in select id from auth.users loop
    insert into public.workspaces default values returning workspace_id into ws;
    insert into public.memberships values (account_id, ws, 'teacher');
  end loop;
end;
$$;
