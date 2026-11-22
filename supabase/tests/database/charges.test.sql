begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(41);

\set teacher '10000000-0000-4000-8000-000000000016'
\set other_teacher '20000000-0000-4000-8000-000000000016'
\set student_user '30000000-0000-4000-8000-000000000016'
\set guardian_user '40000000-0000-4000-8000-000000000016'
\set lesson '50000000-0000-4000-8000-000000000016'
\set late_lesson '60000000-0000-4000-8000-000000000016'

insert into auth.users (id) values (:'teacher'), (:'other_teacher'), (:'student_user'), (:'guardian_user');
select workspace_id as ws from memberships where user_id = :'teacher' \gset
select workspace_id as other_ws from memberships where user_id = :'other_teacher' \gset
insert into memberships (workspace_id, user_id, role)
values (:'ws', :'student_user', 'student'), (:'ws', :'guardian_user', 'guardian');
insert into students (workspace_id, id, name, hourly_rate, is_free)
values (:'ws', :'ws', 'Aluno A', 8000, false), (:'ws', :'student_user', 'Aluno B', 0, true),
       (:'other_ws', :'ws', 'Aluno C', 5000, false);
insert into subjects (workspace_id, id, name)
values (:'ws', :'ws', 'Disciplina A'), (:'other_ws', :'ws', 'Disciplina B');

insert into lessons (workspace_id, id, student_id, subject_id, starts_at, duration_minutes, modality, status)
values (:'other_ws', :'lesson', :'ws', :'ws', now(), 60, 'online', 'realizada'),
       (:'ws', :'lesson', :'ws', :'ws', now(), 90, 'presencial', 'agendada'),
       (:'ws', :'student_user', :'student_user', :'ws', now(), 60, 'online', 'realizada'),
       (:'ws', gen_random_uuid(), :'ws', :'ws', now(), 60, 'online', 'falta'),
       (:'ws', gen_random_uuid(), :'ws', :'ws', now(), 60, 'online', 'cancelada');

set local role anon;
select throws_ok('select * from public.charges', '42501', null, 'Anônimo não lê cobranças');
set local role authenticated;
set local request.jwt.claim.sub = :'teacher';
select is((select count(*) from charges), 0::bigint,
  'Agendada, falta, cancelamento e gratuidade não geram cobrança e o outro workspace fica isolado');

select ok(save_lesson_note(:'ws', :'lesson', 'Frações', '', ''), 'O registro pós-aula conclui a aula');
select is((select amount_cents from charges where lesson_id = :'lesson'), 12000::bigint,
  '90 minutos a R$ 80/h geram exatamente 12000 centavos');
select is((select payment_id from charges where lesson_id = :'lesson'), null::uuid, 'A cobrança nasce pendente');
update students set hourly_rate = 9000 where id = :'ws';
update lessons set status = 'realizada' where id = :'lesson';
select is((select count(*) from charges), 1::bigint, 'Repetir a marcação mantém uma única cobrança');
select is((select amount_cents from charges), 12000::bigint, 'Reajuste e reenvio preservam o valor original');
update lessons set duration_minutes = 45 where id = :'lesson';
select is((select amount_cents from charges), 6000::bigint, 'Corrigir a duração usa a tarifa da cobrança pendente');
update lessons set status = 'falta' where id = :'lesson';
select is((select count(*) from charges), 0::bigint, 'Desfazer a realização remove a pendência');
update lessons set status = 'realizada' where id = :'lesson';
select is((select amount_cents from charges), 6750::bigint, 'Realizar novamente usa a tarifa vigente para o dia');
update lessons set student_id = :'student_user' where id = :'lesson';
select is((select count(*) from charges), 0::bigint, 'Corrigir o aluno para um gratuito remove a pendência');
update lessons set student_id = :'ws' where id = :'lesson';

-- Multiple changes today preserve the rate in force at the end of yesterday, including gratuity.
update students set hourly_rate = 10001 where id = :'ws';
update students set hourly_rate = 10001, is_free = false where id = :'student_user';
insert into lessons (workspace_id, id, student_id, subject_id, starts_at, duration_minutes, modality, status)
select :'ws', row.id, row.student_id, :'ws',
  (((now() at time zone time_zone)::date - 1) + time '23:59') at time zone time_zone,
  90, 'online', 'realizada'
from workspaces cross join (values
  (:'late_lesson'::uuid, :'ws'::uuid), (:'guardian_user', :'student_user')
) as row(id, student_id) where workspace_id = :'ws';
select is((select amount_cents from charges where lesson_id = :'late_lesson'), 12000::bigint,
  'Aula lançada depois de dois reajustes usa a tarifa do dia da aula no fuso do workspace');
select is((select count(*) from charges where student_id = :'student_user'), 0::bigint,
  'Aula que ocorreu durante a gratuidade continua gratuita');
update lessons set starts_at = now() where id = :'guardian_user';
select is((select amount_cents from charges where lesson_id = :'guardian_user'), 15002::bigint,
  'Corrigir a data para o período pago gera a cobrança correspondente');
update lessons set starts_at = now() - interval '2 days' where id = :'guardian_user';
select is((select count(*) from charges where lesson_id = :'guardian_user'), 0::bigint,
  'Corrigir a data para o período gratuito remove a pendência');

select is(save_lesson(:'ws', :'ws', :'ws', now() + interval '3 days', 30, 'online', 'realizada'), false,
  'A agenda também pode salvar uma aula realizada');
