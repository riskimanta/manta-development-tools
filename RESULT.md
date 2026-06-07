# ManDev — Run Profiles Phase 4A (Refresh recent runs)

## Status

**Phase 4A polish shipped:** compact “Refresh recent runs” control on each Run Profile card’s Recent Runs section.

| Slice | Delivered |
|-------|-----------|
| 4A | Manual refresh via `router.refresh()` — no SSE, polling, or schema changes |

## What changed

- **`RefreshRecentRunsButton`** — tiny client component calls Next.js `router.refresh()` with a pending spinner state.
- **`RunProfileRecentRuns`** — header row shows the refresh control beside “Recent runs”; works with empty history.

## Validation

| Check | Result |
|-------|--------|
| `pnpm test` | Pass — 387 tests |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

### Expected behavior

- Click **Refresh recent runs** on a profile row → server-rendered recent run history reloads without full browser reload.
- Empty “No run history yet.” state still shows the refresh control.
- Managed Start/Stop/Restart and Phase 2A short execution unchanged.

## Documentation

- **`docs/features/run-profiles-phase-3.md`** — Phase 4A notes added; Phase 3 limitations updated.

## Schema / migration

None.
