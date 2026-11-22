begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(31);

insert into auth.users (id)
values ('10000000-0000-4000-8000-000000000013'),
       ('20000000-0000-4000-8000-000000000013'),
       ('30000000-0000-4000-8000-000000000013'),
       ('40000000-0000-4000-8000-000000000013');

select workspace_id as teacher_ws from memberships
where user_id = '10000000-0000-4000-8000-000000000013' \gset
select workspace_id as other_ws from memberships
where user_id = '20000000-0000-4000-8000-000000000013' \gset

insert into memberships (workspace_id, user_id, role)
values (:'teacher_ws', '30000000-0000-4000-8000-000000000013', 'student'),
       (:'teacher_ws', '40000000-0000-4000-8000-000000000013', 'guardian');

insert into students (workspace_id, id, name, hourly_rate)
values (:'teacher_ws', :'teacher_ws', 'Aluno A', 5000),
       (:'other_ws', :'other_ws', 'Aluno B', 5000);
insert into subjects (workspace_id, id, name)
values (:'teacher_ws', :'teacher_ws', 'Disciplina A'),
       (:'other_ws', :'other_ws', 'Disciplina B');

insert into lessons (workspace_id, id, student_id, subject_id, starts_at, duration_minutes, modality, status)
values (:'teacher_ws', :'teacher_ws', :'teacher_ws', :'teacher_ws', now(), 60, 'presencial', 'confirmada'),
       (:'teacher_ws', '00000000-0000-4000-8000-000000000013', :'teacher_ws', :'teacher_ws', now(), 60, 'presencial', 'agendada'),
       (:'other_ws', :'other_ws', :'other_ws', :'other_ws', now(), 60, 'presencial', 'realizada');

insert into lesson_notes (workspace_id, lesson_id, worked_on)
values (:'other_ws', :'other_ws', 'Registro de outro espaço');

set local role anon;
select throws_ok('select * from lesson_notes', '42501', null, 'Anônimo não lê registros');
select throws_ok(format('select save_lesson_note(%L, %L, %L, %L, %L)',
  :'teacher_ws', :'teacher_ws', 'Texto', '', ''), '42501', null, 'Anônimo não chama a RPC');

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000013';
select is((select count(*) from lesson_notes), 0::bigint, 'Professora não lê registro de outro workspace');
select throws_ok(format('insert into lesson_notes (workspace_id, lesson_id, worked_on) values (%L, %L, %L)',
  :'other_ws', :'other_ws', 'Texto'), '42501', null, 'Professora não insere em outro workspace');
select throws_ok(format('insert into lesson_notes (workspace_id, lesson_id, worked_on) values (%L, %L, %L)',
  :'teacher_ws', :'other_ws', 'Texto'), '23503', null, 'A aula pertence ao mesmo workspace do registro');

select throws_ok(format('select save_lesson_note(%L, %L, %L, %L, %L)',
  :'teacher_ws', :'teacher_ws', ' ', '', ''), '23514', null, 'Texto obrigatório no banco');
select is((select status from lessons where id = :'teacher_ws'), 'confirmada'::lesson_status,
  'Falha no registro preserva a situação anterior');
select ok(save_lesson_note(:'teacher_ws', :'teacher_ws', 'Frações com desenhos', '', 'Revisar amanhã'),
  'Salva o primeiro registro');
select is((select status from lessons where id = :'teacher_ws'), 'realizada'::lesson_status,
  'Primeiro registro marca a aula como realizada');
select id as first_note from lesson_notes where lesson_id = :'teacher_ws' \gset

select ok(save_lesson_note(:'teacher_ws', :'teacher_ws', 'Frações com tiras de papel', 'Numerador', '', :first_note),
  'Edição cria nova versão');
select is((select supersedes_id from lesson_notes where worked_on = 'Frações com tiras de papel'),
  :first_note::bigint, 'Versão nova aponta para a anterior');
select is((select worked_on from lesson_notes where id = :first_note),
  'Frações com desenhos', 'Versão anterior continua disponível com seu texto original');
