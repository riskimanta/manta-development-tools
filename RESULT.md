# ManDev — Run Profiles Phase 3B (stale managed process notice)

## What changed

**`src/lib/run-profile-process-manager.ts`** — Added module-level `RUN_PROFILE_PROCESS_MANAGER_BOOT_SESSION_ID` (UUID at server boot) and `getRunProfileProcessManagerBootSessionId()`.

**`src/lib/run-profile-managed-action-types.ts`** — `ManagedRunProfileActionResult` now includes `processManagerBootSessionId` on success and failure.

**`src/services/run-profiles.ts`** — All managed run profile service returns attach the current boot session id via `withProcessManagerBootSessionId`.

**`src/app/projects/run-profiles/actions.ts`** — Early validation responses include `processManagerBootSessionId`.

**`src/lib/managed-run-profile-ui.ts`** — Added stale-state notice copy and helpers (`shouldShowManagedRunProfileStaleNotice`, `applyManagedRunProfileBootSessionId`).

**`src/components/projects/managed-run-profile-controls.tsx`** — Tracks boot session id from action responses; shows an informational amber banner when the id changes after a prior value was seen.

**Tests** — Updated service/action expectations; added UI helper and boot session id unit tests.

**`docs/features/run-profiles-phase-3.md`** — Documented boot session id and stale-state notice.

## Public API

Managed run profile Server Action results now include `processManagerBootSessionId: string`. No DB or Phase 2A changes.

## Test / lint / typecheck status

- `pnpm test`: Pass (350 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass
