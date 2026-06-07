# ManDev — Run Profiles Phase 3D (stale run-history recovery on boot)

## What changed

**`src/services/run-profile-run-history.ts`** — Renamed boot recovery to `markActiveRunProfileRunsStaleOnBoot()`; it now finalizes orphaned in-progress rows (`starting`, `running`, `stopping`) as `stale` with `endedAt`, `durationMs`, and `signal = "APP_RESTART"`. DB failures are logged and do not throw.

**`src/services/run-profiles.ts`** — Calls renamed boot recovery once when managed run-profile lifecycle services register (idempotent guard).

**Tests** — Boot recovery cases in `run-profile-run-history.test.ts` cover `starting`, `running`, and `stopping` rows, terminal rows unchanged, and DB failure; mock updated in `run-profiles.test.ts`.

**`docs/features/run-profiles-phase-3.md`** — Phase 3D section and checklist updated for active-status recovery.

## Root cause

Boot recovery only queried `status = "running"`. If ManDev restarted before spawn/finalize lifecycle updates completed, a run could remain persisted as `starting` and was never recovered.

## Schema / migration

None. Uses existing `ProjectRunProfileRun.status` string field (`stale` is a persisted value, not an enum).

## Known limitations

- History is loaded on page render; refresh required to see updates (no SSE).
- Live managed process state remains in-memory only; orphan OS processes may still run after restart.
- Phase 2A short command execution unchanged.

## Test / lint / typecheck status

- `pnpm test`: Pass (387 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass
