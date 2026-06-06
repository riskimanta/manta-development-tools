# ManDev — current state

## Project summary

ManDev (`manta-development-tools`) is a local Next.js 15 control-plane dashboard for managing software projects, features, backlog, architecture diagrams, and per-project run profiles. Phase 2A provides opt-in short-command execution with session-only last-run UI. Phase 3 adds managed long-running process support via an in-memory process manager; Phase 3A now exposes Start/Stop/Restart, status, and log polling in the Run Profiles card UI.

## Feature implemented

**Run Profiles Phase 3A UI MVP: Managed Start/Stop/Restart + Status/Logs Polling**

Each run profile card (when command execution is enabled) includes a compact **Managed process** section with status badge, process metadata, Start/Stop/Restart controls, confirmation dialogs, and a collapsible scrollable logs panel. State is polled from in-memory snapshots via `getManagedRunProfileSnapshotAction`.

## Safety boundary

- Managed controls render only when `MANDEV_ENABLE_COMMAND_EXECUTION=true` (same gate as Phase 2A Run button)
- Start/Restart use saved `ProjectRunProfile` records only — no free-form command input
- Start and Restart require confirmation dialogs showing profile name, command, working directory, and local-process warning
- Card-level amber warning remains visible when execution is enabled
- Phase 2A `RunRunProfileButton` unchanged — still blocks long-running commands on the short Run path
- Managed Start allows long-running commands (Phase 3 path)
- Stop/Restart call managed Server Actions only
- No database schema changes; no persisted run history; no SSE/WebSocket

## UI behavior

- **Managed process** section per profile (violet accent, distinct from amber Phase 2A Run)
- Status badge: idle / starting / running / stopping / stopped / failed / exited
- Metadata when available: pid, startedAt, exitedAt, exitCode, signal
- **Start** — visible when idle/stopped/failed/exited; opens confirmation dialog
- **Stop** — visible when starting/running
- **Restart** — visible when running/stopped/failed/exited; opens confirmation dialog
- Action messages shown inline; errors also toast
- Logs panel (`<details>`): stdout, stderr, truncated badges; compact scrollable `<pre>` blocks
- Null snapshot handled safely (treated as idle)

## Polling behavior

- On mount: fetches initial snapshot via `getManagedRunProfileSnapshotAction(profileId)` (rediscover active in-memory processes after page refresh)
- Poll interval: **1.5s** while status is `starting`, `running`, or `stopping`
- Polling stops when status is `idle`, `stopped`, `failed`, or `exited`
- Pure helpers in `src/lib/managed-run-profile-ui.ts` drive poll/button eligibility

## Files changed

- `src/components/projects/managed-run-profile-controls.tsx` — new client component (controls, dialogs, logs, polling)
- `src/components/projects/project-run-profiles-card.tsx` — renders managed section when execution enabled
- `src/lib/managed-run-profile-ui.ts` — status/poll/button helpers
- `src/lib/managed-run-profile-ui.test.ts` — helper unit tests
- `RESULT.md` — this report

**Unchanged:** `run-run-profile-button.tsx`, Prisma schema, `RunProfileProcessManager`, Phase 3A service/actions (already wired).

## Whether schema changed

**No.** No Prisma migrations or database changes.

## Test / lint / typecheck status

- `pnpm test`: Pass (338 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass

## Known limitations

- In-memory only — registry lost on ManDev server restart; possible orphan OS processes
- Stop kills direct child only; no process-group / tree kill
- No persisted run history or separate clear-logs action
- No SSE/WebSocket — polling only (1.5s interval)
- Restart confirmation reuses same dialog as Start (no separate “will stop first” detail)
- Component-level tests not added (no established component test harness); covered by helper tests + typecheck/lint

## Manual verification steps

1. Set `.env`: `MANDEV_ENABLE_COMMAND_EXECUTION=true`
2. Restart dev server
3. Open a project with a run profile (working directory set), e.g. command `pnpm dev` or a safer long-running test command
4. Confirm **Managed process** section appears; Phase 2A **Run** button still present
5. Click **Start** → confirm dialog → process starts; status becomes **Running**
6. Confirm logs appear in **Process logs** panel
7. Click **Stop** → status becomes **Stopped**
8. Click **Restart** → confirm → process restarts; logs reflect new run
9. Refresh page while running → initial snapshot should rediscover active process

## Recommended next step

Phase 3B: process-group/tree kill on stop, optional log clear action, and/or SSE push for logs to reduce polling load — still without DB persistence unless explicitly scoped.
