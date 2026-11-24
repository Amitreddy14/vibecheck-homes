-- T1.3 profile tables: ownership (RLS), data rules and cascade delete.
-- Run with: pnpm db:test
begin;

create extension if not exists pgtap with schema extensions;

select plan(30);

-- Two test users. Acting "as" a user = role authenticated + their id in the JWT claims.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'asha@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bala@test.local');

-- ---------------------------------------------------------------- structure
select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'preferences', 'preferences exists');
select has_table('public', 'lifestyle', 'lifestyle exists');
select has_table('public', 'consents', 'consents exists');
select is(
  (select count(*)::int from pg_class
   where oid in ('public.profiles'::regclass, 'public.preferences'::regclass,
                 'public.lifestyle'::regclass, 'public.consents'::regclass)
     and relrowsecurity),
  4,
  'RLS is enabled on all four profile tables'
);

-- ---------------------------------------------------------------- as A (Asha)
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.profiles (id, first_name, date_of_birth, gender, occupation)
     values ('11111111-1111-1111-1111-111111111111', 'Asha', '2003-05-10', 'woman', 'student') $$,
  'A can create her own profile'
);
select throws_ok(
  $$ insert into public.profiles (id, first_name, date_of_birth, gender, occupation)
     values ('22222222-2222-2222-2222-222222222222', 'Fake', '2000-01-01', 'man', 'working') $$,
  '42501', null,
  'A cannot create a profile for someone else'
);
select lives_ok(
  $$ insert into public.preferences (user_id, intent, budget_min, budget_max, area, move_in_month, open_to_genders)
     values ('11111111-1111-1111-1111-111111111111', 'need_room', 8000, 12000, 'Potheri', '2027-01-01', '{woman}') $$,
  'A can save her own preferences'
);
select lives_ok(
  $$ insert into public.lifestyle (user_id, bedtime, tidiness)
     values ('11111111-1111-1111-1111-111111111111', 'before_11pm', 5) $$,
  'A can save a partly answered quiz'
);
select lives_ok(
  $$ insert into public.consents (user_id, purpose, notice_version)
     values ('11111111-1111-1111-1111-111111111111', 'core_service', 'v1') $$,
  'A can record her consent'
);

-- ---------------------------------------------------------------- as B (Bala)
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select lives_ok(
  $$ insert into public.profiles (id, first_name, date_of_birth, gender, occupation)
     values ('22222222-2222-2222-2222-222222222222', 'Bala', '2001-08-20', 'man', 'working') $$,
  'B can create his own profile'
);
select is((select count(*)::int from public.profiles), 1, 'B sees exactly one profile: his own');
select is(
  (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  0, 'B cannot read A''s profile'
);
select is((select count(*)::int from public.preferences), 0, 'B cannot read A''s preferences');
select is((select count(*)::int from public.consents), 0, 'B cannot read A''s consents');

-- B tries to rename A. RLS silently matches zero rows; checked from A's side below.
update public.profiles set first_name = 'Hacked'
  where id = '11111111-1111-1111-1111-111111111111';

select throws_ok(
  $$ insert into public.consents (user_id, purpose, notice_version)
     values ('11111111-1111-1111-1111-111111111111', 'core_service', 'v1') $$,
  '42501', null,
  'B cannot record consent on A''s behalf'
);

-- ---------------------------------------------------------------- back to A
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select first_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Asha', 'B''s attempt to change A''s profile did nothing'
);
select throws_ok(
  $$ delete from public.consents $$,
  '42501', null, 'consent history cannot be deleted'
);
select throws_ok(
  $$ update public.consents set purpose = 'core_service', notice_version = 'v9' $$,
  '42501', null, 'consent details cannot be edited'
);
select lives_ok(
  $$ update public.consents set withdrawn_at = now()
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  'A can withdraw her consent'
);
select throws_ok(
  $$ delete from public.profiles $$,
  '42501', null, 'profiles cannot be deleted directly (account deletion is a server task)'
);

-- ---------------------------------------------------------------- data rules
select throws_ok(
  $$ update public.profiles set date_of_birth = (current_date - interval '17 years')::date
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'under-18 date of birth is rejected by the database'
);
select throws_ok(
  $$ update public.profiles set gender = 'robot'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'unknown gender value is rejected'
);
select throws_ok(
  $$ update public.preferences set budget_min = 20000, budget_max = 10000
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'budget minimum above maximum is rejected'
);
select throws_ok(
  $$ update public.preferences set open_to_genders = '{woman,alien}'
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'unknown value in open_to_genders is rejected'
);
select throws_ok(
  $$ update public.preferences set move_in_month = '2027-01-15'
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'move-in month must be the first day of a month'
);
select throws_ok(
  $$ update public.lifestyle set tidiness = 6
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'tidiness must be 1 to 5'
);
select throws_ok(
  $$ update public.lifestyle set completed_at = now()
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'quiz cannot be marked complete with answers missing'
);

-- ---------------------------------------------------------------- signed-out visitor
set local role anon;
select throws_ok(
  $$ select count(*) from public.profiles $$,
  '42501', null, 'signed-out visitors cannot read profiles at all'
);

-- ---------------------------------------------------------------- account deletion
reset role;
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111')
  + (select count(*)::int from public.preferences where user_id = '11111111-1111-1111-1111-111111111111')
  + (select count(*)::int from public.lifestyle where user_id = '11111111-1111-1111-1111-111111111111')
  + (select count(*)::int from public.consents where user_id = '11111111-1111-1111-1111-111111111111'),
  0, 'deleting the account removes all of A''s profile data'
);

select * from finish();
rollback;
