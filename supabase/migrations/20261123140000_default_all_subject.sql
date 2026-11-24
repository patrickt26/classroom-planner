create or replace function private.populate_student_defaults(target_workspace_id uuid)
returns void
language sql
set search_path = ''
as $$
  insert into public.grades (workspace_id, name)
  select target_workspace_id, year_number || 'º ano'
  from pg_catalog.generate_series(1, 9) as year_number
  on conflict (workspace_id, name) do nothing;

  insert into public.subjects (workspace_id, name)
  select target_workspace_id, name
  from pg_catalog.unnest(array['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Todas']) as name
  on conflict do nothing;
$$;

insert into public.subjects (workspace_id, name)
select workspace_id, 'Todas'
from public.workspaces
on conflict do nothing;
