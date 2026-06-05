# ManDev — current state

## Current project summary

ManDev (`manta-development-tools`) is a local Next.js control-plane dashboard for managing software projects, features, backlog, architecture diagrams, and per-project run profiles. Data lives in SQLite via Prisma. Optional JWT session auth protects the app when `MANDEV_PASSWORD` is set.

## Feature implemented

**Run Profiles Import Preview — Phase 1.6**

Reading `.mandev/run-profiles.json` now opens a preview dialog before any database write. Users see what will be created, updated, left unchanged, or kept, plus default-profile impact, then confirm or cancel.

## UX problem solved

**Read run profiles from local path** previously upserted profiles immediately. Users had no visibility into create vs update vs unchanged vs kept profiles, or whether the default would change, before committing the import.

## Safety boundary

- **Preview/import only:** Read JSON from disk, validate, compare, preview, then upsert on explicit confirm.
- **No execution:** No shell spawn, terminal UI, process manager, logs, stop/restart, or run buttons.

## Preview behavior

1. User clicks **Read run profiles from local path** (unchanged label).
2. Server reads and validates `<localPath>/.mandev/run-profiles.json` (same Phase 1.5 validation/errors).
3. `buildRunProfilesImportPreview` compares imported vs existing profiles:
   - **create** — trimmed name not in project
   - **update** — same name, at least one normalized field differs (`command`, `workingDirectory`, `description`, `isDefault`)
   - **unchanged** — same name, all normalized fields match
   - **kept** — existing profile not in file (not deleted)
4. Working directory resolution matches import: missing/empty → `localPath`, `"."` → `localPath`, relative → resolved, absolute → as-is.
5. Default impact: current default name, next default name after import, and whether default will change (including import-file default clearing behavior).
6. Preview dialog shows counts, name lists, default summary, and: *Import will create or update profiles by name. Profiles not listed in the file will be kept.*

## Confirm import behavior

- **Cancel** closes the dialog; no database write.
- **Confirm import** runs existing `importProjectRunProfilesFromLocalFile` (create/update by name, no delete, same default handling).
- Page revalidates and success toast on confirm only.

## Files changed

| Area | Paths |
|------|--------|
| Preview helper | `src/lib/run-profiles-import-preview.ts`, `.test.ts` |
| Working directory (shared) | `src/lib/run-profile-working-directory.ts`, `.test.ts` |
| Service | `src/services/run-profiles.ts`, `.test.ts` |
| Server Actions | `src/app/projects/run-profiles/actions.ts`, `.test.ts` |
| UI | `src/components/projects/project-run-profiles-import.tsx` |
| Report | `RESULT.md` |

## Schema changed

**No.** `ProjectRunProfile` and migrations are unchanged.

## Test / lint / typecheck status

| Check | Status |
|-------|--------|
| `pnpm test` | 248 passed (36 files) |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

## Known limitations

- Preview re-reads the file on confirm (file could change between preview and confirm).
- Preview lists profile names only; field-level diffs are summarized via update count, not per-field before/after.
- Import still requires project `localPath`; no upload fallback.
- Profiles not in the JSON file are never removed automatically.
- No Phase 2 command execution or Phase 3 process/logs UI.

## Recommended next step

Manually verify on a project with `localPath` and mixed existing/imported profiles: read → review preview sections → cancel (no DB change) → read again → confirm import → verify create/update/kept/default badge. Optional: cache validated import payload between preview and confirm to avoid a second disk read.
