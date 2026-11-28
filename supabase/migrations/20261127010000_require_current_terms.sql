-- Policies call this function as authenticated. The security_catalog test
-- forbids granting authenticated EXECUTE on routines in private.
create function public.current_terms_version() returns text
language sql immutable security invoker set search_path = ''
return '2026-11-24'::text;

revoke all on function public.current_terms_version() from public, anon, authenticated, service_role;
grant execute on function public.current_terms_version() to authenticated;

create function public.has_current_terms() returns boolean
language sql stable security invoker set search_path = ''
return exists (
  select 1 from public.terms_acceptances
  where user_id = (select auth.uid())
    and terms_version = public.current_terms_version()
);

revoke all on function public.has_current_terms() from public, anon, authenticated;
grant execute on function public.has_current_terms() to authenticated;

-- Preserve the current-terms check together with the second-factor check from #141
-- when both migrations are integrated.
create or replace function public.has_role(ws uuid, required_role public.workspace_role) returns boolean
language sql stable security invoker set search_path = '' as $$
  select (select public.has_current_terms()) and exists (
    select 1 from public.memberships
    where workspace_id = ws and user_id = (select auth.uid()) and role = required_role
  );
$$;

-- Workspace metadata requires current terms too. The app checks acceptance before
-- fetching the workspace, and users can still read their own memberships and
-- read or record their own acceptance to complete onboarding.
alter policy read_workspace on public.workspaces
using ((select public.has_current_terms()) and public.is_workspace_member(workspace_id));

alter policy insert_own_acceptances on public.terms_acceptances
with check (
  user_id = (select auth.uid())
  and terms_version = (select public.current_terms_version())
);
