begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(22);

with test_users as (
  insert into auth.users (id) values
    ('07000000-0000-4000-8000-000000000001'),
    ('07000000-0000-4000-8000-000000000002')
  returning id
)
insert into public.terms_acceptances (user_id, terms_version)
select id, public.current_terms_version() from test_users;
select workspace_id as ws_a from memberships where user_id = '07000000-0000-4000-8000-000000000001' \gset
select workspace_id as ws_b from memberships where user_id = '07000000-0000-4000-8000-000000000002' \gset
select id as math_a from subjects where workspace_id = :'ws_a' and name = 'Matemática' \gset
select id as math_b from subjects where workspace_id = :'ws_b' and name = 'Matemática' \gset
insert into guardians (workspace_id, name) values (:'ws_b', 'Responsável de outro espaço')
returning id as guardian_b \gset

delete from grades where workspace_id = :'ws_b' and name = '1º ano';
insert into grades (workspace_id, name) values (:'ws_b', 'Ano personalizado');
update subjects set name = 'todas' where workspace_id = :'ws_b' and name = 'Todas';
select private.populate_student_defaults(:'ws_b');
select is(
  (select count(*) from grades where workspace_id = :'ws_b'), 10::bigint,
  'A reposição dos padrões preserva os anos existentes e preenche o ano que falta'
);
select is(
  (select array_agg(name) from subjects where workspace_id = :'ws_b' and lower(trim(name)) = 'todas'),
  array['todas']::text[],
  'A reposição dos padrões preserva a matéria todas sem duplicá-la'
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
  'select name from unnest(array[''Língua Portuguesa'', ''Matemática'', ''Ciências'', ''História'', ''Geografia'', ''Todas'']) name order by name',
  'A nova professora vê as disciplinas padrão do seu espaço'
);
select throws_ok(
  format('select save_student(%L, ''Sem responsável'', 100, false, ''{}'', guardian_consent_confirmed => true)', :'ws_a'),
  '23514', 'student_guardian_required', 'A RPC recusa novo aluno sem responsável'
);
reset role;
select throws_ok(
  format(
    'do $test$ begin insert into students (workspace_id, name, hourly_rate) values (%L, ''Sem responsável'', 100); set constraints student_requires_guardian immediate; end $test$',
    :'ws_a'
  ),
  '23514', 'student_guardian_required', 'Uma gravação direta também exige responsável antes do commit'
);
set local role authenticated;
select ok(
  save_student(
    :'ws_a', 'Aluno A', 8050, false, array[:'math_a'::uuid],
    guardian_name => 'Responsável A', guardian_phone => '+5511999900010',
    guardian_relationship => 'Mãe', financial_guardian => true, guardian_consent_confirmed => true
  ),
  'Cadastra aluno com disciplina e novo responsável'
);
select id as student_a from students where workspace_id = :'ws_a' and name = 'Aluno A' \gset
select is(
  (select subject_id from student_subjects where student_id = :'student_a'), :'math_a'::uuid,
  'A disciplina fica vinculada ao aluno'
);

select id as guardian_a from guardians where workspace_id = :'ws_a' and name = 'Responsável A' \gset
select ok(
  (select is_financial_guardian from student_guardians where student_id = :'student_a' and guardian_id = :'guardian_a'),
  'O novo contato é vinculado como responsável financeiro'
);
select ok(
  save_student(:'ws_a', 'Aluno B', 8000, false, '{}'::uuid[], existing_guardian_id => :'guardian_a', guardian_relationship => 'Mãe', guardian_consent_confirmed => true),
  'Cadastra outro aluno reaproveitando o mesmo contato'
);
select id as student_b from students where workspace_id = :'ws_a' and name = 'Aluno B' \gset
select is(
  (select guardian_id from student_guardians where student_id = :'student_b'),
  :'guardian_a'::uuid, 'O novo vínculo reaproveita o contato existente'
);
select throws_ok(
  format(
    'select save_student(%L, ''Aluno inválido'', 8000, false, ''{}'', existing_guardian_id => %L, guardian_relationship => ''Tutor'', guardian_consent_confirmed => true)',
    :'ws_a', :'guardian_b'
  ),
  '23503', 'student_guardian_unavailable', 'Recusa um contato de outro espaço'
);
select is_empty('select 1 from students where name = ''Aluno inválido''', 'A falha não deixa aluno sem vínculo');
select throws_ok(
  format(
    'select save_student(%L, ''Aluno inválido'', 8000, false, array[%L::uuid], guardian_name => ''Responsável inválido'', guardian_relationship => ''Tutor'', guardian_consent_confirmed => true)',
    :'ws_a', :'math_b'
  ),
  '23503', null, 'Uma disciplina inválida desfaz toda a criação'
);
select is_empty('select 1 from guardians where name = ''Responsável inválido''', 'A falha não deixa contato órfão');
set constraints student_requires_guardian immediate;
set constraints student_requires_guardian deferred;

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
  format(
    'select save_student(%L, ''Aluno B'', 100, false, ''{}'', guardian_name => ''Responsável B'', guardian_relationship => ''Tutor'', guardian_consent_confirmed => true)',
    :'ws_b'
  ),
  '42501', null, 'A função exige uma professora do espaço na criação de aluno'
);

set local request.jwt.claim.sub = '07000000-0000-4000-8000-000000000002';
select throws_ok(
  format('select save_student(%L, %L, 100, false, %L, %L)', :'ws_a', 'Nome alterado', '{}', :'student_a'),
  '42501', 'teacher_required', 'Outra professora não edita aluno do primeiro espaço'
);

select * from finish();
rollback;
