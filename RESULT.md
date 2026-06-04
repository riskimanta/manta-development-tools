# ManDev — current state

## Current project summary

ManDev (`manta-development-tools`) is a local Next.js control-plane dashboard for managing software projects, features, backlog, and per-project architecture diagrams. Data lives in SQLite via Prisma. Optional JWT session auth protects the app when `MANDEV_PASSWORD` is set.

## Feature implemented

**Project Run Profiles — Phase 1**

Each project can have multiple run profiles (name, command, working directory, description, default flag). Users manage profiles on Project Detail and copy commands into their own terminal. ManDev stores and copies only — it does not run processes.

## Phase 1 safety boundary

- **Copy-only:** UI offers “Copy command” and “Copy cd + command” via the clipboard API.
- **No execution:** No shell spawn, terminal UI, process management, stop/restart, or log streaming.

## Database / schema changes

New Prisma model `ProjectRunProfile`:

| Field | Notes |
|-------|--------|
| `id` | cuid |
| `projectId` | FK → `Project`, cascade delete |
| `name` | required |
| `command` | required |
| `workingDirectory` | optional; defaults from project `localPath` on create/update when empty |
| `description` | optional |
| `isDefault` | boolean; at most one `true` per project (enforced in service transactions) |
| `createdAt` / `updatedAt` | timestamps |

Migration: `prisma/migrations/20260602120000_add_project_run_profiles/`

## Files changed

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma`, migration SQL |
| Validation | `src/lib/validations/run-profile.ts`, `.test.ts` |
| Copy helper | `src/lib/run-profile-copy.ts`, `.test.ts` |
| Services | `src/services/run-profiles.ts`, `.test.ts` |
| Server Actions | `src/app/projects/run-profiles/actions.ts`, `.test.ts` |
| UI | `src/components/projects/project-run-profiles-card.tsx`, `project-run-profile-form.tsx`, `delete-run-profile-button.tsx` |
| Page | `src/app/(app)/projects/[id]/page.tsx` |
| Report | `RESULT.md` |

## UI changes

On **Project Detail** (left column, after local path actions):

- **Run profiles** card lists profiles with command, working directory, optional description, and **Default** badge.
- **Copy command** / **Copy cd + command** per profile.
- **Add run profile** inline form; **Edit** in dialog; **Delete** with confirm.
- Helper text when no working directory is set on a profile.

No new main navigation item — profiles stay on Project Detail only.

## Copy behavior

| Action | Clipboard content |
|--------|-------------------|
| Copy command | Trimmed `command` |
| Copy cd + command (WD set) | `cd "<workingDirectory>" && <command>` |
| Copy cd + command (WD missing) | Command only; toast notes no working directory |

Working directory for storage: explicit field, else project `localPath` when saving. Copy uses the stored profile `workingDirectory` (null if neither was available at save time).

## Test / lint / typecheck / migration status

| Check | Status |
|-------|--------|
| `pnpm db:migrate` | Applied `20260602120000_add_project_run_profiles` |
| `pnpm db:generate` | Pass |
| `pnpm test` | 208 passed (31 files) |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

## Known limitations

- Profiles do not auto-refresh when project `localPath` changes after save (re-save profile or edit working directory).
- No dedicated run-profiles list route or global nav.
- Clipboard copy requires a secure context / browser permission.
- Checkbox “default” does not prevent having zero defaults (only enforces single default when one is marked).

## Recommended next step

**Phase 2 (optional):** Run command from UI with explicit user confirmation, cwd validation, and safety guardrails — still out of scope for Phase 1. For now, manually verify on a project with `localPath` set: create profiles, copy both variants, mark default, and confirm only one default badge appears.
