-- Professora e alunos fictícios, exclusivos do ambiente de desenvolvimento.
do $$
declare
  teacher_id uuid := '60000000-0000-4000-8000-000000000001';
  ws uuid;
  workspace_time_zone text;
  current_week_start date;
  current_local_date date;
  previous_month_start date;
  previous_month_paid_lesson uuid;
  previous_month_payer uuid;
  math_subject_id uuid;
  previous_note_id bigint;
  example_meeting_url constant text := 'https://meet.google.com/exemplo-agenda';
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data,
    raw_user_meta_data, confirmation_token, recovery_token, email_change,
    email_change_token_new, created_at, updated_at
  ) values (
    teacher_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'professora.exemplo@example.test', extensions.crypt('senha-de-teste', extensions.gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}',
    '{}', '', '', '', '', now(), now()
  );
  insert into auth.identities (user_id, provider_id, provider, identity_data, created_at, updated_at)
  values (teacher_id, teacher_id::text, 'email',
    jsonb_build_object('sub', teacher_id, 'email', 'professora.exemplo@example.test'), now(), now());

  select workspace_id into strict ws from public.memberships where user_id = teacher_id;
  update public.workspaces set name = 'Espaço de exemplo' where workspace_id = ws
  returning time_zone into strict workspace_time_zone;
  current_week_start := date_trunc('week', now() at time zone workspace_time_zone)::date;
  current_local_date := (now() at time zone workspace_time_zone)::date;
  previous_month_start := (date_trunc('month', current_local_date) - interval '1 month')::date;

  select id into strict math_subject_id from public.subjects
  where workspace_id = ws and name = 'Matemática';

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

  insert into public.guardians (workspace_id, name)
  values (ws, 'Responsável A'), (ws, 'Responsável C');
  insert into public.student_guardians (workspace_id, student_id, guardian_id, relationship, is_financial_guardian)
  select ws, students.id, guardians.id, sample.relationship, sample.financial
  from (values
    ('Aluno A', 'Responsável A', 'Mãe', true),
    ('Aluno B', 'Responsável A', 'Mãe', false),
    ('Aluno C', 'Responsável C', 'Tutor', true)
  ) as sample(student_name, guardian_name, relationship, financial)
  join public.students on students.workspace_id = ws and students.name = sample.student_name
  join public.guardians on guardians.workspace_id = ws and guardians.name = sample.guardian_name;

  -- The recurrence trigger generates lessons for the next eight weeks.
  insert into public.recurrences (
    workspace_id, student_id, subject_id, day_of_week, start_time, duration_minutes,
    modality, meeting_url, start_date, end_date
  )
  select ws, students.id, math_subject_id, sample.weekday, sample.start_time,
    sample.duration_minutes, sample.modality::public.lesson_modality, sample.meeting_url,
    current_week_start + sample.start_offset, current_week_start + sample.end_offset
  from (values
    ('Aluno A', 2, time '14:00', 60, 'presencial', null, 0, null),
    ('Aluno C', 4, time '16:00', 45, 'online', example_meeting_url, 0, null),
    ('Aluno B', 6, time '11:00', 50, 'presencial', null, 12, 26)
  ) as sample(student_name, weekday, start_time, duration_minutes, modality, meeting_url, start_offset, end_offset)
  join public.students on students.workspace_id = ws and students.name = sample.student_name;

  insert into public.lessons (
    workspace_id, student_id, subject_id, starts_at, duration_minutes,
    modality, meeting_url, status, pending_reason
  )
  select ws, students.id, math_subject_id,
    (current_week_start + sample.day_offset + sample.start_time) at time zone workspace_time_zone,
    sample.duration_minutes, sample.modality::public.lesson_modality, sample.meeting_url,
    sample.status::public.lesson_status, sample.pending_reason::public.lesson_status
  from (values
    -- A 90-minute lesson at R$ 80/h produces a pending charge of 12000 cents.
    ('Aluno A', -9, time '09:00', 90, 'presencial', null, 'realizada', null),
    ('Aluno B', -9, time '11:00', 60, 'presencial', null, 'realizada', null),
    ('Aluno A', -8, time '14:00', 60, 'presencial', null, 'realizada', null),
    ('Aluno A', -6, time '14:00', 60, 'presencial', null, 'realizada', null),
    ('Aluno A', -4, time '10:00', 60, 'presencial', null, 'falta', null),
    ('Aluno C', -5, time '16:00', 45, 'online', example_meeting_url, 'falta', null),
    ('Aluno B', -3, time '15:00', 60, 'presencial', null, 'cancelada', null),
    ('Aluno A', -2, time '10:00', 60, 'presencial', null, 'reposicao_pendente', 'falta'),
    ('Aluno C', 6, time '16:00', 45, 'online', example_meeting_url, 'confirmada', null)
  ) as sample(student_name, day_offset, start_time, duration_minutes, modality, meeting_url, status, pending_reason)
  join public.students on students.workspace_id = ws and students.name = sample.student_name;

  -- Today's dashboard can be exercised on any day of the week.
  insert into public.lessons (
    workspace_id, student_id, subject_id, starts_at, duration_minutes,
    modality, meeting_url, status
  )
  select ws, students.id, math_subject_id,
    (current_local_date + sample.start_time) at time zone workspace_time_zone,
    sample.duration_minutes, sample.modality::public.lesson_modality,
    sample.meeting_url, sample.status::public.lesson_status
  from (values
    ('Aluno C', time '09:30', 45, 'online', example_meeting_url, 'confirmada'),
    ('Aluno B', time '13:00', 50, 'presencial', null, 'realizada')
  ) as sample(student_name, start_time, duration_minutes, modality, meeting_url, status)
  join public.students on students.workspace_id = ws and students.name = sample.student_name;

  -- An absence with a completed replacement for the student's timeline.
  insert into public.lessons (
    workspace_id, student_id, subject_id, starts_at, duration_minutes,
    modality, status, rescheduled_from_id
  )
  select ws, original.student_id, original.subject_id,
    (current_week_start - 1 + time '10:00') at time zone workspace_time_zone,
    original.duration_minutes, original.modality, 'realizada', original.id
  from public.lessons as original
  where original.workspace_id = ws and original.status = 'falta'
    and original.starts_at = (current_week_start - 4 + time '10:00') at time zone workspace_time_zone;

  insert into public.lesson_plans (workspace_id, lesson_id, objective, content, activities, materials)
  select ws, lessons.id,
    'Comparar frações com o mesmo denominador',
    'Partes do inteiro, numerador e denominador.',
    'Montar pares de frações com tiras de papel e comparar as partes pintadas.',
    'Papel quadriculado, lápis de cor e régua.'
  from public.lessons
  where lessons.workspace_id = ws
    and lessons.starts_at = (current_week_start - 6 + time '14:00') at time zone workspace_time_zone;

  insert into public.lesson_notes (workspace_id, lesson_id, worked_on, difficulties, next_steps)
  select ws, lesson.id,
    'Comparamos frações com tiras de papel.',
    'Precisou de apoio para identificar o numerador.',
    'Retomar a atividade com desenhos.'
  from public.lessons as lesson
  where lesson.workspace_id = ws
    and lesson.starts_at = (current_week_start - 6 + time '14:00') at time zone workspace_time_zone
  returning id into strict previous_note_id;

  insert into public.lesson_notes (workspace_id, lesson_id, worked_on, difficulties, next_steps, supersedes_id)
  select ws, lesson_id,
    'Comparamos frações com tiras de papel e registramos as primeiras comparações no caderno.',
    'Precisou de apoio para identificar o numerador e separá-lo do denominador.',
    'Começar com desenhos e depois comparar duas frações com o mesmo denominador.',
    previous_note_id
  from public.lesson_notes where id = previous_note_id;

  -- This older lesson's note is entered later to exercise continuity ordering.
  insert into public.lesson_notes (workspace_id, lesson_id, worked_on, difficulties, next_steps)
  select ws, lesson.id,
    'Dividimos figuras em partes iguais.',
    'Precisou de apoio para repartir uma figura em três partes iguais.',
    'Praticar divisões com dobraduras.'
  from public.lessons as lesson
  where lesson.workspace_id = ws
    and lesson.starts_at = (current_week_start - 8 + time '14:00') at time zone workspace_time_zone;

  -- Future lessons use the new rate. The charge above keeps its original amount.
  update public.students set hourly_rate = 8500 where workspace_id = ws and name = 'Aluno A';
  -- Two completed lessons settled together. The other charges remain available for selection.
  perform set_config('request.jwt.claim.sub', teacher_id::text, true);
  perform public.record_payment(ws, student_id, array_agg(id),
    (now() at time zone workspace_time_zone)::date, 'pix', 'Pagamento de duas aulas.')
  from public.lessons
  where workspace_id = ws and status = 'realizada'
    and starts_at in (
      (current_week_start - 8 + time '14:00') at time zone workspace_time_zone,
      (current_week_start - 6 + time '14:00') at time zone workspace_time_zone
    )
  group by student_id;

  -- A previous month with both a pending charge and a recorded payment.
  insert into public.lessons (
    workspace_id, student_id, subject_id, starts_at, duration_minutes, modality, status
  )
  select ws, id, math_subject_id,
    (previous_month_start + time '09:00') at time zone workspace_time_zone,
    60, 'presencial', 'realizada'
  from public.students where workspace_id = ws and name = 'Aluno A';

  insert into public.lessons (
    workspace_id, student_id, subject_id, starts_at, duration_minutes, modality, status
  )
  select ws, id, math_subject_id,
    (previous_month_start + time '11:00') at time zone workspace_time_zone,
    60, 'presencial', 'realizada'
  from public.students where workspace_id = ws and name = 'Aluno C'
  returning id, student_id into strict previous_month_paid_lesson, previous_month_payer;

  perform public.record_payment(ws, previous_month_payer, array[previous_month_paid_lesson],
    previous_month_start + 1, 'pix', 'Pagamento do mês anterior.');
end;
$$;
