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
| T0.9  | Deploy workflows              | `deploy-staging.yml` on push to `main`; `release.yml` on tag `v*`; first staging deploy live                                                     | review |
| T0.10 | Backup workflow               | Nightly `pg_dump` of production to an encrypted artifact; restore tested once locally                                                            | todo   |
| T0.11 | Design direction              | Pick one of three mockups; fill tokens in `design.md`; Tailwind theme from tokens                                                                | done   |
| T0.12 | Phase 0 review                | Checklist in rules.md §4 for what exists; `memory.md` updated; tag `v0.0.1`                                                                      | todo   |

## Phase 1 — Sign-up and profile (outline)

- T1.1 Auth: Google + email magic link; session handling; protected routes
- T1.2 18+ gate and consent notice (stored in `consents`)
- T1.3 `profiles`, `lifestyle`, `preferences` tables with RLS + tests
- T1.4 Onboarding flow: profile → vibe quiz → preferences (≤ 5 minutes)
- T1.5 Photo upload: private bucket, type/size checks, EXIF strip, perceptual hash stored
- T1.6 College-email verification → "verified student" badge
- T1.7 Account settings: edit, download data, delete account
- T1.8 E2E test: sign up → finish onboarding

## Phase 2 — Matching (outline)

- T2.1 Scoring weights config table + quiz definitions in `packages/shared`
- T2.2 SQL function: hard filters + soft score + explanation json (tested with fixtures)
- T2.3 Swipe deck UI with like/pass, undo last pass
- T2.4 `swipes` / `matches` + mutual-match trigger; rate limit swipes
- T2.5 "Why you match" sheet
- T2.6 Event logging for ML v2

## Phases 3–10

Broken into tasks when the previous phase closes. See `PRD.md` §6 for scope and acceptance criteria.
