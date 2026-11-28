begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(18);

with test_users as (
  insert into auth.users(id) values
    ('00000000-0000-4000-8000-000000000001'),
    ('00000000-0000-4000-8000-000000000002')
  returning id
)
insert into public.terms_acceptances (user_id, terms_version)
select id, public.current_terms_version() from test_users;
select set_config('test.workspace_b', workspace_id::text, true) from memberships
where user_id = '00000000-0000-4000-8000-000000000002';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
select is((select count(*) from workspaces), 1::bigint, 'A professora vê apenas seu espaço');
select is((select count(*) from memberships), 1::bigint, 'A professora vê apenas seu vínculo');
select ok((select has_role(workspace_id,'teacher') from memberships), 'Cadastro cria vínculo de professora');
select ok(not is_workspace_member(current_setting('test.workspace_b')::uuid), 'Outro espaço não pertence à professora');
select is((select week_start from workspaces), 'monday'::week_start_day, 'O espaço começa com a semana na segunda-feira');
with changed as (update workspaces set week_start = 'sunday' returning week_start)
select is((select week_start from changed), 'sunday'::week_start_day, 'A professora pode escolher domingo');
with changed as (update workspaces set week_start = 'sunday' where workspace_id = current_setting('test.workspace_b')::uuid returning *)
select is(count(*), 0::bigint, 'A professora não muda o início da semana de outro espaço') from changed;
select throws_ok('update workspaces set week_start = ''tuesday''', '22P02', null, 'O início da semana aceita apenas segunda-feira ou domingo');
with changed as (update workspaces set name = 'Espaço A' returning *) select is(count(*), 1::bigint, 'Edita seu espaço') from changed;
with changed as (update workspaces set name = 'Outro' where workspace_id = current_setting('test.workspace_b')::uuid returning *)
select is(count(*), 0::bigint, 'Outro espaço fica protegido contra edição') from changed;
select throws_ok('update memberships set role = ''teacher''','42501',null,'Vínculos protegidos contra edição');
select throws_ok('delete from memberships','42501',null,'Vínculos protegidos contra exclusão');
select throws_ok('insert into memberships default values','42501',null,'Vínculos protegidos contra criação pelo cliente');

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
select is((select name from workspaces), 'Meu espaço', 'Segunda professora vê seu próprio espaço intacto');
select is((select week_start from workspaces), 'monday'::week_start_day, 'A preferência da segunda professora continua intacta');
reset role;
update memberships set role = 'student' where user_id = '00000000-0000-4000-8000-000000000002';
set local role authenticated;
with changed as (update workspaces set brand = 'Marca' returning *) select is(count(*), 0::bigint, 'Aluno não edita o espaço') from changed;
with changed as (update workspaces set week_start = 'sunday' returning *)
select is(count(*), 0::bigint, 'Aluno não altera o início da semana') from changed;
reset role;
update memberships set role = 'guardian' where user_id = '00000000-0000-4000-8000-000000000002';
set local role authenticated;
with changed as (update workspaces set brand = 'Marca' returning *) select is(count(*), 0::bigint, 'Responsável não edita o espaço') from changed;

select * from finish();
rollback;
