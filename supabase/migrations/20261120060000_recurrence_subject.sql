alter table public.recurrences
  add column subject_id uuid not null,
  add foreign key (workspace_id, subject_id) references public.subjects (workspace_id, id);

grant update (subject_id) on public.recurrences to authenticated;
