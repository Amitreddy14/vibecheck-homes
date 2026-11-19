# Architecture — Vibecheck Homes

> How the app works, how the parts connect, and why each choice was made.
> Status: **Draft v0.1 (2026-11-18)**. Anything marked _(planned)_ is not built yet.

---

## 1. Shape of the system

**A modular monolith plus one Python AI service.** One web app and one database hold all core features, split into modules with clear boundaries. AI/ML runs separately in Python.

```
 ┌──────────────┐      ┌───────────────────┐
 │  Web app      │      │  Mobile app        │  (Phase 9, Expo)
 │  Next.js      │      │  reuses packages/  │
 └──────┬───────┘      └─────────┬─────────┘
        │  HTTPS (Supabase client + Next.js server routes)
 ┌──────▼──────────────────────────────────────────────┐
 │  Core platform (modular monolith)                    │
 │  profiles · matching · chat · trust · listings ·     │
 │  house hub · payments                                │
 │  ── runs as: Next.js server code + Postgres (RLS,    │
 │     SQL functions) + Supabase Auth/Realtime/Storage  │
 └──────┬──────────────────────┬──────────────────────┘
        │                      │ signed internal calls
 ┌──────▼───────┐      ┌───────▼────────┐     ┌──────────────────────┐
 │  Postgres     │      │  AI service     │     │  External APIs        │
 │  RLS,         │      │  Python FastAPI │────▶│  LLM, KYC provider,   │
 │  pgvector,    │      │  agents, ML     │     │  Razorpay, email      │
 │  PostGIS      │      └────────────────┘     └──────────────────────┘
 └──────────────┘
```

**Key rule:** core features (sign-in, matching, chat, safety) must work when the AI service is down or asleep. AI features degrade gracefully (e.g. the template explainer replaces the LLM explainer).

## 2. Decisions (ADR summary)

Format: **decision → problem it solves → trade-off → simpler alternative.** New decisions get added to `memory.md`.

| #     | Decision                                                | Solves                                                                 | Trade-off                                                                    | Simpler alternative                                                 |
| ----- | ------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ADR-1 | Modular monolith, not microservices                     | One person can build, test and deploy it                               | Can't scale modules separately (not needed below tens of thousands of users) | — (already the simplest that works)                                 |
| ADR-2 | Supabase (managed Postgres + Auth + Realtime + Storage) | Auth, realtime chat, file storage and RLS without building them        | Some vendor coupling; free tier pauses after 7 idle days and has no backups  | Plain Postgres + own auth (slower, more security surface)           |
| ADR-3 | Next.js (App Router) + TypeScript for web               | SSR for SEO on listing pages, one language across web and later mobile | Steeper learning curve than plain React                                      | Vite + React SPA (weaker SEO)                                       |
| ADR-4 | Matching scored in Postgres (SQL function)              | Fast, works without the AI service, testable                           | Complex scoring is harder to write in SQL                                    | Score in app code (slower: pulls many rows)                         |
| ADR-5 | Separate Python AI service (FastAPI)                    | Best ML/LLM tooling; your strongest ML language                        | One more thing to deploy                                                     | Call the LLM from Next.js directly (fine for Phase 5, blocks ML v2) |
| ADR-6 | pnpm + Turborepo monorepo                               | Web and mobile share types, schemas and logic                          | Extra tooling to learn                                                       | Separate repos (duplicate code)                                     |
| ADR-7 | Record-only expenses + UPI deep links                   | House-hub money feature without holding money                          | Can't confirm a payment happened (users mark paid)                           | Payment gateway escrow (regulated; not for a student startup)       |
| ADR-8 | Rule-based matching first, ML ranking later             | Works with zero data; explainable                                      | Less personalised at first                                                   | —                                                                   |

## 3. Tech stack

| Layer            | Choice                                                                                                                                                                   | Notes                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Language         | TypeScript (strict) for web/core; Python 3.12+ for AI service                                                                                                            |                                                  |
| Web              | Next.js App Router, React, Tailwind CSS 4 (tokens in `apps/web/src/styles/globals.css`), fonts self-hosted via Fontsource, a motion library for swipe/micro-interactions | Exact versions pinned in the lockfile at Phase 0 |
| UI kit           | Headless accessible primitives (shadcn/ui-style) themed to `design.md`                                                                                                   |                                                  |
| Data fetching    | TanStack Query on the client; server components where possible                                                                                                           |                                                  |
| Validation       | Zod schemas in `packages/shared`, used on client **and** server                                                                                                          | Never trust the frontend                         |
| Database         | Supabase Postgres + PostGIS (location) + pgvector (Phase 10 embeddings)                                                                                                  |                                                  |
| Auth             | Supabase Auth: Google OAuth + email magic link (phone OTP later: SMS costs money)                                                                                        |                                                  |
| Realtime         | Supabase Realtime for chat                                                                                                                                               |                                                  |
| Storage          | Supabase Storage, **private** buckets, signed URLs                                                                                                                       |                                                  |
| AI service       | FastAPI, Pydantic, pytest; managed with `uv`                                                                                                                             | Host chosen in Phase 5                           |
| Tests            | Vitest (unit), pgTAP or SQL tests for RLS/functions, Playwright (E2E), pytest                                                                                            |                                                  |
| Lint/format      | ESLint + Prettier (TS), Ruff (Python)                                                                                                                                    |                                                  |
| Errors/analytics | Sentry (free tier), PostHog (free tier)                                                                                                                                  | Phase 6                                          |
| Payments         | Razorpay                                                                                                                                                                 | Phase 8                                          |
| CI/CD            | GitHub Actions                                                                                                                                                           | §8                                               |

