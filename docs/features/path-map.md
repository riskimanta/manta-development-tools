# Path map — implementation to feature docs

Use this file when assessing **feature-doc-impact** after code changes.

| Path prefix | Feature doc |
|-------------|-------------|
| `src/app/(app)/page.tsx`, `src/services/dashboard.ts` | [dashboard-hub.md](./dashboard-hub.md) |
| `src/components/layout/command-menu.tsx`, `src/config/nav.ts` (command palette) | [dashboard-hub.md](./dashboard-hub.md) |
| `middleware.ts`, `src/lib/mandev-session.ts`, `src/app/login/**`, `src/app/logout/route.ts` | [dashboard-hub.md](./dashboard-hub.md) |
| `src/app/(app)/projects/**`, `src/app/projects/actions.ts`, `src/services/projects.ts` | [dashboard-hub.md](./dashboard-hub.md) |
| `src/app/(app)/features/**`, `src/app/features/actions.ts`, `src/services/features.ts` | [dashboard-hub.md](./dashboard-hub.md) |
| `prisma/schema.prisma` | All data-backed features |
| `src/app/projects/run-profiles/**`, `src/services/run-profiles.ts`, `src/lib/run-profile-*.ts`, `src/components/projects/*run-profile*` | [run-profiles-phase-3.md](./run-profiles-phase-3.md) (Phase 3); Phase 2A behavior in code |
| `src/app/projects/work-progress/**`, `src/app/(app)/projects/[id]/work-progress/**`, `src/app/api/work-progress/**`, `src/services/work-progress.ts`, `src/lib/git-work-progress-capture.ts`, `src/lib/project-local-path-match.ts`, `src/lib/work-progress-dedupe.ts`, `src/lib/work-progress-session.ts`, `src/lib/work-progress-session-ui.ts`, `src/lib/mandev-agent-auth.ts`, `bin/mandev.mjs`, `src/components/projects/*work-progress*` | [work-progress-snapshot.md](./work-progress-snapshot.md) |
