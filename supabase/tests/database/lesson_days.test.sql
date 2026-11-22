begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(22);

insert into auth.users (id) values ('10000000-0000-4000-8000-000000000061'),
  ('10000000-0000-4000-8000-000000000062');
select workspace_id as ws from memberships where user_id = '10000000-0000-4000-8000-000000000061' \gset
select workspace_id as other_ws from memberships where user_id = '10000000-0000-4000-8000-000000000062' \gset
select date_trunc('week', now() at time zone 'America/Sao_Paulo')::date + 8 as tue \gset
insert into students (workspace_id, id, name, hourly_rate) values (:'ws', :'ws', 'Aluno A', 5000);
insert into subjects (workspace_id, id, name) values (:'ws', :'ws', 'Disciplina A'), (:'other_ws', :'other_ws', 'Disciplina B');

create function pg_temp.day(subject uuid, d date, t time, weekly boolean, last_date date default null)
returns jsonb language sql as $$
  select jsonb_build_object('subject_id', subject, 'starts_at', (d + t) at time zone 'America/Sao_Paulo',
    'duration_minutes', 60, 'modality', 'presencial', 'weekly', weekly, 'end_date', last_date);
$$;

-- Catch the RPC exception outside its transaction scope, just as PostgREST does.
create function pg_temp.save(ws uuid, variadic days jsonb[]) returns text language plpgsql as $$
declare block_number text;
begin
  perform public.create_lesson_days(ws, ws, to_jsonb(days));
  return 'saved';
exception when others then
  get stacked diagnostics block_number = pg_exception_detail;
  return concat_ws('/', sqlstate, case when sqlstate = '23P01' then sqlerrm end, nullif(block_number, ''));
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000061';

select is(pg_temp.save(:'ws', pg_temp.day(:'ws', :'tue'::date + 98, '22:00', true)
  || '{"duration_minutes":10081}'), '23P01/lesson_day_conflict/1', 'Sobrepor as próprias ocorrências exige confirmação');

select is(pg_temp.save(:'ws', pg_temp.day(:'ws', :'tue', '09:00', true),
  pg_temp.day(:'ws', :'tue'::date + 2, '16:00', true, :'tue'::date + 16) ||
    '{"duration_minutes":45,"modality":"online","meeting_url":"https://meet.google.com/exemplo"}'),
  'saved', 'Salva terça e quinta em um só envio');
select results_eq(format('select day_of_week::int, start_time, duration_minutes, modality::text, meeting_url, end_date
  from recurrences where student_id = %L and ended_at is null order by day_of_week', :'ws'),
  format('values (2, time ''09:00'', 60, ''presencial'', null::text, null::date),
    (4, time ''16:00'', 45, ''online'', ''https://meet.google.com/exemplo'', %L::date)', :'tue'::date + 16),
  'A ficha recebe duas séries ativas independentes com os dados de cada dia');
select is((select count(distinct recurrence_id) from lessons), 2::bigint, 'As ocorrências pertencem a séries separadas');

select is(pg_temp.save(:'ws', pg_temp.day(:'ws', :'tue', '18:00', true),
  pg_temp.day(:'ws', :'tue'::date + 2, '16:30', false)), '23P01/lesson_day_conflict/2', 'Indica conflito no segundo dia');
select is((select count(*) from recurrences where start_time = '18:00'), 0::bigint, 'Desfaz a primeira série');
select is((select count(*) from lessons where (starts_at at time zone 'America/Sao_Paulo')::time = '18:00'),
  0::bigint, 'Desfaz também as ocorrências geradas pelo trigger');

select is(pg_temp.save(:'ws', pg_temp.day(:'ws', :'tue', '19:00', false),
  pg_temp.day(:'other_ws', :'tue', '20:00', true)), '23503/2', 'Disciplina de outro espaço indica o bloco inválido');
select is((select count(*) from lessons where recurrence_id is null), 0::bigint, 'Erro de integridade também desfaz a aula avulsa');
select throws_ok(format('select public.create_lesson_days(%L, %L, %L, true)', :'ws', :'ws',
  jsonb_build_array(pg_temp.day(:'ws', :'tue', '09:30', false), pg_temp.day(:'other_ws', :'tue', '20:00', true))),
  '23503', 'invalid_lesson_day', 'Confirmar o conflito do primeiro bloco preserva a validação do segundo');
select is((select count(*) from lessons where recurrence_id is null), 0::bigint,
  'Um erro no segundo bloco desfaz até a aula com conflito confirmado');

select is(public.create_lesson_days(:'ws', :'ws', jsonb_build_array(pg_temp.day(:'ws', :'tue', '18:00', true),
  pg_temp.day(:'ws', :'tue'::date + 2, '16:30', false)), true), true, 'Confirmar os mesmos dias salva e informa o conflito');
select is((select count(*) from recurrences where start_time = '18:00'), 1::bigint, 'Grava a série do primeiro bloco');
select is((select count(*) from lessons where recurrence_id is null and
  starts_at = ((:'tue'::date + 2 + time '16:30') at time zone 'America/Sao_Paulo')), 1::bigint,
  'Grava a avulsa do segundo bloco no horário sobreposto');
select is(public.create_lesson_days(:'ws', :'ws', jsonb_build_array(pg_temp.day(:'ws', :'tue', '21:00', false)), true),
  false, 'Mesmo com confirmação, um horário livre é salvo sem aviso de conflito');

select is(pg_temp.save(:'other_ws', pg_temp.day(:'ws', :'tue', '09:00', false)), '42501', 'Exige professora do workspace');

select is(pg_temp.save(:'ws', pg_temp.day(:'ws', :'tue'::date + 84, '09:15', false)),
  '23P01/lesson_day_conflict/1', 'Aula avulsa conflita com série além das oito semanas geradas');
select is(pg_temp.save(:'ws', pg_temp.day(:'ws', :'tue'::date + 84, '13:00', true),
  pg_temp.day(:'ws', :'tue'::date + 91, '13:30', true)), '23P01/lesson_day_conflict/2', 'Detecta conflito entre blocos ainda sem ocorrências');
select is(pg_temp.save(:'ws', pg_temp.day(:'ws', :'tue', '10:00', true),
  pg_temp.day(:'ws', :'tue'::date + 84, '17:00', false)), 'saved', 'Combina série e avulsa e aceita aulas consecutivas');
select is(pg_temp.save(:'ws', pg_temp.day(:'ws', :'tue', '17:30', true)),
  '23P01/lesson_day_conflict/1', 'A primeira ocorrência livre não esconde conflito posterior com avulsa');
select is(pg_temp.save(:'ws', pg_temp.day(:'ws', :'tue'::date + 23, '16:00', false)),
  'saved', 'A série encerrada pela data final não bloqueia o horário');
update lessons set status = 'cancelada' where starts_at = (:'tue'::date + time '09:00') at time zone 'America/Sao_Paulo';
select is(pg_temp.save(:'ws', pg_temp.day(:'ws', :'tue', '09:00', false)), 'saved',
  'A ocorrência cancelada libera apenas o horário daquela data');

select * from finish();
rollback;
