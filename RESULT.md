# ManDev — Run Profiles stale notice copy fix

## What changed

**`src/lib/managed-run-profile-ui.ts`** — Added `resolveManagedRunProfileActionMessage()` to omit supporting action text when the stale restart notice is active and status is idle/terminal.

**`src/components/projects/managed-run-profile-controls.tsx`** — Clears stale action message on boot-session change; updates action message when snapshot is absent; renders via `resolveManagedRunProfileActionMessage()` so text like “Process is running.” no longer appears alongside the stale banner.

**`src/lib/managed-run-profile-ui.test.ts`** — Tests for the new helper.

## Behavior

After app/server restart, the amber stale notice still appears and status shows `Idle`, but conflicting old running copy is hidden. If the user starts the profile again, active-state messages show normally.

## Test / lint / typecheck status

- `pnpm test`: Pass (354 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass
