# Project Run Profiles — Phase 3: Process Manager with Logs, Stop, and Restart

**Status:** Phase 3A foundation + service/action wrappers implemented; UI not wired yet  
**Depends on:** Phase 2A (short-command execution, last-run UI)  
**Target:** Phase 3A MVP, with Phase 3B follow-ups noted inline

---

## 1. Overview

### What Phase 3 adds

Phase 3 turns saved **Project Run Profile** records into **managed long-running local processes** inside the ManDev Next.js server process. Users can start dev servers and similar commands (`pnpm dev`, `next dev`, `docker compose up`, backend workers), watch **live or near-live logs**, **stop** a running process, and **restart** it — all from the Project Detail Run Profiles card.

Core capabilities:

| Capability | Description |
|------------|-------------|
| Long-running execution | Remove the Phase 2A block on likely-long-running commands when using the process manager path |
| Process state | Track `idle`, `starting`, `running`, `stopping`, `stopped`, `failed`, `exited` per profile run |
| Live logs | Stream stdout/stderr into bounded in-memory buffers; UI polls (3A) or uses SSE (3B) |
| Stop | SIGTERM → grace period → SIGKILL |
| Restart | Stop if running, then start again with same saved command/cwd |
| Local-only, opt-in | Same `MANDEV_ENABLE_COMMAND_EXECUTION=true` gate and confirmation dialog |

Phase 2A **short-command execution** (30s timeout, fire-and-wait) remains available for one-shot commands. Phase 3 adds a **parallel execution path** for long-running profiles.

### What Phase 3 does not add

- Arbitrary terminal or free-form shell input
- Remote or multi-machine execution
- Production-grade process orchestration (systemd, Docker Swarm, Kubernetes)
- Multi-user concurrency guarantees across ManDev instances
- Persistent run history or log files in the database (MVP)
- Automatic orphan cleanup across ManDev server restarts (MVP limitation, documented)
- Windows-first process-tree killing (best-effort on macOS/Linux for MVP)

---

## 2. Goals

1. **Start long-running saved run profiles** — e.g. `pnpm dev`, `next dev`, `docker compose up`, local API servers and workers.
2. **Track process state** — visible status badge and metadata (PID, startedAt, exitCode) on each profile row.
3. **Show logs** — scrollable stdout/stderr panel while a process is running or after it exits.
4. **Stop and restart processes** — explicit user actions with predictable shutdown semantics.
5. **Keep execution local-only and opt-in** — unchanged safety boundary from Phase 2A; no behavior when env flag is off.

---

## 3. Non-goals

- **No arbitrary terminal** — commands come only from saved `ProjectRunProfile.command` strings.
- **No remote execution** — child processes run on the same host as the ManDev Node.js server.
- **No multi-user deployment guarantees** — single ManDev instance assumption; no distributed lock or shared registry.
- **No cloud process orchestration** — not a replacement for Railway, Fly.io, or CI runners.
- **No production server manager** — intended for local development workflows only.

---

## 4. Safety model

Phase 3 inherits and extends Phase 2A constraints.

### Required gates

| Gate | Behavior |
|------|----------|
| `MANDEV_ENABLE_COMMAND_EXECUTION=true` | All start/stop/restart/status/log actions no-op or return `disabled` when unset |
| Saved profile only | Start resolves `ProjectRunProfile` by DB ID; command/cwd never taken from client free text |
| Confirmation before start | Dialog shows profile name, command, cwd, and local-only warning (extend existing `RunRunProfileButton` flow) |
| Working directory validation | Reuse `validateRunProfileExecutionTarget` before spawn |
| Empty/invalid commands blocked | Same validation as Phase 2A |

### Exposure warning

If ManDev is bound beyond localhost (detect via env such as `HOST` / `PORT` or a dedicated `MANDEV_EXPOSED_WARNING` helper), show a prominent banner on the Run Profiles card:

> ManDev command execution is enabled and this server may be reachable from other machines. Only run profiles you trust.

MVP: document manual check; optional follow-up to detect bind address at startup.

### Shell execution risk

Phase 2A and Phase 3 both spawn with `shell: true` (see `executeSavedRunProfileCommand` in `src/lib/run-profile-execution.ts`). This means:

- Shell metacharacters in saved commands are interpreted by the user's shell.
- A compromised ManDev session (or malicious profile data) can run arbitrary local commands as the ManDev OS user.
- **Mitigation for MVP:** profiles are admin-curated, confirmation is required, execution is opt-in, and docs warn against exposing ManDev publicly.
- **Future (not Phase 3):** optional `shell: false` with argv parsing for allowlisted patterns; audit log of starts/stops.

### No free-form shell input

The UI never exposes a REPL or command line. Stop/restart only target processes already registered by a prior start action tied to a profile ID.

---

## 5. Proposed architecture

### High-level flow

```
┌─────────────────┐     Server Actions / Route Handler     ┌──────────────────────────┐
│ Run Profiles    │ ── start / stop / restart / status ──► │ run-profiles service     │
│ card (client)   │ ◄── poll logs + status ─────────────── │ (src/services/run-       │
└─────────────────┘                                        │  profiles.ts)            │
        │                                                    └────────────┬─────────────┘
        │ poll (3A) or SSE (3B)                                              │
        ▼                                                                    ▼
┌─────────────────┐                                        ┌──────────────────────────┐
│ Logs panel /    │                                        │ run-profile-process-     │
│ status badge    │                                        │ manager.ts (singleton)   │
└─────────────────┘                                        └────────────┬─────────────┘
                                                                         │
                                                                         ▼
                                                            ┌──────────────────────────┐
                                                            │ child_process.spawn      │
                                                            │ + run-profile-log-buffer │
                                                            └──────────────────────────┘
```

### In-memory process registry (Phase 3A MVP)

**Implemented:** `src/lib/run-profile-process-manager.ts` exports `RunProfileProcessManager` and singleton `runProfileProcessManager`.

- **Key:** `runProfileId` (one managed run per profile; duplicate starts while `starting` / `running` / `stopping` are rejected).
- **No `processRunId` in the skeleton** — deferred to Phase 3B run history.
- **No Prisma / env gating in the manager** — service and Server Action layers enforce DB lookup and `MANDEV_ENABLE_COMMAND_EXECUTION` later.

Public snapshot shape (`RunProfileManagedProcessSnapshot`):

```typescript
{
  runProfileId: string;
  status: "idle" | "starting" | "running" | "stopping" | "stopped" | "failed" | "exited";
  pid: number | null;
  command: string;
  workingDirectory: string;
  startedAt: string | null;   // ISO-8601
  stoppedAt: string | null;
  exitedAt: string | null;
  exitCode: number | null;
  signal: string | null;
  message: string;
  logs: RunProfileLogSnapshot;
}
```

Manager API: `start`, `stop`, `restart`, `getSnapshot`, `listSnapshots`, `clear`. Tests construct isolated `RunProfileProcessManager` instances with mocked `spawn`.

Internal registry entry also holds `ChildProcess` (server-only, not in snapshot) and stop-grace timer state.

### Spawn behavior

- Reuse validation from `validateRunProfileExecutionTarget`.
- **Do not** call `isLikelyLongRunningRunProfileCommand` block on the process-manager path (that guard stays on the Phase 2A short runner only).
- Spawn: `spawn(command, [], { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'] })`.
- Attach `data` handlers → append to bounded log buffers.
- On `spawn` / `error` / `close` → update status and exit metadata.

### Log buffers

`src/lib/run-profile-log-buffer.ts` (**implemented in Phase 3A foundation**):

- Single `RunProfileLogBuffer` instance holds **stdout** and **stderr** separately.
- Default **64 KB (65536 characters) per stream**; configurable via `maxCharsPerStream`.
- Character-based tail retention: when a stream exceeds the limit, **older content is discarded** and the **most recent** characters are kept.
- `snapshot()` returns `{ stdout, stderr, stdoutTruncated, stderrTruncated }` — serializable for Server Action polling.
- `appendStdout` / `appendStderr` accept chunked output; `clear()` resets content and truncation flags.

### Client updates

- **Phase 3A:** Server Actions return snapshot; client **polls** every 1–2s while status is `starting` | `running` | `stopping`.
- **Phase 3B:** Route Handler `GET /api/projects/run-profiles/[id]/logs/stream` with SSE.

### Layering (aligns with `docs/ARCHITECTURE.md`)

| Layer | Responsibility |
|-------|----------------|
| Server Actions (`src/app/projects/run-profiles/actions.ts`) | Auth check (if any), validate IDs, call service, return DTO |
| Service (`src/services/run-profiles.ts`) | Load profile from DB, delegate to process manager |
| Process manager (`src/lib/run-profile-process-manager.ts`) | Registry, spawn, stop, lifecycle |
| Log buffer (`src/lib/run-profile-log-buffer.ts`) | Bounded stdout/stderr storage |

---

## 6. Log delivery options

| Option | Pros | Cons |
|--------|------|------|
| **Polling** | Simple; works with Server Actions only; no extra Route Handler; easy to test; fits Next.js App Router patterns | Higher latency (1–2s); more requests while running; not true streaming |
| **Server-Sent Events (SSE)** | True push; one HTTP connection; standard for log tailing; good UX | Requires Route Handler; connection lifecycle in dev HMR; proxy buffering quirks |
| **WebSocket** | Bidirectional; lowest latency | Overkill for read-only logs; extra infra; harder in serverless/multi-instance |

### Recommendation for MVP: **Polling (Phase 3A)**

- ManDev is a **local single-user** tool; 1–2s log delay is acceptable for dev servers.
- Keeps Phase 3A entirely on **Server Actions** — consistent with existing `executeRunProfileAction`.
- Avoids SSE connection management, reconnection logic, and dev-server hot-reload edge cases in the first slice.
- **Phase 3B** adds SSE for smoother log tailing once the registry and buffers are stable.

Polling contract:

- `getRunProfileProcessStatusAction(profileId)` → `{ status, pid, startedAt, stoppedAt, exitCode, processRunId }`
- `getRunProfileProcessLogsAction(profileId, { sinceLine? })` → `{ stdout, stderr, truncated }`

---

## 7. Process lifecycle

```
                    start()
         idle ──────────────────► starting
          ▲                            │
          │                            │ spawn ok
          │                            ▼
          │                        running ◄──┐
          │                            │      │ restart()
          │              stop()        │      │ (stop then start)
          │                 │          │      │
          │                 ▼          │      │
          │             stopping       │      │
          │                 │          │      │
          │     ┌───────────┼──────────┘      │
          │     │           │                 │
          │     │     exit / kill             │
          │     ▼           ▼                 │
          └── stopped    exited (code 0)      │
                       failed (non-zero       │
                              or spawn error)─┘
```

| State | Meaning |
|-------|---------|
| `idle` | No managed process for this profile (or previous run finished and UI reset) |
| `starting` | Start requested; spawn in progress |
| `running` | Child alive; logs accumulating |
| `stopping` | SIGTERM sent; waiting grace period |
| `stopped` | User stopped (SIGTERM/SIGKILL); `exitCode` may be null or signal |
| `failed` | Spawn error or immediate non-zero exit before "warm" running |
| `exited` | Process ended on its own; `exitCode` set |

**Registry retention:** After `stopped` | `failed` | `exited`, keep entry (and logs) in memory until user clears logs, starts again, or server restarts. UI shows terminal states with last exit code.

---

## 8. Stop / restart behavior

### Stop

1. If status is not `running` (or `starting`), return current snapshot (idempotent).
2. Set status → `stopping`.
3. Send **SIGTERM** to `child.pid`.
4. Start grace timer (`RUN_PROFILE_PROCESS_STOP_GRACE_MS`, default **5000 ms**; injectable in tests).
5. If still alive after grace → **SIGKILL**.
6. On `close` → set `stoppedAt`, `exitCode`, status → `stopped` (user-initiated) or `exited` (natural close during stopping).

### Restart

1. If status is `running` | `starting` | `stopping` → await stop (with timeout).
2. Clear log buffers (configurable; default clear on restart).
3. Generate new `processRunId`; spawn again → `starting` → `running`.

### Platform limitations

| Platform | Notes |
|----------|-------|
| **macOS / Linux** | SIGTERM/SIGKILL apply to the shell child; **process trees** (e.g. `pnpm dev` → node) may survive if only the shell dies. MVP kills direct child; document that users may need `detached: false` and same behavior as their terminal. Optional 3B: `detached` + process group (`kill(-pgid)`) on Unix. |
| **Windows** | No SIGTERM; Node maps to `taskkill`. Tree kill requires `taskkill /T /F`. MVP: best-effort on direct child; document Windows limitations. |
| **Docker** | `docker compose up` may need SIGTERM to compose CLI; container stop semantics vary. Not fully solved in MVP. |

