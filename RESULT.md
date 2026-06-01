# ManDev — current state

## Current project summary

ManDev (`manta-development-tools`) is a local Next.js control-plane dashboard for projects, features, backlog, and per-project architecture diagrams stored in SQLite via Prisma. Optional JWT session auth protects the app when `MANDEV_PASSWORD` is set.

## UX problem solved

The Backlog page split ManDev vs other project work, but **New feature** always opened a generic create form. Users in the ManDev section (or a specific project group) had to pick the project again on `/features/new`.

## Files changed

- `src/lib/feature-new-href.ts` — URL builder and safe project preselection resolver
- `src/lib/feature-new-href.test.ts` — unit tests
- `src/app/(app)/features/new/page.tsx` — validate `?projectId=` against known projects
- `src/app/(app)/backlog/page.tsx` — section-level create links for ManDev and other projects
- `RESULT.md` — this report

## Feature implemented

- **`/features/new?projectId=<id>`** — Project select defaults to that project when the id exists; user can still change it.
- **Invalid/unknown `projectId`** — Ignored; form behaves like `/features/new` (first project default).
- **Backlog → ManDev** — **New ManDev backlog item** (outline) when a project with slug `mandev` exists; links to preselected create URL.
- **Backlog → other projects** — **New item for this project** per project group.
- **Top-level New feature** — Unchanged at `/features/new`.
- **No `mandev` project** — Existing amber callout unchanged.

## How project preselection works

1. `buildFeatureNewHref({ projectId })` builds `/features/new?projectId=…`.
2. On the new-feature page, `resolveDefaultFeatureProjectId(requestedId, projectIds)` returns the id only if it is in `listProjects()`; otherwise `undefined`.
3. `FeatureCreateForm` uses `defaultValue={defaultProjectId ?? projects[0]?.id}` on the Project `<select>`.

## Whether schema changed

No. Backlog still uses the existing `Feature` model.

## Test / lint / typecheck status

| Check | Status |
|-------|--------|
| `pnpm test` | 188 passed (27 files) |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

## Known limitations

- Preselection is query-param only (no session memory).
- ManDev section header + create link appear when the `mandev` project exists and the backlog list is non-empty; an empty global backlog still uses the generic empty-state actions.
- Project detail pages still inline `/features/new?projectId=` strings (could share `buildFeatureNewHref` later).

## Recommended next step

Manually verify: open `/backlog` with a `mandev` project, use **New ManDev backlog item**, confirm Project is preselected; try `/features/new?projectId=invalid` and confirm fallback; use **New item for this project** on another group.
