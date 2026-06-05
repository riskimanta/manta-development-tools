# ManDev — current state

## Bug fix: Run button not appearing

### Root cause

Phase 2A was documented in `RESULT.md` from a prior session, but **the implementation was never committed to `main`**. The wiring files did not exist on disk:

- `src/lib/mandev-command-execution.ts` — missing
- `src/lib/run-profile-execution.ts` — missing
- `src/components/projects/run-run-profile-button.tsx` — missing
- `src/app/(app)/projects/[id]/page.tsx` — did not pass `commandExecutionEnabled`
- `src/components/projects/project-run-profiles-card.tsx` — did not render Run buttons

Fixing `.env` alone could not help because the UI and server execution path were never present in the codebase.

### Fix applied

Restored the full Phase 2A implementation:

1. **Env helper** — `isCommandExecutionEnabled()` reads `process.env.MANDEV_ENABLE_COMMAND_EXECUTION === "true"` (strict string match).
2. **Project detail page** — server component calls the helper and passes `commandExecutionEnabled` to `ProjectRunProfilesCard`.
3. **Run profiles card** — shows amber experimental banner when enabled; shows disabled helper when off; renders `RunRunProfileButton` per profile when enabled.
4. **Execution stack** — `executeRunProfileCommand` (service) → `executeRunProfileAction` (server action) → `executeSavedRunProfileCommand` (spawn + validation).

### How env flag is read

```ts
// src/lib/mandev-command-execution.ts
process.env.MANDEV_ENABLE_COMMAND_EXECUTION === "true"
```

Read on the **server** at render time in `src/app/(app)/projects/[id]/page.tsx`. Next.js loads `.env` automatically; restart `pnpm dev` after changing `.env`. Inline prefix (`MANDEV_ENABLE_COMMAND_EXECUTION=true pnpm dev`) also works.

### Run button visibility

| `MANDEV_ENABLE_COMMAND_EXECUTION` | UI |
|---|---|
| unset / not exactly `true` | Run buttons hidden; dashed helper text shown |
| `true` | Amber banner + **Run** button on each profile card |

Run buttons never appear when the flag is disabled.

### Files changed

- `src/lib/mandev-command-execution.ts` — env flag helper (new)
- `src/lib/mandev-command-execution.test.ts` — helper tests (new)
- `src/lib/run-profile-execution.ts` — spawn, validation, timeout (new)
- `src/lib/run-profile-execution.test.ts` — execution tests (new)
- `src/services/run-profiles.ts` — `executeRunProfileCommand`
- `src/services/run-profiles.test.ts` — service tests
- `src/app/projects/run-profiles/actions.ts` — `executeRunProfileAction`
- `src/app/projects/run-profiles/actions.test.ts` — action tests
- `src/components/projects/run-run-profile-button.tsx` — Run button + confirmation (new)
- `src/components/projects/project-run-profiles-card.tsx` — conditional Run UI
- `src/app/(app)/projects/[id]/page.tsx` — passes `commandExecutionEnabled`
- `.env.example` — documents `MANDEV_ENABLE_COMMAND_EXECUTION`
- `README.md` — local-only warning
- `RESULT.md`

### Schema changed

No.

### Test / lint / typecheck status

- `pnpm test`: Pass (278 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass

### Manual verification steps

1. Ensure `.env` contains `MANDEV_ENABLE_COMMAND_EXECUTION=true` (one variable per line).
2. Restart dev server: `pnpm dev` (or `MANDEV_ENABLE_COMMAND_EXECUTION=true pnpm dev`).
3. Open a project with at least one run profile that has a working directory set.
4. Confirm amber “Local command execution is enabled” banner appears.
5. Confirm each profile card shows **Run** alongside copy buttons.
6. Click **Run** → confirmation dialog → run a short command (e.g. `echo hello`).
7. Remove or set flag to `false`, restart, confirm Run buttons are hidden and disabled helper text appears.

## Feature: Project Run Profiles — Phase 2A

Saved run profiles can be executed from the project detail UI when explicitly enabled. Copy, import, and preview behavior unchanged.

### Safety boundary

- Opt-in only via env flag
- Only saved `ProjectRunProfile` records (by ID from DB)
- Confirmation dialog required
- Blocks empty command, missing/invalid cwd, long-running patterns
- 30s strict timeout for short commands
- No process manager or log streaming (Phase 3)

### Known limitations

- Long-running dev-server commands blocked until Phase 3
- No stop/restart for running processes
- Execution runs on the ManDev server host

### Recommended next step

**Phase 3:** Process manager with long-running command support, live logs, and stop/restart.
