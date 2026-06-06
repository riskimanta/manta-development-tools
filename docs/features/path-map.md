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
