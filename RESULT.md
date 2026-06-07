# ManDev — Run Profiles Phase 3C UI (recent run history)

## What changed

**`src/services/run-profiles.ts`** — Added `listRunProfilesWithRecentRunsByProjectId` to load each profile with up to 3 serializable `RunProfileRunRecord` entries.

**`src/app/(app)/projects/[id]/page.tsx`** — Project Detail now uses the new loader for Run Profiles card data.

**`src/components/projects/project-run-profiles-card.tsx`** — Extended profile shape with optional `recentRuns`; renders a compact history section per profile row.

**`src/components/projects/run-profile-recent-runs.tsx`** — Presentational “Recent runs” list (status, PID, times, duration, exit/signal, stdout/stderr previews) with empty state.

**`src/lib/run-profile-run-history-ui.ts`** — Formatting helpers for run history display (duration, timestamps, exit summary, status labels).

**Tests** — `run-profile-run-history-ui.test.ts`; `listRunProfilesWithRecentRunsByProjectId` cases in `run-profiles.test.ts`.

**`docs/features/run-profiles-phase-3.md`** — Phase 3C UI section and checklist updates.

## Schema / migration

None. Uses existing `ProjectRunProfileRun` table.

## Known limitations

- History is loaded on page render; refresh/reload required to see newly completed runs (no SSE/live updates).
- Live managed process state remains in-memory only.
- Orphaned `running` history rows may persist after server restart mid-run.
- Phase 2A short command execution unchanged; history reflects managed runs only.

## Test / lint / typecheck status

- `pnpm test`: Pass (380 tests)
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass
