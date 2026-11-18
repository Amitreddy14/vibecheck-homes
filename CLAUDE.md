# CLAUDE.md — Vibecheck Homes

Read these before any work, in this order:

1. `rules.md`: how to work (process, git, code, security checklist, AI, privacy, testing). **These rules are binding.**
2. `task.md`: pick the current `in-progress` or next `todo` task. Work on one task only.
3. `Architecture.md`: structure, stack, data model, decisions (ADRs).
4. `PRD.md`: what the product is and each phase's acceptance criteria.
5. `design.md`: visual rules for any UI work.
6. `memory.md`: latest decisions and context (newest first).

## Ground rules (short version)

- Plan first: restate the task and its done-when criteria before writing code. No large code dumps without a task.
- Right-size: tag practices essential / recommended / optional / unnecessary; don't add infra the task doesn't need.
- Explain significant decisions (problem, trade-off, simpler alternative) and log them in `memory.md`.
- Honest reporting: only say "tested" if tests ran and passed; keep built vs planned separate.
- Security and data integrity are never traded for speed (rules.md §4).
- Git: Amit runs git himself. Prepare changes and give the commands. **Never add AI attribution** (no Co-Authored-By, no "Generated with") to commits, PRs or code.
- Update `task.md` status and add a `memory.md` entry at the end of each task.

## Commands

```
pnpm install
pnpm dev            # web app on http://localhost:3000 (needs apps/web/.env.local)
pnpm lint           # ESLint, zero warnings allowed
pnpm typecheck
pnpm test           # Vitest
pnpm check          # lint + typecheck + test + Prettier: run before every PR
pnpm build
pnpm format         # fix formatting
pnpm db:start      # local Supabase: Postgres, Auth, Storage, Studio (needs Docker Desktop)
pnpm db:reset      # re-apply migrations + seed
pnpm db:test       # pgTAP database tests (RLS etc.)
pnpm db:stop
```
