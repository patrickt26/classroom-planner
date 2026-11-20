begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(30);

insert into auth.users (id) values
  ('09000000-0000-4000-8000-000000000001'),
  ('09000000-0000-4000-8000-000000000002');
select workspace_id as ws_a from memberships where user_id = '09000000-0000-4000-8000-000000000001' \gset
select workspace_id as ws_b from memberships where user_id = '09000000-0000-4000-8000-000000000002' \gset
\set other_student '09000000-0000-4000-8000-000000000003'

insert into students (workspace_id, id, name, hourly_rate) values
  (:'ws_a', :'ws_a', 'Aluno A', 5000),
  (:'ws_b', :'ws_b', 'Aluno B', 5000),
  (:'ws_a', :'other_student', 'Aluno C', 5000);
insert into subjects (workspace_id, id, name) values
  (:'ws_a', :'ws_a', 'Disciplina de teste da agenda'),
  (:'ws_b', :'ws_b', 'Disciplina de teste da agenda');

create function pg_temp.add_recurrence(ws uuid) returns void language sql as $$
  insert into public.recurrences (workspace_id, id, student_id, day_of_week, start_time, duration_minutes, modality, meeting_url, start_date)
  values (ws, ws, ws, 1, time '14:00', 60, 'online', 'https://meet.google.com/abc-defg-hij', date '2026-11-23');
$$;

create function pg_temp.add_lesson(ws uuid) returns void language sql as $$
  insert into public.lessons (workspace_id, id, student_id, subject_id, starts_at, duration_minutes, modality)
  values (ws, ws, ws, ws, timestamptz '2026-11-23 14:00:00-03', 60, 'presencial');
$$;

set local role authenticated;
set local request.jwt.claim.sub = '09000000-0000-4000-8000-000000000002';
select pg_temp.add_recurrence(:'ws_b');
select pg_temp.add_lesson(:'ws_b');
set local request.jwt.claim.sub = '09000000-0000-4000-8000-000000000001';

select lives_ok(format('select pg_temp.add_recurrence(%L)', :'ws_a'), 'A professora cria recorrência no próprio espaço');
select lives_ok(format('select pg_temp.add_lesson(%L)', :'ws_a'), 'A professora cria aula no próprio espaço');
select results_eq('select workspace_id from recurrences', format('values (%L::uuid)', :'ws_a'), 'Recorrências isoladas por espaço');
select results_eq('select workspace_id from lessons', format('values (%L::uuid)', :'ws_a'), 'Aulas isoladas por espaço');
select throws_ok(format('select pg_temp.add_recurrence(%L)', :'ws_b'), '42501', null, 'Bloqueia inserir recorrência em outro espaço');
select throws_ok(format('select pg_temp.add_lesson(%L)', :'ws_b'), '42501', null, 'Bloqueia inserir aula em outro espaço');

with changed as (update recurrences set duration_minutes = 50 where workspace_id = :'ws_b' returning id)
select is(count(*), 0::bigint, 'A professora não altera recorrências de outro espaço') from changed;
with changed as (update lessons set status = 'cancelada' where workspace_id = :'ws_b' returning id)
select is(count(*), 0::bigint, 'A professora não altera aulas de outro espaço') from changed;

select is((select status from lessons), 'agendada'::lesson_status, 'O status inicial é agendada');
select lives_ok('update lessons set status = ''confirmada''', 'A professora atualiza o status de sua aula');
select lives_ok('update recurrences set end_date = start_date', 'A recorrência pode terminar no dia em que começa');
select lives_ok(format('update lessons set recurrence_id = %L', :'ws_a'), 'A aula pode ser vinculada à recorrência do aluno');

select throws_ok(format('update recurrences set student_id = %L', :'ws_b'), '23503', null, 'Aluno da recorrência deve pertencer ao espaço');
select throws_ok(format('update lessons set student_id = %L, recurrence_id = null', :'ws_b'), '23503', null, 'Aluno da aula deve pertencer ao espaço');
select throws_ok(format('update lessons set subject_id = %L', :'ws_b'), '23503', null, 'Disciplina da aula deve pertencer ao espaço');
select throws_ok(format('update lessons set recurrence_id = %L', :'ws_b'), '23503', null, 'Recorrência da aula deve pertencer ao espaço');
select throws_ok(format('update lessons set rescheduled_from_id = %L', :'ws_b'), '23503', null, 'Aula original deve pertencer ao espaço');
select throws_ok(format('update lessons set student_id = %L', :'other_student'), '23503', null, 'Recorrência deve ser do mesmo aluno');
select throws_ok('update lessons set rescheduled_from_id = id', '23514', null, 'Uma aula não pode repor a si mesma');
select throws_ok('update recurrences set day_of_week = 7', '23514', null, 'Recorrência exige um dia da semana válido');
select throws_ok('update recurrences set end_date = start_date - 1', '23514', null, 'A data final não pode anteceder a inicial');
select throws_ok('update lessons set duration_minutes = 0', '23514', null, 'A duração da aula deve ser positiva');
select throws_ok('update recurrences set meeting_url = ''https://meet.google.com.example.net/abc''', '23514', null, 'O link deve apontar para o Google Meet');
select has_index('public', 'lessons', 'lessons_workspace_starts_at_idx', array['workspace_id', 'starts_at'], 'Índice apoia consultas por espaço e intervalo de datas');

select lives_ok(
  format($sql$
    insert into lessons (workspace_id, id, student_id, subject_id, starts_at, duration_minutes, modality, rescheduled_from_id)
    values (%1$L, %2$L, %1$L, %1$L, '2026-11-24 14:00:00-03', 60, 'presencial', %1$L)
  $sql$, :'ws_a', :'other_student'),
  'A aula de reposição pode referenciar a aula original do aluno'
);
select throws_ok(format('update lessons set student_id = %L where id = %L', :'other_student', :'other_student'),
  '23503', null, 'A aula de reposição deve ser do mesmo aluno');

reset role;
update memberships set role = 'student' where workspace_id = :'ws_a';
set local role authenticated;
select is_empty('select 1 from lessons', 'Aluno não consulta aulas');
select is_empty('select 1 from recurrences', 'Aluno não consulta recorrências');
reset role;
update memberships set role = 'guardian' where workspace_id = :'ws_a';
set local role authenticated;
select is_empty('select 1 from lessons', 'Responsável não consulta aulas');
select is_empty('select 1 from recurrences', 'Responsável não consulta recorrências');

select * from finish();
rollback;
