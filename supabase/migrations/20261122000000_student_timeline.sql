create view public.student_timeline
with (security_invoker = true) as
select
  lesson.workspace_id,
  lesson.student_id,
  lesson.id as lesson_id,
  lesson.starts_at as occurred_at,
  case
    when lesson.status = 'falta' or lesson.pending_reason = 'falta' then 'falta'
    when lesson.rescheduled_from_id is not null or lesson.status = 'reposicao_pendente' then 'reposicao'
    else 'aula'
  end as event_type,
  subject.name as subject_name,
  lesson.status,
  null::text as summary
from public.lessons as lesson
join public.subjects as subject
  on (subject.workspace_id, subject.id) = (lesson.workspace_id, lesson.subject_id)

union all

select
  lesson.workspace_id,
  lesson.student_id,
  lesson.id,
  note.created_at,
  'registro',
  subject.name,
  null::public.lesson_status,
  note.worked_on
from public.lesson_notes as note
join public.lessons as lesson
  on (lesson.workspace_id, lesson.id) = (note.workspace_id, note.lesson_id)
join public.subjects as subject
  on (subject.workspace_id, subject.id) = (lesson.workspace_id, lesson.subject_id)
where not exists (
  select from public.lesson_notes as successor
  where (successor.workspace_id, successor.lesson_id, successor.supersedes_id)
    = (note.workspace_id, note.lesson_id, note.id)
);

revoke all on public.student_timeline from public, anon, authenticated;
grant select on public.student_timeline to authenticated;