select is((select amount_cents from charges where duration_minutes = 30), 5001::bigint,
  'Meio centavo é arredondado para o centavo superior');
select throws_ok('update charges set amount_cents = default', '42501', null, 'Cliente não altera valores');
select throws_ok('delete from charges', '42501', null, 'Cliente não apaga cobranças');
select throws_ok('insert into charges default values', '42501', null, 'Cliente não cria cobranças à mão');
select throws_ok('update student_rate_history set previous_hourly_rate = 1', '42501', null,
  'Cliente não reescreve o histórico de tarifas');

set local request.jwt.claim.sub = :'student_user';
select is((select count(*) from charges), 0::bigint, 'Aluno não lê cobranças');
select is((select count(*) from student_rate_history), 0::bigint, 'Aluno não lê histórico de tarifas');
set local request.jwt.claim.sub = :'guardian_user';
select is((select count(*) from charges), 0::bigint, 'Responsável não lê cobranças');
select is((select count(*) from student_rate_history), 0::bigint, 'Responsável não lê histórico de tarifas');
set local request.jwt.claim.sub = :'other_teacher';
select is((select amount_cents from charges), 5000::bigint, 'A cobrança da aula homônima no outro workspace foi preservada');
select is((select count(*) from student_rate_history), 0::bigint, 'Histórico das tarifas isolado por workspace');

reset role;
select throws_ok(format('insert into charges (workspace_id,lesson_id,student_id,hourly_rate,duration_minutes)
  values (%L,%L,%L,8000,90)', :'ws', :'late_lesson', :'ws'), '23505', null, 'Uma única cobrança por aula no banco');
select throws_ok(format('update charges set student_id = %L where workspace_id = %L and lesson_id = %L',
  :'student_user', :'ws', :'late_lesson'), '23503', null, 'Cobrança pertence ao aluno da aula');
set local role authenticated;
set local request.jwt.claim.sub = :'teacher';
select record_payment(:'ws', :'ws', array[:'late_lesson'::uuid],
  (now() at time zone time_zone)::date, 'pix', '') as payment from workspaces where workspace_id = :'ws' \gset
update lessons set status = 'agendada' where id = :'late_lesson';
select is((select payment_id from charges where lesson_id = :'late_lesson'), :'payment'::uuid,
  'Desfazer a realização conserva a cobrança paga');
select is(can_delete_lesson(:'ws', :'late_lesson'), false, 'Cobrança bloqueia exclusão mesmo em aula avulsa agendada');
select is(delete_lesson(:'ws', :'late_lesson'), null::timestamptz, 'RPC recusa excluir a aula com cobrança');
reset role;
select throws_ok(format('delete from lessons where workspace_id = %L and id = %L', :'ws', :'late_lesson'),
  '23503', null, 'FK sem cascata bloqueia exclusão direta');
update lessons set status = 'realizada', duration_minutes = 60 where workspace_id = :'ws' and id = :'late_lesson';
select is((select amount_cents from charges where workspace_id = :'ws' and lesson_id = :'late_lesson'),
  12000::bigint, 'Refazer a realização preserva o valor já pago');
select is((select payment_id from charges where workspace_id = :'ws' and lesson_id = :'late_lesson'),
  :'payment'::uuid, 'Refazer a realização preserva o vínculo com o pagamento');

set local role authenticated;
insert into recurrences (workspace_id, id, student_id, subject_id, day_of_week,
  start_time, duration_minutes, modality, start_date)
values (:'ws', :'ws', :'ws', :'ws', 1, '09:00', 60, 'presencial', current_date + 8);
select id as recurring_lesson, starts_at as recurring_start from lessons
where workspace_id = :'ws' and recurrence_id = :'ws'
order by starts_at limit 1 \gset

-- Register the payment with the lesson dated today, then restore its future slot.
update lessons set starts_at = now(), status = 'realizada'
where workspace_id = :'ws' and id = :'recurring_lesson';
select record_payment(:'ws', :'ws', array[:'recurring_lesson'::uuid],
  (now() at time zone time_zone)::date, 'pix', '') as recurring_payment
from workspaces where workspace_id = :'ws' \gset
update lessons set starts_at = :'recurring_start', status = 'agendada'
where workspace_id = :'ws' and id = :'recurring_lesson';

select is((select payment_id from charges where workspace_id = :'ws' and lesson_id = :'recurring_lesson'),
  :'recurring_payment'::uuid, 'A aula reagendada conserva a cobrança paga');
select lives_ok(format('update recurrences set day_of_week = 2, start_time = ''10:00''
  where workspace_id = %L and id = %L', :'ws', :'ws'), 'Altera a série com cobrança paga');
select is((select status from lessons where workspace_id = :'ws' and id = :'recurring_lesson'
  and recurrence_id = :'ws' and starts_at = :'recurring_start' and starts_at > now()),
  'agendada'::lesson_status, 'A edição preserva a aula futura no horário original');
select lives_ok(format('update recurrences set ended_at = now()
  where workspace_id = %L and id = %L', :'ws', :'ws'), 'Encerra a série com cobrança paga');
select results_eq(format('select id from lessons where workspace_id = %L and recurrence_id = %L',
  :'ws', :'ws'), array[:'recurring_lesson'::uuid], 'Somente a aula com cobrança permanece na série encerrada');
select is((select payment_id from charges where workspace_id = :'ws' and lesson_id = :'recurring_lesson'),
  :'recurring_payment'::uuid, 'O pagamento continua vinculado à mesma aula após o encerramento');

select * from finish();
rollback;
