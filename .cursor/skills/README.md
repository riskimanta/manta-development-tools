# Project skills routing guide (ManDev)

This file documents when each project skill should be auto-applied. Keep it synchronized with `.cursor/rules/Skill-Autoload-Router.mdc`.

## Skill map

| Intent or signal | Skill |
|------------------|--------|
| Update/sync feature docs, ask docs impact, behavior/validation/Prisma/Server Action changes | `feature-doc-impact` |
| Fix/refactor admin UI, layout shell, project/feature forms, theme providers | `settings-change-checklist` |

## Path hints

- `docs/features/path-map.md`, `docs/features/index.md` → `feature-doc-impact`
- `src/components/layout/`, `src/components/providers/`, `src/components/projects/`, `src/components/features/` → `settings-change-checklist`
- `src/app/projects/actions.ts`, `src/app/features/actions.ts` → both may apply; prefer `feature-doc-impact` for schema/validation changes, `settings-change-checklist` for pure UI.

## Conflict order

1. `feature-doc-impact`
2. `settings-change-checklist`

## Maintenance rules

- Add new skills here first, then wire triggers in `Skill-Autoload-Router.mdc`.
- Prefer specific trigger terms over broad generic wording.
