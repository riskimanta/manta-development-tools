# ManDev — current state

## Current project summary

ManDev (`manta-development-tools`) is a local Next.js control-plane dashboard for managing software projects, features, backlog, architecture diagrams, and per-project run profiles. Data lives in SQLite via Prisma. Optional JWT session auth protects the app when `MANDEV_PASSWORD` is set.

## UX problem solved

Run profile cards showed the raw command and working directory separately, but users could not see the exact combined `cd + command` string before copying. That made **Copy cd + command** feel opaque and increased the risk of pasting the wrong thing into a terminal.

## Files changed

| Area | Paths |
|------|--------|
| Copy/preview helpers | `src/lib/run-profile-copy.ts`, `src/lib/run-profile-copy.test.ts` |
| UI | `src/components/projects/project-run-profiles-card.tsx` |
| Report | `RESULT.md` |

## UI changes implemented

On each run profile card:

- Added a compact **Clipboard preview** block (dashed border, muted background) labeled **copy only, not executed by ManDev**.
- **Copy command** preview shows the exact trimmed string copied by **Copy command**.
- **Copy cd + command** preview shows `cd "<workingDirectory>" && <command>` when a working directory is set — same format as clipboard copy.
- When no working directory is set, shows: `No working directory set. Copy cd + command will copy the command only.`
- Removed redundant separate command/working-directory blocks and duplicate footer hint to reduce clutter.
- Profile description (when present) remains above the preview.
- **Copy command** and **Copy cd + command** buttons and clipboard behavior are unchanged.

## Copy-only — no execution

**Confirmed.** This change is preview-only UI. ManDev still does not spawn shells, run commands, or add terminal/process UI. Clipboard copy helpers and button handlers are unchanged.

## Schema changed

**No.** `ProjectRunProfile` and migrations are unchanged.

## Test / lint / typecheck status

| Check | Status |
|-------|--------|
| `pnpm test` | 233 passed (34 files) |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

New coverage: `getRunProfileCopyPreview` and `RUN_PROFILE_NO_WORKING_DIRECTORY_COPY_HINT` in `run-profile-copy.test.ts`.

## Known limitations

- Preview reflects stored profile fields only; it does not infer a working directory from project `localPath` when the profile field is empty (same as copy behavior).
- Long commands/paths wrap in the preview block but may still be hard to scan on very narrow viewports.
- No Phase 2 run-from-UI, process manager, logs, or stop/restart.

## Recommended next step

Manually verify on a project detail page: confirm both preview lines match what lands on the clipboard for profiles with and without a working directory. Optional **Phase 2:** explicit run-from-UI with confirmation and cwd guardrails.
