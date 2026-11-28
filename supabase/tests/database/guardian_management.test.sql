begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(29);

with test_users as (
  insert into auth.users (id) values
    ('08000000-0000-4000-8000-000000000001'),
    ('08000000-0000-4000-8000-000000000002')
  returning id
)
insert into public.terms_acceptances (user_id, terms_version)
select id, public.current_terms_version() from test_users;
select workspace_id as ws_a from memberships where user_id = '08000000-0000-4000-8000-000000000001' \gset
select workspace_id as ws_b from memberships where user_id = '08000000-0000-4000-8000-000000000002' \gset

insert into students (workspace_id, name, hourly_rate) values
  (:'ws_a', 'Aluno A', 8000), (:'ws_a', 'Aluno B', 8000),
  (:'ws_b', 'Aluno C', 8000);
select id as student_a from students where workspace_id = :'ws_a' and name = 'Aluno A' \gset
select id as student_b from students where workspace_id = :'ws_a' and name = 'Aluno B' \gset
select id as student_c from students where workspace_id = :'ws_b' and name = 'Aluno C' \gset

set local role authenticated;
set local request.jwt.claim.sub = '08000000-0000-4000-8000-000000000002';
select save_student_guardian(:'ws_b', :'student_c', 'Responsável C', 'Tutor', true) as created \gset
select id as guardian_c from guardians where workspace_id = :'ws_b' and name = 'Responsável C' \gset
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
  save_student_guardian(:'ws_a', :'student_a', 'Responsável Exemplo', 'Tutor', true, target_guardian_id => :'guardian_b'),
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

select is(
  link_existing_student_guardian(:'ws_a', :'student_b', :'guardian_c', 'Tutor', true),
  false, 'Recusa responsável de outro workspace'
);
select is(
  link_existing_student_guardian(:'ws_b', :'student_c', :'guardian_c', 'Tutor', true),
  false, 'A função de vínculo respeita o isolamento por workspace'
);
select ok(
  link_existing_student_guardian(:'ws_a', :'student_b', :'guardian_a', 'Mãe', true),
  'Vincula um responsável existente como financeiro'
);
select ok(
  link_existing_student_guardian(:'ws_a', :'student_b', :'guardian_b', 'Pai', true),
  'Vincula outro contato e substitui o financeiro deste aluno'
);
select is(
  link_existing_student_guardian(:'ws_a', :'student_b', :'guardian_a', 'Tutor', true),
  false, 'Recusa um vínculo duplicado'
);
select is(
  (select guardian_id from student_guardians where student_id = :'student_b' and is_financial_guardian),
  :'guardian_b'::uuid, 'A tentativa duplicada preserva o financeiro atual'
);
select is(
  (select guardian_id from student_guardians where student_id = :'student_a' and is_financial_guardian),
  :'guardian_b'::uuid, 'O financeiro do primeiro aluno permanece inalterado'
);
select is(
  (select relationship from student_guardians where student_id = :'student_b' and guardian_id = :'guardian_b'),
  'Pai', 'O parentesco do novo vínculo é próprio do aluno'
);
select ok(
  save_student_guardian(:'ws_a', :'student_a', 'Responsável Atualizado', 'Tutor', false, '+5511999900010', :'guardian_b'),
  'Edita os dados do contato compartilhado'
);
select is(
  (select count(*) from student_guardians
   join guardians on guardians.workspace_id = student_guardians.workspace_id
     and guardians.id = student_guardians.guardian_id
   where guardians.id = :'guardian_b' and name = 'Responsável Atualizado' and phone = '+5511999900010'),
  2::bigint, 'Ambos os vínculos leem nome e telefone atualizados do mesmo contato'
);
select ok(remove_student_guardian(:'ws_a', :'student_a', :'guardian_b'), 'Remove o vínculo com o primeiro aluno');
select is(
  (select student_id from student_guardians where guardian_id = :'guardian_b'), :'student_b'::uuid,
  'Preserva o vínculo do outro aluno'
);
select ok(remove_student_guardian(:'ws_a', :'student_b', :'guardian_b'), 'Remove o último vínculo do contato, mantendo o outro responsável do aluno');
select is(
  (select count(*) from guardians where id = :'guardian_b'), 0::bigint,
  'Apaga o contato quando não está mais vinculado a nenhum aluno'
);

select throws_ok(
  format('select remove_student_guardian(%L, %L, %L)', :'ws_a', :'student_a', :'guardian_a'),
  '23514', 'student_guardian_required', 'Recusa a remoção do último responsável pela RPC'
);
select throws_ok(
  format('delete from student_guardians where student_id = %L and guardian_id = %L', :'student_a', :'guardian_a'),
  '23514', 'student_guardian_required', 'Recusa também a remoção direta do último vínculo'
);
select throws_ok(
  format('delete from guardians where id = %L', :'guardian_a'),
  '23514', 'student_guardian_required', 'Apagar o contato por cascata preserva o último responsável'
);
select is(
  (select count(*) from student_guardians where guardian_id = :'guardian_a'), 2::bigint,
  'Os vínculos permanecem após as tentativas de remoção'
);

select * from finish();
rollback;
