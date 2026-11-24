-- T1.3: profile tables (first real user data).
--
-- profiles     who someone is            (1 row per user, id = auth.users.id)
-- preferences  what they're looking for  (1 row per user)
-- lifestyle    the 12-card vibe quiz     (1 row per user)
-- consents     privacy-notice consent log (many rows per user, append-only)
--
-- Security model (rules.md §3–4):
-- * RLS on every table. For now a user can only see and change THEIR OWN rows;
--   other people's profiles become visible only through a matching function (Phase 2).
-- * Signed-out visitors (anon) get no access at all.
-- * Deleting the auth user deletes everything here (account deletion, DPDP).
-- * Rules that protect people (18+, valid choices, sane budgets) live in the database,
--   not only in the app, so no client can bypass them.
-- Allowed values mirror packages/shared (Zod) and PRD.md §6.1.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null
    check (char_length(btrim(first_name)) between 1 and 40),
  date_of_birth date not null
    -- 18+ only. Checked on every insert/update against today's date.
    check (date_of_birth <= (current_date - interval '18 years')::date)
    check (date_of_birth >= date '1900-01-01'),
  gender text not null
    check (gender in ('woman', 'man', 'non_binary', 'prefer_not_to_say')),
  occupation text not null
    check (occupation in ('student', 'working')),
  -- College or company name (required to become discoverable, but filled in a later step).
  org_name text
    check (org_name is null or char_length(btrim(org_name)) between 2 and 80),
  bio text
    check (bio is null or char_length(bio) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per user: basics shown on their card.';
comment on column public.profiles.date_of_birth is
  'Never shown to others; only the age derived from it.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- preferences
-- ---------------------------------------------------------------------------
create table public.preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  intent text not null
    check (intent in ('need_room', 'have_room')),
  -- Monthly rent share in whole rupees.
  budget_min integer not null check (budget_min between 1000 and 500000),
  budget_max integer not null check (budget_max between 1000 and 500000),
  -- Free-text Chennai area for now; map coordinates come with listings (Phase 4).
  area text not null
    check (char_length(btrim(area)) between 2 and 80),
  -- First day of the month they want to move in.
  move_in_month date not null
    check (extract(day from move_in_month) = 1),
  -- Who they're open to living with (one or more genders).
  open_to_genders text[] not null
    check (
      cardinality(open_to_genders) between 1 and 4
      and open_to_genders <@ array['woman', 'man', 'non_binary', 'prefer_not_to_say']::text[]
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget_min <= budget_max)
);

comment on table public.preferences is 'What a user is looking for in a home and flatmate.';

create trigger preferences_set_updated_at
  before update on public.preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- lifestyle (vibe quiz v1: 12 questions, PRD.md §6.1)
-- Every answer may be empty until answered; `completed_at` is set when all 12 are in.
-- ---------------------------------------------------------------------------
create table public.lifestyle (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  bedtime text check (bedtime in ('before_11pm', '11pm_to_1am', 'after_1am')),
  wake_time text check (wake_time in ('before_7am', '7am_to_9am', 'after_9am')),
  tidiness smallint check (tidiness between 1 and 5),
  dishes text check (dishes in ('right_away', 'end_of_day', 'when_needed')),
  friends_over text check (friends_over in ('rarely', 'weekends', 'often')),
  overnight_guests text check (overnight_guests in ('never', 'sometimes', 'anytime')),
  home_vibe text check (home_vibe in ('quiet', 'occasional', 'hosting')),
  food text check (food in ('veg', 'eggetarian', 'non_veg')),
  smoking text check (smoking in ('no', 'outside_only', 'yes')),
  drinking text check (drinking in ('no', 'occasionally', 'yes')),
  pets text check (pets in ('no_pets', 'have_pet', 'love_pets')),
  weekday_routine text check (weekday_routine in ('out_all_day', 'from_home', 'night_shifts')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- "Completed" is only allowed when every answer is present.
  check (
    completed_at is null
    or num_nulls(
      bedtime, wake_time, tidiness, dishes, friends_over, overnight_guests,
      home_vibe, food, smoking, drinking, pets, weekday_routine
    ) = 0
  )
);

comment on table public.lifestyle is 'Vibe quiz answers used for matching.';

create trigger lifestyle_set_updated_at
  before update on public.lifestyle
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- consents (DPDP): append-only log; a withdrawal is recorded, never deleted.
-- ---------------------------------------------------------------------------
create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  purpose text not null check (purpose in ('core_service')),
  notice_version text not null check (notice_version ~ '^v[0-9]+$'),
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  check (withdrawn_at is null or withdrawn_at >= granted_at)
);

comment on table public.consents is
  'Consent given to a specific privacy-notice version. Never deleted while the account exists.';

create index consents_user_id_idx on public.consents (user_id);

-- ---------------------------------------------------------------------------
-- Row level security + grants
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.lifestyle enable row level security;
alter table public.consents enable row level security;

-- Supabase grants everything to the API roles by default: take it all back, then
-- give signed-in users only what each table needs. Signed-out visitors get nothing.
revoke all on table public.profiles, public.preferences, public.lifestyle, public.consents
  from anon, authenticated;

grant select, insert, update on table public.profiles, public.preferences, public.lifestyle
  to authenticated;
-- Consents: users may add one and record a withdrawal, but never edit or delete history.
grant select, insert on table public.consents to authenticated;
grant update (withdrawn_at) on table public.consents to authenticated;

-- `(select auth.uid())` is evaluated once per query instead of once per row.
create policy "Users read their own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Users create their own profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Users read their own preferences" on public.preferences
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users create their own preferences" on public.preferences
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users update their own preferences" on public.preferences
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Users read their own lifestyle" on public.lifestyle
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users create their own lifestyle" on public.lifestyle
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users update their own lifestyle" on public.lifestyle
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Users read their own consents" on public.consents
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users record their own consent" on public.consents
  for insert to authenticated
  with check (user_id = (select auth.uid()) and withdrawn_at is null);
create policy "Users withdraw their own consent" on public.consents
  for update to authenticated
  using (user_id = (select auth.uid()) and withdrawn_at is null)
  with check (user_id = (select auth.uid()));
