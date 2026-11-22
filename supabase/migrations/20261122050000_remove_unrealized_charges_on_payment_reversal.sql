create or replace function public.reverse_payment(target_workspace_id uuid, target_payment_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_role(target_workspace_id, 'teacher') then
    raise insufficient_privilege;
  end if;
  update public.payments set reversed_at = now()
  where workspace_id = target_workspace_id and id = target_payment_id and reversed_at is null;
  if not found then return false; end if;

  -- Serialize with lesson updates so the charge triggers see the result of the reversal.
  perform 1 from public.lessons as lesson
  join public.charges as charge
    on charge.workspace_id = lesson.workspace_id and charge.lesson_id = lesson.id
  where charge.workspace_id = target_workspace_id and charge.payment_id = target_payment_id
  order by lesson.id for no key update of lesson;

  delete from public.charges as charge using public.lessons as lesson
  where charge.workspace_id = target_workspace_id and charge.payment_id = target_payment_id
    and lesson.workspace_id = charge.workspace_id and lesson.id = charge.lesson_id
    and lesson.status <> 'realizada';

  update public.charges set payment_id = null
  where workspace_id = target_workspace_id and payment_id = target_payment_id;
  return true;
end;
$$;
