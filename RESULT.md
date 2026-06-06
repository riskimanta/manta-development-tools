# ManDev — current state

## Project summary

ManDev (`manta-development-tools`) is a local Next.js 15 control-plane dashboard for managing software projects, features, backlog, architecture diagrams, and per-project run profiles. Phase 2A provides opt-in short-command execution with session-only last-run UI. Phase 3 adds managed long-running process support via an in-memory process manager; Phase 3A service and Server Action wrappers are now wired, but no UI changes yet.

## Feature implemented

**Run Profiles Phase 3A: Service + Server Actions Wrapper for Managed Processes**

Exposes the internal `RunProfileProcessManager` through `src/services/run-profiles.ts` and thin Server Actions so Phase 3 UI can later poll status/logs and call start/stop/restart safely. Mutating actions are gated by `MANDEV_ENABLE_COMMAND_EXECUTION=true`; start/restart load saved profile command/cwd from the database only.

## Why this is Phase 3A wrapper

Phase 3 requires a stable server API before the Run Profiles card can add Start/Stop/Restart, status badges, and log polling. This slice wires DB validation, env gating, and serializable results around the existing process manager — without changing Phase 2A Run button behavior, UI, or schema.

## Files changed

- `src/services/run-profiles.ts` — managed process service functions + `ManagedRunProfileActionResult` type
- `src/app/projects/run-profiles/actions.ts` — five new Server Actions
- `src/services/run-profiles.test.ts` — service tests (validation, env gate, manager delegation, Phase 2A long-running block)
- `src/app/projects/run-profiles/actions.test.ts` — action delegation tests
- `docs/features/run-profiles-phase-3.md` — aligned API docs with implementation
- `RESULT.md` — this report

## Service API

| Function | Behavior |
|----------|----------|
| `startManagedRunProfile(runProfileId)` | Env gate → DB load → validate cwd/command → `runProfileProcessManager.start` |
| `stopManagedRunProfile(runProfileId)` | Env gate → `runProfileProcessManager.stop` |
| `restartManagedRunProfile(runProfileId)` | Env gate → DB load → validate → `runProfileProcessManager.restart` |
| `getManagedRunProfileSnapshot(runProfileId)` | Returns manager snapshot or `null` (no env gate) |
| `listManagedRunProfileSnapshots()` | Returns all manager snapshots (no env gate) |

Result type: `ManagedRunProfileActionResult` with `ok`, `message`, optional `snapshot` / `snapshots`, and failure `reason` (`disabled`, `not_found`, `invalid_command`, `missing_working_directory`, `invalid_working_directory`, `not_directory`, `manager_error`).

## Server Actions API

| Action | Delegates to |
|--------|----------------|
| `startManagedRunProfileAction` | `startManagedRunProfile` |
| `stopManagedRunProfileAction` | `stopManagedRunProfile` |
| `restartManagedRunProfileAction` | `restartManagedRunProfile` |
| `getManagedRunProfileSnapshotAction` | `getManagedRunProfileSnapshot` |
| `listManagedRunProfileSnapshotsAction` | `listManagedRunProfileSnapshots` |

## Safety boundary

- `MANDEV_ENABLE_COMMAND_EXECUTION=true` required for start/stop/restart
- Command and working directory come only from saved `ProjectRunProfile` records
- `validateRunProfileExecutionTarget` reused before spawn; no arbitrary caller input
- Managed path does **not** apply Phase 2A long-running command block
- Phase 2A `executeRunProfileAction` unchanged — still blocks long-running commands on the Run button
- No env gating inside `RunProfileProcessManager`

## Whether UI/app behavior changed

**No.** No routes, components, schema, or Phase 2A Run button changes. New actions exist but are not called from the UI yet.

## Test / lint / typecheck status

- `pnpm test`: Pass (330 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass

## Known limitations

- In-memory only — registry lost on ManDev server restart; possible orphan OS processes
- No UI polling, status badges, or Start/Stop/Restart buttons yet
- No confirmation dialog on managed start (UI responsibility in next slice)
- Read actions (`get`/`list` snapshot) are not env-gated
- Stop kills direct child only; no process-group / tree kill
- No persisted run history or separate clear-logs action

## Recommended next step

Build Phase 3A UI on the Run Profiles card: status badge, Start/Stop/Restart buttons (with confirmation), and log panel polling `getManagedRunProfileSnapshotAction` every 1–2s while a process is active.
