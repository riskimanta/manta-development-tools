# Work Progress Snapshot (Phase 5A + 5B + 5C + 5D + 5E + 5F + 5G + 5H + 5I + 5J + 5K)

**Status:** Implemented (Phase 5A UI + Phase 5B CLI + Phase 5C watch mode + Phase 5D session view + Phase 5E session detail + Phase 5F AI summary prompt + Phase 5G saved AI summary + Phase 5H sessions list summary preview + Phase 5I Project Detail dashboard summary + Phase 5J sessions list search/filter + Phase 5K stabilization and UX polish)  
**Scope:** Manual Git snapshot capture on Project Detail, local CLI, polling watch mode, derived session view, session detail page, copyable AI summary prompt, manual saved AI summaries, saved summary previews on the sessions list, a compact Work Progress dashboard summary on Project Detail, server-rendered search/filter on the Work Progress sessions page, and UX polish for guidance, empty states, and derived-session messaging

## Overview

Projects with a configured `localPath` can capture a **Work Progress** snapshot from the local Git repository. Each snapshot records branch, latest commit metadata, working tree status, and changed files.

Supports dogfooding: register ManDev as a project whose `localPath` points at this repository.

## End-to-end usage flow

```
Capture / CLI / Watch
→ Project dashboard summary
→ Sessions list
→ Search & filter
→ Session detail
→ Copy AI prompt
→ Save AI summary
→ Summary preview
```

1. **Capture** from Project Detail, **`mandev track`**, or **`mandev track --watch`** while developing.
2. Review the **Project Detail** Work Progress dashboard summary.
3. Open **View all work progress** for the derived **sessions list**.
4. **Search and filter** sessions when the list grows.
5. Open **session detail**, **copy the AI summary prompt**, generate a summary externally, and **save** it back to ManDev.
6. See the **summary preview** on the sessions list and Project Detail dashboard.

## Operational notes

After Prisma schema or migration changes:

```bash
pnpm db:generate
pnpm db:migrate
```

Restart the dev server:

```bash
pnpm dev
```

## User flow

### Project Detail (Phase 5A)

1. Open **Project Detail**.
2. In the **Work progress** card, click **Capture progress**.
3. ManDev runs read-only Git commands against the project `localPath` and stores a `WorkProgress` row.
4. Recent snapshots appear in the card (newest first, up to 10).
5. A compact **Summary** section shows last activity, snapshot/session counts, sessions with saved summaries, the latest derived session, and the latest saved AI summary preview when available.

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

### Saved AI summary preview (Phase 5H)

1. Open `/projects/[id]/work-progress`.
2. Each session card shows whether a saved AI summary exists.
3. When present, the card displays an **AI Summary** label, a short preview of the saved text, and the last updated timestamp.
4. When missing, the card shows **No saved AI summary yet.**

Summaries are still saved manually from the session detail page. ManDev does **not** call any AI API. Full summary editing remains on `/projects/[id]/work-progress/sessions/[sessionId]`.

### Project Detail dashboard summary (Phase 5I)

1. Open **Project Detail**.
2. The **Work progress** card shows a compact dashboard summary above **Recent snapshots**.
3. Summary fields include last activity, snapshot count, derived session count, sessions with saved summaries, latest session metadata, and the latest saved AI summary preview.
4. When no snapshots exist, the summary shows **No work progress captured yet.** Capture progress and terminal guidance remain available when `localPath` is set.

The dashboard summary is derived from existing `WorkProgress` snapshots and saved `WorkProgressSessionSummary` rows. ManDev does **not** call any AI API. Summaries are still saved manually from the session detail page.

### Sessions list search and filter (Phase 5J)

1. Open `/projects/[id]/work-progress`.
2. Use the server-rendered filter form above the session list.
3. Filter by search text, branch, clean/dirty status, saved summary state, and optional date range.
4. Filters are applied via URL query params (`q`, `branch`, `status`, `summary`, `from`, `to`) on GET submit.
5. The page shows `Showing X of Y sessions`, a no-match state when filters exclude all sessions, and **Clear filters** to reset.

Search matches branch, commit hash/message, changed file paths, saved summary text/preview, and snapshot commit messages (case-insensitive). Branch filter is exact match. Clean/dirty uses the existing derived session status helper. Summary filter supports `has` / `none`. Date range filters sessions whose `startedAt` falls within the selected UTC day range; invalid dates are ignored safely.

No new database migration. No AI API is called. Filtering applies to derived sessions in memory after grouping snapshots.

### Stabilization and UX polish (Phase 5K)

1. Project Detail and the sessions page show a compact **How to use Work Progress** guide.
2. Terminal hints include separate copy buttons for `mandev track` and `mandev track --watch`.
3. Empty states use consistent copy for missing snapshots, missing summaries, filter no-match, and clean working trees.
4. Session detail and the sessions page show subtle derived-session messaging: links may change if future snapshots regroup sessions.
5. Navigation links remain: Project Detail → **View all work progress**; sessions page → **Back to project**; session detail → **Back to work progress** / **Back to project**.

No new database migration. No AI API is called.

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
| `src/lib/work-progress-session-filter.ts` | Sessions list query parsing and in-memory filtering |
| `src/lib/work-progress-dashboard-summary.ts` | Project Detail dashboard summary builder |
| `src/lib/work-progress-session-ui.ts` | Session duration/timestamp formatting and dashboard/list summary labels |
| `src/lib/work-progress-session-summary-preview.ts` | Saved summary preview text helper |
| `src/lib/work-progress-ai-summary-prompt.ts` | Structured AI summary prompt builder |
| `src/services/work-progress.ts` | Persist/list snapshots, cwd capture, sessions, dashboard summary |
| `src/services/work-progress-session-summaries.ts` | Saved session summary get/list/upsert and detail page data |
| `src/lib/validations/work-progress-session-summary.ts` | Summary save validation |
| `src/app/projects/work-progress/session-summaries/actions.ts` | `saveWorkProgressSessionSummaryAction` |
| `src/app/(app)/projects/[id]/work-progress/page.tsx` | Work Progress sessions page |
| `src/app/(app)/projects/[id]/work-progress/sessions/[sessionId]/page.tsx` | Session detail page |
| `src/app/projects/work-progress/actions.ts` | `captureWorkProgressAction` |
| `src/app/api/work-progress/capture/route.ts` | Agent API for CLI capture |
| `bin/mandev.mjs` | `mandev track` CLI |
| `src/components/projects/project-work-progress-card.tsx` | Project Detail card with dashboard summary |
| `src/components/projects/capture-work-progress-button.tsx` | Capture button + toasts |
| `src/components/projects/work-progress-usage-guide.tsx` | Compact How to use Work Progress guide |
| `src/components/projects/work-progress-terminal-hint.tsx` | Terminal usage hint with per-command copy buttons |
| `src/components/projects/work-progress-session-list.tsx` | Session cards with saved summary preview on sessions page |
| `src/components/projects/work-progress-session-filters.tsx` | Server-rendered GET filter form on sessions page |
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
- Sessions list shows a short preview only; full summary editing remains on the session detail page
- Project Detail dashboard summary is derived from snapshots and saved summaries; no AI API is called
- Dashboard summary editing is not available on Project Detail; use the session detail page
- Sessions list search/filter is in-memory over derived sessions; no full-text search index or saved filters yet
- Date range filtering uses session `startedAt` within the selected UTC day range
