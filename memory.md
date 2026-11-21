# memory.md — Project log

> Running log of context, decisions, bugs and changes. Newest first.
> Format: `## YYYY-MM-DD — title` then short bullets. Decisions use: **Decision / Why / Trade-off / Alternative**.

---

## 2026-11-21 — Phase 0 review (T0.12)

- T0.9 done: production release `v0.0.2` deployed green after approval (`v0.0.1` pointed at a pre-fix commit and was cancelled).
- **Decision:** Keep the repository **public**.
  **Why:** Amit's choice (portfolio visibility; branch rulesets are enforced on public repos without GitHub Pro).
  **Trade-off:** Code, docs and plans (including the PRD's business model) are readable by anyone, and anyone signed in to GitHub can download the encrypted backup artifacts.
  **Alternative:** Private repo + GitHub Pro via the Student Developer Pack.
- Review written: `docs/reviews/phase-0-review.md`. Security checklist: all applicable items done; open findings F2–F9 with actions and dates (backups to private storage and nonce CSP before Phase 6 beta).
- Git history secret scan (all branches): clean. `pnpm audit`: 1 moderate, dev-only (`minimatch` via typescript-eslint), accepted until upstream supports minimatch 11.

## 2026-11-20 — T0.10 nightly production backups

- Staging deploy pipeline fully green (2026-11-19, after the first-run fixes below).
- `.github/workflows/backup.yml`: every night at 01:47 IST (or by hand) dumps production with the pinned Supabase CLI as `roles.sql`, `schema.sql`, `data.sql`; tars them; encrypts with GPG AES-256 using `BACKUP_PASSPHRASE`; stores the encrypted file + SHA-256 checksum as a GitHub artifact for 30 days. Unencrypted dumps never leave the runner.
- **Decision:** A separate `production-backup` environment (prod ref + password + passphrase, no approval, `main` only).
  **Why:** The `production` environment needs a human approval, which would block a nightly scheduled job.
  **Trade-off:** The production database password is stored in two environments.
  **Alternative:** Repo-level secrets (would expose the prod password to every workflow).
- **Decision:** Backups as encrypted GitHub artifacts (30-day retention).
  **Why:** Free, automatic, no extra storage account.
  **Trade-off:** 30 days only and counts toward GitHub's artifact storage quota (tiny for now). Revisit at launch (e.g. Supabase Pro backups or object storage).
- Restore runbook: `docs/runbooks/restore-backup.md` (routine local check: migrations + `data.sql`; disaster recovery: new Supabase project + all three files).
- Verified in a container: encrypt → checksum OK → wrong passphrase rejected → decrypt → restore `data.sql` into a migrated, unseeded database brought back a production-only row. The real `supabase db dump` against production runs first on GitHub.
- `BACKUP_PASSPHRASE` lives only in GitHub secrets and Amit's password manager. Losing it makes every backup unreadable.
- First real restore failed: `data.sql` included Supabase-internal `storage.buckets_vectors`, which even the admin user can't write ("permission denied"). Fix: the data dump excludes `storage.buckets_vectors` and `storage.vector_indexes`, as Supabase's own backup guide does.
- **T0.10 done (2026-11-21):** backup run #3 downloaded, checksum OK, decrypted, `data.sql` restored into a migrated local database with no errors.
- Dependabot now ignores major upgrades of `typescript`, `eslint`, `@eslint/js` and `@types/node` (held back on purpose; see the T0.3/T0.5 entries). The four open major-bump PRs (#8–#11) were closed.

## 2026-11-19 — T0.8 environments + T0.9 deploy workflows

- **T0.8 done:** Supabase `vibecheck-staging` (ref `bozwowmkhhwzhystumic`) and `vibecheck-prod` (ref `wkfhwuozmhjfytugfula`), both in Mumbai, Free plan. Vercel project `vibecheck-homes` (Hobby, root `apps/web`) at https://vibecheck-homes.vercel.app. GitHub environments `staging` and `production` (production needs Amit's approval), each with `SUPABASE_PROJECT_REF` and `SUPABASE_DB_PASSWORD`; repo secrets `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- **T0.9:** `_deploy.yml` (shared recipe), `deploy-staging.yml` (every push to `main`), `release.yml` (tags `vX.Y.Z`).
- **Decision:** Deploy through GitHub Actions + Vercel CLI; Vercel's Git auto-deploys turned off.
  **Why:** One controlled path: migrations run before the app deploys, production needs approval, and every deploy is in the Actions log.
  **Trade-off:** No automatic Vercel preview per PR (CI already builds every PR).
  **Alternative:** Vercel's Git integration (simpler, but no migration step and no approval gate).
- **Decision:** Staging = a Vercel preview deployment aliased to https://vibecheck-homes-staging.vercel.app.
  **Why:** Hobby gives one production target; the alias gives staging a stable URL.
  **Trade-off:** Staging shares Vercel's "Preview" environment variables.
- Migrations: dry run first (shows what will change in the log), then `supabase db push`. Seed data never goes to hosted databases.
- Rule: migrations must stay backward compatible with the code already live (add columns/tables first, remove in a later release), because the database updates a minute before the new app.
- Smoke test after each deploy: `vercel curl` requests the new deployment and fails on any 4xx/5xx. It gets past Vercel's login wall, which protects preview (staging) deployments by default; on its first run it created a "Protection Bypass for Automation" secret on the Vercel project (revocable under Deployment Protection). Keeping staging behind that login is intentional: only the team can open it.
- First-run fixes (2026-11-19):
  - `SUPABASE_PROJECT_REF` held a URL instead of the 20-letter ref → the deploy now starts with "Check deploy secrets", which names any missing or malformed secret without printing values.
  - `vercel alias` failed with "User not found" → every Vercel CLI call passes `--scope="$VERCEL_ORG_ID"`, and `VERCEL_TOKEN` must be a **full-account** token (a team-only token can't look up its user, which `--scope` needs).
  - `vercel curl` forwards unknown flags to curl, which rejected `--token` → the smoke test gets the token from the `VERCEL_TOKEN` environment variable.
- Vercel CLI pinned to 65.16.0 (66.x released the same day this was written; supply-chain cooldown).
- Checked with actionlint: no problems. First real run happens on GitHub.

## 2026-11-19 — T0.7 CI workflow

- T0.6 confirmed on Amit's laptop: `pnpm db:reset` applied the migration and seed; `pnpm db:test` passed 8/8.
- `.github/workflows/ci.yml` runs on every PR and every push to `main`, in two jobs:
  - **Code checks**: frozen-lockfile install, Prettier check, ESLint, typecheck, Vitest, `next build`.
  - **Database tests**: starts only Postgres via the pinned Supabase CLI (migrations + seed), then `pnpm db:test`.
- **Decision:** Pin every GitHub Action to a full commit SHA (tag in a comment).
  **Why:** A moved or hijacked tag can't change what runs in CI.
  **Trade-off:** Updates need a PR, which Dependabot opens.
  **Alternative:** Pin to major tags (`@v7`), simpler but weaker.
- `permissions: contents: read` (least privilege); old runs on the same branch are cancelled when a new commit arrives.
- `.github/dependabot.yml`: weekly grouped PRs for npm and GitHub Actions, with a 3-day cooldown after each release.
- Ruleset `protect-main` on `main` requires the checks **Code checks** and **Database tests** (the CI job names), a PR (0 approvals: solo), no force pushes, no deletion. Job names have no commas: GitHub's check picker split the first name at its commas. Renaming a CI job means updating the ruleset too.
- Private-repo rulesets are only enforced on GitHub Pro or higher; Amit is applying for Pro through the GitHub Student Developer Pack. T0.2 stays in progress until enforcement is on.

## 2026-11-18 — T0.6 local Supabase

- Supabase CLI 3.2 as a root dev dependency; `supabase/config.toml` (project id `vibecheck-homes`, auth site URL `http://localhost:3000`).
- First migration `20261118183000_app_meta.sql`: shared `set_updated_at()` trigger helper + `app_meta` key/value table (settings every client can read; only the server writes). RLS on; default Supabase grants revoked and only `select` given back to `anon`/`authenticated`.
- **Pattern for every future table:** RLS on, revoke default grants, grant only what's needed, explicit policies, pgTAP tests in `supabase/tests/database/` in the same PR.
- pgTAP tests (8): structure, RLS on, "every public table has RLS" guard, key format check, anon can read, anon/authenticated can't write.
- Verified in a container against Postgres 16 + pgTAP with stand-in Supabase roles: migration + seed apply, all 8 tests pass, and turning RLS off makes tests 2 and 3 fail. `supabase start` itself could not run there (image registries blocked), so the first full Supabase run is on Amit's laptop with Docker Desktop.
- Root commands: `pnpm db:start`, `db:stop`, `db:reset`, `db:test`, `db:status`.

## 2026-11-18 — T0.5 lint and test tooling

- ESLint (flat config) per package: `apps/web` uses Next.js's recommended set (React, hooks, accessibility basics, Core Web Vitals, TypeScript); `packages/shared` uses typescript-eslint recommended. Project rules on top: no `console`, no `any`, `===` only, no `dangerouslySetInnerHTML`. Lint runs with `--max-warnings=0`.
- **Decision:** ESLint 9.39, not 10.
  **Why:** eslint-plugin-react and eslint-plugin-import (pulled in by Next's config) only support ESLint ≤ 9.
  **Trade-off:** Miss ESLint 10 improvements for now.
  **Alternative:** Upgrade once those plugins support 10 (Dependabot will flag it).
- Vitest 5.1 in node mode for unit tests. React component tests (jsdom + Testing Library) get added with the first real components in Phase 1.
- First tests: env validation (4), security headers (3), shared constants (1). All pass.
- `env.ts` split into `env-schema.ts` (pure, testable `parseEnv`) and `env.ts` (reads `process.env` once).
- New root commands: `pnpm lint`, `pnpm test`, `pnpm check` (lint + typecheck + tests + Prettier: run before every PR).

## 2026-11-18 — T0.4 web app skeleton (+ T0.11 Tailwind theme)

- Tailwind CSS 4 with the design tokens from `design.md` §3 in `apps/web/src/styles/globals.css` (`bg-bg`, `text-ink`, `bg-primary`, `bg-tag-*`, `font-display`, `rounded-card`, …). Dark theme draft follows the device setting.
- **Decision:** Self-host fonts from npm (Fontsource) instead of `next/font/google`.
  **Why:** Builds never depend on reaching Google Fonts (CI and offline builds stay reliable); no third-party font requests from users' browsers.
  **Trade-off:** Font updates come through Dependabot instead of automatically.
  **Alternative:** `next/font/google` (downloads at build time).
- Environment variables are checked with Zod in `apps/web/src/lib/env.ts`, imported by `next.config.ts`, so a missing or bad value stops `pnpm build`/`pnpm dev` with a clear message. Only `NEXT_PUBLIC_APP_URL` for now; Supabase keys come in T0.6.
- Security headers on every response (`apps/web/src/lib/security-headers.ts`): CSP, HSTS, nosniff, frame denial, referrer policy, permissions policy, COOP. `X-Powered-By` is off.
- **Decision:** CSP keeps `'unsafe-inline'` for scripts for now.
  **Why:** Next.js boots with inline scripts; a nonce-based CSP makes every page dynamic.
  **Trade-off:** Weaker XSS protection until Phase 6.
  **Alternative:** Nonce CSP via middleware now. Scheduled for Phase 6 hardening.
- Turbo build now tracks `.env*` files and `NEXT_PUBLIC_APP_URL`, so changing them busts the build cache.
- Verified here: build fails without env and passes with it; typecheck passes; headers checked with `curl` against `next start`; tokens and fonts present in the built CSS.

## 2026-11-18 — T0.3 monorepo setup

- pnpm workspace + Turborepo: `apps/web` (Next.js 16, React 19), `packages/shared` (`@vch/shared`), `packages/config` (`@vch/config`, shared tsconfigs).
- Verified in a clean environment: `pnpm install`, `pnpm typecheck` and `pnpm build` pass; Prettier check passes.
- **Decision:** TypeScript 5.9, not 7.0.
  **Why:** TS 7 is the new native compiler; Next.js type-checking still leans on the classic TypeScript API, so 5.9 is the safe pick for now.
  **Trade-off:** Slower type-checks than TS 7.
  **Alternative:** Try TS 7 later in its own PR once Next.js supports it.
- **Decision:** Pin turbo 2.11.11 (not 2.11.13, released the same day). pnpm refuses brand-new releases by default as a supply-chain safety check; we keep that check on instead of adding exceptions.
- Node pinned to 22 (`.nvmrc`, `engines`); pnpm pinned to 12.21.0 (`packageManager`).
- Internal packages ship TypeScript source; Next.js compiles them via `transpilePackages`.
- `.gitattributes` forces LF line endings (Windows checkout had turned some docs into CRLF).

## 2026-11-18 — UI direction chosen

- **Decision:** B's layout (soft and cosy) with A's colours (bold and playful).
  **Why:** Soft, roomy layout reads as safe and homely; loud colours keep the Gen Z energy.
  **Trade-off:** Two styles mixed: must keep outlines and colours disciplined so it doesn't look busy.
  **Alternative:** Pure A (louder, less "safe") or pure B (calmer, less distinctive).
- Hard shadows and the tilted card from A were dropped.
- Tokens written in `design.md` §3. Fonts chosen: Bricolage Grotesque (display) + DM Sans (body).
- Mockups: https://claude.ai/artifact/DEc9u6G4gwVsUBv3uHCnnY

## 2026-11-18 — Project kickoff and Phase 0 planning

**Context**

- Vibecheck Homes (working name): trust-first flatmate matching app for India, launching in Chennai (campus-first).
- Solo build, 10–20 hrs/week, no fixed beta date. Private repo: `Amitreddy14/vibecheck-homes`.
- Web first, mobile (Expo) later. Free tiers only until revenue.

**Decisions**

- **Decision:** Modular monolith + one Python AI service.
  **Why:** One person can build and run it; AI tooling is best in Python.
  **Trade-off:** No independent scaling per module.
  **Alternative:** Microservices (rejected: cost and complexity with no user benefit now).
- **Decision:** Supabase (Postgres, Auth, Realtime, Storage) + Next.js.
  **Why:** RLS, auth and realtime chat out of the box; fastest for a solo founder.
  **Trade-off:** Vendor coupling; free tier pauses after 7 idle days and has no backups (we add a nightly backup job).
  **Alternative:** Spring Boot or FastAPI API with our own auth/chat (slower).
- **Decision:** Differentiators: deep compatibility, campus verification, women-first safety, and a house hub after the match (in that build order).
- **Decision:** Expenses are record-only with UPI deep links; the app never holds money.
- **Decision:** Rule-based, explainable matching first; ML ranking only after real interaction data exists.
- **Decision:** Sign-in with Google + email link first; phone OTP after revenue (SMS costs money).

**Known constraints**

- Vercel Hobby is non-commercial only → upgrade or move host before charging users.
- DPDP Rules 2025: main obligations apply from 13 May 2027 → consent, erasure and breach handling built from Phase 1.

**Open**

- UI direction (three mockups pending).
- Final brand name and domain.
- LLM provider for Phase 5.
