begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(26);

insert into auth.users (id) values
  ('63000000-0000-4000-8000-000000000001'),
  ('63000000-0000-4000-8000-000000000002');
select workspace_id as ws from memberships where user_id = '63000000-0000-4000-8000-000000000001' \gset
select workspace_id as other_ws from memberships where user_id = '63000000-0000-4000-8000-000000000002' \gset

set local role authenticated;
set local request.jwt.claim.sub = '63000000-0000-4000-8000-000000000002';
insert into grades (workspace_id, name) values (:'other_ws', 'Série de exemplo');
insert into subjects (workspace_id, name) values (:'other_ws', 'Matéria de exemplo');

set local request.jwt.claim.sub = '63000000-0000-4000-8000-000000000001';
insert into grades (workspace_id, name) values (:'ws', 'Série de exemplo') returning id as grade \gset
insert into subjects (workspace_id, name) values (:'ws', 'Matéria de exemplo') returning id as subject \gset
reset role;
insert into students (workspace_id, name, grade_id, hourly_rate)
values (:'ws', 'Aluno A', :'grade', 1000) returning id as student \gset
insert into students (workspace_id, name, hourly_rate)
values (:'ws', 'Aluno B', 1000) returning id as other_student \gset
set local role authenticated;
insert into student_subjects (workspace_id, student_id, subject_id) values (:'ws', :'student', :'subject');
insert into lessons (workspace_id, student_id, subject_id, starts_at, duration_minutes, modality)
values (:'ws', :'student', :'subject', now(), 60, 'presencial') returning id as lesson \gset
insert into recurrences (workspace_id, student_id, subject_id, day_of_week, start_date, start_time, duration_minutes, modality)
values (:'ws', :'student', :'subject', 3, current_date, '14:00', 60, 'presencial') returning id as recurrence \gset

select is_empty(format('select 1 from grades where workspace_id = %L', :'other_ws'), 'Séries de outro espaço são invisíveis');
select is_empty(format('select 1 from subjects where workspace_id = %L', :'other_ws'), 'Matérias de outro espaço são invisíveis');
with changed as (update grades set name = 'Outro' where workspace_id = :'other_ws' returning id)
select is(count(*), 0::bigint, 'Não renomeia série de outro espaço') from changed;
with changed as (update subjects set archived_at = now() where workspace_id = :'other_ws' returning id)
select is(count(*), 0::bigint, 'Não arquiva matéria de outro espaço') from changed;

select throws_ok(format('insert into grades (workspace_id, name) values (%L, %L)', :'ws', ' série de exemplo '),
  '23505', null, 'Séries com o mesmo nome são recusadas mesmo com caixa e espaços diferentes');
select throws_ok(format('insert into subjects (workspace_id, name) values (%L, %L)', :'ws', ' MATÉRIA DE EXEMPLO '),
  '23505', null, 'Matérias com o mesmo nome são recusadas mesmo com caixa e espaços diferentes');
select throws_ok(format('update grades set name = %L where id = %L', '2º ano', :'grade'),
  '23505', null, 'Renomear série também impede duplicatas');
select throws_ok(format('update subjects set name = %L where id = %L', 'Matemática', :'subject'),
  '23505', null, 'Renomear matéria também impede duplicatas');

update grades set name = 'Série renomeada', archived_at = now() where id = :'grade';
update subjects set name = 'Matéria renomeada', archived_at = now() where id = :'subject';
select is_empty(format('select id from grades where id = %L and archived_at is null', :'grade'), 'Série arquivada sai das opções ativas');
select is_empty(format('select id from subjects where id = %L and archived_at is null', :'subject'), 'Matéria arquivada sai das opções ativas');
select is((select grades.name from students join grades on (grades.workspace_id, grades.id) = (students.workspace_id, students.grade_id)
  where students.id = :'student'), 'Série renomeada', 'Ficha preserva série arquivada e mostra o nome atual');
select is((select subjects.name from lessons join subjects on (subjects.workspace_id, subjects.id) = (lessons.workspace_id, lessons.subject_id)
  where lessons.id = :'lesson'), 'Matéria renomeada', 'Aula preserva matéria arquivada e mostra o nome atual');
select throws_ok(format('insert into subjects (workspace_id, name) values (%L, %L)', :'ws', 'Matéria renomeada'),
  '23505', null, 'Matérias arquivadas continuam reservando o nome');

select throws_ok(format('update students set grade_id = %L where id = %L', :'grade', :'other_student'),
  '23503', 'grade_unavailable', 'Não permite novo vínculo com série arquivada');
select throws_ok(format('insert into student_subjects (workspace_id, student_id, subject_id) values (%L, %L, %L)', :'ws', :'other_student', :'subject'),
  '23503', 'subject_unavailable', 'Não permite novo vínculo de aluno com matéria arquivada');
select throws_ok(format('insert into lessons (workspace_id, student_id, subject_id, starts_at, duration_minutes, modality)
  values (%L, %L, %L, now(), 60, ''presencial'')', :'ws', :'student', :'subject'),
  '23503', 'subject_unavailable', 'Não permite cadastrar uma aula avulsa com matéria arquivada');
select throws_ok(format('insert into recurrences (workspace_id, student_id, subject_id, day_of_week, start_date, start_time, duration_minutes, modality)
  values (%L, %L, %L, 3, current_date, ''15:00'', 60, ''presencial'')', :'ws', :'student', :'subject'),
  '23503', 'subject_unavailable', 'Não permite cadastrar série de aulas com matéria arquivada');
select lives_ok(format('update students set grade_id = %L, name = ''Aluno C'' where id = %L', :'grade', :'student'),
  'Edição mantém a série arquivada já vinculada');
select lives_ok(format('insert into student_subjects (workspace_id, student_id, subject_id) values (%L, %L, %L)
  on conflict do nothing', :'ws', :'student', :'subject'), 'Edição mantém a matéria arquivada já vinculada');

select lives_ok(format('update lessons set subject_id = %L, duration_minutes = 75 where id = %L', :'subject', :'lesson'),
  'Edição mantém a matéria arquivada da aula');
select lives_ok(format('update recurrences set subject_id = %L, start_time = ''16:00'' where id = %L', :'subject', :'recurrence'),
  'Série existente pode gerar aulas com a matéria arquivada que já usa');
select throws_ok('delete from grades', '42501', null, 'Professora não exclui séries');
select throws_ok('delete from subjects', '42501', null, 'Professora não exclui matérias');

reset role;
update memberships set role = 'student' where workspace_id = :'ws';
set local role authenticated;
select is_empty('select id from grades', 'Aluno não lê séries do espaço');
select is_empty('select id from subjects', 'Aluno não lê matérias do espaço');
select throws_ok(format('insert into subjects (workspace_id, name) values (%L, %L)', :'ws', 'Matéria nova'),
  '42501', null, 'Aluno não cadastra matéria no espaço');

select * from finish();
rollback;