select throws_ok(format('select save_lesson_note(%L, %L, %L, %L, %L, %s)',
  :'teacher_ws', :'teacher_ws', 'Edição desatualizada', '', '', :first_note), '23505', null,
  'Uma versão já substituída não aceita outro sucessor');
select throws_ok(format('select save_lesson_note(%L, %L, %L, %L, %L)',
  :'teacher_ws', :'teacher_ws', 'Primeiro registro duplicado', '', ''), '23505', null,
  'Uma aula só tem um primeiro registro');
select throws_ok(format('select save_lesson_note(%L, %L, %L, %L, %L, %s)',
  :'teacher_ws', '00000000-0000-4000-8000-000000000013', 'Outra aula', '', '', :first_note),
  '23503', null, 'A versão anterior pertence à mesma aula');
select throws_ok('update lesson_notes set worked_on = ''Novo texto''', '42501', null,
  'Professora não sobrescreve registros');
select throws_ok('delete from lesson_notes', '42501', null, 'Professora não apaga registros');

-- An avulsa can be rescheduled after it has a note. Exercise the note guard independently of status.
update lessons set status = 'agendada' where id = :'teacher_ws';
select is(can_delete_lesson(:'teacher_ws', :'teacher_ws'), false, 'Aula agendada com registro não oferece exclusão');
select is(delete_lesson(:'teacher_ws', :'teacher_ws'), null::timestamptz, 'RPC recusa excluir aula com registro');
select is((select count(*) from lesson_notes where lesson_id = :'teacher_ws'), 2::bigint,
  'As duas versões permanecem na aula');

insert into recurrences (workspace_id, id, student_id, subject_id, day_of_week,
  start_time, duration_minutes, modality, start_date)
values (:'teacher_ws', :'teacher_ws', :'teacher_ws', :'teacher_ws',
  1, '09:00', 60, 'presencial', current_date + 8);
select id as recurring_lesson from lessons
where workspace_id = :'teacher_ws' and recurrence_id = :'teacher_ws'
order by starts_at limit 1 \gset

-- Direct inserts can attach a note without changing the lesson status.
insert into lesson_notes (workspace_id, lesson_id, worked_on)
values (:'teacher_ws', :'recurring_lesson', 'Registro da aula recorrente');

select lives_ok(format('update recurrences set day_of_week = 2, start_time = ''10:00''
  where workspace_id = %L and id = %L', :'teacher_ws', :'teacher_ws'),
  'Altera dia e horário da série com registro pós-aula');
select is((select status from lessons where id = :'recurring_lesson'), 'agendada'::lesson_status,
  'A edição preserva a aula agendada com registro');

select lives_ok(format('update recurrences set ended_at = now()
  where workspace_id = %L and id = %L', :'teacher_ws', :'teacher_ws'),
  'Encerra a série com registro pós-aula');
select results_eq(format('select id from lessons where workspace_id = %L and recurrence_id = %L',
  :'teacher_ws', :'teacher_ws'), array[:'recurring_lesson'::uuid],
  'Somente a aula com registro permanece na série encerrada');
select is((select worked_on from lesson_notes where lesson_id = :'recurring_lesson'),
  'Registro da aula recorrente', 'O registro continua vinculado à mesma aula após o encerramento');

set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000013';
select is((select count(*) from lesson_notes), 0::bigint, 'Aluno não lê registros do workspace');
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000013';
select is((select count(*) from lesson_notes), 0::bigint, 'Responsável não lê registros do workspace');
select is(save_lesson_note(:'teacher_ws', :'teacher_ws', 'Texto', '', ''), false,
  'Responsável não grava registros pela RPC');

reset role;
-- Temporarily grant write privileges to verify that RLS alone blocks both operations.
grant update, delete on lesson_notes to authenticated;
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000013';
with updated as (update lesson_notes set worked_on = 'Outro texto' returning id)
select is((select count(*) from updated), 0::bigint, 'RLS não tem policy de UPDATE');
with deleted as (delete from lesson_notes returning id)
select is((select count(*) from deleted), 0::bigint, 'RLS não tem policy de DELETE');

reset role;
select throws_ok(format('delete from lessons where id = %L', :'teacher_ws'),
  '23503', null, 'Chave estrangeira impede excluir a aula diretamente');

select * from finish();
rollback;
