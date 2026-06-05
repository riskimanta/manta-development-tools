# ManDev — current state

## Current project summary

ManDev (`manta-development-tools`) is a local Next.js 15 control-plane dashboard for managing software projects, features, backlog, architecture diagrams, and per-project run profiles. Data lives in SQLite via Prisma.

## Feature implemented

Run Profiles Import Preview — Field-level Diff (for `update` items).

## UX problem solved

Previously, profiles in the **to update** category only showed a name, so users could not tell what would change. The preview now shows a compact before → after diff per changed field.

## Safety boundary

Preview/import only. No command execution, terminal UI, process manager, logs, stop/restart, or run buttons.

## Field-level diff behavior

- Diffed fields: `command`, `workingDirectory`, `description`, `isDefault`.
- Updated items now include `changes: Array<{ field, before, after }>` (serializable).
- Diff values are normalized to match import behavior:
  - `workingDirectory` uses `resolveImportedRunProfileWorkingDirectory(...)`.
  - `description` treats empty/whitespace as `null`.
  - `isDefault` treats missing as `false`.
- Create/unchanged/kept behavior is unchanged.
- Default impact summary is unchanged.

## Files changed

- /Users/riskimanta/Documents/manta-development-tools/src/lib/run-profiles-import-preview.ts
- /Users/riskimanta/Documents/manta-development-tools/src/lib/run-profiles-import-preview.test.ts
- /Users/riskimanta/Documents/manta-development-tools/src/services/run-profiles.test.ts
- /Users/riskimanta/Documents/manta-development-tools/src/components/projects/project-run-profiles-import.tsx
- /Users/riskimanta/Documents/manta-development-tools/RESULT.md

## Schema changed

No.

## Test / lint / typecheck status

- `pnpm test`: Pass
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass

## Known limitations

- Preview still re-reads the file on confirm (the file can change between preview and confirm).
- Diff display is intentionally compact; it does not do word-level highlighting.

## Recommended next step

Manually verify the preview dialog on a project with mixed updates (command, working directory, description, and default) to confirm the compact diff remains readable in dark mode.