## 4. Repository structure _(planned)_

```
vibecheck-homes/
├─ apps/
│  ├─ web/                 # Next.js app (routes, UI, server actions)
│  │  └─ src/
│  │     ├─ app/           # routes: (auth), onboarding, discover, matches, chat, listings, house
│  │     ├─ modules/       # feature modules: profiles, matching, chat, trust, listings, house
│  │     │  └─ <module>/   # components/, server/ (actions, queries), hooks/, tests/
│  │     ├─ components/ui/ # design-system components
│  │     └─ lib/           # supabase clients, rate limiter, logger, env parsing
│  └─ mobile/              # Expo app (Phase 9)
├─ services/
│  └─ ai/                  # FastAPI: agents, explainer, moderation, ML (Phase 5+)
├─ packages/
│  ├─ shared/              # Zod schemas, types, constants (quiz definitions, scoring weights)
│  └─ config/              # eslint, tsconfig, tailwind presets
├─ supabase/
│  ├─ migrations/          # SQL migrations (only way to change the schema)
│  ├─ tests/               # RLS + SQL function tests
│  └─ seed.sql             # fake local data only
├─ .github/workflows/      # ci.yml, deploy-staging.yml, release.yml, backup.yml
├─ docs/adr/               # longer decision records if needed
└─ PRD.md · Architecture.md · rules.md · design.md · task.md · memory.md · CLAUDE.md
```

**Module boundary rule:** a module may import from `packages/shared` and its own folder. It talks to another module only through that module's `server/index.ts` public functions, never by reaching into its tables from UI code.

## 5. Data model _(draft, refined per phase)_

All tables: `id uuid pk`, `created_at`, `updated_at`; RLS **on**.

| Table                                       | Purpose                        | Key fields                                                                                                                          | Phase |
| ------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `profiles`                                  | Public-ish profile             | `user_id`, display name, age (18+ check), gender, bio, college/company, `verification_level`                                        | 1     |
| `profile_photos`                            | Photos in private bucket       | `profile_id`, `storage_path`, `phash`, order                                                                                        | 1     |
| `lifestyle`                                 | Vibe quiz answers              | sleep window, cleanliness 1–5, guests, noise, food, smoking, pets, work pattern, languages, interests[]                             | 1     |
| `preferences`                               | What they want                 | budget min/max, area + radius (PostGIS point, stored rough), move-in window, gender pref, women-only, verified-only, dealbreakers[] | 1     |
| `consents`                                  | DPDP consent log               | user, purpose, notice version, granted/withdrawn at                                                                                 | 1     |
| `verifications`                             | Badge evidence                 | user, type (college_email / id_kyc), status, provider ref; **no ID numbers stored**                                                 | 1 / 8 |
| `swipes`                                    | Like / pass                    | `swiper_id`, `target_id`, direction                                                                                                 | 2     |
| `matches`                                   | Mutual likes                   | `user_a`, `user_b`, score, explanation json                                                                                         | 2     |
| `conversations`, `messages`                 | Chat                           | match-scoped; `masked` flags; soft delete                                                                                           | 3     |
| `blocks`, `reports`                         | Safety                         | reporter, target, reason, status, moderator notes                                                                                   | 3     |
| `meetups`                                   | Meet before moving in          | match, time, place type (public), check-in status                                                                                   | 3     |
| `listings`, `listing_photos`                | Have/need a room               | rent, deposit, area (rough), amenities, rules                                                                                       | 4     |
| `households`, `household_members`           | House hub                      |                                                                                                                                     | 7     |
| `expenses`, `expense_splits`, `settlements` | Who owes whom                  |                                                                                                                                     | 7     |
| `chores`, `chore_assignments`, `reminders`  | Rotation + reminders           |                                                                                                                                     | 7     |
| `house_rules`                               | Agreement + member acceptances |                                                                                                                                     | 7     |
| `audit_log`                                 | Admin/moderator actions        | actor, action, target, at                                                                                                           | 3     |

