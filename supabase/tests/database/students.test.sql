begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(37);

insert into auth.users (id) values
  ('06000000-0000-4000-8000-000000000001'),
  ('06000000-0000-4000-8000-000000000002');
select workspace_id as ws_a from memberships where user_id = '06000000-0000-4000-8000-000000000001' \gset
select workspace_id as ws_b from memberships where user_id = '06000000-0000-4000-8000-000000000002' \gset

insert into grades (workspace_id, id, name)
values (:'ws_a', :'ws_a', 'Ano de teste'), (:'ws_b', :'ws_b', 'Ano de teste');
insert into subjects (workspace_id, id, name)
values (:'ws_a', :'ws_a', 'Disciplina de teste'), (:'ws_b', :'ws_b', 'Disciplina de teste');

-- Reutiliza o UUID de cada workspace como ID dos registros de teste desse espaço.
create function pg_temp.fill_workspace(ws uuid) returns void language plpgsql as $$
begin
  insert into guardians (workspace_id, id, name) values (ws, ws, 'Responsável A');
  insert into student_guardians (workspace_id, student_id, guardian_id, relationship, is_financial_guardian)
  values (ws, ws, ws, 'Mãe', true);
  insert into student_subjects (workspace_id, student_id, subject_id) values (ws, ws, ws);
end;
$$;

insert into students (workspace_id, id, name, grade_id, hourly_rate)
values (:'ws_a', :'ws_a', 'Aluno A', :'ws_a', 8050), (:'ws_b', :'ws_b', 'Aluno B', :'ws_b', 8050);

set local role authenticated;
set local request.jwt.claim.sub = '06000000-0000-4000-8000-000000000002';
select pg_temp.fill_workspace(:'ws_b');
set local request.jwt.claim.sub = '06000000-0000-4000-8000-000000000001';
select lives_ok(format('select pg_temp.fill_workspace(%L)', :'ws_a'), 'A professora cadastra no próprio espaço');

create function pg_temp.student_tables() returns setof text language sql as $$
  values ('grades'), ('subjects'), ('students'), ('guardians'), ('student_guardians'), ('student_subjects');
$$;

select results_eq(format('select distinct workspace_id from %I', tbl), format('values (%L::uuid)', :'ws_a'),
  format('%s exibe apenas os registros da professora', tbl))
from pg_temp.student_tables() tbl;

select throws_ok(format('insert into grades (workspace_id, name) values (%L, ''3º ano'')', :'ws_b'),
  '42501', null, 'Recusa ano em outro espaço');
select throws_ok(format('insert into subjects (workspace_id, name) values (%L, ''Ciências'')', :'ws_b'),
  '42501', null, 'Recusa disciplina em outro espaço');
select throws_ok(format('insert into students (workspace_id, name, hourly_rate) values (%L, ''Aluno B'', 100)', :'ws_b'),
  '42501', null, 'Recusa aluno em outro espaço');
select throws_ok(format('insert into guardians (workspace_id, name) values (%L, ''Responsável B'')', :'ws_b'),
  '42501', null, 'Recusa responsável em outro espaço');
select throws_ok(format('insert into student_guardians (workspace_id, student_id, guardian_id, relationship) values (%1$L, %1$L, %1$L, ''Pai'')', :'ws_b'),
  '42501', null, 'Recusa vínculo com responsável em outro espaço');
select throws_ok(format('insert into student_subjects (workspace_id, student_id, subject_id) values (%1$L, %1$L, %1$L)', :'ws_b'),
  '42501', null, 'Recusa vínculo com disciplina em outro espaço');

select throws_ok(format('select set_student_archived(%1$L, %1$L, true)', :'ws_b'),
  '42501', 'teacher_required', 'A professora não arquiva alunos de outro espaço');
select ok(set_student_archived(:'ws_a', :'ws_a', true), 'A professora arquiva seu aluno');
with removed as (delete from student_subjects where workspace_id = :'ws_b' returning student_id)
select is(count(*), 0::bigint, 'A professora não remove disciplinas de outro espaço') from removed;

select throws_ok(format('update students set grade_id = %L', :'ws_b'),
  '23503', null, 'O ano precisa pertencer ao espaço do aluno');
select throws_ok(format('insert into student_guardians (workspace_id, student_id, guardian_id, relationship) values (%L, %L, %L, ''Pai'')', :'ws_a', :'ws_a', :'ws_b'),
  '23503', null, 'O responsável precisa pertencer ao espaço');
select throws_ok(format('insert into student_guardians (workspace_id, student_id, guardian_id, relationship) values (%L, %L, %L, ''Pai'')', :'ws_a', :'ws_b', :'ws_a'),
  '23503', null, 'O vínculo com responsável exige aluno do mesmo espaço');
select throws_ok(format('insert into student_subjects (workspace_id, student_id, subject_id) values (%L, %L, %L)', :'ws_a', :'ws_a', :'ws_b'),
  '23503', null, 'A disciplina precisa pertencer ao espaço');
select throws_ok(format('insert into student_subjects (workspace_id, student_id, subject_id) values (%L, %L, %L)', :'ws_a', :'ws_b', :'ws_a'),
  '23503', null, 'O vínculo com disciplina exige aluno do mesmo espaço');

select throws_ok('update students set hourly_rate = -1', '23514', null, 'Recusa valor negativo');
select throws_ok('update students set hourly_rate = 0', '23514', null, 'Valor zero exige gratuidade explícita');
select lives_ok('update students set is_free = true, hourly_rate = 0', 'Aluno pode receber gratuidade');
insert into guardians (workspace_id, name) values (:'ws_a', 'Responsável B') returning id as guardian_b \gset
select throws_ok(format('insert into student_guardians (workspace_id, student_id, guardian_id, relationship, is_financial_guardian) values (%L, %L, %L, ''Pai'', true)', :'ws_a', :'ws_a', :'guardian_b'),
  '23505', null, 'Cada aluno tem no máximo um responsável financeiro');

reset role;
update memberships set role = 'student' where workspace_id = :'ws_a';
set local role authenticated;
select is_empty(format('select 1 from %I', tbl), format('Aluno não consulta %s', tbl))
from pg_temp.student_tables() tbl;
reset role;
update memberships set role = 'guardian' where workspace_id = :'ws_a';
set local role authenticated;
select is_empty(format('select 1 from %I', tbl), format('Responsável não consulta %s', tbl))
from pg_temp.student_tables() tbl;

select * from finish();
rollback;
