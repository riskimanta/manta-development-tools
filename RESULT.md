# ManDev — current state

## Project summary

ManDev (`manta-development-tools`) is a local Next.js 15 control-plane dashboard for managing software projects, features, backlog, architecture diagrams, and per-project run profiles. Run profile execution (Phase 2A) supports opt-in short commands with session-only last-run UI; long-running dev servers remain blocked until Phase 3 is implemented.

## What document was added

**`docs/features/run-profiles-phase-3.md`** — design specification for Project Run Profiles Phase 3: Process Manager with Logs, Stop, and Restart. Covers architecture, safety, lifecycle, log delivery comparison, UI/backend modules, persistence decision, edge cases, testing, MVP scope (3A vs 3B), acceptance criteria, and risks.

Also updated:

- `docs/features/index.md` — index row for Phase 3 design doc
- `docs/features/path-map.md` — run profile implementation paths mapped to Phase 3 doc

## Key recommendation for Phase 3 architecture

Use an **in-memory process registry singleton** (`src/lib/run-profile-process-manager.ts`) keyed by `runProfileId`, with **bounded stdout/stderr ring buffers** (`src/lib/run-profile-log-buffer.ts`), and **polling via Server Actions** for Phase 3A MVP (1–2s interval). Defer SSE streaming, DB run history, and process-group orphan cleanup to Phase 3B. Keep Phase 2A short-command execution (`executeRunProfileAction`, 30s timeout) as a separate path; only the managed start path bypasses the long-running command block.

## Files changed

- `docs/features/run-profiles-phase-3.md` — new design specification
- `docs/features/index.md` — feature index entry
- `docs/features/path-map.md` — path mapping for run profile modules
- `RESULT.md` — this report

## Whether code behavior changed

**No.** Documentation-only task; no Phase 3 implementation.

## Test / lint / typecheck status

- `pnpm test`: Not re-run (docs-only; no code changes; existing suite unaffected)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass

## Known limitations (unchanged in code)

- Phase 2A: short commands only; long-running patterns blocked
- Last run result is session-only on the profile card
- No live logs, stop, restart, or persistent process tracking

## Recommended next step

Implement **Phase 3A** per the design doc: process manager + log buffer + Server Actions (start/stop/restart/status/logs) + polled logs UI on the Run Profiles card. Write unit tests for buffer and manager (mocked `child_process`) before production code.
