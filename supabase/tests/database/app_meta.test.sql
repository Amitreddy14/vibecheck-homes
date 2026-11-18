-- Run with: pnpm db:test   (needs the local database: pnpm db:start)
begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

-- Structure
select has_table('public', 'app_meta', 'app_meta table exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.app_meta'::regclass),
  'RLS is enabled on app_meta'
);

-- Guard for every future table: nothing in public may ship without RLS.
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'every table in the public schema has RLS enabled'
);

-- Data rules (as the table owner)
select throws_ok(
  $$ insert into public.app_meta (key, value) values ('Bad Key', '1') $$,
  '23514',
  null,
  'keys must be lower_snake_case'
);

insert into public.app_meta (key, value) values ('test_flag', 'true');

-- Signed-out visitors
set local role anon;

select is(
  (select count(*)::int from public.app_meta where key = 'test_flag'),
  1,
  'anon can read app settings'
);

select throws_ok(
  $$ insert into public.app_meta (key, value) values ('sneaky', '1') $$,
  '42501',
  null,
  'anon cannot insert settings'
);

-- Signed-in users
set local role authenticated;

select throws_ok(
  $$ update public.app_meta set value = 'false' where key = 'test_flag' $$,
  '42501',
  null,
  'authenticated users cannot change settings'
);

select throws_ok(
  $$ delete from public.app_meta where key = 'test_flag' $$,
  '42501',
  null,
  'authenticated users cannot delete settings'
);

reset role;

select * from finish();

rollback;
