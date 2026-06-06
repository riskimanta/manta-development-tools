# ManDev — Run Profiles Phase 3B (safe stop)

## What changed

**`src/lib/run-profile-process-manager.ts`** — POSIX managed processes spawn with `detached: true` so the shell leads a process group. Stop, restart force-stop, and dispose prefer `process.kill(-pid, signal)` on macOS/Linux, falling back to direct `child.kill` when group kill fails. Windows behavior is unchanged (no `detached`, direct child kill only).

**`src/lib/run-profile-process-manager.test.ts`** — Added POSIX spawn/stop tests (process-group kill, SIGKILL escalation, fallback, Windows path). Existing tests pin `platform: "win32"` to preserve prior expectations.

**`docs/features/run-profiles-phase-3.md`** — Documented Phase 3B safe-stop behavior and marked Unix process-group item done.

## Public API / UI

Unchanged. No DB schema or UI changes.

## Test / lint / typecheck status

- `pnpm test`: Pass (343 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass
