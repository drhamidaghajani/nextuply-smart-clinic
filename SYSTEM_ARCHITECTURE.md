# SYSTEM_ARCHITECTURE.md

> Companion to [PROJECT_UNDERSTANDING.md](./PROJECT_UNDERSTANDING.md). Defines *how* the system is built. Read [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md), [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) and [API_GUIDELINES.md](./API_GUIDELINES.md) alongside this document — they detail specific layers introduced here.

## 1. Guiding Constraint

Every decision below answers to one test: **does this still make sense if we build one clinic (Dr. Sadighi) today, and five clinics in eighteen months?** If a pattern only helps the five-clinic future and slows down the one-clinic present, it is deferred to an ADR, not built now. If a shortcut helps today but requires a rewrite tomorrow, it is rejected. This is the operational meaning of "professional MVP, not over-engineered."

## 2. Architectural Style

**Layered / Clean-Architecture-lite**, organized by *feature module* rather than by technical layer at the top level. We do **not** adopt full DDD (bounded contexts as separate deployables, aggregate roots with invariant-enforcing methods, domain events/event sourcing). At this team size and product stage that ceremony would slow delivery without a corresponding payoff. What we keep from Clean Architecture / DDD, because it directly protects the multi-clinic future:

- **Domain logic is framework-agnostic.** Business rules (e.g. "an appointment cannot overlap another confirmed appointment for the same doctor") live in plain TypeScript functions/classes in `domain/`, not inside a Server Action or a React component.
- **Dependency direction is one-way**: `presentation → application → domain ← infrastructure`. Domain never imports from Next.js, Prisma, or any SDK.
- **Infrastructure is swappable behind interfaces** (ports/adapters), specifically for: the AI provider (OpenAI/Anthropic via gateway), the SMS provider, the payment gateway, and the WordPress blog source. This is the concrete reason we pay the small cost of an interface layer — every one of these four integrations is genuinely likely to change or multiply per clinic.

Everything else (CRUD screens, static pages, simple forms) is allowed to be "just Next.js" — Server Component fetching + Server Action mutating — without a forced domain/application split. Forcing that split on trivial CRUD is the over-engineering this project explicitly rejects.

## 3. High-Level Component Diagram

```
                         ┌─────────────────────────────┐
                         │        Visitors / Patients   │
                         └───────────────┬──────────────┘
                                         │ HTTPS
                         ┌───────────────▼──────────────┐
                         │   Next.js 15 App (App Router)│
                         │  - Public site (SSG/ISR)     │
                         │  - Patient Portal (SSR/Auth) │
                         │  - Doctor Dashboard (SSR)    │
                         │  - Server Actions / Route    │
                         │    Handlers (BFF layer)      │
                         └──┬───────────┬───────────┬───┘
                            │           │           │
              ┌─────────────▼──┐   ┌────▼─────┐  ┌──▼──────────────┐
              │ PostgreSQL      │   │  n8n     │  │ WordPress        │
              │ (Prisma ORM)    │   │ workflows│  │ (Headless, blog  │
              │ Iranian VPS     │   │          │  │ content only)    │
              └─────────────────┘   └────┬─────┘  └──────────────────┘
                                          │
                                ┌─────────▼──────────┐
                                │   AI Gateway/Proxy   │
                                │ (internal service)   │
                                └──┬────────────────┬──┘
                                   │                │
                          ┌────────▼───┐   ┌────────▼────────┐
                          │ OpenAI /   │   │ Reputation/SEO   │
                          │ Anthropic  │   │ scraping sources │
                          └────────────┘   └──────────────────┘

        External integrations (via adapters, see §6):
        Payment Gateway (IRR + FX) · SMS Panel · Calendar
```

## 4. Runtime Boundaries

| Boundary | Technology | Notes |
|---|---|---|
| Public marketing site | Next.js, mostly SSG/ISR | Must hit sub-3s load per the client proposal; no auth. |
| Patient Portal | Next.js SSR + session auth | OTP-based auth pending decision (see PROJECT_UNDERSTANDING.md §13). |
| Doctor/Clinic Dashboard | Next.js SSR + role-based auth | Internal users only (doctor, reception staff). |
| Blog | WordPress (headless), consumed via REST/GraphQL at build/ISR time | Never a runtime dependency for the core app — if WordPress is down, the rest of the app must keep working. |
| AI Layer | n8n workflows + internal AI Gateway service | Runs on the same Iranian VPS estate but is a logically separate service/process, not code inside the Next.js app. |
| Database | PostgreSQL + Prisma | Single shared-schema database, tenant-scoped by `clinicId` (see DATABASE_GUIDE.md). |

## 5. Multi-Tenancy Strategy

Decision: **shared schema, single database, tenant discriminator column (`clinicId`)** — not schema-per-tenant, not database-per-tenant. Rationale: at the expected scale (tens, not thousands, of clinics; small teams operating on a modest Iranian VPS budget), shared-schema is dramatically cheaper to operate and migrate, and is the industry-default choice for this scale (confirmed as Hamid's own conclusion in the strategy docs' IRL analysis).

Concrete rules (enforced from day one even though `clinicId` has exactly one value today):

