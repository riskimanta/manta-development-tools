# Work Progress Snapshot (Phase 5A + 5B + 5C + 5D + 5E + 5F + 5G)

**Status:** Implemented (Phase 5A UI + Phase 5B CLI + Phase 5C watch mode + Phase 5D session view + Phase 5E session detail + Phase 5F AI summary prompt + Phase 5G saved AI summary)  
**Scope:** Manual Git snapshot capture on Project Detail, local CLI, polling watch mode, derived session view, session detail page, copyable AI summary prompt, and manual saved AI summaries

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

### Watch mode (Phase 5C)

Polling-based session tracking from the CLI:

```bash
mandev track --watch
mandev track --watch --interval 60
```

Behavior:

- Performs an immediate capture attempt on start
- Polls every `--interval` seconds (default `300`, minimum `30`)
- Sends `dedupe: true` to skip unchanged snapshots
- Handles Ctrl+C gracefully

### Session view (Phase 5D)

1. Open **Project Detail** and click **View all work progress**, or go to `/projects/[id]/work-progress`.
2. ManDev groups existing `WorkProgress` snapshots into derived sessions.
3. A new session starts when branch changes or the gap between snapshots exceeds 90 minutes.
4. Each session card shows branch, duration, snapshot count, latest commit, changed files, and clean/dirty status.

### Session detail (Phase 5E)

1. From `/projects/[id]/work-progress`, click **View details** on a session card.
2. Open `/projects/[id]/work-progress/sessions/[sessionId]`.
3. The detail page shows session summary, aggregated changed files, and a snapshot timeline.
4. Sessions remain derived from snapshots; detail links may change if future snapshots extend or regroup a session.

### AI summary prompt (Phase 5F)

1. Open a session detail page at `/projects/[id]/work-progress/sessions/[sessionId]`.
2. Click **Copy AI summary prompt** near the session summary card.
3. ManDev builds a structured Markdown prompt from project and session data and copies it to the clipboard.
4. Paste the prompt into Cursor, Claude, ChatGPT, or another AI assistant to generate a summary manually.

ManDev does **not** call any AI API. Summary generation remains manual by pasting the copied prompt into your AI tool of choice.

### Saved AI summary (Phase 5G)

1. Open a session detail page at `/projects/[id]/work-progress/sessions/[sessionId]`.
2. Click **Copy AI summary prompt** and generate a summary in Cursor, Claude, ChatGPT, or another AI tool.
3. Paste the generated summary into the **AI Summary** textarea on the same page.
4. Click **Save summary** to persist it in ManDev.

Saved summaries are stored in `WorkProgressSessionSummary` keyed by `projectId` + derived `sessionId`, with snapshot metadata for reference. ManDev still does **not** call any AI API.

Known limitation: sessions remain derived from snapshots, so a saved summary is attached to the current derived session ID. That ID may change if future snapshots extend or regroup the session.

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

`WorkProgressSessionSummary` stores manually saved AI summary text per derived session (`projectId` + `sessionId` unique). Optional metadata: `firstSnapshotId`, `latestSnapshotId`, `branch`, `sessionStartedAt`, `sessionEndedAt`.

## Implementation map

| Path | Role |
|------|------|
| `src/lib/git-work-progress-capture.ts` | Git commands + status parsing |
| `src/lib/project-local-path-match.ts` | cwd-to-project `localPath` matching |
| `src/lib/mandev-agent-auth.ts` | `MANDEV_AGENT_TOKEN` verification |
| `src/lib/work-progress-dedupe.ts` | Duplicate snapshot comparison |
| `src/lib/work-progress-session.ts` | Derived session grouping |
| `src/lib/work-progress-session-ui.ts` | Session duration/timestamp formatting |
| `src/lib/work-progress-ai-summary-prompt.ts` | Structured AI summary prompt builder |
| `src/services/work-progress.ts` | Persist/list snapshots, cwd capture, sessions |
| `src/services/work-progress-session-summaries.ts` | Saved session summary get/upsert and detail page data |
| `src/lib/validations/work-progress-session-summary.ts` | Summary save validation |
| `src/app/projects/work-progress/session-summaries/actions.ts` | `saveWorkProgressSessionSummaryAction` |
| `src/app/(app)/projects/[id]/work-progress/page.tsx` | Work Progress sessions page |
| `src/app/(app)/projects/[id]/work-progress/sessions/[sessionId]/page.tsx` | Session detail page |
| `src/app/projects/work-progress/actions.ts` | `captureWorkProgressAction` |
| `src/app/api/work-progress/capture/route.ts` | Agent API for CLI capture |
| `bin/mandev.mjs` | `mandev track` CLI |
| `src/components/projects/project-work-progress-card.tsx` | Project Detail card |
| `src/components/projects/capture-work-progress-button.tsx` | Capture button + toasts |
| `src/components/projects/work-progress-terminal-hint.tsx` | Terminal usage hint |
| `src/components/projects/work-progress-session-list.tsx` | Session cards on sessions page |
| `src/components/projects/work-progress-session-detail.tsx` | Session detail summary and timeline |
| `src/components/projects/work-progress-ai-summary-prompt-actions.tsx` | Copy AI summary prompt button |
| `src/components/projects/work-progress-session-summary-form.tsx` | AI Summary save/edit form |

## Agent API

`POST /api/work-progress/capture`

- Auth: `Authorization: Bearer <MANDEV_AGENT_TOKEN>`
- Body: `{ cwd: string; note?: string; dedupe?: boolean }`
- When `dedupe: true`, unchanged Git state returns `created: false`, `skipped: true`, `reason: "UNCHANGED"`
- Rejects unregistered cwd paths and unauthenticated requests
- Middleware bypasses session cookie for this route; the route enforces the agent token

## Not included

- Background agent daemon, Cursor extension, file watcher
- Notion integration, SSE/WebSocket, automatic AI summary API, OpenAI/Claude API integration
- Auto-run tests
- Remote cloud sync

## Known limitations

- Requires valid `localPath` pointing at a Git repository on the ManDev host
- Read-only Git inspection only; no push/pull/commit from ManDev
- Snapshots are manual; no scheduled or automatic capture
- Recent list capped at 10 entries on Project Detail
- CLI requires ManDev app running locally and `MANDEV_AGENT_TOKEN` configured
- Watch mode is polling-based only; no native filesystem watcher or background daemon
- Sessions are derived from snapshots; no dedicated `WorkSession` table yet
- Derived session detail links may change if future snapshots extend or regroup a session
- No automatic AI-generated session summary; users copy a prompt, generate externally, and paste the result back into ManDev manually
- Saved summaries are attached to derived session IDs and may become orphaned if future snapshots extend or regroup the session
