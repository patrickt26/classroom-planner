begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(23);

\set teacher '00000000-0000-4000-8000-000000000001'
\set other_teacher '00000000-0000-4000-8000-000000000002'
select public.current_terms_version() as current_version \gset

insert into auth.users (id) values
  (:'teacher'), (:'other_teacher');
select workspace_id as ws from memberships where user_id = :'teacher' \gset
insert into students (workspace_id, name, hourly_rate) values (:'ws', 'Aluno A', 5000);
insert into grades (workspace_id, name) values (:'ws', 'Série livre') returning id as grade_id \gset

set local role authenticated;
set local request.jwt.claim.sub = :'teacher';
select ok(not has_current_terms(), 'Conta sem aceite não atende à exigência');
select is((select count(*) from memberships), 1::bigint, 'Pode ler o próprio vínculo antes de aceitar');
select is_empty('select * from workspaces', 'Não lê o espaço antes de aceitar');
select is_empty('select * from students', 'Não lê alunos antes de aceitar');
select throws_ok(format('select delete_catalog_item(%L, %L, %L)', :'ws', 'grades', :'grade_id'),
  '42501', null, 'Não executa RPC de professora antes de aceitar');
select throws_ok($$insert into terms_acceptances (user_id, terms_version)
  values (auth.uid(), 'anterior')$$, '42501', null, 'A API rejeita outra versão');

reset role;
insert into public.terms_acceptances (user_id, terms_version) values (:'teacher', 'anterior');
set local role authenticated;
select is((select terms_version from terms_acceptances), 'anterior', 'Pode ler o aceite histórico');
select ok(not has_current_terms(), 'Aceite antigo não atende à exigência');
select is_empty('select * from workspaces', 'Aceite antigo não libera o espaço');
select is_empty('select * from students', 'Aceite antigo não libera os alunos');
select throws_ok(format('select delete_catalog_item(%L, %L, %L)', :'ws', 'grades', :'grade_id'),
  '42501', null, 'Aceite antigo não libera a RPC de professora');
select throws_ok(format('insert into terms_acceptances (user_id, terms_version) values (%L, %L)',
  :'other_teacher', :'current_version'), '42501', null, 'Não pode aceitar em nome de outra pessoa');

select lives_ok(format('insert into terms_acceptances (user_id, terms_version) values (auth.uid(), %L)
  on conflict (user_id, terms_version) do nothing',
  :'current_version'), 'Pode registrar o próprio aceite vigente');
select is((select accepted_at from terms_acceptances where terms_version = :'current_version'),
  now(), 'O banco atribui a data e a hora');
select ok(has_current_terms(), 'Reconhece o aceite vigente');
select is((select workspace_id from workspaces), :'ws'::uuid, 'Aceite vigente libera o próprio espaço');
select is((select name from students), 'Aluno A', 'Aceite vigente libera a leitura dos alunos');
select is(delete_catalog_item(:'ws', 'grades', :'grade_id'), :'grade_id'::uuid,
  'Aceite vigente libera a RPC de professora');
select throws_ok(format('insert into terms_acceptances (user_id, terms_version) values (auth.uid(), %L)',
  :'current_version'), '23505', null, 'Cada versão tem um único aceite por pessoa');
select throws_ok($$update terms_acceptances set terms_version = 'outra'$$,
  '42501', null, 'Nem a própria pessoa pode alterar o aceite');
select throws_ok($$delete from terms_acceptances$$,
  '42501', null, 'Nem a própria pessoa pode apagar o aceite');
select throws_ok(format('insert into terms_acceptances (user_id, terms_version, accepted_at)
  values (auth.uid(), %L, now())', :'current_version'), '42501', null, 'O cliente não pode fornecer a data');

set local request.jwt.claim.sub = :'other_teacher';
select is((select count(*) from terms_acceptances), 0::bigint, 'Aceites de outra pessoa ficam privados');

select * from finish();
rollback;
