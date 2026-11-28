begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

\set teacher '10000000-0000-4000-8000-000000000017'
\set other_teacher '20000000-0000-4000-8000-000000000017'
\set student_user '30000000-0000-4000-8000-000000000017'
\set guardian_user '40000000-0000-4000-8000-000000000017'
\set first '50000000-0000-4000-8000-000000000017'
\set second '60000000-0000-4000-8000-000000000017'
\set third '70000000-0000-4000-8000-000000000017'

with test_users as (
  insert into auth.users (id) values (:'teacher'), (:'other_teacher'), (:'student_user'), (:'guardian_user')
  returning id
)
insert into public.terms_acceptances (user_id, terms_version)
select id, public.current_terms_version() from test_users;
select workspace_id as ws from memberships where user_id = :'teacher' \gset
select workspace_id as other_ws from memberships where user_id = :'other_teacher' \gset
insert into memberships (workspace_id, user_id, role)
values (:'ws', :'student_user', 'student'), (:'ws', :'guardian_user', 'guardian');
insert into students (workspace_id, id, name, hourly_rate, is_free)
values (:'ws', :'ws', 'Aluno A', 9050, false), (:'ws', :'student_user', 'Aluno B', 4000, false),
  (:'other_ws', :'ws', 'Aluno C', 5000, false);
insert into subjects (workspace_id, id, name)
values (:'ws', :'ws', 'Disciplina A'), (:'other_ws', :'ws', 'Disciplina B');
insert into lessons (workspace_id, id, student_id, subject_id, starts_at, duration_minutes, modality, status)
values (:'ws', :'first', :'ws', :'ws', now() - interval '3 days', 60, 'online', 'realizada'),
       (:'ws', :'second', :'ws', :'ws', now() - interval '2 days', 30, 'online', 'realizada'),
       (:'ws', :'third', :'student_user', :'ws', now() - interval '2 days', 60, 'online', 'realizada'),
       (:'other_ws', :'first', :'ws', :'ws', now() - interval '2 days', 60, 'online', 'realizada');

set local role anon;
select throws_ok('select * from payments', '42501', null, 'Anônimo não lê pagamentos');
set local role authenticated;
set local request.jwt.claim.sub = :'teacher';
select throws_ok('insert into payments default values', '42501', null, 'Sem gravação direta');
select throws_ok('update payments set amount_cents = 1', '42501', null, 'Sem alteração de valor');
select throws_ok('delete from payments', '42501', null, 'Sem exclusão do histórico');
select throws_ok(format('select record_payment(%L,%L,array[%L,%L]::uuid[],current_date-1,%L,%L)',
  :'ws', :'ws', :'first', :'third', 'cash', ''), 'P0001', null, 'Seleção com alunos diferentes é recusada');
select throws_ok(format('select record_payment(%L,%L,array[%L,%L]::uuid[],current_date-1,%L,%L)',
  :'ws', :'ws', :'first', :'first', 'cash', ''), 'P0001', null, 'Aula repetida é recusada');
select throws_ok(format('select record_payment(%L,%L,array[%L]::uuid[],current_date+2,%L,%L)',
  :'ws', :'ws', :'first', 'pix', ''), '22007', null, 'Data futura é recusada');
select throws_ok(format('select record_payment(%L,%L,array[%L]::uuid[],current_date-5,%L,%L)',
  :'ws', :'ws', :'first', 'pix', ''), '22007', null, 'Adiantamento é recusado');
select is((select count(*) from payments), 0::bigint, 'Seleções inválidas não gravam pagamento parcial');
select record_payment(:'ws', :'ws', array[:'first', :'second']::uuid[], current_date-1, 'pix', 'Duas aulas') as payment \gset
select is((select amount_cents from payments), 13575::bigint, 'Pagamento soma as duas cobranças em centavos');
select is((select count(*) from charges where payment_id = :'payment'), 2::bigint, 'Aulas quitadas juntas');
select throws_ok(format('select record_payment(%L,%L,array[%L]::uuid[],current_date-1,%L,%L)',
  :'ws', :'ws', :'first', 'other', ''), 'P0001', null, 'Reenvio não quita novamente');

set local request.jwt.claim.sub = :'other_teacher';
select is((select count(*) from payments), 0::bigint, 'Outra professora não lê o pagamento');
select throws_ok(format('select reverse_payment(%L,%L)', :'ws', :'payment'), '42501', null, 'Estorno entre espaços recusado');
select throws_ok(format('select record_payment(%L,%L,array[%L]::uuid[],current_date-1,%L,%L)',
  :'ws', :'student_user', :'third', 'pix', ''), '42501', null, 'Registro entre espaços recusado');
select is((select payment_id from charges where lesson_id = :'first'), null::uuid, 'Aula homônima do outro espaço intacta');
set local request.jwt.claim.sub = :'student_user';
select is((select count(*) from payments), 0::bigint, 'Aluno não lê pagamentos');
select throws_ok(format('select reverse_payment(%L,%L)', :'ws', :'payment'), '42501', null, 'Aluno não estorna');
set local request.jwt.claim.sub = :'guardian_user';
select is((select count(*) from payments), 0::bigint, 'Responsável não lê pagamentos');
select throws_ok(format('select record_payment(%L,%L,array[%L]::uuid[],current_date-1,%L,%L)',
  :'ws', :'student_user', :'third', 'other', ''), '42501', null, 'Responsável não registra pagamento');

set local request.jwt.claim.sub = :'teacher';
update lessons set status = 'agendada' where workspace_id = :'ws' and id = :'second';
select is((select payment_id from charges where lesson_id = :'second'), :'payment'::uuid,
  'Desmarcar a aula preserva a cobrança paga até o estorno');
select ok(reverse_payment(:'ws', :'payment'), 'Estorno aceito');
select ok((select reversed_at is not null from payments where id = :'payment'), 'Estorno preservado no histórico');
select is((select count(*) from charges where lesson_id = :'first' and payment_id is null), 1::bigint,
  'Estorno reabre a cobrança da aula realizada');
select is((select count(*) from charges where lesson_id = :'second'), 0::bigint,
  'Estorno remove a cobrança da aula que deixou de ser realizada');
select record_payment(:'ws', :'ws', array[:'first']::uuid[], current_date-1, 'transfer', '') as replacement \gset
select is(reverse_payment(:'ws', :'payment'), false, 'Repetir estorno não altera pagamento posterior');
select is((select payment_id from charges where lesson_id = :'first'), :'replacement'::uuid, 'Uma aula pode ser quitada depois do estorno');
select * from finish();
rollback;
