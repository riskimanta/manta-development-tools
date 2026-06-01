---
name: feature-doc-impact
description: Checks feature documentation impact from changed target paths and proposes precise docs updates. Use when implementing behavior changes, validation changes, new flows, Prisma schema changes, Server Action changes, or when the user asks to update docs/features files.
---

# Feature Doc Impact

## Trigger phrases

Apply this skill when requests include signals like:

- "update feature docs"
- "sync docs with code changes"
- "new flow or validation"
- "is docs update needed?"
- edits near `docs/features/path-map.md` or `docs/features/index.md`

## Goal

Decide whether `docs/features/*.md` needs updates, then ask for user confirmation before editing docs.

## Workflow

1. Identify changed or target implementation paths.
2. Open `docs/features/path-map.md` and map each path to candidate feature docs.
3. Open `docs/features/index.md` for quick feature coverage context.
4. Read only 1–3 mapped docs that are closest to the changed area.
5. Run docs impact check:
   - New flow, constraint, validation, or Prisma model field?
   - Changed user-facing behavior on dashboard, projects, or features?
6. If impact exists, propose updates first:
   - List exact target files in `docs/features/*.md`
   - Add one short reason per file
   - Ask user confirmation before editing docs
7. If creating a new feature doc, also include:
   - `docs/features/index.md`
   - `docs/features/path-map.md`
8. Keep updates concise and scoped to impacted feature docs only.

## Output template

Use this format when reporting impact:

```markdown
Docs impact: Yes|No

Proposed files:
- docs/features/feature-xxx.md — <reason>
- docs/features/index.md — <reason, if needed>
- docs/features/path-map.md — <reason, if needed>

Need confirmation before editing docs/features files.
```

## Guardrails

- Do not edit `docs/features/*.md` before explicit user approval.
- Do not load unrelated feature docs.
- Prefer closest mapping when multiple docs match.

## Quick scenarios

- Behavior change in services or Server Actions: map changed path, detect impact, propose exact docs files.
- New feature doc creation: include updates for both `docs/features/index.md` and `docs/features/path-map.md`.
