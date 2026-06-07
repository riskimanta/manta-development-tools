# ManDev — Run history persistence fix (PR open)

## Bug / fix summary

Completed managed runs did not appear in Recent Runs or View All Runs when boot recovery/HMR marked the in-flight row `stale` before spawn/finalize finished. Finalization only looked for rows with `endedAt: null`, so the completed process had no open DB row to update.

Fix:
- Match open run rows by active statuses (`starting` / `running` / `stopping`), not `endedAt: null`
- Skip boot stale recovery for profiles with active managed process snapshots
- Create a finalized history row from terminal snapshot when no open row exists

## Branch

`fix/run-profiles-managed-run-history-persistence`

## Commit

`39afb75b784ed05bbe1eb01d2c352c2365ea6e0a`

## PR

| Item | Value |
|------|--------|
| URL | https://github.com/riskimanta/manta-development-tools/pull/11 |
| Title | fix: persist managed run history after stale rows |
| State | OPEN |
| Mergeable | Yes — MERGEABLE, merge state CLEAN, no conflicts |

## Validation

| Check | Result |
|-------|--------|
| `pnpm test` | Pass — 395 tests |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

## Notes

- No DB schema changes
- No migration
- No SSE/WebSocket
- Managed Start/Stop/Restart UX unchanged
- Phase 2A short command execution unchanged

## Git status

```
On branch fix/run-profiles-managed-run-history-persistence
Your branch is up to date with 'origin/fix/run-profiles-managed-run-history-persistence'.
nothing to commit, working tree clean
```