---

## 9. Log handling

| Rule | Detail |
|------|--------|
| Bounded size | Default 64 KB (65536 chars) per stream via `RUN_PROFILE_LOG_BUFFER_DEFAULT_MAX_CHARS` |
| Separate streams | stdout and stderr stored independently; UI tabs or stacked sections |
| Truncation indicator | When older lines drop, prefix snapshot with `[… earlier output truncated …]` |
| Memory safety | Ring buffer evicts oldest lines/bytes; no unbounded string concat |
| Clear logs | Manual "Clear logs" button clears buffers for terminal states; restart clears by default |
| No DB writes (MVP) | Logs live only in server memory; lost on ManDev restart |

Phase 2A `truncateRunProfileOutputPreview` remains for **short** execution results; process manager uses the dedicated buffer type.

---

## 10. UI design

Extend **Project Detail → Run Profiles card** (`project-run-profiles-card.tsx`).

### Per profile row

| Element | Behavior |
|---------|----------|
| **Status badge** | `Idle` / `Starting` / `Running` / `Stopping` / `Stopped` / `Failed` / `Exited` with color coding (green=running, amber=starting/stopping, muted=idle/stopped, red=failed) |
| **Run** | Shown when `idle` or terminal state; opens confirmation dialog (existing pattern) |
| **Stop** | Shown when `running` or `starting`; disabled when `stopping` |
| **Restart** | Shown when `running`, terminal states, or `failed`; confirms if process still running |
| **View logs** | Opens sheet/dialog with auto-scroll; polls while active |
| **Last exit code** | Shown for terminal states |
| **Last started** | Relative time (`startedAt`) |
| **Local execution warning** | Amber callout when command execution enabled (card-level + dialog) |

### Components (suggested)

| File | Role |
|------|------|
| `run-run-profile-button.tsx` | Extend: distinguish short vs long path, or add `StartManagedRunProfileButton` |
| `run-profile-process-status-badge.tsx` | New — status chip |
| `run-profile-logs-panel.tsx` | New — polled log viewer |
| `run-profile-execution-result-panel.tsx` | Keep for Phase 2A short runs |

### UX notes

- While **running**, disable editing command/cwd on that row (or show warning that changes apply on next start).
- Polling stops when tab hidden optional optimization (3B).
- Copy actions (command, cd) unchanged.

---

## 11. Backend / service design

### New modules

| Path | Purpose |
|------|---------|
| `src/lib/run-profile-log-buffer.ts` | Bounded ring buffer for one stream |
| `src/lib/run-profile-process-manager.ts` | Singleton registry, start/stop/restart, lifecycle |
| `src/lib/run-profile-process-types.ts` | Shared enums/DTOs (optional) |

### Server Actions (extend `src/app/projects/run-profiles/actions.ts`) — **implemented (3A wrappers)**

| Action | Returns |
|--------|---------|
| `startManagedRunProfileAction(profileId)` | `ManagedRunProfileActionResult` |
| `stopManagedRunProfileAction(profileId)` | `ManagedRunProfileActionResult` |
| `restartManagedRunProfileAction(profileId)` | `ManagedRunProfileActionResult` |
| `getManagedRunProfileSnapshotAction(profileId)` | `ManagedRunProfileActionResult` (snapshot includes status + logs) |
| `listManagedRunProfileSnapshotsAction()` | `ManagedRunProfileActionResult` (`snapshots` array) |

**Not yet implemented:** separate status/logs actions, `clearManagedRunProfileLogsAction`, SSE route. Phase 3A UI will poll `getManagedRunProfileSnapshotAction` (logs embedded in snapshot).

Existing `executeRunProfileAction` **unchanged** for short commands.

### Service wrappers (`src/services/run-profiles.ts`) — **implemented (3A wrappers)**

