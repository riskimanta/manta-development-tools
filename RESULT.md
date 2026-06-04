# ManDev — current state

## Current project summary

ManDev (`manta-development-tools`) is a local Next.js control-plane dashboard for managing software projects, features, backlog, architecture diagrams, and per-project run profiles. Data lives in SQLite via Prisma. Optional JWT session auth protects the app when `MANDEV_PASSWORD` is set.

## Feature implemented

**Run Profiles Importer — Phase 1.5**

ManDev can import run profiles from a target project’s `.mandev/run-profiles.json`, using the same workflow as architecture import: copy an AI prompt into Cursor, generate the file in the target repo, then read/import from the project’s configured `localPath`. Profiles are created or updated by name; nothing is deleted. ManDev still does not execute commands.

## Safety boundary

- **Import/copy only:** Read JSON from disk, validate, upsert profiles; copy AI prompt and run commands to clipboard.
- **No execution:** No shell spawn, terminal UI, process manager, logs, stop/restart, or file upload in the browser.

## File format (`.mandev/run-profiles.json`)

```json
{
  "profiles": [
    {
      "name": "Dev Server",
      "command": "pnpm dev",
      "workingDirectory": ".",
      "description": "Run the Next.js development server",
      "isDefault": true
    }
  ]
}
```

Validation: root `profiles` (non-empty array); each profile requires `name` and `command`; optional `workingDirectory`, `description`, `isDefault` (boolean). **At most one** profile may have `isDefault: true` — otherwise import fails with a clear validation error (safer than silently picking the first).

## Import behavior

| Rule | Behavior |
|------|----------|
| Match key | `projectId` + profile `name` (trimmed) |
| New name | Create profile |
| Existing name | Update command, working directory, description, `isDefault` |
| Names not in file | Left unchanged (no delete) |
| Default in file | If any imported profile has `isDefault: true`, all other defaults for the project are cleared first, then that profile is saved as default |

## Working directory on import

| Input | Stored value |
|-------|----------------|
| Missing / empty | Project `localPath` when set |
| `"."` | Project `localPath` |
| Relative path | Resolved with `path.resolve(localPath, relative)` |
| Absolute path | Stored as-is |

## UI changes

On **Project Detail → Run profiles** card:

- **Copy AI run profiles prompt** — Cursor instructions to inspect the repo and write `.mandev/run-profiles.json`
- **Read run profiles from local path** — server action reads `<localPath>/.mandev/run-profiles.json`
- Helper text: not a file upload; reads from configured local path
- Toasts: `AI run profiles prompt copied` / `Run profiles loaded from local path`

## Schema changed

**No.** Phase 1 `ProjectRunProfile` model is unchanged; no new migration.

## Files changed

| Area | Paths |
|------|--------|
| Validation | `src/lib/validations/run-profile-import.ts`, `.test.ts` |
| Local reader | `src/lib/local-run-profiles-import.ts`, `.test.ts` |
| AI prompt | `src/lib/run-profiles-import-template.ts`, `.test.ts` |
| Service | `src/services/run-profiles.ts`, `.test.ts` |
| Server Action | `src/app/projects/run-profiles/actions.ts`, `.test.ts` |
| UI | `src/components/projects/project-run-profiles-card.tsx`, `project-run-profiles-import.tsx` |
| Page | `src/app/(app)/projects/[id]/page.tsx` |
| Report | `RESULT.md` |

## Test / lint / typecheck status

| Check | Status |
|-------|--------|
| `pnpm test` | 231 passed (34 files) |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

## Known limitations

- Import requires project `localPath`; no upload fallback.
- Profiles not listed in the JSON file are never removed automatically.
- Only one `isDefault: true` per import file; fix the JSON and re-import if Cursor marks multiple defaults.
- Imported working directories are not re-resolved when `localPath` changes later (same as manual profiles).
- No Phase 2 command execution or Phase 3 process/logs UI.

## Recommended next step

Manually verify on a project with `localPath`: copy AI prompt → generate `.mandev/run-profiles.json` in the target repo → import → confirm create/update by name and a single default badge. Optional **Phase 2:** run command from UI with explicit confirmation and cwd guardrails.
