---
name: settings-change-checklist
description: Enforces safe, scoped change workflow for ManDev admin UI, layout shell, and project/feature form behavior. Use when editing dashboard layout, navigation, theme providers, or CRUD forms for projects and features.
---

# Settings change checklist (ManDev)

## Trigger phrases

Apply this skill when requests include signals like:

- "fix the sidebar" / "mobile menu"
- "refactor project form" / "feature form"
- "theme toggle" / "toasts"
- "dashboard layout"

Also apply when touched paths include:

- `src/components/layout/`
- `src/components/providers/`
- `src/components/projects/`
- `src/components/features/`
- `src/app/(app)/layout.tsx` or dashboard shell wrappers

## Goal

Keep UI and form changes small, test-first when tests exist, and module-scoped.

## Workflow

1. Identify the UI module boundary being changed.
2. Write/update tests first when the repo has coverage for that area; otherwise note the gap.
3. Implement minimal production change after validation strategy is clear.
4. Avoid cross-module edits; if required, explain and request confirmation.
5. Keep refactor and behavior change separated when possible.

## Guardrails

- Do not broaden scope to unrelated modules.
- Preserve Server Action response shapes and Zod schemas unless explicitly requested.
- Prefer adapter-style additions to keep public behavior stable.

## Output checklist

- [ ] Module scope clearly identified
- [ ] Test-first step completed or gap explained
- [ ] Cross-module changes avoided or explicitly approved
- [ ] No unrelated refactor mixed in
