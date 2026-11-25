create table public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, terms_version)
);

alter table public.terms_acceptances enable row level security;
create policy read_own_acceptances on public.terms_acceptances
  for select to authenticated using (user_id = (select auth.uid()));
create policy insert_own_acceptances on public.terms_acceptances
  for insert to authenticated with check (user_id = (select auth.uid()));

revoke all on public.terms_acceptances from public, anon, authenticated, service_role;
grant select, insert (user_id, terms_version) on public.terms_acceptances to authenticated;
