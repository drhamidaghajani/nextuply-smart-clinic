# DATABASE_GUIDE.md

> PostgreSQL + Prisma conventions. Implements the tenancy strategy from [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) §5. No schema is final until it has an ADR — this document defines *conventions*, not the literal `schema.prisma` (that lands with the first data-model ADR).

## 1. Tenancy Convention (the single most important rule in this file)

Every tenant-owned model includes:

```prisma
model Appointment {
  id        String   @id @default(uuid())
  clinicId  String
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  // ...domain fields
  @@index([clinicId])
}
```

Platform-level models (e.g. `Clinic` itself, future `PlanSubscription`) do **not** carry `clinicId` — they define tenants, they don't belong to one.

All application-layer reads/writes go through the tenant-scoped wrapper described in SYSTEM_ARCHITECTURE.md §5, which injects `where: { clinicId }` automatically. Raw `prisma.appointment.findMany()` without going through that wrapper is a code-review blocker.

## 2. Initial Core Entities (conceptual — exact fields land in the ADR + schema.prisma)

| Entity | Tenant-owned? | Purpose |
|---|---|---|
| `Clinic` | No (defines tenant) | Name, branding config, locales enabled, contact info |
| `Location` | Yes | **Added after reviewing the real client**: a clinic can have more than one physical address (Dr. Sadighi practices in both Tehran and Tabriz) — address, hours, phone, map coordinates. `Doctor` and `Appointment` both reference a `Location`, not just a `Clinic`. See CONTENT_INVENTORY.md §5. |
| `Doctor` | Yes | Profile, credentials, specialties, availability rules; may serve multiple `Location`s |
| `Service` | Yes | Procedure catalog, pricing, locale-specific descriptions |
| `Patient` | Yes | Contact info, auth identity, medical-record pointer |
| `Appointment` | Yes | Doctor, patient, service, location, time slot, status, deposit status |
| `Conversation` / `Message` | Yes | Closer AI chat history, linked to a patient or anonymous session |
| `ReputationSignal` | Yes | Oracle AI's ingested review/competitor/trend data points |
| `WeeklyReport` | Yes | Oracle AI's generated summary for the clinic dashboard |
| `Payment` | Yes | Transaction records, linked to Appointment, gateway reference |
| `MediaAsset` | Yes | Before/after photos, gallery images, with locale/consent metadata |
| `StaffUser` | Yes | Doctor/reception accounts with roles, distinct from `Patient` auth |

Medical-record-sensitive fields (diagnosis notes, clinical photos) are flagged as a distinct concern pending the open legal-compliance question in PROJECT_UNDERSTANDING.md §13 — until resolved, default to storing the *minimum necessary* clinical detail, with photos/notes encrypted at the column or storage level.

## 3. Naming Conventions

- Models: `PascalCase` singular (`Appointment`, not `Appointments`).
- Fields: `camelCase`; foreign keys as `<relation>Id` (`clinicId`, `doctorId`).
- Enums: `PascalCase` type, `SCREAMING_SNAKE_CASE` or `PascalCase` values consistently per enum (pick one at the first ADR and stay consistent).
- Every table gets `createdAt`/`updatedAt` timestamps by convention; soft-delete (`deletedAt`) used only where a hard delete would destroy audit-relevant medical/financial history (Appointment, Payment) — not applied blanket to every table.

## 4. Migrations

- `prisma migrate dev` locally, `prisma migrate deploy` in CI/CD against staging and production — never manual schema edits against a live database.
- Every migration is reviewed as part of its feature's PR, with the ADR (if the change introduces a new entity/relationship) referenced in the PR description.
- Destructive migrations (column drops, type narrowing) require an explicit rollback note in the PR — production has real patient data from day one of launch, so "just re-seed" is never an acceptable recovery plan post-launch.

## 5. Seeding

- `prisma/seed.ts` populates `local`/`staging` with realistic **synthetic** data only — real patient data is never present outside `production`.
- Seed data includes at least: one `Clinic` (mirroring Dr. Sadighi's real structure but with fake patients), a full service catalog, and enough fake appointments/conversations to exercise the Dashboard and Oracle AI report views without needing production data for development.

## 6. Backups & Data Integrity

- Daily automated `pg_dump` backups per VISION.md's "Security by Design," stored off the primary VPS (see DEPLOYMENT_GUIDE.md for exact target and retention policy).
- Foreign keys enforced at the database level (not just application-level checks) — Prisma relations are configured with real FK constraints, not `@relation` without enforcement.

## 7. Query Performance

- Indexes on every `clinicId` column (tenant-scoped queries are the hot path) plus any column used in a `WHERE`/`ORDER BY` on a list/dashboard view (e.g. `Appointment.startTime`, `ReputationSignal.detectedAt`).
- N+1 queries avoided via Prisma's `include`/`select` — flagged in code review, not just caught in production monitoring.

## 8. Future Multi-Tenant Evolution Path

If a future clinic requires full data isolation (e.g. an enterprise contract demanding a dedicated database), the `clinicId`-scoped access pattern defined here is what makes an eventual move to schema-per-tenant or database-per-tenant a data-migration exercise rather than an application rewrite — this is the entire economic justification for the discipline in §1.
