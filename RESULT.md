# ManDev — current state

## Project summary

ManDev (`manta-development-tools`) is a local Next.js 15 control-plane dashboard for managing software projects, features, backlog, architecture diagrams, and per-project run profiles.

## Feature implemented

**Run Profile Last Result UI (Phase 2A)**

After a saved run profile is executed, the latest result now persists on the profile card for the remainder of the page session. Users can close the confirmation dialog and still see what happened under that profile.

## UX problem solved

Previously, execution results appeared only inside the confirmation dialog and were cleared when the dialog closed. Users lost visibility into stdout/stderr, exit code, and status immediately after dismissing the dialog.

## Safety boundary

Unchanged from Phase 2A:

- Opt-in via `MANDEV_ENABLE_COMMAND_EXECUTION=true`
- Only saved run profiles (by DB ID)
- Confirmation dialog required before execution
- No database persistence of results
- No live log streaming
- No process manager, stop, or restart
- Long-running commands remain blocked until Phase 3

## UI behavior

- Each run profile row keeps `lastRun` in client-side React state (`useState`).
- State resets on page refresh (no persistence).
- After `executeRunProfileAction` completes, `RunRunProfileButton` calls `onExecutionComplete` and the parent row renders a **Last run just now** panel below the action buttons.
- Panel shows: status badge (success / failed / blocked / timed_out / disabled), exit code when present, message, and scrollable stdout/stderr previews (max height ~7rem).
- Confirmation dialog, toasts, copy buttons, and clipboard preview sections are unchanged.
- Dialog still shows the inline result while open; closing the dialog clears dialog-local state only.

## Schema changed

No.

## Files changed

- `src/components/projects/run-profile-execution-result-panel.tsx` — shared result display (new)
- `src/components/projects/run-run-profile-button.tsx` — `onExecutionComplete` callback; uses shared panel in dialog
- `src/components/projects/project-run-profiles-card.tsx` — per-row last-run state and card panel
- `RESULT.md`

## Test / lint / typecheck status

- `pnpm test`: Pass (278 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass

## Known limitations

- Last result is session-only; lost on refresh or navigation away
- Timestamp is static (“Last run just now”), not a live relative clock
- Long-running dev-server commands still blocked until Phase 3
- No stop/restart or live logs

## Recommended next step

**Phase 3:** Process manager with long-running command support, live logs, stop/restart, and optional persisted run history.
