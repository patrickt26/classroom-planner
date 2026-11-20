begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(1);

create temporary table timestamp_fixture (
  label text not null,
  updated_at timestamptz not null
);

create trigger set_updated_at
before update on timestamp_fixture
for each row execute function public.set_updated_at();

insert into timestamp_fixture (label, updated_at)
values ('Antes', '2000-01-01 00:00:00+00');
update timestamp_fixture set label = 'Depois';

select cmp_ok(
  (select updated_at from timestamp_fixture),
  '>=',
  transaction_timestamp(),
  'O trigger atualiza updated_at ao editar um registro'
);

select * from finish();
rollback;
