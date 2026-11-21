# Phase 0 review — Foundation

> Date: 2026-11-21 · Reviewer: Claude with Amit · Result: **Phase 0 complete**, tag `v0.1.0`.
> Scope: everything built in T0.1–T0.11. Rules checked: `rules.md` §4 (security) and §1/§7 (process, testing).

## 1. What Phase 0 delivered

| Area              | Delivered                                                                                | Proof                                           |
| ----------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Docs              | PRD, Architecture, rules, design, task, memory, CLAUDE.md, restore runbook               | In repo                                         |
| Monorepo          | pnpm 12 + Turborepo, Node 22, TS 5.9 strict                                              | `pnpm build` green locally and in CI            |
| Web skeleton      | Next.js 16, Tailwind 4 design tokens, self-hosted fonts, Zod env check, security headers | Unit tests (env, headers)                       |
| Quality gates     | ESLint (zero warnings), Vitest, Prettier, `pnpm check`                                   | CI job **Code checks**                          |
| Database          | Local Supabase, first migration (`app_meta`) with RLS, pgTAP tests (8)                   | CI job **Database tests**; run on Amit's laptop |
| Branch protection | Ruleset `protect-main`: PR required, 2 required checks, no force push or deletion        | Direct push to `main` was rejected (GH013)      |
| Environments      | Supabase staging + prod (Mumbai), Vercel project, GitHub environments                    | —                                               |
| Deploys           | Staging on merge, production on tag with approval; migrations before app; smoke test     | Staging green; release `v0.0.2` green           |
| Backups           | Nightly encrypted production dump, 30-day retention, restore runbook                     | Backup #3 restored locally with no errors       |

## 2. Security checklist (`rules.md` §4)

✅ done · ➖ not applicable yet (no such feature exists) · ⚠️ open item

| #   | Rule                                   | Status | Notes                                                                           |
| --- | -------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| 1   | RLS enabled and tested on every table  | ✅     | `app_meta` + guard test that fails if any `public` table lacks RLS              |
| 2   | Every API route checks auth            | ➖     | No API routes yet (Phase 1)                                                     |
| 3   | Never trust the frontend               | ✅     | Pattern set: Zod schemas validate on the server; env checked at startup         |
| 4   | Rate limiting                          | ➖     | Nothing to limit yet; required for auth, swipes, chat (Phase 1+)                |
| 5   | Sanitize / validate input              | ➖     | No user input yet                                                               |
| 6   | Parameterized queries                  | ✅     | No SQL built from strings; schema only via migrations                           |
| 7   | CORS locked down                       | ➖     | No API yet; set allowed origins with Supabase auth (Phase 1)                    |
| 8   | HTTPS everywhere                       | ✅     | Vercel HTTPS + HSTS header                                                      |
| 9   | Verify webhook signatures              | ➖     | No webhooks until Razorpay (Phase 8)                                            |
| 10  | Never run commands from chat/AI text   | ✅     | No such path exists; AI comes in Phase 5                                        |
| 11  | Debug off in production                | ✅     | Production builds only; `X-Powered-By` removed                                  |
| 12  | Private storage buckets                | ➖     | No buckets yet (photos: Phase 1)                                                |
| 13  | Lock dangerous tools                   | ✅     | Production deploy needs Amit's approval; service-role key not in the app        |
| 14  | Hide admin pages properly              | ➖     | No admin pages yet                                                              |
| 15  | Update vulnerable packages             | ⚠️     | Dependabot on. `pnpm audit`: 1 moderate (see F5)                                |
| 16  | Security headers                       | ✅     | CSP, HSTS, nosniff, frame denial, referrer, permissions, COOP; tested           |
| 17  | Check file upload types                | ➖     | No uploads yet                                                                  |
| 18  | Stop IDOR bugs                         | ➖     | No user-owned data yet; RLS tests per table from Phase 1                        |
| 19  | Log admin actions                      | ➖     | `audit_log` table arrives with moderation (Phase 3)                             |
| 20  | No secrets in code, logs or bundle     | ✅     | Full git history scanned 2026-11-21: clean. Workflows never print secret values |
| 21  | Security review before closing a phase | ✅     | This document                                                                   |

## 3. Findings and actions

| ID  | Finding                                                                                             | Risk                                                                                      | Action                                                                                                                                                             | When                                 |
| --- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| F1  | **Repo is public** (Amit's choice, 2026-11-21): code, docs and plans are readable by anyone         | Business (copying), not security: no secrets in the repo                                  | Accepted. Keep secrets only in GitHub/Vercel/Supabase; re-check before every phase close                                                                           | Ongoing                              |
| F2  | Because the repo is public, **any signed-in GitHub user can download the nightly backup artifacts** | Encrypted with AES-256; safe only with a long random passphrase                           | Confirm `BACKUP_PASSPHRASE` is password-manager generated, 24+ chars (enforced by the workflow). **Before real user data exists, move backups to private storage** | Now (passphrase) · Phase 6 (storage) |
| F3  | Public repo: pull requests from forks can run CI                                                    | Fork runs get no secrets, but can use runner minutes                                      | Settings → Actions → General → **Require approval for all external contributors**                                                                                  | Now                                  |
| F4  | Default `GITHUB_TOKEN` permissions                                                                  | Workflows already set `contents: read`                                                    | Settings → Actions → General → Workflow permissions → **Read repository contents** (defence in depth)                                                              | Now                                  |
| F5  | `minimatch` <11.0.1 (moderate, DoS via glob patterns), dev-only via `typescript-eslint`             | Not shipped to users; only our own patterns reach it                                      | Accepted until `typescript-eslint` supports minimatch 11; Dependabot will propose it                                                                               | Watch                                |
| F6  | CSP allows inline scripts (`'unsafe-inline'`)                                                       | Weaker XSS protection                                                                     | Nonce-based CSP                                                                                                                                                    | Phase 6                              |
| F7  | `staging` environment can be used from any branch                                                   | Only collaborators can push; fork runs get no secrets                                     | Settings → Environments → staging → Deployment branches → **Selected: `main`**                                                                                     | Now                                  |
| F8  | Supabase free projects pause after 7 days without activity                                          | Staging may pause if nothing merges for a week (prod stays awake through nightly backups) | If a staging deploy fails with a connection error, unpause it in the Supabase dashboard. Upgrade before beta                                                       | Phase 6                              |
| F9  | Vercel token expires (90 days)                                                                      | Deploys stop when it expires                                                              | Renew `VERCEL_TOKEN` before ~2027-02-17                                                                                                                            | Reminder                             |

## 4. Process review

- Worked well: one task per PR, CI as the gate, every decision logged in `memory.md`.
- Friction: starting work while on an already-merged branch caused checkout errors three times. Habit: after every merge, `git checkout main && git pull` before the next task.
- Docs drift: one `memory.md` edit overwrote an entry (caught and restored). Habit: update docs on a fresh branch from `main`, never on a merged branch.
- First-run surprises in CI/CD (secret format, Vercel token scope, `vercel curl` flags, Supabase internal tables) were each fixed with a guard so they can't recur silently.

## 5. Exit criteria

- [x] All Phase 0 tasks done (T0.1–T0.11)
- [x] Security checklist reviewed; open items have owners and dates
- [x] Staging and production deploy from `main` / tags; backups restore
- [ ] Amit applies F3, F4, F7 and confirms F2's passphrase
- [ ] Tag `v0.1.0` and release it to production
