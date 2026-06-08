# Work Progress Snapshot (Phase 5A)

**Status:** Implemented (Phase 5A MVP)  
**Scope:** Manual Git snapshot capture on Project Detail

## Overview

Projects with a configured `localPath` can capture a **Work Progress** snapshot from the local Git repository. Each snapshot records branch, latest commit metadata, working tree status, and changed files.

Supports dogfooding: register ManDev as a project whose `localPath` points at this repository.

## User flow

1. Open **Project Detail**.
2. In the **Work progress** card, click **Capture progress**.
3. ManDev runs read-only Git commands against the project `localPath` and stores a `WorkProgress` row.
4. Recent snapshots appear in the card (newest first, up to 10).

## Git capture

| Data | Git command |
|------|-------------|
| Branch | `git rev-parse --abbrev-ref HEAD` |
| Commit hash | `git rev-parse --short HEAD` |
| Commit message | `git log -1 --pretty=format:%s` |
| Commit author | `git log -1 --pretty=format:%an` |
| Commit date | `git log -1 --pretty=format:%cI` |
| Status / changed files | `git status --short` |

Changed files are parsed into `{ status, path }` items and stored as JSON in `changedFilesJson`.

## Data model

`WorkProgress` belongs to `Project` (cascade delete). Fields: branch, commit metadata, `changedFilesJson`, `changedFilesCount`, `gitStatusText`, auto-generated `summary`, optional `note`.

## Implementation map

| Path | Role |
|------|------|
| `src/lib/git-work-progress-capture.ts` | Git commands + status parsing |
| `src/services/work-progress.ts` | Persist/list snapshots, DTO mapping |
| `src/app/projects/work-progress/actions.ts` | `captureWorkProgressAction` |
| `src/components/projects/project-work-progress-card.tsx` | Project Detail card |
| `src/components/projects/capture-work-progress-button.tsx` | Capture button + toasts |

## Not included (Phase 5A)

- Background agent, Cursor extension, file watcher
- Notion integration, SSE/WebSocket, AI summary
- Auto-run tests

## Known limitations

- Requires valid `localPath` pointing at a Git repository on the ManDev host
- Read-only Git inspection only; no push/pull/commit from ManDev
- Snapshots are manual; no scheduled or automatic capture
- Recent list capped at 10 entries on Project Detail
