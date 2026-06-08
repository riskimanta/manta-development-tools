# Phase 5A — Work Progress Snapshot

## Summary
Manual Git snapshot capture on Project Detail. Click **Capture progress** to inspect the project `localPath` repository and store branch, commit metadata, working tree status, and changed files as a `WorkProgress` entry.

## Branch
`feat/work-progress-snapshot`

## Commits
- `e844d24` — feat: add work progress snapshot capture
- `<pending>` — docs: update work progress snapshot result

## Changed files

### Prisma / migration
- `prisma/schema.prisma` — `WorkProgress` model + `Project.workProgressEntries`
- `prisma/migrations/20260607120752_add_work_progress/migration.sql`

### Git capture helper
- `src/lib/git-work-progress-capture.ts` — Git commands + status parsing
- `src/lib/git-work-progress-capture.test.ts`

### Service layer
- `src/services/work-progress.ts` — capture/list + serializable DTOs
- `src/services/work-progress.test.ts`

### Server Action
- `src/app/projects/work-progress/actions.ts` — `captureWorkProgressAction`

### UI components
- `src/components/projects/capture-work-progress-button.tsx`
- `src/components/projects/work-progress-list.tsx`
- `src/components/projects/project-work-progress-card.tsx`

### Project Detail integration
- `src/app/(app)/projects/[id]/page.tsx` — Work progress card on Project Detail

### Tests
- `src/lib/git-work-progress-capture.test.ts`
- `src/services/work-progress.test.ts`

### Docs
- `docs/features/work-progress-snapshot.md`
- `docs/features/index.md`
- `docs/features/path-map.md`

## Validation
| Check | Result |
|-------|--------|
| `pnpm test` | Pass — 417 tests |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |
| `pnpm db:migrate` | Applied `add_work_progress` |

## PR
- URL: `<pending>`
- Status: `<pending>`

## Git status
`<pending>`

## Known limitations
- Manual capture only; no background agent, file watcher, or Notion/AI integration
- Requires `localPath` pointing at a Git repo on the ManDev host
- Read-only Git inspection; no commit/push from ManDev
- Recent snapshots capped at 10 on Project Detail
- Optional `note` field supported in action but not exposed in MVP UI

## Manual verification checklist
- Not performed yet
- Recommended manual check:
  1. Open ManDev Project Detail for the ManDev project itself
  2. Ensure `localPath` points to the ManDev repo
  3. Click **Capture progress**
  4. Confirm a new snapshot appears with branch, latest commit, and changed files count
