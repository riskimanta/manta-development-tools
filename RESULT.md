# ManDev — Run Profiles Phase 3D (stale run-history recovery on boot)

## What changed

**`src/services/run-profile-run-history.ts`** — Added `markRunningRunProfileRunsStaleOnBoot()` to finalize orphaned `running` rows as `stale` with `endedAt`, `durationMs`, and `signal = "APP_RESTART"`. DB failures are logged and do not throw.

**`src/lib/run-profile-run-history-types.ts`** — Added `RUN_PROFILE_RUN_STALE_APP_RESTART_SIGNAL` constant.

**`src/services/run-profiles.ts`** — Calls boot recovery once when managed run-profile lifecycle services register (idempotent guard).

**`src/lib/run-profile-run-history-ui.ts`** — **Stale** status label/variant and compact **app restart** exit summary for recovered rows.

**Tests** — Boot recovery cases in `run-profile-run-history.test.ts`; stale UI formatting in `run-profile-run-history-ui.test.ts`; mock updated in `run-profiles.test.ts`.

**`docs/features/run-profiles-phase-3.md`** — Phase 3D section and checklist updates.

## Schema / migration

None. Uses existing `ProjectRunProfileRun.status` string field (`stale` is a persisted value, not an enum).

## Known limitations

- Only rows with `status = "running"` are recovered; `starting` / `stopping` orphans are unchanged.
- History is loaded on page render; refresh required to see updates (no SSE).
- Live managed process state remains in-memory only; orphan OS processes may still run after restart.
- Phase 2A short command execution unchanged.

## Test / lint / typecheck status

- `pnpm test`: Pass (385 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass
