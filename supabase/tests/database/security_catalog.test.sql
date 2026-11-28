begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

select is_empty($sql$
  select c.oid::regclass
  from pg_class c
  where c.relnamespace = 'public'::regnamespace
    and c.relkind in ('r', 'p', 'f')
    and not c.relrowsecurity
$sql$, 'Todas as tabelas de public têm RLS');

-- Expand both relation and column ACLs. Grantee 0 is PUBLIC, and USAGE
-- includes grants that anon inherits through role memberships.
select is_empty($sql$
  with relations as (
    select oid, relkind, relowner, relacl
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relkind in ('r', 'p', 'f', 'v', 'm', 'S')
  ), privileges as (
    select r.oid, null::name as column_name, acl.grantee, acl.privilege_type
    from relations r
    cross join lateral aclexplode(coalesce(
      r.relacl,
      acldefault(case when r.relkind = 'S' then 's'::"char" else 'r'::"char" end, r.relowner)
    )) acl
    union all
    select r.oid, a.attname, acl.grantee, acl.privilege_type
    from relations r
    join pg_attribute a on a.attrelid = r.oid and a.attnum > 0 and not a.attisdropped
    cross join lateral aclexplode(a.attacl) acl
  )
  select oid::regclass, column_name, privilege_type
  from privileges
  where case when grantee = 0 then true else pg_has_role('anon', grantee, 'USAGE') end
$sql$, 'anon e PUBLIC não recebem privilégios em relações ou colunas de public');

select is_empty($sql$
  select p.oid::regprocedure
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private')
    and (
      not exists (
        select from unnest(p.proconfig) as settings(setting)
        where setting like 'search_path=%'
      )
      or (p.prosecdef and not ('search_path=""' = any(p.proconfig)))
    )
$sql$, 'Rotinas de public e private fixam search_path, vazio para SECURITY DEFINER');

select is_empty($sql$
  select p.oid::regprocedure
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private')
    and p.prosecdef
    and has_function_privilege('anon', p.oid, 'EXECUTE')
$sql$, 'anon não executa rotinas SECURITY DEFINER da aplicação');

-- Match full signatures so that a new overload also requires review.
select is_empty($sql$
  with allowed(signature) as (
    values
      -- Grava aluno, responsável e vínculos juntos, com autorização.
      ('public.save_student(uuid,text,integer,boolean,uuid[],uuid,date,uuid,text,text,uuid,text,text,text,boolean,boolean)'),
      -- Quita cobranças e registra o pagamento na mesma transação.
      ('public.record_payment(uuid,uuid,uuid[],date,public.payment_method,text)'),
      -- Reabre cobranças preservando o histórico do pagamento.
      ('public.reverse_payment(uuid,uuid)'),
      -- Registra a data de autorização definida pelo banco.
      ('public.record_guardian_consent(uuid,uuid)'),
      -- Exclui somente aulas avulsas elegíveis pela RPC.
      ('public.delete_lesson(uuid,uuid)'),
      -- Exclui itens de catálogo sem vínculos pela RPC.
      ('public.delete_catalog_item(uuid,text,uuid)'),
      -- Trigger que sincroniza ocorrências ao gravar uma recorrência.
      ('public.refresh_recurrence()')
  )
  select p.oid::regprocedure
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and p.prosecdef
    and not exists (select from allowed where to_regprocedure(signature) = p.oid)
$sql$, 'Toda rotina SECURITY DEFINER de public consta na lista revisada');

select is_empty($sql$
  select p.oid::regprocedure
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and (
      has_function_privilege('anon', p.oid, 'EXECUTE')
      or has_function_privilege('authenticated', p.oid, 'EXECUTE')
    )
$sql$, 'anon e authenticated não executam rotinas de private');

select is_empty($sql$
  select c.oid::regclass
  from pg_class c
  where c.relnamespace = 'public'::regnamespace
    and c.relkind = 'v'
    and not exists (
      select from pg_options_to_table(c.reloptions)
      where case when option_name = 'security_invoker' then option_value::boolean else false end
    )
$sql$, 'Todas as visões de public usam security_invoker');

-- A publicação está vazia. Registre a decisão antes de permitir uma tabela.
select is_empty($sql$
  select schemaname, tablename
  from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public'
$sql$, 'Nenhuma tabela de public está publicada no Supabase Realtime');

select * from finish();
rollback;
