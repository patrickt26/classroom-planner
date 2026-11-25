begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(10);

insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
select lives_ok($$insert into terms_acceptances (user_id, terms_version)
  values (auth.uid(), 'v1')$$, 'Pode registrar o próprio aceite');
select is((select accepted_at from terms_acceptances), now(), 'O banco atribui a data e a hora');
select throws_ok($$insert into terms_acceptances (user_id, terms_version)
  values (auth.uid(), 'v1')$$, '23505', null, 'Cada versão tem um único aceite por pessoa');
select lives_ok($$insert into terms_acceptances (user_id, terms_version)
  values (auth.uid(), 'v2')$$, 'Uma nova versão pode ser aceita');
select throws_ok($$update terms_acceptances set terms_version = 'v3'$$,
  '42501', null, 'Nem a própria pessoa pode alterar o aceite');
select throws_ok($$delete from terms_acceptances$$,
  '42501', null, 'Nem a própria pessoa pode apagar o aceite');
select throws_ok($$insert into terms_acceptances (user_id, terms_version, accepted_at)
  values (auth.uid(), 'v3', now())$$, '42501', null, 'O cliente não pode fornecer a data');

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
select is((select count(*) from terms_acceptances), 0::bigint, 'Aceites de outra pessoa ficam privados');
select throws_ok($$insert into terms_acceptances (user_id, terms_version)
  values ('00000000-0000-4000-8000-000000000001', 'v3')$$,
  '42501', null, 'Não pode aceitar em nome de outra pessoa');
select lives_ok($$insert into terms_acceptances (user_id, terms_version)
  values (auth.uid(), 'v1')$$, 'Outra pessoa pode aceitar a mesma versão');

select * from finish();
rollback;
