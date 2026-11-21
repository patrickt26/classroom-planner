begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(26);

insert into auth.users (id)
values ('10000000-0000-4000-8000-000000000038'),
       ('20000000-0000-4000-8000-000000000038');

select workspace_id as teacher_ws from memberships
where user_id = '10000000-0000-4000-8000-000000000038' \gset
select workspace_id as other_ws from memberships
where user_id = '20000000-0000-4000-8000-000000000038' \gset

insert into students (workspace_id, id, name, hourly_rate)
values (:'teacher_ws', :'teacher_ws', 'Aluno A', 5000),
       (:'other_ws', :'other_ws', 'Aluno B', 5000);
insert into subjects (workspace_id, id, name)
values (:'teacher_ws', :'teacher_ws', 'Disciplina A'),
       (:'other_ws', :'other_ws', 'Disciplina B');

insert into recurrences (
  workspace_id, id, student_id, subject_id, day_of_week,
  start_time, duration_minutes, modality, start_date, end_date
)
values (:'teacher_ws', :'teacher_ws', :'teacher_ws', :'teacher_ws',
        1, '09:00', 60, 'presencial', '2020-01-01', '2020-01-01');

insert into lessons (
  workspace_id, id, student_id, subject_id, starts_at,
  duration_minutes, modality, status, recurrence_id, rescheduled_from_id
)
select :'teacher_ws', fixture.id, :'teacher_ws', :'teacher_ws', fixture.starts_at,
       60, 'presencial', fixture.status, fixture.recurrence_id, fixture.rescheduled_from_id
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, now() + interval '1 day', 'agendada'::lesson_status, null::uuid, null::uuid),
  ('00000000-0000-4000-8000-000000000002', now() - interval '1 day', 'confirmada', null, null),
  ('00000000-0000-4000-8000-000000000003', now(), 'realizada', null, null),
  ('00000000-0000-4000-8000-000000000004', now(), 'falta', null, null),
  ('00000000-0000-4000-8000-000000000005', now(), 'cancelada', null, null),
  ('00000000-0000-4000-8000-000000000006', now(), 'reposicao_pendente', null, null),
  ('00000000-0000-4000-8000-000000000007', now(), 'agendada', :'teacher_ws', null),
  ('00000000-0000-4000-8000-000000000008', now(), 'agendada', null, null),
  ('00000000-0000-4000-8000-000000000009', now(), 'confirmada', null, '00000000-0000-4000-8000-000000000008')
) as fixture(id, starts_at, status, recurrence_id, rescheduled_from_id);

insert into lessons (workspace_id, id, student_id, subject_id, starts_at, duration_minutes, modality)
values (:'other_ws', '00000000-0000-4000-8000-000000000010', :'other_ws', :'other_ws', now(), 60, 'presencial');

set local role anon;
select throws_ok(
  format('select public.delete_lesson(%L, %L)', :'teacher_ws', '00000000-0000-4000-8000-000000000001'),
  '42501', null, 'Anônimo não pode chamar a RPC'
);
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000038';

select throws_ok('delete from public.lessons', '42501', null, 'Professora não tem DELETE direto');
select ok(can_delete_lesson(:'teacher_ws', '00000000-0000-4000-8000-000000000001'), 'Mostra exclusão para aula avulsa agendada');
select is(delete_lesson(:'teacher_ws', '00000000-0000-4000-8000-000000000001'), now() + interval '1 day', 'Exclui aula agendada futura e retorna seu horário');
select ok(not exists (select from lessons where id = '00000000-0000-4000-8000-000000000001'), 'Aula excluída some da agenda');
select is(delete_lesson(:'teacher_ws', '00000000-0000-4000-8000-000000000001'), null::timestamptz, 'Segundo envio é seguro');

select ok(can_delete_lesson(:'teacher_ws', '00000000-0000-4000-8000-000000000002'), 'Mostra exclusão para aula avulsa confirmada');
select is(delete_lesson(:'teacher_ws', '00000000-0000-4000-8000-000000000002'), now() - interval '1 day', 'Exclui aula confirmada passada');

select is(can_delete_lesson(:'teacher_ws', id), false, 'Oculta exclusão: ' || description)
from (values
  ('00000000-0000-4000-8000-000000000003'::uuid, 'realizada'),
  ('00000000-0000-4000-8000-000000000004', 'falta'),
  ('00000000-0000-4000-8000-000000000005', 'cancelada'),
  ('00000000-0000-4000-8000-000000000006', 'reposição pendente'),
  ('00000000-0000-4000-8000-000000000007', 'recorrente'),
  ('00000000-0000-4000-8000-000000000008', 'original com reposição'),
  ('00000000-0000-4000-8000-000000000009', 'aula de reposição')
) as fixture(id, description);

select is(delete_lesson(:'teacher_ws', id), null::timestamptz, 'Recusa exclusão: ' || description)
from (values
  ('00000000-0000-4000-8000-000000000003'::uuid, 'realizada'),
  ('00000000-0000-4000-8000-000000000004', 'falta'),
  ('00000000-0000-4000-8000-000000000005', 'cancelada'),
  ('00000000-0000-4000-8000-000000000006', 'reposição pendente'),
  ('00000000-0000-4000-8000-000000000007', 'recorrente'),
  ('00000000-0000-4000-8000-000000000008', 'original com reposição'),
  ('00000000-0000-4000-8000-000000000009', 'aula de reposição')
) as fixture(id, description);

select is(can_delete_lesson(:'other_ws', '00000000-0000-4000-8000-000000000010'), false, 'Oculta exclusão em outro workspace');
select is(delete_lesson(:'other_ws', '00000000-0000-4000-8000-000000000010'), null::timestamptz, 'Recusa exclusão em outro workspace');

reset role;
select is((select count(*) from lessons where workspace_id = :'teacher_ws'), 7::bigint, 'Aulas protegidas permanecem intactas');
select ok(exists (select from lessons where workspace_id = :'other_ws'), 'Aula de outro workspace permanece intacta');

select * from finish();
rollback;