## 6. Matching v1 (rule-based, explainable)

1. **Hard filters (SQL `WHERE`)**: both users 18+; not blocked either way; gender preferences satisfied **both ways**; women-only and verified-only respected; budget ranges overlap; areas within radius; move-in windows overlap (±30 days); no dealbreaker conflict (e.g. smoking, pets).
2. **Soft score 0–100**: weighted sum of per-dimension similarity:
   sleep-window overlap, cleanliness gap, guests, noise/parties, food habits, work pattern, budget closeness, commute distance, shared languages, interest overlap (Jaccard).
   Weights live in a config table (tunable without a deploy).
3. **Explanation**: the top 3 contributing dimensions + the biggest conflict → "You both sleep by midnight and keep things tidy. Talk about: guests on weekends."
4. **Deck order**: score, then recency and verification level; previously swiped users excluded.
5. **Data for ML v2**: every swipe, match, chat-started and meetup-done event is logged for later learning-to-rank.

## 7. Security model

- **Authorization in the database:** RLS on every table; policies are written and tested per table (user can read/write only their own rows; can read another profile only if it passes the visibility rules; messages only in their own conversations). Blocks hide users both ways.
- **Server-side checks:** every server route/action re-checks the session and validates input with Zod. The service-role key is used only in server code and CI, never in the browser.
- **Privacy by design:** exact address and phone never stored on public rows; locations rounded/jittered for display; photos in private buckets via short-lived signed URLs; EXIF stripped on upload.
- **Abuse controls:** rate limits on sign-in, swipes, messages, reports and uploads; content moderation (rules first, AI in Phase 5).
- **Full checklist:** see `rules.md` §4.

## 8. Environments and CI/CD

| Env        | Where                                                                                                        | Deploys when                       |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Local      | Supabase CLI (Docker) + `pnpm dev`                                                                           | —                                  |
| Staging    | Supabase `vibecheck-staging` (Mumbai) + Vercel preview aliased to https://vibecheck-homes-staging.vercel.app | merge to `main`                    |
| Production | Supabase `vibecheck-prod` (Mumbai) + Vercel production at https://vibecheck-homes.vercel.app                 | git tag `vX.Y.Z` (manual approval) |

**GitHub Actions workflows** _(planned, Phase 0)_:

- `ci.yml` (every PR): install → lint → typecheck → unit tests → start local Supabase → apply migrations → RLS/SQL tests → build → Playwright smoke (once flows exist) → Python lint/tests (when `services/ai` exists).
- `_deploy.yml` (shared recipe): dry-run then apply migrations (`supabase db push`) → `vercel pull/build/deploy --prebuilt` → optional alias → smoke test (HTTP 200).
- `deploy-staging.yml` (push to `main`, or run by hand): `_deploy.yml` with the `staging` environment.
- Vercel's own Git auto-deploys are off (`apps/web/vercel.json`), so GitHub Actions is the only way code reaches staging or production.
- `release.yml` (tag `vX.Y.Z`): `_deploy.yml` with the `production` environment, which waits for Amit's approval.
- `backup.yml` (nightly): `pg_dump` production → encrypted artifact (free tier has no backups).
- Dependabot for npm, pip and GitHub Actions.

Secrets live only in GitHub environment secrets and the hosting dashboards. `.env.example` lists names, never values.

## 9. Free-tier budget and upgrade triggers

| Service         | Free limit that matters                                                   | Upgrade trigger                                        |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| Supabase        | 2 projects, 500 MB DB, 1 GB storage, pauses after 7 idle days, no backups | Public launch (pausing) or DB > 400 MB → Pro (~$25/mo) |
| Vercel          | Hobby is non-commercial only                                              | Before charging users (Phase 8) → Pro, or move host    |
| Auth SMS        | Not free                                                                  | Phone OTP only after revenue                           |
| ID verification | Paid per check                                                            | Phase 8                                                |
| LLM             | Rate-limited free tiers; check training-on-data terms                     | Paid tier when usage grows                             |

## 10. Observability _(Phase 6)_

Structured JSON logs with a request id; Sentry for errors (web + AI service); PostHog for product funnels; audit log for admin actions; uptime check on the public URL.

## 11. Main technical risks

| Risk                               | Mitigation                                                         |
| ---------------------------------- | ------------------------------------------------------------------ |
| RLS mistakes leak data (IDOR)      | RLS tests in CI for every table; no service-role key in the client |
| Free tier pause/limits during beta | Upgrade before public launch; monitor DB size                      |
| Realtime chat abuse/spam           | Rate limits, match-only chat, report/block                         |
| AI cost or outage                  | AI is optional on every path; per-user limits; cache explanations  |
| Scope creep                        | Phase gates in `task.md`; one phase in progress at a time          |
