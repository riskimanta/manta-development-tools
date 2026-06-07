# ManDev — Fix managed run history persistence

## Bug summary

After Phase 4B merge, a completed managed run (`View All Runs Test`, PID 72552, exit 0, ~2s) showed correctly in the managed process UI but **did not appear** in Recent Runs or View All Runs. Only an older `STALE` / `APP_RESTART` row (~388ms) remained.

## Root cause

1. `createRunProfileRunForManagedStart` created a `starting` row on managed Start.
2. Dev boot recovery (`markActiveRunProfileRunsStaleOnBoot`) ran again (e.g. HMR/module reload) and marked that in-flight row `stale` with `endedAt` set (~388ms after start).
3. `findOpenRunProfileRun` only matched rows with `endedAt: null`, so spawn/finalize lifecycle handlers could not find an open row.
4. In-memory process manager still reported `Exited`, but DB finalization was a no-op — history never got the completed run.

SQLite confirmed one row for the profile: `stale`, `APP_RESTART`, no PID, no stdout preview.

## Fix summary

- **`findOpenRunProfileRun`**: match active statuses (`starting` / `running` / `stopping`) instead of `endedAt: null`, so stale rows are never selected.
- **`markActiveRunProfileRunsStaleOnBoot`**: skip run profiles that still have an active managed process in `runProfileProcessManager`.
- **`finalizeRunProfileRunFromSnapshot`**: if no open row exists (e.g. boot recovery already closed it), create a finalized history row from the terminal snapshot (pid, exit, duration, stdout/stderr previews).

## Changed files

- `src/services/run-profile-run-history.ts`
- `src/services/run-profile-run-history.test.ts`
- `RESULT.md`

## Validation

| Check | Result |
|-------|--------|
| `pnpm test` | Pass — 395 tests |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

## Notes

- No DB schema changes
- No migration
- No SSE/WebSocket
- Phase 2A short command execution unchanged
- Managed Start/Stop/Restart UX unchanged

## Git branch/status

```
Branch: fix/run-profiles-managed-run-history-persistence
Base: main (up to date with origin/main)
```
