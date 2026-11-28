begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(30);

insert into auth.users (id) values
  ('14200000-0000-4000-8000-000000000011'),
  ('14200000-0000-4000-8000-000000000012');
select workspace_id as ws from memberships where user_id = '14200000-0000-4000-8000-000000000011' \gset
select workspace_id as other_ws from memberships where user_id = '14200000-0000-4000-8000-000000000012' \gset
select gen_random_uuid() as a, gen_random_uuid() as b, gen_random_uuid() as shared \gset

-- Repeat the student's and related records' IDs in another workspace.
create function pg_temp.add_student(ws uuid, sid uuid, student_name text) returns void language plpgsql as $$
declare
  subject uuid;
  grade uuid;
  first_note bigint;
  first_lesson uuid;
  original uuid;
begin
  select id into strict subject from subjects where workspace_id = ws and name = 'Matemática';
  select id into strict grade from grades where workspace_id = ws and name = '2º ano';
  insert into students (workspace_id, id, name, birth_date, grade_id, school, notes, hourly_rate, guardian_consent_at)
  values (ws, sid, student_name, '2016-01-01', grade, 'Escola Exemplo', 'Observação fictícia', 8000, now());
  insert into guardians (workspace_id, id, name) values (ws, sid, 'Responsável de exemplo');
  insert into student_guardians (workspace_id, student_id, guardian_id, relationship) values (ws, sid, sid, 'Tutor');
  insert into student_subjects (workspace_id, student_id, subject_id) values (ws, sid, subject);
  insert into recurrences (workspace_id, id, student_id, subject_id, day_of_week, start_time,
    duration_minutes, modality, start_date, end_date)
  values (ws, sid, sid, subject, 1, '08:00', 60, 'presencial', current_date - 14, current_date - 7);
  insert into lessons (workspace_id, student_id, subject_id, recurrence_id, starts_at, duration_minutes, modality, status)
  values (ws, sid, subject, sid, now() - interval '1 week', 60, 'presencial', 'falta') returning id into first_lesson;
  insert into lessons (workspace_id, student_id, subject_id, rescheduled_from_id, starts_at, duration_minutes, modality, status)
  values (ws, sid, subject, first_lesson, now() - interval '3 days', 60, 'presencial', 'falta') returning id into original;
  insert into lessons (workspace_id, id, student_id, subject_id, recurrence_id, rescheduled_from_id,
    starts_at, duration_minutes, modality, meeting_url, status)
  values (ws, sid, sid, subject, sid, original, now() - interval '1 day', 60,
    'online', 'https://meet.google.com/aula-ficticia', 'realizada');
  insert into lesson_plans (workspace_id, lesson_id, objective) values (ws, original, 'Plano de exemplo');
  insert into lesson_plans (workspace_id, lesson_id, objective) values (ws, sid, 'Plano da aula cobrada');
  insert into lesson_notes (workspace_id, lesson_id, worked_on) values (ws, first_lesson, 'Registro da aula sem cobrança');
  insert into lesson_notes (workspace_id, lesson_id, worked_on) values (ws, sid, 'Registro fictício') returning id into first_note;
  insert into lesson_notes (workspace_id, lesson_id, worked_on, supersedes_id) values (ws, sid, 'Revisão fictícia', first_note);
  insert into payments (workspace_id, id, student_id, amount_cents, paid_on, method, note)
  values (ws, sid, sid, 8000, current_date, 'pix', 'Observação do pagamento');
  update charges set payment_id = sid where workspace_id = ws and lesson_id = sid;
  -- A second billed lesson remains pending.
  insert into lessons (workspace_id, student_id, subject_id, starts_at, duration_minutes, modality, status)
  values (ws, sid, subject, now(), 30, 'presencial', 'realizada');
  update students set hourly_rate = 9000 where workspace_id = ws and id = sid;
end;
$$;
select pg_temp.add_student(:'ws', :'a', 'Aluno A');
select pg_temp.add_student(:'ws', :'b', 'Aluno B');
select pg_temp.add_student(:'other_ws', :'a', 'Aluno de outro espaço');
insert into guardians (workspace_id, id, name) values (:'ws', :'shared', 'Responsável compartilhado');
insert into student_guardians (workspace_id, student_id, guardian_id, relationship)
values (:'ws', :'a', :'shared', 'Tutor'), (:'ws', :'b', :'shared', 'Tutor');
insert into guardians (workspace_id, name) values (:'ws', 'Contato sem vínculo anterior')
returning id as unrelated_guardian \gset
set constraints all immediate;

-- Capture complete rows, including dates, amounts and links.
create function pg_temp.student_rows(ws uuid, sid uuid) returns setof jsonb language sql as $$
  select to_jsonb(s) from students s where s.workspace_id = ws and s.id = sid
  union all select to_jsonb(s) from student_subjects s where s.workspace_id = ws and s.student_id = sid
  union all select to_jsonb(s) from student_guardians s where s.workspace_id = ws and s.student_id = sid
  union all select to_jsonb(g) from guardians g join student_guardians s on (s.workspace_id,s.guardian_id) = (g.workspace_id,g.id)
    where s.workspace_id = ws and s.student_id = sid
  union all select to_jsonb(l) from lessons l where l.workspace_id = ws and l.student_id = sid
  union all select to_jsonb(r) from recurrences r where r.workspace_id = ws and r.student_id = sid
  union all select to_jsonb(p) from lesson_plans p join lessons l on (l.workspace_id,l.id) = (p.workspace_id,p.lesson_id)
    where l.workspace_id = ws and l.student_id = sid
  union all select to_jsonb(n) from lesson_notes n join lessons l on (l.workspace_id,l.id) = (n.workspace_id,n.lesson_id)
    where l.workspace_id = ws and l.student_id = sid
  union all select to_jsonb(c) from charges c where c.workspace_id = ws and c.student_id = sid
  union all select to_jsonb(p) from payments p where p.workspace_id = ws and p.student_id = sid
  union all select to_jsonb(r) from student_rate_history r where r.workspace_id = ws and r.student_id = sid;
$$;
create temporary table untouched as
  select * from pg_temp.student_rows(:'ws', :'b') union all select * from pg_temp.student_rows(:'other_ws', :'a');
create temporary table kept_charges as select * from charges where workspace_id = :'ws' and student_id = :'a';
create temporary table kept_payments as select to_jsonb(p) - 'note' as row from payments p where workspace_id = :'ws' and student_id = :'a';
create temporary view billed_lessons as
  select l.id, l.starts_at, l.duration_minutes, l.status from lessons l
  join charges c on (c.workspace_id, c.lesson_id) = (l.workspace_id, l.id)
  where l.workspace_id = :'ws' and l.student_id = :'a';
create temporary table original_billed_lessons as table billed_lessons;

-- Sum charges and payments separately: a payment can settle multiple lessons.
create temporary view financial_totals as
  select sum(c.amount_cents) as billed,
    sum(c.amount_cents) filter (where c.payment_id is null) as receivable,
    (select sum(p.amount_cents) from payments p where p.workspace_id = :'ws'
      and p.student_id = :'a' and p.reversed_at is null) as received
  from charges c where c.workspace_id = :'ws' and c.student_id = :'a';
create temporary table original_totals as table financial_totals;

set local role anon;
select throws_ok(format('select erase_student_data(%L,%L)', :'ws', :'a'), '42501', null, 'Visitante não pode executar');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '14200000-0000-4000-8000-000000000011';
select throws_ok(format('select erase_student_data(%L,%L)', :'other_ws', :'a'), '42501', 'teacher_required',
  'Professora não pode apagar dados de outro espaço');
select throws_ok(format('select erase_student_data(%L,%L)', :'ws', :'a'), '23514', 'archived_student_required',
  'Aluno ativo está protegido');
select ok(set_student_archived(:'ws', :'a', true), 'Arquiva no próprio espaço');
select ok(set_student_archived(:'ws', :'a', false), 'Permite reativar antes da anonimização');
select ok(set_student_archived(:'ws', :'a', true), 'Aluno reativado pode ser arquivado de novo');
select throws_ok(format('select erase_student_data(%L,%L)', :'ws', :'a'), '23514', 'student_name_mismatch',
  'A chamada direta também precisa da confirmação');
select set_config('request.headers', '{"x-student-name-sha256":"incorreto"}', true);
select throws_ok(format('select erase_student_data(%L,%L)', :'ws', :'a'), '23514', 'student_name_mismatch',
  'Um nome incorreto não autoriza a exclusão');
select set_config('request.headers', jsonb_build_object('x-student-name-sha256',
  encode(sha256(convert_to('Aluno A','UTF8')),'hex'))::text, true);
select is(erase_student_data(:'ws', :'a'),
  '{"deleted":{"lesson_notes":3,"lesson_plans":2,"student_subjects":1,"student_guardians":2,"guardians":1,"lessons":2,"recurrences":1},
    "anonymized":{"students":1,"payments":1,"lessons":1}}'::jsonb, 'Conta cada exclusão e anonimização');
select ok((select name = 'Aluno removido' and birth_date is null and grade_id is null and school is null
  and notes is null and guardian_consent_at is null and anonymized_at is not null and archived_at is not null
  from students where workspace_id = :'ws' and id = :'a'), 'Perfil anonimizado continua arquivado');
select is((select count(*) from guardians where workspace_id = :'ws' and id = :'a'), 0::bigint, 'Remove contato exclusivo');
select ok(exists(select from guardians where workspace_id = :'ws' and id = :'unrelated_guardian'),
  'Um contato que nunca pertenceu ao aluno permanece intacto');
select is((select count(*) from lessons where workspace_id = :'ws' and student_id = :'a'
  and meeting_url is null and rescheduled_from_id is null and recurrence_id is null), 2::bigint, 'Mantém as duas aulas cobradas sem links');
select is((select note from payments where workspace_id = :'ws' and id = :'a'), '', 'Apaga observação do pagamento');
select is((select previous_hourly_rate from student_rate_history where workspace_id = :'ws' and student_id = :'a'), 8000, 'Preserva tarifa anterior');
select is_empty(format('select 1 from lesson_notes n join lessons l on (l.workspace_id,l.id) = (n.workspace_id,n.lesson_id)
  where l.workspace_id = %1$L and l.student_id = %2$L
  union all select 1 from lesson_plans p join lessons l on (l.workspace_id,l.id) = (p.workspace_id,p.lesson_id)
  where l.workspace_id = %1$L and l.student_id = %2$L
  union all select 1 from student_subjects where workspace_id = %1$L and student_id = %2$L
  union all select 1 from student_guardians where workspace_id = %1$L and student_id = %2$L
  union all select 1 from recurrences where workspace_id = %1$L and student_id = %2$L', :'ws', :'a'),
  'Remove os dados pedagógicos, os vínculos e as recorrências');
select set_config('request.headers', '{}', true);
select is(erase_student_data(:'ws', :'a'),
  '{"deleted":{"lesson_notes":0,"lesson_plans":0,"student_subjects":0,"student_guardians":0,"guardians":0,"lessons":0,"recurrences":0},
    "anonymized":{"students":0,"payments":0,"lessons":0}}'::jsonb, 'Repetir não altera registros');
select is(set_student_archived(:'ws', :'a', false), false, 'Recusa reativação');
select is(save_student(:'ws','Nome novo',100,false,'{}',:'a'), false, 'Recusa edição por save_student');
select throws_ok(format('update students set archived_at = null where id = %L', :'a'), '42501', null, 'Recusa reativação direta');
select throws_ok(format('update students set name = ''Nome novo'' where id = %L', :'a'), '23514', 'student_anonymized', 'Recusa edição direta');
select throws_ok(format('insert into lesson_notes (workspace_id,lesson_id,worked_on) values (%L,%L,''Novo texto'')', :'ws', :'a'),
  '23514','student_anonymized','Uma ficha antiga não recria o registro pedagógico');
select throws_ok(format('update lessons set student_id = %L where workspace_id = %L and id in
  (select lesson_id from charges where workspace_id = %L and student_id = %L and payment_id is null)',
  :'b', :'ws', :'ws', :'a'), '23514', 'student_anonymized', 'Uma aula cobrada do aluno removido não pode mudar de aluno');
reset role;
select bag_eq(format('select * from pg_temp.student_rows(%L,%L) union all select * from pg_temp.student_rows(%L,%L)',
  :'ws', :'b', :'other_ws', :'a'), 'table untouched', 'Preserva o aluno B, seu responsável compartilhado e o outro espaço');
select bag_eq(format('select * from charges where workspace_id = %L and student_id = %L', :'ws', :'a'),
  'table kept_charges', 'Mantém integralmente as cobranças pagas e pendentes');
select bag_eq(format('select to_jsonb(p) - ''note'' from payments p where workspace_id = %L and student_id = %L', :'ws', :'a'),
  'table kept_payments', 'Mantém datas, valores e vínculos dos pagamentos');
select bag_eq('table billed_lessons', 'table original_billed_lessons', 'Mantém datas, duração e situação das aulas cobradas');
select results_eq('table financial_totals', 'table original_totals',
  'Os totais cobrados, a receber e recebidos são iguais antes e depois da exclusão');

-- Outstanding charges may still be settled, without recording identifying text.
select lesson_id as pending_lesson from charges
where workspace_id = :'ws' and student_id = :'a' and payment_id is null \gset
select (now() at time zone 'America/Sao_Paulo')::date as payment_date \gset
set local role authenticated;
select throws_ok(format('select record_payment(%L,%L,array[%L::uuid],%L,''pix'',''Outro texto'')',
  :'ws', :'a', :'pending_lesson', :'payment_date'), '23514', 'student_anonymized',
  'Impede que um novo pagamento volte a identificar o aluno');
select ok(record_payment(:'ws', :'a', array[:'pending_lesson'::uuid], :'payment_date', 'pix', '') is not null,
  'A professora ainda pode receber a cobrança pendente');
select * from finish();
rollback;
