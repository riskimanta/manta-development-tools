# ManDev — Run Profiles Phase 4B (View all runs)

## Status

**Phase 4B shipped:** “View all runs” link and dedicated run history page per Run Profile. PR opened on GitHub.

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

## Git workflow

| Item | Value |
|------|--------|
| **Current branch** | `feat/run-profiles-view-all-runs` |
| **Commit hash** | `5bb1a601eb8299dad4f79b8e31fc5e8cb6f79d02` |
| **Commit message** | `feat: add run profile run history page` |
| **Push result** | Pushed to `origin/feat/run-profiles-view-all-runs` (up to date) |
| **PR** | [#10](https://github.com/riskimanta/manta-development-tools/pull/10) — OPEN, mergeable, no conflicts (`mergeStateStatus: CLEAN`) |
| **Merge/cleanup** | Not merged yet; ready to merge when approved |

### Changed files (11)

- `RESULT.md`
- `docs/features/run-profiles-phase-3.md`
- `src/app/(app)/projects/[id]/run-profiles/[runProfileId]/runs/page.tsx`
- `src/components/projects/project-run-profiles-card.tsx`
- `src/components/projects/run-profile-recent-runs.tsx`
- `src/components/projects/run-profile-run-list.tsx`
- `src/lib/run-profile-run-history-ui.ts`
- `src/services/run-profile-run-history.test.ts`
- `src/services/run-profile-run-history.ts`
- `src/services/run-profiles.test.ts`
- `src/services/run-profiles.ts`

### Final git status

```
On branch feat/run-profiles-view-all-runs
Your branch is up to date with 'origin/feat/run-profiles-view-all-runs'.
nothing to commit, working tree clean
```
