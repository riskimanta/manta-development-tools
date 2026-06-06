# ManDev — Run Profiles Phase 3C foundation (persistent run history)

## What changed

**`prisma/schema.prisma`** — Added `ProjectRunProfileRun` model with indexes on `runProfileId`, `startedAt`, and `(runProfileId, startedAt)`.

**`prisma/migrations/20260606183000_add_project_run_profile_runs/`** — SQLite migration for run history table.

**`src/lib/run-profile-run-history-types.ts`** — Serializable `RunProfileRunRecord` DTO.

**`src/services/run-profile-run-history.ts`** — DB helpers: create on managed start, update on spawn, finalize on terminal lifecycle, list/get latest runs. DB failures are logged, not thrown.

**`src/lib/run-profile-process-manager.ts`** — Typed lifecycle callbacks (`spawn`, `error`, `close`) via `setLifecycleHandler`; restart force-stop emits `close` before listeners are removed.

**`src/services/run-profiles.ts`** — Registers lifecycle handler; creates run history on accepted managed start/restart; re-exports `listRunProfileRuns` / `getLatestRunProfileRun`.

**Tests** — `run-profile-run-history.test.ts`, lifecycle handler test, integration expectations in `run-profiles.test.ts`.

**`docs/features/run-profiles-phase-3.md`** — Phase 3C foundation note.

## Schema / migration

New table `ProjectRunProfileRun` (cascade delete with profile). Run `pnpm db:migrate` (or apply migration `20260606183000_add_project_run_profile_runs`).

## Known limitations

- Live managed process state remains in-memory only.
- No run-history UI in this step.
- Server restart mid-run may leave an open `running` history row (orphan metadata).
- Phase 2A short command execution unchanged.

## Test / lint / typecheck status

- `pnpm db:generate` + `prisma migrate deploy`: applied `20260606183000_add_project_run_profile_runs`
- `pnpm test`: Pass (366 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass
