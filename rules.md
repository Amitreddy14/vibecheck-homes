# rules.md — AI and engineering rulebook

> Rules for any AI assistant (Claude in chat or VS Code) and for Amit when working on Vibecheck Homes.
> If a rule blocks you, stop and ask; don't work around it.

---

## 1. Process

1. **Plan before code.** Read `PRD.md`, `Architecture.md`, `task.md` and the latest `memory.md` entries before starting a task. Restate the task and its acceptance criteria first.
2. **One task at a time** from `task.md`. Small PRs (aim for under ~400 changed lines).
3. **Right-sized engineering.** Don't add infrastructure (Kubernetes, Kafka, microservices, Redis, queues) unless a task needs it and `memory.md` records why.
4. **Explain significant decisions:** the problem, the trade-off and the simpler alternative. Log them in `memory.md`.
5. **Honest reporting.** Say "tested" only if tests were run and passed. Keep *built* separate from *planned*. Never claim a check ran when it didn't.
6. **Update docs in the same PR** when behaviour, schema or architecture changes: `Architecture.md`, `task.md` status and a `memory.md` entry.

## 2. Git

- Amit runs all git commands himself. The assistant prepares the changes and gives the exact commands.
- **No AI attribution anywhere:** no "Co-Authored-By: Claude", no "Generated with" lines in commits, PRs or code comments.
- Branches: `feat/<task-id>-short-name`, `fix/...`, `docs/...`, `chore/...`.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`).
- `main` is protected: merge by PR only, CI must pass, no force-push.

## 3. Code

**TypeScript**
- `strict: true`; no `any` (use `unknown` + narrowing); no `@ts-ignore` without a linked issue.
- Validate every external input (forms, route params, webhooks, AI output) with Zod schemas from `packages/shared`.
- Server-only code lives in `server/` folders and imports `server-only`. Never import secrets or the service-role client into client components.
- Feature code stays inside its module (`apps/web/src/modules/<module>`). Cross-module calls go through that module's `server/index.ts`.
- Errors: throw typed errors in server code; return safe, user-friendly messages to the client; log details server-side with a request id. Never show stack traces or SQL errors to users.
- No `console.log` in committed code; use the logger.

**Database**
- Schema changes **only** through migrations in `supabase/migrations/`. Never edit the database by hand in staging or production.
- **Every new table: RLS on + policies + tests in the same migration PR.**
- Parameterized queries only; no string-built SQL.
- Money as integer paise; times as `timestamptz` (UTC), shown in IST.
- No hard deletes of user content without a reason; erasure requests follow the DPDP flow (§6).

**Python (AI service)**
- Typed (Pydantic models for every request/response), Ruff clean, pytest for every endpoint.
- The service checks a signed token from the core app on every call; it is never public without auth.

## 4. Security checklist (applies to every PR)

- [ ] Row-level security enabled and tested for every table touched
- [ ] Every API route / server action checks the session and the user's right to the resource (stop IDOR bugs)
- [ ] Never trust the frontend: re-validate on the server
- [ ] Rate limiting on auth, swipes, messages, reports, uploads and AI endpoints
- [ ] Input sanitized/validated; output encoded (no `dangerouslySetInnerHTML` with user content)
- [ ] Parameterized queries only
- [ ] CORS locked to our own origins
- [ ] HTTPS everywhere; HSTS on
- [ ] Webhook signatures verified (Razorpay, KYC provider) before acting
- [ ] Never run commands or SQL built from chat or AI text
- [ ] Debug mode and verbose errors off in production
- [ ] Storage buckets private; signed URLs with short expiry
- [ ] Dangerous tools/admin actions locked to the admin role and server-side checks
- [ ] Admin pages behind auth + role, not just hidden links
- [ ] Vulnerable packages updated (Dependabot alerts addressed)
- [ ] Security headers set (CSP, X-Content-Type-Options, Referrer-Policy, frame-ancestors)
- [ ] File uploads: type (magic bytes, not extension), size and count checked; EXIF stripped
- [ ] Admin and moderator actions written to `audit_log`
- [ ] No secrets in code, logs or the client bundle
- [ ] Ask for a security review before each phase is closed

## 5. AI features

- Every AI feature has: a non-AI fallback, a timeout, per-user rate limits, an eval set (in `services/ai/evals/`) and logging of the model + prompt version.
- **No personal data to providers that train on inputs.** Send the minimum (no names, phone numbers, emails or exact locations).
- AI output is untrusted input: validate its shape with a schema; never execute it; moderation decisions by AI are reviewable by a human.
- Agents may only call an allow-list of tools; no tool that writes data without the user confirming.

## 6. Privacy and DPDP

- Collect only what a feature needs; every field in the data model has a purpose.
- Show a clear notice and record consent (purpose + notice version) before collecting data.
- Users can download their data and delete their account; deletion removes or anonymises their data within the defined retention period.
- 18+ only; no data from minors.
- Never store Aadhaar or other ID numbers; keep only verification status and the provider reference.
- A breach response runbook exists before the beta (Phase 6).

## 7. Testing

- Unit tests for scoring, validation and utility code; RLS tests for every table; E2E (Playwright) for: sign-up → quiz → swipe → match → chat.
- Bug fix = a failing test first, then the fix.
- CI must be green to merge. Flaky tests get fixed or quarantined with an issue, not ignored.

## 8. Dependencies

- Prefer the stack in `Architecture.md` §3. A new dependency needs: a reason, maintenance check (recent releases), licence check, and a `memory.md` line.
- Pin versions via the lockfile; Dependabot keeps them updated.

## 9. Don't

- Don't generate large amounts of code without a task from `task.md`.
- Don't add features outside the current phase without asking.
- Don't put real user data in seeds, tests, logs or screenshots.
- Don't disable lint rules, tests or security checks to make CI pass.
- Don't change a locked decision (Architecture.md §2) without a new ADR entry in `memory.md`.
