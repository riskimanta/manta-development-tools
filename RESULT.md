# ManDev — Run Profiles Phase 4B (View all runs)

## Status

**Phase 4B shipped:** “View all runs” link and dedicated run history page per Run Profile.

| Slice | Delivered |
|-------|-----------|
| 4A | Manual refresh via `router.refresh()` |
| 4B | View all runs page — up to 25 persisted runs per profile |

## What changed

- **`RunProfileRecentRuns`** — compact “View all runs” link beside Recent Runs heading.
- **`RunProfileRunList`** — shared list items for Recent Runs and the history page.
- **`getRunProfileRunHistoryPageData`** — service helper validates project ownership and loads serializable run records.
- **`/projects/[id]/run-profiles/[runProfileId]/runs`** — simple server page with profile metadata and full run list (newest first).
- **`RUN_PROFILE_ALL_RUNS_PAGE_LIMIT`** — default cap of 25 runs for list helpers and the history page.

## Validation

| Check | Result |
|-------|--------|
| `pnpm test` | Pass — 391 tests |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

### Expected behavior

- Each Run Profile card shows **View all runs** next to Recent runs.
- History page shows profile name, command, working directory, and up to 25 runs with status, PID, timestamps, duration, exit/signal, and stdout/stderr previews.
- Empty state: “No run history yet.”
- Managed Start/Stop/Restart and Phase 2A short execution unchanged.

## Documentation

- **`docs/features/run-profiles-phase-3.md`** — Phase 4B notes added; limitations updated.

## Schema / migration

None.
