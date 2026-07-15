# 0004. First Prisma schema: Smart Clinic Assistant lead/booking persistence

Status: Accepted
Date: 2026-07-13

## Context

The Smart Clinic Assistant (`src/modules/smart-clinic-assistant/`) has a complete multi-step flow — lead capture, triage, service selection, appointment request, payment-draft preparation — but no durable storage; `submitBookingRequest` only logs and returns. Hamid asked to turn this into real persistence.

This is the *first* Prisma schema to land in this repo. `DATABASE_GUIDE.md` already states its own conventions (shared-schema multi-tenancy, `clinicId` on every tenant-owned table) but explicitly defers the literal `schema.prisma` to "the first data-model ADR" — this is that ADR. `PROJECT_GUIDE.md` also names `0001-tenancy-strategy.md` as a suggested early ADR that was never actually written; rather than add a second, overlapping ADR, this one formalizes the tenancy discipline in the context of its first real usage.

No live PostgreSQL instance or credentials exist in this environment (verified: no `docker`, `psql`, or local Postgres binary; no `.env*` files). Per `SYSTEM_ARCHITECTURE.md` §4, PostgreSQL + Prisma on a dedicated Iranian VPS is the confirmed production target — not re-litigated here.

## Decision

- **Schema targets `postgresql`**, matching the confirmed architecture — not SQLite, even for local dev convenience. A provider swap later would itself be a rewrite of every migration; better to author correctly once, even though it means this repo can't run a live migration against a real database until real credentials exist.
- **Five models exactly as specified**: `Lead`, `TriageAnswer`, `BookingRequest`, `PaymentDraft`, `SmsEvent` — plus one new minimal `Clinic` model (platform-level, not tenant-owned) purely so the required `clinicId` foreign keys have somewhere real to point; `Clinic` is not itself part of this task's scope beyond that.
- **Tenancy discipline applied from row one**: every one of the five models carries `clinicId` + an index, per `DATABASE_GUIDE.md` §1's non-negotiable rule — even though exactly one clinic exists today.
- **Tenant resolution is a single-tenant placeholder** (`src/core/tenancy/clinic.ts`): `getDefaultClinicId()` returns one env-configurable ID. No session/auth system exists yet to resolve a real per-request tenant — this is the seam DATABASE_GUIDE.md's "Future Multi-Tenant Evolution Path" describes, not a shortcut that needs undoing, just today's honest single value.
- **Access pattern is explicit, not a generic Prisma Client Extension**: `src/modules/smart-clinic-assistant/server/lead-repository.ts` exposes named, clinicId-scoped functions (`createLeadWithTriage`, `createBookingRequestForLead`, `createPaymentDraftForLead`, `createSmsEvent`, `listLeadsForAdmin`) rather than a fully generic auto-injecting wrapper. A generic extension is the more scalable long-term answer (CODING_STANDARDS.md §4's intent), but this is the *first* real usage of the tenancy pattern in code — building the generic version now, before a second real consumer exists, is exactly the premature abstraction `CODING_STANDARDS.md` §11 rejects. Revisit once a second module needs tenant-scoped persistence.
- **Live persistence is gated behind `DATABASE_URL` presence.** The Prisma Client is generated and type-checked (works fully offline), and an initial migration SQL file is generated via `prisma migrate diff` (also offline-safe — no live connection needed), so everything is ready to apply the moment real credentials exist. `submitBookingRequest` checks for `DATABASE_URL` at runtime and falls back to its previous log-only behavior if absent, rather than crashing the patient-facing assistant flow.

## Consequences

- Real, correct, type-checked persistence code exists and is exercised by the admin-view read path against generated types — but the actual read/write round-trip against a live database is **not verified in this pass**, since no database is reachable from this environment. This must be verified once real `DATABASE_URL` credentials are provisioned.
- The single-tenant `getDefaultClinicId()` placeholder must be replaced with real session-derived tenant resolution once patient/staff auth exists (`PROJECT_UNDERSTANDING.md` §13's open question) — flagged, not silently assumed permanent.
- `lead-repository.ts`'s explicit-function pattern will need generalizing (or duplicating per-module) as more tenant-owned models arrive — an intentional, logged deferral, not an oversight.
- No medical files, uploaded images, or diagnostic content are stored by any of these five models — `notes`/triage `answer` fields are free text the patient enters, capped at reasonable lengths, never a place for clinical files.
