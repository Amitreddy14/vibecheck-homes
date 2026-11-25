-- T1.4: consent + 18+ gate.
--
-- The first screen after sign-in shows the privacy notice and asks for first name
-- and date of birth. Those two facts and the consent are saved together by ONE
-- function call, so it's all-or-nothing: an under-18 date or a bad notice version
-- saves nothing at all.
--
-- 1. profiles.gender and profiles.occupation become nullable. The gate creates the
--    profile with only name + date of birth; the onboarding "basics" step (T1.5)
--    fills these in. Allowed values are still checked by the existing CHECKs, and
--    the discoverable rule (T1.7) will require them, the same way org_name works.
-- 2. accept_privacy_notice(): records consent + creates/updates the profile.
-- 3. delete_own_account(): deletes the caller's auth user (cascades to every
--    table). Used now for under-18 sign-ups, and by account settings in T1.9.

alter table public.profiles
  alter column gender drop not null,
  alter column occupation drop not null;

comment on column public.profiles.gender is
  'Filled in the onboarding basics step; required to become discoverable.';
comment on column public.profiles.occupation is
  'Filled in the onboarding basics step; required to become discoverable.';

-- ---------------------------------------------------------------------------
-- accept_privacy_notice
-- ---------------------------------------------------------------------------
-- SECURITY INVOKER: runs as the signed-in user, so RLS and the table CHECKs
-- (including 18+) still apply. It only bundles the two writes into one transaction.
create function public.accept_privacy_notice(
  p_notice_version text,
  p_first_name text,
  p_date_of_birth date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  insert into public.profiles (id, first_name, date_of_birth)
  values (v_user_id, btrim(p_first_name), p_date_of_birth)
  on conflict (id) do update
    set first_name = excluded.first_name,
        date_of_birth = excluded.date_of_birth;

  -- One active consent per notice version: submitting twice doesn't add a second row.
  if not exists (
    select 1 from public.consents c
    where c.user_id = v_user_id
      and c.purpose = 'core_service'
      and c.notice_version = p_notice_version
      and c.withdrawn_at is null
  ) then
    insert into public.consents (user_id, purpose, notice_version)
    values (v_user_id, 'core_service', p_notice_version);
  end if;
end;
$$;

comment on function public.accept_privacy_notice(text, text, date) is
  'Consent gate: saves consent + first name + date of birth together, or nothing.';

-- ---------------------------------------------------------------------------
-- delete_own_account
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER because signed-in users have no rights on auth.users. It can only
-- ever delete the caller (auth.uid()), never a row chosen by a parameter.
create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  delete from auth.users where id = v_user_id;
end;
$$;

comment on function public.delete_own_account() is
  'Deletes the signed-in user and, by cascade, all their rows.';

-- Functions are executable by PUBLIC by default: allow signed-in users only.
revoke all on function public.accept_privacy_notice(text, text, date) from public, anon;
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.accept_privacy_notice(text, text, date) to authenticated;
grant execute on function public.delete_own_account() to authenticated;
