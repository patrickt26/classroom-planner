begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(11);

insert into auth.users (id) values
  ('07000000-0000-4000-8000-000000000001'),
  ('07000000-0000-4000-8000-000000000002');
select workspace_id as ws_a from memberships where user_id = '07000000-0000-4000-8000-000000000001' \gset
select workspace_id as ws_b from memberships where user_id = '07000000-0000-4000-8000-000000000002' \gset
select id as math_a from subjects where workspace_id = :'ws_a' and name = 'Matemática' \gset
select id as math_b from subjects where workspace_id = :'ws_b' and name = 'Matemática' \gset

delete from grades where workspace_id = :'ws_b' and name = '1º ano';
insert into grades (workspace_id, name) values (:'ws_b', 'Ano personalizado');
select private.populate_student_defaults(:'ws_b');
select is(
  (select count(*) from grades where workspace_id = :'ws_b'), 10::bigint,
  'A reposição dos padrões preserva os anos existentes e preenche o ano que falta'
);

set local role authenticated;
set local request.jwt.claim.sub = '07000000-0000-4000-8000-000000000001';

select results_eq(
  'select name from grades order by name',
  'select year_number || ''º ano'' from generate_series(1, 9) year_number',
  'A nova professora vê os nove anos do seu espaço'
);
select results_eq(
  'select name from subjects order by name',
  'select name from unnest(array[''Língua Portuguesa'', ''Matemática'', ''Ciências'', ''História'', ''Geografia'']) name order by name',
  'A nova professora vê as disciplinas padrão do seu espaço'
);
select is(save_student(:'ws_a', 'Aluno A', 8050, false, array[:'math_a'::uuid]), true, 'Cadastra aluno com disciplina');
select id as student_a from students where workspace_id = :'ws_a' and name = 'Aluno A' \gset
select is(
  (select subject_id from student_subjects where student_id = :'student_a'), :'math_a'::uuid,
  'A disciplina fica vinculada ao aluno'
);

select throws_ok(
  format('select save_student(%L, ''Nome alterado'', 100, false, array[%L::uuid], %L)', :'ws_a', :'math_b', :'student_a'),
  '23503', null, 'Recusa disciplina de outro espaço'
);
select is((select name from students where id = :'student_a'), 'Aluno A', 'A falha preserva o nome anterior');
select is(
  (select subject_id from student_subjects where student_id = :'student_a'), :'math_a'::uuid,
  'A falha também preserva a disciplina anterior'
);
select is(
  save_student(:'ws_a', 'Aluno A', 0, true, '{}'::uuid[], :'student_a'), true,
  'Um aluno pode passar a ser gratuito e ficar sem disciplinas'
);
select is_empty('select 1 from student_subjects', 'Remover a seleção remove os vínculos anteriores');
select throws_ok(
  format('select save_student(%L, ''Aluno B'', 100, false, ''{}'')', :'ws_b'),
  '42501', null, 'A função respeita a RLS na criação de aluno'
);

select * from finish();
rollback;
