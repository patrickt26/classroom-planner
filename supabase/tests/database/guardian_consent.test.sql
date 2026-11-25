begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(17);

insert into auth.users (id) values
  ('11900000-0000-4000-8000-000000000001'),
  ('11900000-0000-4000-8000-000000000002');
select workspace_id as ws from memberships where user_id = '11900000-0000-4000-8000-000000000001' \gset
select workspace_id as other_ws from memberships where user_id = '11900000-0000-4000-8000-000000000002' \gset
insert into students (workspace_id, id, name, hourly_rate, guardian_consent_at) values
  (:'ws', :'ws', 'Aluno antigo', 100, null),
  (:'other_ws', :'other_ws', 'Aluno de outro espaço', 100, null),
  (:'ws', :'other_ws', 'Aluno já autorizado', 100, now() - interval '1 day');

set local role authenticated;
set local request.jwt.claim.sub = '11900000-0000-4000-8000-000000000001';
select throws_ok(
  format('select save_student(%L, ''Aluno novo'', 100, false, ''{}'', guardian_name => ''Responsável A'', guardian_relationship => ''Tutor'')', :'ws'),
  '23514', 'guardian_consent_required', 'O cadastro exige confirmação mesmo com responsável'
);
select throws_ok(
  format('select save_student(%L, ''Aluno novo'', 100, false, ''{}'', guardian_consent_confirmed => %s)', :'ws', confirmation),
  '23514', 'guardian_consent_required', 'O cadastro recusa confirmação ' || confirmation
) from (values ('false'), ('null')) args(confirmation);
select throws_ok(
  format('insert into students (workspace_id, name, hourly_rate) values (%L, ''Aluno novo'', 100)', :'ws'),
  '42501', null, 'O cliente não pode contornar a confirmação por inserção direta'
);
select throws_ok(
  format('insert into students (workspace_id, name, hourly_rate, guardian_consent_at) values (%L, ''Aluno novo'', 100, now())', :'ws'),
  '42501', null, 'O cliente não pode inserir uma data de sua escolha'
);
select throws_ok(
  format('update students set guardian_consent_at = now() where id = %L', :'ws'),
  '42501', null, 'O cliente não pode atualizar a data diretamente'
);
select ok(save_student(:'ws', 'Aluno novo', 100, false, '{}',
  guardian_name => 'Responsável A', guardian_relationship => 'Tutor', guardian_consent_confirmed => true),
  'O cadastro aceita a confirmação explícita');
select is((select guardian_consent_at from students where name = 'Aluno novo'), now(), 'O banco data a confirmação no cadastro');

select ok(save_student(:'ws', 'Aluno editado', 200, false, '{}', :'ws', guardian_consent_confirmed => true),
  'A edição de dados de um aluno antigo continua disponível');
select is((select guardian_consent_at from students where id = :'ws'), null::timestamptz, 'Editar o aluno não registra autorização');
select ok(record_guardian_consent(:'ws', :'ws'), 'A professora pode registrar autorização no próprio espaço');
select is((select guardian_consent_at from students where id = :'ws'), now(), 'A ficha recebe a data do servidor');
select ok(record_guardian_consent(:'ws', :'other_ws'), 'Repetir a operação é seguro');
select is((select guardian_consent_at from students where id = :'other_ws'), now() - interval '1 day', 'O primeiro registro é preservado');
select throws_ok(format('select record_guardian_consent(%1$L, %1$L)', :'other_ws'), '42501', 'teacher_required', 'Outro espaço é protegido');

reset role;
update memberships set role = 'student' where workspace_id = :'ws';
set local role authenticated;
select throws_ok(format('select record_guardian_consent(%1$L, %1$L)', :'ws'), '42501', 'teacher_required', 'Aluno não registra autorização');
reset role;
update memberships set role = 'guardian' where workspace_id = :'ws';
set local role authenticated;
select throws_ok(format('select record_guardian_consent(%1$L, %1$L)', :'ws'), '42501', 'teacher_required', 'Responsável não registra autorização pela professora');

select * from finish();
rollback;
