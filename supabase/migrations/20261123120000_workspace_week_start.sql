create type public.week_start_day as enum ('monday', 'sunday');

alter table public.workspaces
  add column week_start public.week_start_day not null default 'monday';

grant update (week_start) on public.workspaces to authenticated;
