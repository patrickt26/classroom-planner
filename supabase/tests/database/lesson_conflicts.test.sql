begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(11);

with test_users as (
  insert into auth.users (id) values
    ('10000000-0000-4000-8000-000000000001'),
    ('10000000-0000-4000-8000-000000000002')
  returning id
)
insert into public.terms_acceptances (user_id, terms_version)
select id, public.current_terms_version() from test_users;

select workspace_id as ws_a from memberships where user_id = '10000000-0000-4000-8000-000000000001' \gset
select workspace_id as ws_b from memberships where user_id = '10000000-0000-4000-8000-000000000002' \gset

insert into students (workspace_id, id, name, hourly_rate) values
  (:'ws_a', :'ws_a', 'Aluno A', 5000),
  (:'ws_b', :'ws_b', 'Aluno B', 5000);
insert into subjects (workspace_id, id, name) values
  (:'ws_a', :'ws_a', 'Disciplina A'),
  (:'ws_b', :'ws_b', 'Disciplina B');
insert into lessons (workspace_id, id, student_id, subject_id, starts_at, duration_minutes, modality)
values
  (:'ws_a', :'ws_a', :'ws_a', :'ws_a', '2026-11-22 23:30:00-03', 90, 'presencial'),
  (:'ws_b', :'ws_b', :'ws_b', :'ws_b', '2026-11-23 12:00:00-03', 60, 'presencial');

create function pg_temp.save(
  ws uuid, starts timestamptz, duration integer, lesson_id uuid default null
)
returns boolean language sql as $$
  select public.save_lesson(ws, ws, ws, starts, duration, 'presencial', 'confirmada',
    target_lesson_id => lesson_id);
$$;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';

select is(pg_temp.save(:'ws_a', '2026-11-22 23:30:00-03', 90, :'ws_a'), false, 'Edição não conflita com a própria aula');
select is((select status::text from lessons where id = :'ws_a'), 'confirmada', 'Edição atualiza a situação');
select is(pg_temp.save(:'ws_a', '2026-11-23 00:30:00-03', 20), true, 'Detecta sobreposição com aula iniciada no dia anterior');
select is((select count(*) from lessons), 2::bigint, 'O conflito não bloqueia a gravação');
select is(pg_temp.save(:'ws_a', '2026-11-23 01:00:00-03', 60), false, 'Pode começar exatamente no fim de outra aula');
select is(pg_temp.save(:'ws_a', '2026-11-22 23:00:00-03', 30), false, 'Pode terminar exatamente no início de outra aula');
select is(pg_temp.save(:'ws_a', '2026-11-22 22:45:00-03', 45), true, 'Detecta sobreposição quando a nova aula começa primeiro');
select is(pg_temp.save(:'ws_a', '2026-11-23 12:00:00-03', 60), false, 'Aulas de outro espaço não geram conflito');

update lessons set status = 'cancelada' where id = :'ws_a';
select is(pg_temp.save(:'ws_a', '2026-11-23 00:00:00-03', 15), false, 'Aula cancelada não gera conflito');
select is(pg_temp.save(:'ws_a', '2026-11-23 06:00:00-03', 60, :'ws_a'), null::boolean, 'Aula cancelada não pode ser editada');
select throws_ok(format('select pg_temp.save(%L, %L, 60)', :'ws_b', '2026-11-23 08:00:00-03'),
  '42501', null, 'A professora não agenda aulas em outro espaço');

select * from finish();
rollback;
