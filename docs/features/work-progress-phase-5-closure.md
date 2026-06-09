# Work Progress — Phase 5 Closure (5A–5L)

**Status:** Phase 5 complete (5A through 5L)  
**Scope:** Documentation milestone closing the Work Progress feature set delivered in Phase 5. No new runtime capability.

## Phase 5 milestone summary

Phase 5 delivered a full Work Progress workflow from capture through AI summary and UX polish:

```
Capture / CLI / Watch
→ Project Dashboard Summary
→ Sessions List
→ Search & Filter
→ Session Detail
→ Copy AI Prompt
→ Save AI Summary
→ Summary Preview
→ UX Polish
```

| Phase | Deliverable | PR | Merge commit |
|-------|-------------|-----|--------------|
| 5A | Manual capture from Project Detail | #13 | `6e99823` |
| 5B | Local CLI via `mandev track` | #14 | `4d05c91` |
| 5C | Polling watch mode via `mandev track --watch` | #15 | `2006dcf` |
| 5D | Derived sessions page | #16 | `86ae225` |
| 5E | Session detail (summary, changed files, timeline) | #17 | `fd0acf7` |
| 5F | Copy AI summary prompt | #18 | `2e591be` |
| 5G | Save/edit AI-generated summaries manually | #19 | `c156b76` |
| 5H | Summary preview on sessions list | #20 | `04dee4c` |
| 5I | Project Detail dashboard summary | #21 | `6a668f9` |
| 5J | Server-rendered sessions search/filter | #22 | `eafdfe9` |
| 5K | UX polish, guidance, empty states, navigation | #23 | `20327f7` |
| 5L | Closure docs / release summary | — | — |

Implementation details and path map: [work-progress-snapshot.md](./work-progress-snapshot.md).

## Current capabilities

ManDev Work Progress today supports:

- **Manual progress capture** from Project Detail (`Capture progress` button)
- **Local CLI capture** with `mandev track`
- **Polling watch mode** with `mandev track --watch`
- **Token-protected local agent endpoint** (`POST /api/work-progress/capture`)
- **Derived work sessions** grouped from snapshots (branch change or 90-minute gap starts a new session)
- **Session list page** at `/projects/[id]/work-progress`
- **Session detail page** at `/projects/[id]/work-progress/sessions/[sessionId]`
- **Changed files aggregation** across snapshots in a session
- **Snapshot timeline** on session detail
- **AI summary prompt copy** (structured Markdown built from session data)
- **Manual saved AI summaries** (paste and save on session detail)
- **Saved summary previews** on sessions list and Project Detail dashboard
- **Dashboard summary** on Project Detail (counts, last activity, latest session, latest summary preview)
- **Search and filter** by text, branch, clean/dirty, summary state (`has` / `none`), and date range
- **Consistent empty states and usage guidance** (How to use Work Progress, terminal hints, derived-session messaging)

## Usage guide

### App setup

