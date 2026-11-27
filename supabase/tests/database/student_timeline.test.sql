begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

with test_users as (
  insert into auth.users (id)
  values ('10000000-0000-4000-8000-000000000015'),
         ('20000000-0000-4000-8000-000000000015'),
         ('30000000-0000-4000-8000-000000000015'),
         ('40000000-0000-4000-8000-000000000015')
  returning id
)
insert into public.terms_acceptances (user_id, terms_version)
select id, public.current_terms_version() from test_users;

select workspace_id as teacher_ws from memberships
where user_id = '10000000-0000-4000-8000-000000000015' \gset
select workspace_id as other_ws from memberships
where user_id = '20000000-0000-4000-8000-000000000015' \gset

insert into memberships (workspace_id, user_id, role)
values (:'teacher_ws', '30000000-0000-4000-8000-000000000015', 'student'),
       (:'teacher_ws', '40000000-0000-4000-8000-000000000015', 'guardian');

insert into students (workspace_id, id, name, hourly_rate)
values (:'teacher_ws', :'teacher_ws', 'Aluno A', 5000),
       (:'other_ws', :'other_ws', 'Aluno B', 5000);
insert into subjects (workspace_id, id, name)
values (:'teacher_ws', :'teacher_ws', 'Disciplina A'),
       (:'other_ws', :'other_ws', 'Disciplina B');

insert into lessons (
  workspace_id, id, student_id, subject_id, starts_at, duration_minutes, modality, status,
  pending_reason, rescheduled_from_id
)
values
  (:'teacher_ws', :'teacher_ws', :'teacher_ws', :'teacher_ws',
    '2026-01-01 15:00Z', 60, 'presencial', 'falta', null, null),
  (:'teacher_ws', '00000000-0000-4000-8000-000000000015', :'teacher_ws', :'teacher_ws',
    '2026-01-02 15:00Z', 60, 'presencial', 'realizada', null, :'teacher_ws'),
  (:'teacher_ws', '00000000-0000-4000-8000-000000000016', :'teacher_ws', :'teacher_ws',
    '2026-01-03 15:00Z', 60, 'presencial', 'confirmada', null, null),
  (:'teacher_ws', '00000000-0000-4000-8000-000000000017', :'teacher_ws', :'teacher_ws',
    '2026-01-04 15:00Z', 60, 'presencial', 'reposicao_pendente', 'falta', null),
  (:'other_ws', :'other_ws', :'other_ws', :'other_ws',
    '2026-01-05 15:00Z', 60, 'presencial', 'realizada', null, null);

insert into lesson_notes (workspace_id, lesson_id, worked_on, created_at)
values (:'teacher_ws', '00000000-0000-4000-8000-000000000015', 'Rascunho', '2026-01-02 16:00Z')
returning id as previous_note \gset
insert into lesson_notes (workspace_id, lesson_id, worked_on, created_at, supersedes_id)
values (:'teacher_ws', '00000000-0000-4000-8000-000000000015', 'Frações com desenhos', '2026-01-05 16:00Z', :previous_note),
       (:'other_ws', :'other_ws', 'Registro de outro espaço', '2026-01-05 16:00Z', null);

set local role anon;
select throws_ok('select * from student_timeline', '42501', null, 'Anônimo não lê a linha do tempo');

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000015';
select is(
  (select array_agg(event_type order by occurred_at desc) from student_timeline where student_id = :'teacher_ws'),
  array['registro', 'falta', 'aula', 'reposicao', 'falta'],
  'Lista tipos por data e mantém a falta enquanto aguarda reposição'
);
select is(
  (select array_agg(summary) from student_timeline where event_type = 'registro'),
  array['Frações com desenhos'], 'Mostra apenas a versão atual do registro'
);
select is(
  (select count(*) from student_timeline where workspace_id = :'other_ws'), 0::bigint,
  'Professora não lê a linha do tempo de outro workspace'
);
select ok(
  not has_table_privilege('public.student_timeline', 'INSERT, UPDATE, DELETE'),
  'Professora não tem permissão de escrita na view'
);

set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000015';
select is(
  (select count(*) from student_timeline), 2::bigint,
  'Outra professora lê apenas a aula e o registro do seu próprio workspace'
);

set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000015';
select is((select count(*) from student_timeline), 0::bigint, 'Aluno não lê a linha do tempo');
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000015';
select is((select count(*) from student_timeline), 0::bigint, 'Responsável não lê a linha do tempo');

select * from finish();
rollback;
