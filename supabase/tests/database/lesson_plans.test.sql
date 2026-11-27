begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(17);

with test_users as (
  insert into auth.users (id)
  values ('10000000-0000-4000-8000-000000000012'),
         ('20000000-0000-4000-8000-000000000012'),
         ('30000000-0000-4000-8000-000000000012')
  returning id
)
insert into public.terms_acceptances (user_id, terms_version)
select id, public.current_terms_version() from test_users;

select workspace_id as teacher_ws from memberships
where user_id = '10000000-0000-4000-8000-000000000012' \gset
select workspace_id as other_ws from memberships
where user_id = '20000000-0000-4000-8000-000000000012' \gset
insert into memberships (workspace_id, user_id, role)
values (:'teacher_ws', '30000000-0000-4000-8000-000000000012', 'student');

insert into students (workspace_id, id, name, hourly_rate)
values (:'teacher_ws', :'teacher_ws', 'Aluno A', 5000),
       (:'other_ws', :'other_ws', 'Aluno B', 5000);
insert into subjects (workspace_id, id, name)
values (:'teacher_ws', :'teacher_ws', 'Disciplina A'),
       (:'other_ws', :'other_ws', 'Disciplina B');

insert into lessons (workspace_id, id, student_id, subject_id, starts_at, duration_minutes, modality)
values (:'teacher_ws', :'teacher_ws', :'teacher_ws', :'teacher_ws', now() + interval '1 day', 60, 'presencial'),
       (:'other_ws', :'other_ws', :'other_ws', :'other_ws', now() + interval '1 day', 60, 'presencial');

insert into lesson_plans (workspace_id, lesson_id, objective)
values (:'other_ws', :'other_ws', 'Objetivo de outro espaço');

insert into recurrences (workspace_id, id, student_id, subject_id, day_of_week,
  start_time, duration_minutes, modality, start_date)
values (:'teacher_ws', :'teacher_ws', :'teacher_ws', :'teacher_ws',
  1, '09:00', 60, 'presencial', current_date + 8);

select id as protected_lesson from lessons
where workspace_id = :'teacher_ws' and recurrence_id = :'teacher_ws'
order by starts_at limit 1 \gset
select id as unprotected_lesson from lessons
where workspace_id = :'teacher_ws' and recurrence_id = :'teacher_ws'
order by starts_at offset 1 limit 1 \gset

set local role anon;
select throws_ok('select * from lesson_plans', '42501', null, 'Anônimo não pode ler planos');

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000012';
select is((select count(*) from lesson_plans), 0::bigint, 'Não vê plano de outro workspace');
select throws_ok(format('insert into lesson_plans (workspace_id, lesson_id, objective) values (%L, %L, %L)',
  :'other_ws', :'other_ws', 'Objetivo'), '42501', null, 'Não cria planos em outro workspace');
select throws_ok(format('insert into lesson_plans (workspace_id, lesson_id, objective) values (%L, %L, %L)',
  :'teacher_ws', :'other_ws', 'Objetivo'), '23503', null, 'A aula deve pertencer ao workspace do plano');

select lives_ok(format('insert into lesson_plans (workspace_id, lesson_id, objective) values (%L, %L, %L)',
  :'teacher_ws', :'teacher_ws', 'Objetivo original'), 'Professora cria plano para sua aula');
select throws_ok(format('insert into lesson_plans (workspace_id, lesson_id, objective) values (%L, %L, %L)',
  :'teacher_ws', :'teacher_ws', 'Duplicado'), '23505', null, 'A aula só pode ter um plano');
update lesson_plans set objective = 'Objetivo atualizado';
select is((select objective from lesson_plans), 'Objetivo atualizado', 'Professora edita e vê seu plano');
with changed as (update lesson_plans set objective = 'Outro objetivo'
  where workspace_id = :'other_ws' returning 1)
select is((select count(*) from changed), 0::bigint, 'Não edita plano de outro workspace');

select is(can_delete_lesson(:'teacher_ws', :'teacher_ws'), false, 'Oculta exclusão quando existe plano');
select is(delete_lesson(:'teacher_ws', :'teacher_ws'), null::timestamptz, 'RPC recusa excluir aula com plano');

insert into lesson_plans (workspace_id, lesson_id, objective)
values (:'teacher_ws', :'protected_lesson', 'Objetivo recorrente');
update recurrences set day_of_week = 2, start_time = '10:00'
where workspace_id = :'teacher_ws' and id = :'teacher_ws';
select ok(exists (select from lessons where id = :'protected_lesson'), 'Preserva aula com plano ao alterar dia e horário');
select ok(not exists (select from lessons where id = :'unprotected_lesson'), 'Substitui aula sem plano ao mover a série');
select id as ending_lesson from lessons
where workspace_id = :'teacher_ws' and recurrence_id = :'teacher_ws' and id <> :'protected_lesson'
order by starts_at limit 1 \gset
insert into lesson_plans (workspace_id, lesson_id, objective)
values (:'teacher_ws', :'ending_lesson', 'Objetivo antes de encerrar');
update recurrences set ended_at = now()
where workspace_id = :'teacher_ws' and id = :'teacher_ws';
select ok(exists (select from lessons where id = :'ending_lesson'), 'Preserva aula com plano ao encerrar a série');
select is((select count(*) from lessons where recurrence_id = :'teacher_ws'), 2::bigint, 'Encerra a série e mantém somente as duas aulas planejadas');
select is((select count(*) from lesson_plans), 3::bigint, 'Planos sobrevivem a mudanças na agenda');

set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000012';
select is((select count(*) from lesson_plans), 0::bigint, 'Aluno do workspace não lê planejamento');

reset role;
select throws_ok(format('delete from lessons where id = %L', :'teacher_ws'), '23503', null, 'Chave estrangeira impede exclusão em cascata');

select * from finish();
rollback;
