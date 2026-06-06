# ManDev — current state

## Project summary

ManDev (`manta-development-tools`) is a local Next.js 15 control-plane dashboard for managing software projects, features, backlog, architecture diagrams, and per-project run profiles. Phase 2A provides opt-in short-command execution with session-only last-run UI. Phase 3 (process manager, live logs, stop/restart) is in progress.

## Feature implemented

**Run Profiles Phase 3A Foundation: Bounded Log Buffer**

A small, well-tested utility for storing recent stdout/stderr from managed run profiles without unbounded memory growth. This is the first building block for the Phase 3 process manager; it does not spawn processes or change the UI.

## Why this is Phase 3A foundation

The Phase 3 design (`docs/features/run-profiles-phase-3.md`) calls for in-memory process tracking with bounded log buffers and polling via Server Actions. The process manager (next task) will attach `child_process` stdout/stderr handlers to `RunProfileLogBuffer`; Server Actions will return `snapshot()` DTOs to the UI. Implementing the buffer in isolation keeps this PR focused, fully testable, and free of execution/UI risk.

## Files changed

- `src/lib/run-profile-log-buffer.ts` — `RunProfileLogBuffer` class and types (new)
- `src/lib/run-profile-log-buffer.test.ts` — unit tests (new)
- `docs/features/run-profiles-phase-3.md` — aligned log buffer API/defaults with implementation
- `RESULT.md` — this report

## Log buffer behavior

- **Default limit:** 64 KB (65536 characters) per stream (`RUN_PROFILE_LOG_BUFFER_DEFAULT_MAX_CHARS`)
- **API:** `appendStdout`, `appendStderr`, `snapshot()`, `clear()`
- **Truncation:** When a stream exceeds the limit, older content is dropped; the tail is kept; `stdoutTruncated` / `stderrTruncated` flags are set (sticky until `clear()`)
- **Order:** Appends preserve chronological order within each stream
- **Chunks:** Handles many small chunks, single oversized chunks, and newline-containing text
- **Guards:** Empty strings and non-string chunks are ignored
- **Serializable:** `RunProfileLogSnapshot` is plain strings and booleans for future Server Action responses

## Whether code behavior changed in the app UI

**No.** No process manager, Server Actions, command execution changes, or UI updates. Run profile behavior remains Phase 2A only.

## Test / lint / typecheck status

- `pnpm test`: Pass
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass

## Recommended next step

Implement **`src/lib/run-profile-process-manager.ts`** with mocked-spawn unit tests: in-memory registry keyed by `runProfileId`, start/stop lifecycle stubs that wire stdout/stderr into `RunProfileLogBuffer`, without enabling long-running commands in the UI yet.
