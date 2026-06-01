# ManDev (Manta Development Tools)

Control-plane dashboard for **projects** and **features**: register repos, capture specs, and filter work before opening target codebases (for example in Cursor).

## Stack

- Next.js 15 (App Router, currently **15.5.15** for security patches), React 19, TypeScript
- Tailwind CSS 4, shadcn-style UI (Base UI + Radix primitives where applicable)
- Prisma ORM with SQLite in development (Postgres-compatible for production)

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)

## Setup

1. Copy environment and adjust if needed:

   ```bash
   cp .env.example .env
   ```

   `DATABASE_URL` defaults to `file:./dev.db` (SQLite file under `prisma/`).

2. Install dependencies (runs `prisma generate` via `postinstall`):

   ```bash
   pnpm install
   ```

3. Apply migrations (creates tables):

   ```bash
   pnpm db:migrate
   ```

4. Optional seed sample project/feature:

   ```bash
   pnpm db:seed
   ```

## Optional password gate

When **`MANDEV_PASSWORD`** is set in `.env`, all dashboard routes require a signed **HttpOnly** session cookie (JWT via [`jose`](https://github.com/panva/jose), 7-day expiry). You must also set **`MANDEV_AUTH_SECRET`** to a random string of **at least 16 characters**.

- Leave both unset for local development without a login screen.
- Sign in at `/login`. Sign out via **Sign out** in the header/sidebar/mobile menu, or open `/logout`.

## Command palette

Press **⌘K** (macOS) or **Ctrl+K** (Windows/Linux), or use the search field in the header, to jump to dashboard routes and “new project / new feature” screens.

## Scripts

| Command | Description |
|--------|-------------|
| `pnpm dev` | Development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm db:generate` | Regenerate Prisma Client |
| `pnpm db:migrate` | Create/apply dev migrations |
| `pnpm db:push` | Push schema without migration files (prototyping) |
| `pnpm db:seed` | Run `prisma/seed.ts` |

## Production database

Point `DATABASE_URL` to Postgres (Neon, Supabase, RDS, etc.) and run migrations in CI or release pipeline (`prisma migrate deploy`).

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layering and data access conventions.
- [docs/features/](docs/features/) — feature doc index and path map (for agent skills).
