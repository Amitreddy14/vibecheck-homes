# task.md — Task board

> One task in progress at a time. Each task: id, goal, done-when, status.
> Status: `todo` · `in-progress` · `review` · `done` · `blocked`.
> Pace: 10–20 hrs/week, solo. Phases close only when every task's done-when is met and the phase review is done.

---

## Phase 0 — Foundation (current)

| ID    | Task                          | Done when                                                                                                                                        | Status |
| ----- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| T0.1  | Project docs scaffold         | PRD, Architecture, rules, design, task, memory, CLAUDE.md committed to `main`                                                                    | done   |
| T0.2  | GitHub repo settings          | Repo private; `main` protected (PR required, CI status required, no force-push); Dependabot alerts + secret scanning on                          | done   |
| T0.3  | Monorepo setup                | pnpm + Turborepo; `apps/web`, `packages/shared`, `packages/config`; `.gitignore`, `.editorconfig`, `.nvmrc`, `.env.example`; `pnpm build` passes | done   |
| T0.4  | Web app skeleton              | Next.js (TS strict) + Tailwind; home page; env parsing with Zod (fails fast on missing vars); security headers configured                        | done   |
| T0.5  | Lint/format/test tooling      | ESLint + Prettier + Vitest wired; one sample test; `pnpm lint`, `pnpm typecheck`, `pnpm test` pass                                               | done   |
| T0.6  | Local Supabase                | Supabase CLI init; first migration (e.g. `app_meta` table with RLS + a test); `supabase db reset` works locally                                  | done   |
| T0.7  | CI workflow                   | `ci.yml` runs lint, typecheck, tests, migrations + SQL tests on local Supabase, build; required on PRs                                           | done   |
| T0.8  | Staging + production projects | Two Supabase projects; Vercel project linked; GitHub environments `staging` and `production` (prod needs approval); secrets stored               | done   |
| T0.9  | Deploy workflows              | `deploy-staging.yml` on push to `main`; `release.yml` on tag `v*`; first staging deploy live                                                     | done   |
| T0.10 | Backup workflow               | Nightly `pg_dump` of production to an encrypted artifact; restore tested once locally                                                            | done   |
| T0.11 | Design direction              | Pick one of three mockups; fill tokens in `design.md`; Tailwind theme from tokens                                                                | done   |
| T0.12 | Phase 0 review                | Checklist in rules.md §4 for what exists; `memory.md` updated; tag `v0.0.1`                                                                      | done   |

## Phase 1 — Sign-up and profile (current)

Goal: a person can sign up, finish onboarding in ≤ 5 minutes, and become **discoverable**: ready to appear in other people's swipe decks (Phase 2).
Decisions (2026-11-21): all four field groups required to be discoverable; 12-card vibe quiz; gender Woman / Man / Non-binary / Prefer not to say; college/work email verification is an optional badge.

| ID    | Task                     | Done when                                                                                                                                                                                                                                                                                                                            | Status  |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| T1.1  | Supabase in the web app  | `@supabase/ssr` browser + server clients; session refresh on every request; `NEXT_PUBLIC_SUPABASE_URL` + publishable key in the env schema, `.env.example`, Vercel (Preview + Production) and CI; CSP `connect-src` allows the project URL                                                                                           | done    |
| T1.2  | Sign-in                  | Google sign-in only (decision 2026-11-23); `/sign-in`, `/auth/callback`, sign-out; signed-out users redirected from app pages and returned afterwards; `next` checked against open redirects; email provider off in all environments; setup in `docs/runbooks/google-sign-in-setup.md`; tested on staging with a real Google account | done    |
| T1.3  | Profile schema           | Tables `profiles`, `lifestyle`, `preferences`, `consents` with enums (gender, occupation, intent); RLS: a user reads/writes only their own rows; pgTAP tests incl. "user A cannot read or update user B" (IDOR)                                                                                                                      | review  |
| T1.4  | Consent + 18+ gate       | Privacy notice v1 shown before any data is collected; consent stored with notice version; date of birth must be 18+ (checked in Zod **and** a database constraint); under-18 sign-ups stopped with a kind message, nothing stored                                                                                                    | todo    |
| T1.5  | Onboarding flow          | Steps: basics → housing → college/company → vibe quiz (12 cards) → photos → done; progress bar; back/next keeps answers; shared Zod schemas; mobile-first in the chosen design; ≤ 5 minutes                                                                                                                                          | todo    |
| T1.6  | Photos                   | Private bucket `profile-photos` with owner-only storage policies; JPEG/PNG/WebP checked by content, ≤ 5 MB, max 6; EXIF/location stripped; shown through short-lived signed URLs                                                                                                                                                     | todo    |
| T1.7  | Discoverable rule        | One database function decides `is_discoverable` (basics + housing + college/company + quiz complete + ≥ 1 photo + consent); tested; profile page shows what's missing                                                                                                                                                                | todo    |
| T1.8  | Email verification badge | Optional college/work email badge with a 6-digit code. **Blocked:** needs a domain + email-sending service (Resend) before codes can reach real users; decide before Phase 6                                                                                                                                                         | blocked |
| T1.9  | Account settings         | Edit everything from onboarding; download my data (JSON); delete my account (removes profile, photos, auth user), as DPDP requires                                                                                                                                                                                                   | todo    |
| T1.10 | End-to-end test          | Playwright in CI: sign up → onboarding → discoverable; runs against local Supabase                                                                                                                                                                                                                                                   | todo    |
| T1.11 | Phase 1 review           | Security checklist for the new surface (auth, uploads, RLS, rate limits); review doc; tag `v0.2.0`                                                                                                                                                                                                                                   | todo    |

## Phase 2 — Matching (outline)

- T2.1 Scoring weights config table + quiz definitions in `packages/shared`
- T2.2 SQL function: hard filters + soft score + explanation json (tested with fixtures)
- T2.3 Swipe deck UI with like/pass, undo last pass
- T2.4 `swipes` / `matches` + mutual-match trigger; rate limit swipes
- T2.5 "Why you match" sheet
- T2.6 Event logging for ML v2

## Phase 6 — carried over from the Phase 0 review

Must happen before real users' data is in production (see `docs/reviews/phase-0-review.md`):

- Move nightly backups from public GitHub artifacts to private storage (finding F2)
- Nonce-based Content Security Policy, drop `'unsafe-inline'` (F6)
- Upgrade Supabase (no pausing, built-in backups) and Vercel (commercial use) before launch (F8)

## Phases 3–10

Broken into tasks when the previous phase closes. See `PRD.md` §6 for scope and acceptance criteria.
