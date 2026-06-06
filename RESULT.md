# ManDev — current state

## Rule added

**`.cursor/rules/next-server-action-type-boundary.mdc`** — Cursor rule for Next.js Server Action type boundaries.

## Why it was added

Project Detail crashed with `ReferenceError: ManagedRunProfileActionResult is not defined`. Root cause: `src/app/projects/run-profiles/actions.ts` (`"use server"`) contained `export type { ManagedRunProfileActionResult };` re-exporting a type from `@/services/run-profiles`. Turbopack evaluated the module at runtime and emitted a reference to a type-only symbol that does not exist as a JS value.

The runtime fix (prior task) moved shared types to `src/lib/run-profile-managed-action-types.ts`. This rule prevents the same mistake on future Server Action work.

## File changed

- `.cursor/rules/next-server-action-type-boundary.mdc` — **new** rule (globs: `actions.ts`, client components, services, lib type modules)
- `RESULT.md` — this report

No app runtime code changed in this task. Prior fix remains in place; `rg "export type \\{" src/app` finds no re-export pattern.

## Whether app behavior changed

**No.** Documentation/guardrail only. Application behavior is unchanged.

## Test / lint / typecheck status

- `pnpm test`: **Not run** — rules/docs-only change; no runtime code modified
- `pnpm typecheck`: Pass
- `pnpm lint`: Pass

## Recommended next step

Optionally migrate remaining client imports of inline action state types (e.g. `ActionState`, `RunProfileActionState`, `LoginState` from various `actions.ts` files) into `src/lib/*-types.ts` modules to fully align with the new rule and reduce future risk.
