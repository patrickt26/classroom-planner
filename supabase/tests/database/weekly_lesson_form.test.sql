begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

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
select (now() at time zone 'America/Sao_Paulo')::date + 1 as first_date \gset

insert into students (workspace_id, id, name, hourly_rate) values
  (:'ws_a', :'ws_a', 'Aluno A', 5000),
  (:'ws_b', :'ws_b', 'Aluno B', 5000);
insert into subjects (workspace_id, id, name) values
  (:'ws_a', :'ws_a', 'Disciplina A'),
  (:'ws_b', :'ws_b', 'Disciplina B');
insert into lessons (workspace_id, student_id, subject_id, starts_at, duration_minutes, modality)
values (:'ws_a', :'ws_a', :'ws_a', (:'first_date'::date + time '14:30') at time zone 'America/Sao_Paulo', 60, 'presencial');

create function pg_temp.create_series(ws uuid, first_date date, first_time time, last_date date default null)
returns boolean language sql as $$
  select public.create_weekly_lesson(ws, ws, ws, first_date, first_time, 60, 'presencial', last_date => last_date);
$$;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';

select is(pg_temp.create_series(:'ws_a', :'first_date', '14:00', :'first_date'::date + 7), true,
  'A primeira aula sobreposta gera aviso e a série é gravada');
select is((select start_date from recurrences), :'first_date'::date, 'Usa a data escolhida como início');
select is((select day_of_week::int from recurrences), extract(dow from :'first_date'::date)::int,
  'Deriva o dia da semana da data escolhida');
select results_eq(
  $$select (starts_at at time zone 'America/Sao_Paulo')::date from lessons where recurrence_id is not null order by starts_at$$,
  format('values (%L::date), (%L::date)', :'first_date', :'first_date'::date + 7),
  'Gera a primeira aula e repete semanalmente até a data final inclusive');
select is(pg_temp.create_series(:'ws_a', :'first_date', '15:30'), false,
  'Aulas consecutivas não geram aviso');
select is((select end_date from recurrences where start_time = '15:30'), null::date, 'Aceita uma série sem data final');
select is(pg_temp.create_series(:'ws_a', :'first_date'::date - 7, '14:00'), true,
  'Com data inicial passada, verifica a primeira aula gerada');
select throws_ok(format('select pg_temp.create_series(%L, %L, %L)', :'ws_b', :'first_date', '14:00'),
  '42501', null, 'A professora não cria série em outro espaço');

select * from finish();
rollback;