```typescript
export type ManagedRunProfileActionResult =
  | { ok: true; snapshot: RunProfileManagedProcessSnapshot | null; snapshots?: RunProfileManagedProcessSnapshot[]; message: string }
  | { ok: false; snapshot?: RunProfileManagedProcessSnapshot | null; snapshots?: RunProfileManagedProcessSnapshot[]; message: string; reason: "disabled" | "not_found" | "invalid_command" | "missing_working_directory" | "invalid_working_directory" | "not_directory" | "manager_error" };

export function startManagedRunProfile(profileId: string): Promise<ManagedRunProfileActionResult>
export function stopManagedRunProfile(profileId: string): Promise<ManagedRunProfileActionResult>
export function restartManagedRunProfile(profileId: string): Promise<ManagedRunProfileActionResult>
export function getManagedRunProfileSnapshot(profileId: string): ManagedRunProfileActionResult
export function listManagedRunProfileSnapshots(): ManagedRunProfileActionResult
```

- **Mutating** actions (`start`, `stop`, `restart`) require `MANDEV_ENABLE_COMMAND_EXECUTION=true`.
- **Read** actions (`getManagedRunProfileSnapshot`, `listManagedRunProfileSnapshots`) do not gate on env (in-memory introspection only).
- Start/restart load `ProjectRunProfile` from DB; command/cwd come from saved profile only.
- Reuses `validateRunProfileExecutionTarget` before spawn; does **not** apply Phase 2A long-running block.

### Phase 3B Route Handler (not MVP)

- `src/app/api/projects/run-profiles/[profileId]/stream/route.ts` — SSE log stream

### Tests (co-located)

- `src/lib/run-profile-log-buffer.test.ts`
- `src/lib/run-profile-process-manager.test.ts`
- Extend `src/app/projects/run-profiles/actions.test.ts`

---

## 12. Data persistence decision

**Recommendation: no database persistence for Phase 3A MVP.**

| Approach | Pros | Cons |
|----------|------|------|
| **In-memory only** | Fast; no schema migration; no disk growth; matches local-dev scope; simple tests | Lost on server restart; no audit trail |
| **DB run history** | Survives restarts; queryable last run; multi-tab consistency | Schema design (`RunProfileProcessRun` table); log storage awkward in SQLite; scope creep |
| **File-based logs** | Large logs possible; survives restarts | Path hygiene; concurrent writes; cleanup jobs; security (sensitive log content on disk) |

If persistence is needed later, prefer **DB for metadata only** (run id, profile id, startedAt, stoppedAt, exitCode, status) and **optional file tail** for large logs — not both full logs in DB.

**Prisma schema:** unchanged in Phase 3A.

---

## 13. Edge cases

| Case | Handling |
|------|----------|
| **ManDev server restart** | In-memory registry empty; UI shows `idle`; **orphan OS processes may keep running** — document; user must kill manually or via port conflict discovery. Phase 3B: optional startup pidfile scan. |
| **Orphaned processes** | MVP does not reconcile PIDs after restart; warn in docs and UI footer |
| **Port conflicts** | Command fails or hangs; stderr shows "address already in use"; status → `failed` or `exited` with non-zero code |
| **Command exits immediately** | `starting` → quick `exited`/`failed`; logs still shown |
| **Huge log volume** | Buffer truncates; UI shows truncation banner; memory stays bounded |
| **cwd deleted after start** | Running process unaffected; restart/start validation fails with blocked message |
| **Duplicate starts** | If already `running`/`starting`, return existing snapshot or reject with message (recommend **reject** for clarity) |
| **Multiple profiles at once** | Supported — registry keyed by `runProfileId`; independent processes |
| **Stopping process trees** | MVP: kill direct child only; document limitation; 3B explore Unix process groups |
| **Concurrent stop + restart** | Serialize per `runProfileId` with in-manager mutex/queue |
| **Profile deleted while running** | On delete action, attempt stop then remove registry entry |
| **Command execution disabled mid-run** | Do not auto-kill; prevent new starts; stop still allowed |

---

## 14. Testing strategy

| Area | Approach |
|------|----------|
| Log buffer | Unit tests: append, line cap, byte cap, truncation message, clear |
| Process manager | Mock `child_process.spawn`; simulate stdout/stderr `data`, `close`, `error`; test lifecycle transitions, stop grace, duplicate start rejection |
| Server Actions | Mock service/manager; assert disabled when env off, not-found profile, DTO shape |
| Integration | Avoid real `pnpm dev` in CI; use `node -e "console.log('ok'); setInterval(()=>{}, 10000)"` only in manual QA |
| Existing Phase 2A tests | Must remain green; long-running block stays on short path |

