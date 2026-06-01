# ManDev architecture

## Goals

- Thin **route handlers** (RSC pages, Server Actions): validate input, call services, revalidate tags/paths, return UI state.
- **Services** (`src/services/*`) encapsulate Prisma queries and domain-oriented reads. They do not depend on React.
- **Validation** lives in `src/lib/validations/*` (Zod). Server Actions parse `FormData` or JSON through these schemas.
- **Prisma** is only imported from `src/lib/db.ts` (singleton) and used inside services (or narrowly in Server Actions if the query is trivial one-liner — prefer services for non-trivial queries).

## Directories

| Path | Role |
|------|------|
| `src/app/` | Routes, layouts, Server Actions colocated with routes where practical |
| `src/components/` | UI: layout shell, forms, shadcn-style primitives |
| `src/services/` | Database access patterns, aggregations |
| `src/lib/` | Shared utilities, Zod schemas, Prisma client |

## Authentication (optional)

- When `MANDEV_PASSWORD` is set, [`middleware.ts`](../middleware.ts) enforces a JWT session cookie (`MANDEV_SESSION_COOKIE` in [`src/lib/mandev-session.ts`](../src/lib/mandev-session.ts)).
- Login uses Server Actions in [`src/app/login/actions.ts`](../src/app/login/actions.ts); logout clears the cookie via [`src/app/logout/route.ts`](../src/app/logout/route.ts).

## Conventions

- Prefer **Server Actions** + `revalidatePath` for mutations after MVP; introduce Route Handlers only when an external API or webhooks are required.
- Forms: **Zod** on the server; client uses `useActionState` for inline errors.
- Do not widen Prisma types into the UI layer unnecessarily — map to DTOs in services if shapes diverge.

## Changing this document

Update `docs/ARCHITECTURE.md` when layering or data-flow conventions change materially.
