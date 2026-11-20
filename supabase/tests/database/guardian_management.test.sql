begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(15);

insert into auth.users (id) values
  ('08000000-0000-4000-8000-000000000001'),
  ('08000000-0000-4000-8000-000000000002');
select workspace_id as ws_a from memberships where user_id = '08000000-0000-4000-8000-000000000001' \gset
select workspace_id as ws_b from memberships where user_id = '08000000-0000-4000-8000-000000000002' \gset

insert into students (workspace_id, name, hourly_rate) values
  (:'ws_a', 'Aluno A', 8000), (:'ws_a', 'Aluno B', 8000),
  (:'ws_b', 'Aluno C', 8000);
select id as student_a from students where workspace_id = :'ws_a' and name = 'Aluno A' \gset
select id as student_b from students where workspace_id = :'ws_a' and name = 'Aluno B' \gset
select id as student_c from students where workspace_id = :'ws_b' and name = 'Aluno C' \gset

set local role authenticated;
set local request.jwt.claim.sub = '08000000-0000-4000-8000-000000000001';

select ok(save_student_guardian(:'ws_a', :'student_a', 'Responsável A', 'Mãe', true), 'Cria responsável financeiro');
select id as guardian_a from guardians where workspace_id = :'ws_a' and name = 'Responsável A' \gset

select throws_ok(
  format('select save_student_guardian(%L, %L, %L, %L, true)', :'ws_a', :'student_a', 'Responsável B', ''),
  '23514', null, 'Um vínculo inválido faz a criação inteira falhar'
);
select ok(
  (select is_financial_guardian from student_guardians where guardian_id = :'guardian_a'),
  'O responsável financeiro anterior é preservado após a falha'
);
select is(
  (select count(*) from guardians where name = 'Responsável B'), 0::bigint,
  'A criação malsucedida não deixa um responsável órfão'
);

select ok(save_student_guardian(:'ws_a', :'student_a', 'Responsável B', 'Pai', true), 'Substitui o responsável financeiro');
select id as guardian_b from guardians where workspace_id = :'ws_a' and name = 'Responsável B' \gset
select is(
  (select guardian_id from student_guardians where student_id = :'student_a' and is_financial_guardian),
  :'guardian_b'::uuid, 'Só o novo responsável fica marcado como financeiro'
);
select ok(
  save_student_guardian(:'ws_a', :'student_a', 'Responsável Exemplo', 'Tutor', false, target_guardian_id => :'guardian_b'),
  'Edita dados do contato e do vínculo'
);
select is(
  (select relationship from student_guardians where student_id = :'student_a' and guardian_id = :'guardian_b'),
  'Tutor', 'Atualiza o parentesco ou vínculo'
);
select is(
  save_student_guardian(:'ws_a', :'student_b', 'Outro nome', 'Tutor', false, target_guardian_id => :'guardian_b'),
  false, 'Recusa edição de contato sem vínculo com este aluno'
);
select is(
  save_student_guardian(:'ws_b', :'student_c', 'Responsável C', 'Tutor', true),
  false, 'A função de gravação respeita o isolamento por workspace'
);
select is(
  remove_student_guardian(:'ws_b', :'student_c', :'guardian_b'),
  false, 'A função de remoção respeita o isolamento por workspace'
);

insert into student_guardians (workspace_id, student_id, guardian_id, relationship)
values (:'ws_a', :'student_b', :'guardian_b', 'Tutor');
select ok(remove_student_guardian(:'ws_a', :'student_a', :'guardian_b'), 'Remove o vínculo com o primeiro aluno');
select is(
  (select student_id from student_guardians where guardian_id = :'guardian_b'), :'student_b'::uuid,
  'Preserva o vínculo do outro aluno'
);
select ok(remove_student_guardian(:'ws_a', :'student_b', :'guardian_b'), 'Remove o último vínculo');
select is(
  (select count(*) from guardians where id = :'guardian_b'), 0::bigint,
  'Apaga o contato quando não está mais vinculado a nenhum aluno'
);

select * from finish();
rollback;
