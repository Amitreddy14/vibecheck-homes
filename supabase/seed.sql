-- Local development data only. Never put real user data here (rules.md §9).
-- Runs after migrations on `supabase db reset`.

insert into public.app_meta (key, value)
values
  ('environment', '"local"'),
  ('maintenance_mode', 'false')
on conflict (key) do nothing;
