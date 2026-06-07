# ManDev — Run history persistence fix (merged)

## Fix status

**Merged to `main`.** Managed run history now persists after boot recovery/HMR marks an in-flight row stale.

## PR

| Item | Value |
|------|--------|
| PR | [#11](https://github.com/riskimanta/manta-development-tools/pull/11) — **MERGED** |
| Title | fix: persist managed run history after stale rows |
| Merge commit | `9bfee948bdf1fea85a2e5e4d33b360f546c3ad54` |
| Fix commit | `39afb75b784ed05bbe1eb01d2c352c2365ea6e0a` |

## What shipped

- Match open run rows by active statuses, not `endedAt: null`
- Skip boot stale recovery for profiles with active managed process snapshots
- Create finalized history row from terminal snapshot when no open row exists

## Cleanup

| Item | Result |
|------|--------|
| Local branch `fix/run-profiles-managed-run-history-persistence` | Deleted |
| Remote branch `fix/run-profiles-managed-run-history-persistence` | Deleted |

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
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```
