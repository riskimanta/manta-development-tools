# Work Progress Snapshot (Phase 5A + 5B)

**Status:** Implemented (Phase 5A UI + Phase 5B CLI)  
**Scope:** Manual Git snapshot capture on Project Detail and via local CLI

## Overview

Projects with a configured `localPath` can capture a **Work Progress** snapshot from the local Git repository. Each snapshot records branch, latest commit metadata, working tree status, and changed files.

Supports dogfooding: register ManDev as a project whose `localPath` points at this repository.

## User flow

### Project Detail (Phase 5A)

1. Open **Project Detail**.
2. In the **Work progress** card, click **Capture progress**.
3. ManDev runs read-only Git commands against the project `localPath` and stores a `WorkProgress` row.
4. Recent snapshots appear in the card (newest first, up to 10).

### Local CLI (Phase 5B)

1. Ensure ManDev is running locally (`pnpm dev`).
2. Set `MANDEV_AGENT_TOKEN` in `.env.local` on the ManDev server and in the terminal running the CLI.
3. Register the project in ManDev with a valid `localPath`.
4. From the registered project folder, run:

```bash
mandev track
```

Optional:

```bash
mandev track --note "Working on login redirect fix"
pnpm mandev:track
node ./bin/mandev.mjs track
```

ManDev matches the current working directory to the longest registered `localPath`, captures Git state, and stores a `WorkProgress` entry.

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
| `src/lib/project-local-path-match.ts` | cwd-to-project `localPath` matching |
| `src/lib/mandev-agent-auth.ts` | `MANDEV_AGENT_TOKEN` verification |
| `src/services/work-progress.ts` | Persist/list snapshots, cwd capture |
| `src/app/projects/work-progress/actions.ts` | `captureWorkProgressAction` |
| `src/app/api/work-progress/capture/route.ts` | Agent API for CLI capture |
| `bin/mandev.mjs` | `mandev track` CLI |
| `src/components/projects/project-work-progress-card.tsx` | Project Detail card |
| `src/components/projects/capture-work-progress-button.tsx` | Capture button + toasts |
| `src/components/projects/work-progress-terminal-hint.tsx` | Terminal usage hint |

## Agent API

`POST /api/work-progress/capture`

- Auth: `Authorization: Bearer <MANDEV_AGENT_TOKEN>`
- Body: `{ cwd: string; note?: string }`
- Rejects unregistered cwd paths and unauthenticated requests
- Middleware bypasses session cookie for this route; the route enforces the agent token

## Not included

- Background agent daemon, Cursor extension, file watcher
- Notion integration, SSE/WebSocket, AI summary
- Auto-run tests
- Remote cloud sync

## Known limitations

- Requires valid `localPath` pointing at a Git repository on the ManDev host
- Read-only Git inspection only; no push/pull/commit from ManDev
- Snapshots are manual; no scheduled or automatic capture
- Recent list capped at 10 entries on Project Detail
- CLI requires ManDev app running locally and `MANDEV_AGENT_TOKEN` configured
