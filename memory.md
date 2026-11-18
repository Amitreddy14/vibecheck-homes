# memory.md — Project log

> Running log of context, decisions, bugs and changes. Newest first.
> Format: `## YYYY-MM-DD — title` then short bullets. Decisions use: **Decision / Why / Trade-off / Alternative**.

---

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
