begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(28);

insert into auth.users (id) values
  ('94000000-0000-4000-8000-000000000001'),
  ('94000000-0000-4000-8000-000000000002');
select workspace_id as ws from memberships where user_id = '94000000-0000-4000-8000-000000000001' \gset
select workspace_id as other_ws from memberships where user_id = '94000000-0000-4000-8000-000000000002' \gset

set local role authenticated;
set local request.jwt.claim.sub = '94000000-0000-4000-8000-000000000001';
insert into grades (workspace_id, name) values (:'ws', 'Série livre') returning id as free_grade \gset
insert into subjects (workspace_id, name) values (:'ws', 'Matéria livre') returning id as free_subject \gset
update grades set archived_at = now() where workspace_id = :'ws' and id = :'free_grade';
update subjects set archived_at = now() where workspace_id = :'ws' and id = :'free_subject';

-- Test the same two unused, archived items as each unauthorized caller.
prepare check_catalog_access(uuid, uuid, uuid, text) as
  select is_empty(format('update %I set archived_at = null where workspace_id = %L and id = %L returning id',
    catalog, $1, id), $4 || ' não desarquiva em ' || catalog)
  from (values ('grades', $2), ('subjects', $3)) as items(catalog, id)
  union all
  select throws_ok(format('select delete_catalog_item(%L, %L, %L)', $1, catalog, id),
    '42501', null, $4 || ' não exclui em ' || catalog)
  from (values ('grades', $2), ('subjects', $3)) as items(catalog, id);

set local request.jwt.claim.sub = '94000000-0000-4000-8000-000000000002';
execute check_catalog_access(:'ws', :'free_grade', :'free_subject', 'Professora de outro espaço');
select is(delete_catalog_item(:'other_ws', 'grades', :'free_grade'), null::uuid, 'ID de série é filtrado pelo espaço');
select is(delete_catalog_item(:'other_ws', 'subjects', :'free_subject'), null::uuid, 'ID de matéria é filtrado pelo espaço');

reset role;
insert into memberships (workspace_id, user_id, role) values (:'ws', '94000000-0000-4000-8000-000000000002', 'student');
set local role authenticated;
execute check_catalog_access(:'ws', :'free_grade', :'free_subject', 'Aluno');
reset role;
update memberships set role = 'guardian' where workspace_id = :'ws' and user_id = '94000000-0000-4000-8000-000000000002';
set local role authenticated;
execute check_catalog_access(:'ws', :'free_grade', :'free_subject', 'Responsável');

set local request.jwt.claim.sub = '94000000-0000-4000-8000-000000000001';
update grades set archived_at = null where workspace_id = :'ws' and id = :'free_grade';
update subjects set archived_at = null where workspace_id = :'ws' and id = :'free_subject';
select is((select id from grades where id = :'free_grade' and archived_at is null), :'free_grade'::uuid,
  'Série desarquivada volta às opções ativas');
select is((select id from subjects where id = :'free_subject' and archived_at is null), :'free_subject'::uuid,
  'Matéria desarquivada volta às opções ativas');
update subjects set archived_at = now() where workspace_id = :'ws' and id = :'free_subject';
select is(delete_catalog_item(:'ws', 'grades', :'free_grade'), :'free_grade'::uuid, 'Exclui série ativa sem uso');
select is(delete_catalog_item(:'ws', 'subjects', :'free_subject'), :'free_subject'::uuid, 'Exclui matéria arquivada sem uso');
select is_empty(format('select id from grades where id = %L', :'free_grade'), 'Série livre removida');
select is_empty(format('select id from subjects where id = %L', :'free_subject'), 'Matéria livre removida');

-- Each item has exactly one reference, including a past lesson and a recurrence without occurrences.
insert into grades (workspace_id, name) values (:'ws', 'Série do aluno') returning id as grade \gset
insert into subjects (workspace_id, name) values (:'ws', 'Matéria do aluno') returning id as linked \gset
insert into subjects (workspace_id, name) values (:'ws', 'Matéria da aula') returning id as taught \gset
insert into subjects (workspace_id, name) values (:'ws', 'Matéria da recorrência') returning id as recurring \gset
insert into students (workspace_id, name, grade_id, hourly_rate)
values (:'ws', 'Aluno A', :'grade', 1000) returning id as student \gset
insert into student_subjects (workspace_id, student_id, subject_id) values (:'ws', :'student', :'linked');
insert into lessons (workspace_id, student_id, subject_id, starts_at, duration_minutes, modality, status)
values (:'ws', :'student', :'taught', now() - interval '1 month', 60, 'presencial', 'falta') returning id as lesson \gset
insert into recurrences (workspace_id, student_id, subject_id, day_of_week, start_date, end_date, start_time, duration_minutes, modality)
values (:'ws', :'student', :'recurring', 3, current_date - 30, current_date - 5, '14:00', 60, 'presencial') returning id as recurrence \gset

select throws_ok(format('select delete_catalog_item(%L, %L, %L)', :'ws', catalog, id),
  '23503', 'Este item já está em uso; arquive em vez de excluir.', 'Bloqueia exclusão por vínculo em ' || source)
from (values ('grades', :'grade', 'students'), ('subjects', :'linked', 'student_subjects'),
  ('subjects', :'taught', 'lessons'), ('subjects', :'recurring', 'recurrences')) as items(catalog, id, source);

select is((select g.id from grades g join students s on (s.workspace_id, s.grade_id) = (g.workspace_id, g.id)
  where s.id = :'student'), :'grade'::uuid, 'Preserva aluno e série');
select is((select s.id from subjects s join student_subjects link on (link.workspace_id, link.subject_id) = (s.workspace_id, s.id)
  where link.student_id = :'student'), :'linked'::uuid, 'Preserva matéria e vínculo com aluno');
select is((select s.id from subjects s join lessons l on (l.workspace_id, l.subject_id) = (s.workspace_id, s.id)
  where l.id = :'lesson'), :'taught'::uuid, 'Preserva aula passada e matéria');
select is((select s.id from subjects s join recurrences r on (r.workspace_id, r.subject_id) = (s.workspace_id, s.id)
  where r.id = :'recurrence'), :'recurring'::uuid, 'Preserva recorrência e matéria');

deallocate check_catalog_access;
select * from finish();
rollback;