Follow **Test-First Enforcement** for implementation PRs: buffer tests → manager tests → action tests → UI.

---

## 15. Recommended MVP scope

### Phase 3A (implement first)

- [x] In-memory registry keyed by `runProfileId` (`run-profile-process-manager.ts`)
- [x] Bounded in-memory logs (stdout/stderr) (`run-profile-log-buffer.ts`)
- [x] Service wrappers with DB validation + env gating (`src/services/run-profiles.ts`)
- [x] Server Actions for start/stop/restart/snapshot/list (`actions.ts`)
- [x] Unit tests for buffer, manager, service, and actions (mocked spawn / Prisma / fs)
- [ ] Start long-running command via UI (service path bypasses Phase 2A long-running block)
- [ ] Poll status + logs via Server Actions (1–2s interval in UI)
- [ ] Status badge + Run/Stop/Restart + logs panel on Run Profiles card

### Phase 3B (later)

- [ ] SSE log streaming Route Handler
- [ ] Persisted run history (metadata in DB, optional log files)
- [ ] Unix process groups / improved tree kill
- [ ] Orphan detection (pidfile or startup scan)
- [ ] Bind-address exposure warning automation
- [ ] Clear separation UI: "Run once" (30s) vs "Start server" (managed)

---

## 16. Acceptance criteria

### Phase 3A checklist

- [ ] With `MANDEV_ENABLE_COMMAND_EXECUTION=true`, user can start a saved profile whose command matches long-running patterns (e.g. `pnpm dev`) without Phase 2A block message
- [ ] With flag off, start/stop/restart return disabled state; no spawn
- [ ] Confirmation dialog required before managed start
- [ ] Status badge reflects lifecycle within 2s of state change (via polling)
- [ ] Logs update while running (poll); stdout and stderr visible separately
- [ ] Stop terminates process within grace period + kill fallback
- [ ] Restart stops then starts; logs cleared on restart (default)
- [ ] Log buffers do not grow unbounded (verified by test with large output)
- [ ] Duplicate start while running returns error or existing run (documented behavior)
- [ ] Short-command `executeRunProfileAction` still works with 30s timeout and long-running block
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint` pass
- [ ] Manual QA: start → view logs → stop → restart → exit naturally

---

## 17. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Security** — shell injection via saved commands | Arbitrary code as OS user | Opt-in env; confirmation; admin-only profile CRUD; exposure warning; no public deployment docs |
| **Orphan processes** — server crash/restart | Zombie dev servers, port leaks | Document; Phase 3B pid tracking; UI note after restart |
| **Memory** — verbose logs | OOM on ManDev server | Bounded buffers; line + byte caps; truncation UI |
| **Platform** — incomplete tree kill | Stop leaves node children | Document; Unix process group in 3B |
| **UX** — polling lag | Logs feel delayed | 1s poll while running; SSE in 3B |
| **UX** — confused Run vs Start | Wrong action for long cmd | Label buttons "Run once" vs "Start" in 3B; Phase 3A can use "Start" for managed path |
| **Next.js dev HMR** | Registry wiped on hot reload in dev | Accept for dev; production `next start` more stable; document |
| **Concurrent users** | Two tabs start same profile | Per-profile lock in manager; reject duplicate |

---

## Related code (Phase 2A baseline)

| Path | Role today |
|------|------------|
| `src/lib/run-profile-execution.ts` | Short command spawn, 30s timeout, long-running block |
| `src/services/run-profiles.ts` | `executeRunProfileCommand` |
| `src/app/projects/run-profiles/actions.ts` | `executeRunProfileAction` |
| `src/components/projects/project-run-profiles-card.tsx` | Profile list, last-run panel |
| `src/components/projects/run-run-profile-button.tsx` | Confirmation + run |
| `src/lib/mandev-command-execution.ts` | Env gate |

---

## Document maintenance

When Phase 3A is implemented, update this doc with "Implemented" sections, add paths to `path-map.md`, and extend `dashboard-hub.md` or a dedicated `run-profiles.md` with user-visible behavior summary.
