# Dashboard hub (projects & features)

## Scope

- Dashboard home with aggregates and recent activity.
- CRUD for **Project** and **Feature** via Server Actions.
- SQLite dev DB; Prisma schema in `prisma/schema.prisma`.

## User-visible behavior

- **⌘K / Ctrl+K** command palette (plus header search on larger screens) for quick navigation.
- Optional **password gate** (`MANDEV_PASSWORD` + `MANDEV_AUTH_SECRET`): `/login`, JWT cookie, `/logout`, collapsible desktop sidebar with **Sign out**.
- Projects: name, slug, description, optional repo URL and local path.
- Features: title, description, status (`draft` | `ready` | `in_progress` | `done`), optional priority, belongs to one project.
- Deleting a project cascades features.

## Implementation notes

- Server Actions: `src/app/projects/actions.ts`, `src/app/features/actions.ts`.
- Services: `src/services/projects.ts`, `src/services/features.ts`, `src/services/dashboard.ts`.

When changing validation, status values, or cascade rules, update this doc and `path-map.md` if paths shift.
