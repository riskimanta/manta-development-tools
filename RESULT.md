# ManDev — current state

## Project summary

ManDev (`manta-development-tools`) is a local Next.js 15 control-plane dashboard for managing software projects, features, backlog, architecture diagrams, and per-project run profiles. Phase 2A provides opt-in short-command execution with session-only last-run UI. Phase 3 adds an in-memory process manager skeleton for long-running profiles (not yet wired to the UI).

## Feature implemented

**Run Profiles Phase 3A Skeleton: In-memory Process Manager**

Internal module to start, track, stop, and restart managed local processes for saved run profiles. Captures stdout/stderr into `RunProfileLogBuffer` and returns serializable snapshots for future Server Actions and UI polling.

## Why this is Phase 3A skeleton

Phase 3 requires a process registry before Server Actions or UI can expose long-running dev servers. This module implements lifecycle management and log capture in isolation — fully unit-tested with mocked `spawn`, with no changes to Phase 2A execution, no env gating here, and no user-facing behavior yet.

## Files changed

- `src/lib/run-profile-process-manager.ts` — manager class + `runProfileProcessManager` singleton (new)
- `src/lib/run-profile-process-manager.test.ts` — 16 unit tests with mocked spawn (new)
- `docs/features/run-profiles-phase-3.md` — aligned registry/API docs with implementation
- `RESULT.md` — this report

## Process manager API

| Method | Behavior |
|--------|----------|
| `start({ runProfileId, command, workingDirectory })` | Spawns child; returns snapshot (`starting` → `running` on `spawn` event) |
| `stop(runProfileId)` | SIGTERM → grace (`RUN_PROFILE_PROCESS_STOP_GRACE_MS`, 5s) → SIGKILL; `null` if unknown |
| `restart(input)` | Force-stops active process, clears logs, starts fresh |
| `getSnapshot(runProfileId)` | Snapshot or `null` |
| `listSnapshots()` | All registry entries |
| `clear(runProfileId)` | Removes entry and disposes child |

Export: `runProfileProcessManager` singleton; tests use `new RunProfileProcessManager({ spawn, stopGraceMs, logBufferOptions })`.

## Lifecycle behavior

- **starting** → **running** on child `spawn` (pid set)
- **running** → **exited** (code 0) or **failed** (non-zero / error) on `close` / `error`
- **stop** → **stopping** → **stopped** on `close` (user-initiated)
- **restart** clears log buffer and replaces the registry entry; active child receives SIGTERM and listeners are removed before a new spawn
- Duplicate start while **starting** / **running** / **stopping** blocked with explanatory message

Spawn options: `shell: true`, `cwd: workingDirectory`, `stdio: ["ignore", "pipe", "pipe"]`.

## Safety boundary

- No `MANDEV_ENABLE_COMMAND_EXECUTION` check in this module (service/action layer later)
- No Prisma / DB validation
- Phase 2A `executeRunProfileAction` unchanged; long-running commands still blocked on the Run button
- Not connected to UI or Server Actions

## Whether app behavior changed

**No.** Internal library only; no routes, UI, schema, or Phase 2A execution changes.

## Test / lint / typecheck status

- `pnpm test`: Pass (308 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass

## Known limitations

- In-memory only — registry lost on ManDev server restart; possible orphan OS processes
- Restart uses SIGTERM on old child without waiting for graceful shutdown before new spawn
- Stop kills direct child only (no process-group / tree kill)
- No `processRunId` or persisted run history
- Windows tree-kill not addressed

## Recommended next step

Wire the manager into **`src/services/run-profiles.ts`** and **Server Actions** (`startManagedRunProfileAction`, `stopManagedRunProfileAction`, etc.) with `MANDEV_ENABLE_COMMAND_EXECUTION` gating and DB profile lookup — still no UI until actions are stable.
