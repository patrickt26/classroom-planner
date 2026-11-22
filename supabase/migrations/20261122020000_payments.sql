create type public.payment_method as enum ('pix', 'cash', 'transfer', 'other');

create table public.payments (
  workspace_id uuid not null,
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  paid_on date not null,
  amount_cents bigint not null check (amount_cents >= 0),
  method public.payment_method not null,
  note text not null default '' check (length(note) <= 1000),
  reversed_at timestamptz,
  primary key (workspace_id, id),
  unique (workspace_id, student_id, id),
  foreign key (workspace_id, student_id) references public.students (workspace_id, id)
);
alter table public.charges add foreign key (workspace_id, student_id, payment_id)
  references public.payments (workspace_id, student_id, id);
create index charges_payment_idx on public.charges (workspace_id, payment_id);

alter table public.payments enable row level security;
create policy teacher_read on public.payments for select to authenticated
using (public.has_role(workspace_id, 'teacher'));
revoke all on public.payments from public, anon, authenticated;
grant select on public.payments to authenticated;

create function public.record_payment(target_workspace_id uuid, target_student_id uuid,
  lesson_ids uuid[], payment_date date, payment_method public.payment_method, payment_note text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  payment uuid;
  charge_count integer;
  total bigint;
  zone text;
  latest_lesson date;
begin
  if not public.has_role(target_workspace_id, 'teacher') then
    raise insufficient_privilege;
  end if;
  select time_zone into strict zone from public.workspaces where workspace_id = target_workspace_id;
  -- Lock in a stable order. After a concurrent payment commits, only still-pending rows qualify.
  select count(*), sum(locked.amount_cents), max((locked.starts_at at time zone zone)::date)
  into charge_count, total, latest_lesson
  from (
    select c.amount_cents, l.starts_at from public.charges c
    join public.lessons l on l.workspace_id = c.workspace_id and l.id = c.lesson_id
    where c.workspace_id = target_workspace_id and c.student_id = target_student_id
      and c.lesson_id = any(lesson_ids) and c.payment_id is null
    order by c.lesson_id for update of c
  ) locked;
  if charge_count = 0 or charge_count <> cardinality(lesson_ids) then
    raise exception 'Invalid pending charges' using errcode = 'P0001';
  end if;
  if payment_date < latest_lesson or payment_date > (now() at time zone zone)::date then
    raise exception 'Invalid payment date' using errcode = '22007';
  end if;
  insert into public.payments (workspace_id, student_id, amount_cents, paid_on, method, note)
  values (target_workspace_id, target_student_id, total, payment_date, payment_method, trim(payment_note))
  returning id into payment;
  update public.charges set payment_id = payment
  where workspace_id = target_workspace_id and student_id = target_student_id and lesson_id = any(lesson_ids);
  return payment;
end;
$$;

create function public.reverse_payment(target_workspace_id uuid, target_payment_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_role(target_workspace_id, 'teacher') then
    raise insufficient_privilege;
  end if;
  update public.payments set reversed_at = now()
  where workspace_id = target_workspace_id and id = target_payment_id and reversed_at is null;
  if not found then return false; end if;
  update public.charges set payment_id = null
  where workspace_id = target_workspace_id and payment_id = target_payment_id;
  return true;
end;
$$;
revoke all on function public.record_payment(uuid, uuid, uuid[], date, public.payment_method, text),
  public.reverse_payment(uuid, uuid) from public, anon, authenticated;
grant execute on function public.record_payment(uuid, uuid, uuid[], date, public.payment_method, text),
  public.reverse_payment(uuid, uuid) to authenticated;
