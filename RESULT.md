# ManDev — Run Profiles Phase 3 (complete)

## Status

**Run Profiles Phase 3 is DONE.** Slices 3A–3D shipped and verified.

| Slice | Delivered |
|-------|-----------|
| 3A | Managed Start/Stop/Restart, status/log polling, last run result UI |
| 3B | Safe stop process group (macOS/Linux), stale app/server restart notice, stale notice copy fix |
| 3C | Persistent `ProjectRunProfileRun` history, Recent Runs UI |
| 3D | Stale run-history recovery on boot (`starting` / `running` / `stopping` → `stale`) |

## Validation

| Check | Result |
|-------|--------|
| `pnpm test` | Pass — 387 tests |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

### Verified manually

- Safe stop process group killed shell + child process
- Stale app restart notice after dev server restart
- Stale notice copy no longer showed misleading “Process is running.”
- Run history persisted to SQLite; completed runs finalized
- Recent Runs UI showed persisted history after refresh
- Active stale recovery marked orphaned rows `STALE`, not `STARTING`
- Orphan test OS processes cleaned manually after restart tests

## Documentation

- **`docs/features/run-profiles-phase-3.md`** — Phase 3 completion checkpoint added; status set to DONE; checklists and limitations updated.

## Known limitations (Phase 4 candidates)

- Recent Runs requires page refresh; no SSE/WebSocket
- Live process state remains in-memory only
- Orphan OS processes may survive app restart; manual cleanup may be needed
- No full run detail page; previews only in DB
- Phase 2A short command execution remains separate from managed run history

## Schema / migration

None in this checkpoint. Uses existing `ProjectRunProfileRun` model from Phase 3C.