1. Every tenant-owned table (Doctor, Service, Patient, Appointment, Conversation, ReputationSignal, MediaAsset, Payment...) carries a `clinicId` foreign key.
2. All Prisma queries go through a thin data-access layer that injects `clinicId` automatically from the authenticated session/context — application code never manually threads `clinicId` through every query by hand (this is the one place we *do* pay an abstraction cost up front, because retrofitting it later means auditing every query in the codebase).
3. Global/platform-level tables (e.g. future `Clinic`, `PlanSubscription`) are modeled distinctly from tenant-owned tables from the start.
4. No feature may assume "there is only one clinic" in its logic — even though the UI, config, and content are 100% Dr. Sadighi's today.

Migrating to schema-per-tenant later remains possible without an application rewrite if this discipline holds — that is the entire point of paying this specific cost now.

## 6. Adapter Boundaries (Ports & Adapters)

Four integration points are hidden behind interfaces from day one, because each is expected to vary by clinic, by country, or by sanction-driven necessity:

- **AI Provider Port** — `generateReply(prompt, context): Response`. Adapter today: internal Gateway → OpenAI/Anthropic. Future adapters: alternative LLM providers, per-clinic model choice.
- **Payment Port** — `createPaymentIntent`, `verifyPayment`. Adapter pending gateway choice (see open question in PROJECT_UNDERSTANDING.md). Must support both IRR and FX flows per the client proposal.
- **SMS/Notification Port** — `sendTransactionalMessage(template, recipient, payload)`. Adapter pending provider choice.
- **Content Source Port** (blog) — abstracts WordPress specifically so it can be swapped or dropped per-clinic without touching page code.

Everything that is *not* one of these four stays a direct, boring implementation — we do not create speculative interfaces for things that aren't actually expected to change (e.g. the database itself is not behind a swappable port; Prisma + Postgres is the committed choice).

## 7. AI Layer Architecture (Closer AI / Oracle AI)

Both agents are **domain-specific personas of the same underlying Gateway**, not separate infrastructure:

- **Closer AI**: real-time, patient-facing. Flow: patient message → Next.js chat widget → Server Action → n8n workflow (light RAG over clinic's real service content + FAQ) → AI Gateway → LLM → structured reply + optional booking-intent action (create draft appointment, request deposit link). Confidence-based handoff to a human (reception) is mandatory — this is both a UX requirement and a liability-reduction requirement for a medical vertical.
- **Oracle AI**: asynchronous, clinic-owner-facing. Flow: scheduled n8n workflow → scrapes/pulls signals (Google Maps reviews, Instagram, competitor pages) → AI Gateway summarizes/classifies → weekly report persisted to DB → surfaced in Doctor Dashboard + optionally emailed/Telegram-sent. V1 is explicitly a weekly batch report, not a live dashboard, per the Ng/Jobs "small MVP first" precedent.
- Both personas' system prompts are versioned artifacts (see CODING_STANDARDS.md) — never hardcoded inline strings scattered through the codebase — because prompt tone directly affects patient trust and must be reviewable/A-B-testable independent of code deploys.

## 8. Security & Compliance Posture

- All sensitive patient data (medical notes, before/after photos, phone numbers) encrypted at rest; access scoped by role and `clinicId`.
- AI Gateway strips/pseudonymizes patient-identifying data before sending context to a foreign LLM provider wherever the feature allows it (open question: exact legal requirement under Iranian medical-records regulation — flagged in PROJECT_UNDERSTANDING.md).
- Daily automated backups of the Postgres database (per VISION.md's "Security by Design"/"Offline-First" principles) with a documented restore drill (see DEPLOYMENT_GUIDE.md).
- Auth: session-based for the Doctor Dashboard (staff), pending decision for patient-side auth strength (OTP vs. stronger).

## 9. Internationalization Architecture

Three locales (`fa` default, `en`, `ar`) with RTL (`fa`, `ar`) and LTR (`en`) layouts switching at the root layout level, not per-component. Locale-specific routing (`/en/...`, `/ar/...`, bare path = `fa`) with `hreflang` tags for SEO. Content model in the database carries locale-specific fields for anything patient-facing (service descriptions, FAQ) — this is a data-modeling decision, not just a UI-string translation layer, because medical-tourism content (visa/hotel/transfer guidance) is structurally different per locale, not just translated.

## 10. Performance & SEO Architecture

- Public pages: SSG/ISR by default; only truly dynamic data (live slot availability) is fetched client-side or via a short-revalidate Server Component.
- Images (before/after gallery) served through Next.js Image with aggressive optimization — the client proposal's <3s load target is a hard constraint, not an aspiration.
- Structured data (Schema.org `MedicalClinic`/`MedicalProcedure` markup) generated server-side for every service page.

## 11. What This Document Deliberately Does Not Specify

Exact folder layout → [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md). Exact Prisma schema → [DATABASE_GUIDE.md](./DATABASE_GUIDE.md). Exact route/endpoint conventions → [API_GUIDELINES.md](./API_GUIDELINES.md). Hosting/CI details → [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md). This document is the map; those are the terrain.
