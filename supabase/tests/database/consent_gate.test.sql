-- T1.4 consent gate: accept_privacy_notice() and delete_own_account().
-- Run with: pnpm db:test
begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

insert into auth.users (id, email) values
  ('33333333-3333-3333-3333-333333333333', 'chitra@test.local'),
  ('44444444-4444-4444-4444-444444444444', 'dev@test.local'),
  ('55555555-5555-5555-5555-555555555555', 'esha@test.local');

-- ---------------------------------------------------------------- structure
select has_function('public', 'accept_privacy_notice', array['text', 'text', 'date'],
  'accept_privacy_notice exists');
select has_function('public', 'delete_own_account', 'delete_own_account exists');
select col_is_null('public', 'profiles', 'gender', 'gender is filled later, in onboarding');
select col_is_null('public', 'profiles', 'occupation', 'occupation is filled later, in onboarding');
select ok(
  not has_function_privilege('anon', 'public.accept_privacy_notice(text, text, date)', 'execute'),
  'signed-out visitors cannot call accept_privacy_notice'
);
select ok(
  not has_function_privilege('anon', 'public.delete_own_account()', 'execute'),
  'signed-out visitors cannot call delete_own_account'
);

-- ---------------------------------------------------------------- as C (Chitra): happy path
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select lives_ok(
  $$ select public.accept_privacy_notice('v1', '  Chitra ', '2004-02-29') $$,
  'C can accept the notice with an adult date of birth'
);
select results_eq(
  $$ select first_name, date_of_birth, gender from public.profiles $$,
  $$ values ('Chitra'::text, '2004-02-29'::date, null::text) $$,
  'C now has a profile with trimmed name, date of birth, and no gender yet'
);
select is(
  (select count(*)::int from public.consents where notice_version = 'v1' and withdrawn_at is null),
  1, 'C has one active consent for v1'
);
select lives_ok(
  $$ select public.accept_privacy_notice('v1', 'Chitra', '2004-02-29') $$,
  'submitting the gate twice is fine'
);
select is(
  (select count(*)::int from public.consents),
  1, 'submitting twice does not add a second consent row'
);

-- ---------------------------------------------------------------- as D (Dev): nothing saved on failure
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';

select throws_ok(
  $$ select public.accept_privacy_notice('v1', 'Dev', (current_date - interval '17 years')::date) $$,
  '23514', null, 'an under-18 date of birth is rejected'
);
select throws_ok(
  $$ select public.accept_privacy_notice('version-one', 'Dev', '2001-01-01') $$,
  '23514', null, 'a malformed notice version is rejected'
);
select is(
  (select count(*)::int from public.profiles) + (select count(*)::int from public.consents),
  0, 'after both failures nothing at all was saved for D (all-or-nothing)'
);

-- ---------------------------------------------------------------- no session
set local request.jwt.claims = '{"role":"authenticated"}';
select throws_ok(
  $$ select public.accept_privacy_notice('v1', 'Nobody', '2001-01-01') $$,
  '42501', null, 'without a signed-in user the gate refuses'
);
select throws_ok(
  $$ select public.delete_own_account() $$,
  '42501', null, 'without a signed-in user nothing is deleted'
);

-- ---------------------------------------------------------------- as E (Esha): delete own account
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select lives_ok($$ select public.delete_own_account() $$, 'E can delete her own account');

reset role;
select results_eq(
  $$ select id::text from auth.users
     where id in ('33333333-3333-3333-3333-333333333333',
                  '44444444-4444-4444-4444-444444444444',
                  '55555555-5555-5555-5555-555555555555')
     order by id $$,
  $$ values ('33333333-3333-3333-3333-333333333333'), ('44444444-4444-4444-4444-444444444444') $$,
  'only E was deleted; C and D are untouched'
);

select * from finish();
rollback;
