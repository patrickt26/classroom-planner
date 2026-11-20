-- Professora e alunos fictícios, exclusivos do ambiente de desenvolvimento.
do $$
declare
  teacher_id uuid := '60000000-0000-4000-8000-000000000001';
  ws uuid;
begin
  insert into auth.users (
    id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data,
    raw_user_meta_data, confirmation_token, recovery_token, email_change,
    email_change_token_new, created_at, updated_at
  ) values (
    teacher_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'professora.exemplo@example.test', now(), '{"provider":"email","providers":["email"]}',
    '{}', '', '', '', '', now(), now()
  );
  insert into auth.identities (user_id, provider_id, provider, identity_data)
  values (teacher_id, teacher_id::text, 'email',
    jsonb_build_object('sub', teacher_id, 'email', 'professora.exemplo@example.test'));

  select workspace_id into strict ws from public.memberships where user_id = teacher_id;
  update public.workspaces set name = 'Espaço de exemplo' where workspace_id = ws;

  insert into public.grades (workspace_id, name)
  select ws, year_number || 'º ano' from generate_series(1, 9) as year_number;

  insert into public.subjects (workspace_id, name)
  select ws, unnest(array['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia']);

  insert into public.students (workspace_id, name, grade_id, hourly_rate, is_free)
  select ws, sample.name, grades.id, sample.rate, sample.is_free
  from (values
    ('Aluno A', '2º ano', 8000, false),
    ('Aluno B', '4º ano', 0, true),
    ('Aluno C', '7º ano', 9050, false)
  ) as sample(name, grade, rate, is_free)
  join public.grades on grades.workspace_id = ws and grades.name = sample.grade;

  insert into public.student_subjects (workspace_id, student_id, subject_id)
  select ws, students.id, subjects.id from public.students
  join public.subjects using (workspace_id)
  where students.workspace_id = ws and subjects.name = 'Matemática';

  insert into public.guardians (workspace_id, name) values (ws, 'Responsável A');
  insert into public.student_guardians (workspace_id, student_id, guardian_id, relationship, is_financial_guardian)
  select ws, students.id, guardians.id, 'Mãe', true from public.students
  join public.guardians using (workspace_id)
  where students.workspace_id = ws and students.name = 'Aluno A' and guardians.name = 'Responsável A';
end;
$$;
