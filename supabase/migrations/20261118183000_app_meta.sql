-- T0.6: first migration.
-- 1. A shared trigger helper that later tables reuse to keep updated_at current.
-- 2. app_meta: a tiny key/value table for app-wide settings that clients may read
--    (for example maintenance mode or the minimum supported app version).
--    Only the server (service_role, which bypasses RLS) can write to it.
-- Every table gets RLS + explicit grants + tests in the same PR (rules.md §3).

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger helper: sets updated_at to now() on every UPDATE.';

revoke execute on function public.set_updated_at() from public;

create table public.app_meta (
  key text primary key
    check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.app_meta is
  'App-wide settings readable by every client; written only by the server.';

create trigger app_meta_set_updated_at
  before update on public.app_meta
  for each row execute function public.set_updated_at();

-- Row level security: on for every table, no exceptions.
alter table public.app_meta enable row level security;

-- Supabase grants all privileges on new tables to the API roles by default.
-- Take them away and give back only what this table needs.
revoke all on table public.app_meta from anon, authenticated;
grant select on table public.app_meta to anon, authenticated;

create policy "Anyone can read app settings"
  on public.app_meta
  for select
  to anon, authenticated
  using (true);