```bash
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Requirements:

- ManDev must be running locally for UI capture and CLI/agent capture
- Projects must be registered with a valid `localPath` pointing at a Git repository on the ManDev host
- `MANDEV_AGENT_TOKEN` must be configured locally for CLI/watch (never commit tokens)

### Manual capture (UI)

1. Open **Project Detail** for a project with `localPath` set.
2. In the **Work progress** card, click **Capture progress**.
3. Review recent snapshots and the dashboard summary in the same card.
4. Click **View all work progress** for the full sessions list.

### CLI capture

Set the agent token in the terminal (and in ManDev server env, e.g. `.env.local`):

```bash
MANDEV_AGENT_TOKEN=dev-local-token node ./bin/mandev.mjs track
```

Optional note:

```bash
MANDEV_AGENT_TOKEN=dev-local-token node ./bin/mandev.mjs track --note "Working on login redirect fix"
```

From the registered project directory, ManDev matches the longest registered `localPath`, captures Git state, and stores a `WorkProgress` row.

### Watch mode

Polling-based capture while you work:

```bash
MANDEV_AGENT_TOKEN=dev-local-token node ./bin/mandev.mjs track --watch --interval 30
```

- Performs an immediate capture on start
- Polls every `--interval` seconds (default `300`, minimum `30`)
- Sends `dedupe: true` to skip unchanged snapshots
- Observes Git-visible state only (no filesystem watcher)
- Handles Ctrl+C gracefully

### Sessions, search, and detail

1. Open `/projects/[id]/work-progress`.
2. Use search/filter when the list grows (URL params: `q`, `branch`, `status`, `summary`, `from`, `to`).
3. Click **View details** on a session card.
4. Review session summary, aggregated changed files, and snapshot timeline.

## AI workflow

ManDev does **not** call an AI API. No AI API key is required. Summary generation is manual.

1. Open **session detail** for a derived session.
2. Click **Copy AI summary prompt**.
3. Paste the prompt into Cursor, Claude, ChatGPT, or another AI assistant.
4. Copy the generated summary from your AI tool.
5. Paste it into the **AI Summary** textarea on the session detail page.
6. Click **Save summary**.
7. The **summary preview** appears on the sessions list and on the Project Detail dashboard summary.

Full editing remains on the session detail page. The sessions list shows a short preview only.

## Data model overview

| Model | Role |
|-------|------|
| `WorkProgress` | Stores Git snapshot data per capture (branch, commit metadata, changed files JSON, status text, optional note) |
| `WorkProgressSessionSummary` | Stores manually saved AI summary text keyed by `projectId` + derived `sessionId` (unique) |

Important notes:

- **Sessions are derived** from `WorkProgress` snapshots at read time; there is no persisted `WorkSession` table yet.
- Session grouping rules: new session when branch changes or gap between snapshots exceeds 90 minutes.
- **Derived session IDs may change** if future snapshots extend or regroup a session; saved summaries attach to the current derived ID.

## Operational notes

After Prisma schema or migration changes (learned in Phase 5G):

```bash
pnpm db:generate
pnpm db:migrate
```

Then restart the dev server:

```bash
pnpm dev
```

Reason: the cached dev Prisma Client may not pick up new delegates until regenerated and the dev server is restarted.

Agent token setup:

- Set `MANDEV_AGENT_TOKEN` in ManDev server environment (e.g. `.env.local`)
- Export the same value in the terminal running `mandev track` or watch mode
- Do not commit tokens to the repository

## Known limitations

- No AI API integration; no automatic AI-generated summary inside ManDev
- No global Work Progress search across projects
- No export feature (Markdown, clipboard, or PDF)
- No saved filters on the sessions page
- No persisted `WorkSession` table; sessions are derived from snapshots
- Saved summaries attach to derived session IDs; IDs may change if snapshots extend/regroup sessions
- Watch mode is polling-based only; no background daemon or filesystem watcher
- Watch mode observes Git-visible state only
- ManDev must be running locally for CLI capture and the agent endpoint
- `MANDEV_AGENT_TOKEN` is required for the local agent endpoint
- Sessions list search/filter is in-memory over derived sessions; no full-text index
- Recent snapshots on Project Detail are capped at 10 entries
- Read-only Git inspection; no push/pull/commit from ManDev

## Recommended Phase 6 roadmap

Proposed follow-ups (not implemented):

### Phase 6A — Export Work Progress Report

- Export session, detail, or dashboard summary to Markdown
- Consider clipboard export first
- No PDF in initial scope

### Phase 6B — Global Work Progress Search

- Search across all projects
- Filter by project, branch, summary state, date range

### Phase 6C — Saved Filters

- Save reusable filters on the Work Progress sessions page

### Phase 6D — Persisted Work Sessions

- Introduce an explicit `WorkSession` table with stable session IDs
- Optional start/stop command for session boundaries

### Phase 6E — AI API Integration

- Optional in-app AI-generated summaries
- Require explicit user-provided API key
- Keep manual prompt copy flow as fallback

### Phase 6F — Work Progress Export / Report Pack

- Export a project-level progress report for sharing or archival
