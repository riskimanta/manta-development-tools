# ManDev — Run Profiles Phase 4B (View all runs)

## Status

**Phase 4B merged to `main`.** PR #10 merged cleanly; feature and docs branches cleaned up.

| Item | Value |
|------|--------|
| Phase | 4B — View all runs page |
| PR | [#10](https://github.com/riskimanta/manta-development-tools/pull/10) — **MERGED** |
| Merge commit | `2884d40e1426e399d10b2e4c506689117b941b75` |
| Feature commit | `5bb1a601eb8299dad4f79b8e31fc5e8cb6f79d02` |
| Branch cleanup | Local `feat/run-profiles-view-all-runs` — not present; remote — deleted by GitHub on merge |

## Delivered

- “View all runs” link beside each Run Profile Recent Runs section
- History page: `/projects/[id]/run-profiles/[runProfileId]/runs`
- Shared `RunProfileRunList` for Recent Runs and full history view
- `getRunProfileRunHistoryPageData` with project ownership validation
- `RUN_PROFILE_ALL_RUNS_PAGE_LIMIT = 25`

## Validation

| Check | Result |
|-------|--------|
| `pnpm test` | Pass — 391 tests |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

## Notes

- No DB schema changes
- No migration
- No SSE/WebSocket
- Managed Start/Stop/Restart unchanged
- Phase 2A short command execution unchanged

## Git status

```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```
