begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public,extensions;
select plan(19);

with test_users as (
  insert into auth.users(id) values ('10000000-0000-4000-8000-000000000011')
  returning id
)
insert into public.terms_acceptances (user_id, terms_version)
select id, public.current_terms_version() from test_users;
select workspace_id as ws from memberships where user_id='10000000-0000-4000-8000-000000000011' \gset
update workspaces set time_zone='Asia/Tokyo' where workspace_id=:'ws';
insert into students(workspace_id,id,name,hourly_rate) values (:'ws',:'ws','Aluno A',5000);
insert into subjects(workspace_id,id,name) values (:'ws',:'ws','Disciplina A');
select (now() at time zone 'Asia/Tokyo')::date+1 as tomorrow \gset
insert into recurrences(workspace_id,id,student_id,subject_id,day_of_week,start_time,duration_minutes,modality,start_date)
values (:'ws',:'ws',:'ws',:'ws',extract(dow from :'tomorrow'::date),'01:30',60,'presencial',:'tomorrow');
select is((select count(*) from lessons where recurrence_id=:'ws'),8::bigint,'Gera oito semanas ao criar');
select is((select min(starts_at) from lessons where recurrence_id=:'ws'),(:'tomorrow'::date + time '01:30') at time zone 'Asia/Tokyo','Usa o horário local do workspace');
select id as original, starts_at as original_start from lessons where recurrence_id=:'ws' order by starts_at limit 1 \gset
update lessons set status='cancelada' where id=:'original';
select generate_recurring_lessons(8);
select generate_recurring_lessons(8);
select is((select count(*) from lessons where recurrence_id=:'ws'),8::bigint,'Duas execuções não duplicam aulas');
select is((select status::text from lessons where id=:'original'),'cancelada','Geração preserva o cancelamento');
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000011';
update lessons set status='reposicao_pendente' where id=:'original';
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000099';
select is(schedule_makeup(:'ws',:'original',now()+interval '3 days'),false,'Outro usuário não consegue repor a aula');
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000011';
select throws_ok(
  format('select schedule_makeup(%L, %L, %L::timestamptz - interval ''1 minute'')', :'ws', :'original', :'original_start'),
  '22023', 'makeup_before_original', 'Recusa horário anterior ao da aula original no mesmo dia'
);
select is((select status::text from lessons where id=:'original'),'reposicao_pendente','Horário inválido preserva a pendência');
select ok(schedule_makeup(:'ws',:'original',:'original_start'),'Aceita reposição no horário exato da original');
select is((select rescheduled_from_id from lessons where workspace_id=:'ws' and recurrence_id is null),:'original'::uuid,'Reposição ligada à aula original');
select is((select status::text from lessons where id=:'original'),'cancelada','Restabelece situação original');
select is(schedule_makeup(:'ws',:'original',now()+interval '4 days'),false,'Reenvio não duplica a reposição');
select throws_ok(format('update lessons set status = ''reposicao_pendente'' where id = %L', :'original'), '23514', null, 'Aula já reposta não volta para a lista de pendências');
select throws_ok('select public.generate_recurring_lessons()', '42501', null, 'Geração global restrita ao job');
reset role;
update recurrences set start_time='02:15' where id=:'ws';
select is((select count(*) from lessons where recurrence_id=:'ws' and status='agendada' and (starts_at at time zone 'Asia/Tokyo')::time='02:15'),8::bigint,'Mudança de horário atualiza aulas futuras');
insert into lessons(workspace_id,student_id,subject_id,recurrence_id,starts_at,duration_minutes,modality)
values (:'ws',:'ws',:'ws',:'ws',now()-interval '1 day',60,'presencial');
update recurrences set ended_at=now() where id=:'ws';
select generate_recurring_lessons();
select is((select count(*) from lessons where recurrence_id=:'ws' and starts_at<now()),1::bigint,'Encerrar preserva aulas passadas');
select is((select count(*) from lessons where recurrence_id=:'ws' and starts_at>now() and status='agendada'),0::bigint,'Encerrar remove aulas futuras da série');
select is((select count(*) from lessons where rescheduled_from_id=:'original'),1::bigint,'Encerrar preserva reposição independente');
insert into lessons(workspace_id,student_id,subject_id,starts_at,duration_minutes,modality,status,pending_reason)
values (:'ws',:'ws',:'ws',now()-interval '3 days',60,'presencial','reposicao_pendente','falta')
returning id as past_original \gset
set local role authenticated;
select ok(schedule_makeup(:'ws',:'past_original',now()-interval '2 days'),'Aceita reposição passada após a aula original');
reset role;
select ok(exists(select from cron.job where jobname='generate-recurring-lessons' and active),'Job diário registrado');
select * from finish();
rollback;
