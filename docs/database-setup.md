# Database Setup

How to get a real PostgreSQL database running for local development or staging, apply the Prisma migration, and confirm the Smart Clinic Assistant is actually persisting leads. Production target is a dedicated Iranian VPS (`SYSTEM_ARCHITECTURE.md` §4) — these same steps apply there once that VPS is provisioned; nothing here is local-only tooling. Docker is **not** required — this repo does not use Docker anywhere else, so no Docker dependency is introduced for this either.

See `docs/adr/0004-assistant-persistence-schema.md` for why the schema looks the way it does, and `DATABASE_GUIDE.md` for the tenancy conventions every table follows.

## 1. Get a PostgreSQL server

Any of these work — Prisma only cares about the connection string.

- **macOS, no install footprint**: [Postgres.app](https://postgresapp.com/) — a menu-bar app, one Postgres server, no `brew services` background daemon to remember about.
- **macOS via Homebrew**: `brew install postgresql@16 && brew services start postgresql@16`
- **Linux**: your distro's `postgresql` package, or your team's existing staging instance.
- **A remote/staging Postgres you already have credentials for** (e.g. the project's VPS once provisioned) — skip straight to step 3.

## 2. Create the database

```bash
createdb nextuply_smart_clinic
```

(If your local Postgres uses a non-default user/password, adjust accordingly — `createdb -U <user> nextuply_smart_clinic`.)

## 3. Set `DATABASE_URL`

Copy `.env.example` to `.env` (already gitignored — never commit real credentials) and fill in the real connection string:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/nextuply_smart_clinic?schema=public"
```

For a local Postgres.app/Homebrew install with no password set, this is typically:

```
DATABASE_URL="postgresql://localhost:5432/nextuply_smart_clinic?schema=public"
```

## 4. Apply the migration

- **Local development** (creates the DB schema, and would prompt to generate a new migration if the schema and migration history had diverged — they won't have, since this is the initial migration):
  ```bash
  npm run prisma:migrate
  ```
- **Staging/production** (applies existing migrations only, never generates new ones — the correct command for any non-dev environment):
  ```bash
  npm run prisma:deploy
  ```

Both regenerate the Prisma Client automatically. To regenerate it on its own (e.g. after pulling a schema change without a new migration):

```bash
npm run prisma:generate
```

## 5. Verify a lead actually saved

Two ways:

1. **Through the real flow**: run `npm run dev`, open `http://localhost:3001/fa`, go through the Smart Clinic Assistant end-to-end (any service → triage → contact info → submit). Then either:
   - `npm run prisma:studio` — opens a local GUI at `http://localhost:5555`, browse the `Lead` table.
   - Or visit the internal admin view at `/fa/internal/assistant-leads` (see `docs/database-setup.md`'s sibling concern, the `INTERNAL_ADMIN_TOKEN` gate documented in `.env.example` and `src/middleware.ts` — required outside local development).
2. **Directly via `psql`**:
   ```bash
   psql "$DATABASE_URL" -c 'SELECT "fullName", "mobile", "status", "createdAt" FROM "Lead" ORDER BY "createdAt" DESC LIMIT 5;'
   ```

If `DATABASE_URL` is unset or unreachable, `submitBookingRequest` degrades gracefully (validates and logs, returns `persisted: false`) instead of crashing — see `src/modules/smart-clinic-assistant/server/submit-booking-request.ts`. That is expected behavior, not a bug, whenever no database is configured.
