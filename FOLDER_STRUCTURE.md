# FOLDER_STRUCTURE.md

> Concrete realization of the layering described in [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md). One Next.js 15 app, feature-first, with a thin shared core. No monorepo tooling (Nx/Turborepo) until there is a second deployable package that actually needs one.

## 1. Top-Level Layout

```
nextuply-smart-clinic/
├── src/
│   ├── app/                     # Next.js App Router — routes only, no business logic
│   ├── modules/                 # Feature modules (see §2)
│   ├── core/                    # Cross-cutting domain-agnostic building blocks (see §3)
│   ├── infrastructure/          # Concrete adapters for external systems (see §4)
│   ├── components/              # Shared, feature-agnostic UI primitives (see COMPONENT_GUIDE.md)
│   ├── config/                  # Runtime config, env parsing, feature flags
│   ├── styles/                  # Tailwind config extensions, global CSS, design tokens
│   ├── i18n/                    # Locale dictionaries, routing helpers (fa/en/ar)
│   └── types/                   # Truly global TypeScript types (kept small on purpose)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── docs/
│   └── adr/                     # Architecture Decision Records, one file per decision
├── public/
├── n8n/                         # Exported/versioned n8n workflow JSON (source of truth in git)
├── tests/
│   ├── unit/
│   └── e2e/
├── PROJECT_UNDERSTANDING.md
├── SYSTEM_ARCHITECTURE.md
├── FOLDER_STRUCTURE.md          # this file
├── DESIGN_SYSTEM.md
├── UI_GUIDELINES.md
├── UX_GUIDELINES.md
├── CODING_STANDARDS.md
├── API_GUIDELINES.md
├── DATABASE_GUIDE.md
├── COMPONENT_GUIDE.md
├── DEPLOYMENT_GUIDE.md
├── CLAUDE.md
├── VISION.md
└── ROADMAP.md
```

## 2. `src/modules/` — Feature Modules

Each module owns one business capability end-to-end and is the primary unit of "modular for future clinics." A module contains its own domain logic, application services, and UI — but never talks to another module's internals directly (only through its public `index.ts`).

```
src/modules/
├── booking/
│   ├── domain/            # Appointment, TimeSlot, booking rules (pure TS, no framework imports)
│   ├── application/       # use-cases: createAppointment(), cancelAppointment()
│   ├── ui/                # BookingCalendar, BookingConfirmation components
│   ├── server/             # Server Actions calling application layer
│   └── index.ts            # public exports only
├── patient/
│   ├── domain/             # Patient entity, medical-record value objects
│   ├── application/
│   ├── ui/                 # Patient Portal screens
│   └── server/
├── clinic-profile/          # doctors, services, gallery, clinic-level config — the "tenant-ready" surface
│   ├── domain/
│   ├── application/
│   ├── ui/
│   └── server/
├── closer-ai/                # patient-facing concierge chat
│   ├── application/          # conversation orchestration, handoff-to-human logic
│   ├── ui/                   # ChatWidget
│   └── server/
├── oracle-ai/                 # reputation/content-strategy engine
│   ├── application/
│   ├── ui/                    # weekly report views in Doctor Dashboard
│   └── server/
├── payments/
│   ├── domain/
│   ├── application/
│   └── server/
├── notifications/              # SMS/email templating and dispatch
│   ├── application/
│   └── server/
└── blog/                        # WordPress-headless integration, isolated per §6 of SYSTEM_ARCHITECTURE.md
    ├── application/
    ├── ui/
    └── server/
```

Rule of thumb for "does this need `domain/`?": if the module has business rules that could be wrong (overlapping bookings, refund eligibility, tenant scoping), it gets a `domain/` folder. If it's a thin pass-through (blog listing), `application/` + `server/` is enough — no empty `domain/` folder for the sake of symmetry.

## 3. `src/core/` — Cross-Cutting Domain-Agnostic Code

```
src/core/
├── tenancy/         # clinicId resolution, tenant-scoped Prisma client wrapper (see SYSTEM_ARCHITECTURE.md §5)
├── auth/            # session/role primitives shared by all modules
├── errors/          # shared error types and result/either helpers
└── logging/
```

Nothing product-specific lives here. If a piece of code only makes sense for clinics, it belongs in a module, not in `core/`.

## 4. `src/infrastructure/` — Adapters

One subfolder per port defined in SYSTEM_ARCHITECTURE.md §6:

```
src/infrastructure/
├── ai-gateway/       # AI Provider Port implementation
├── payment-gateway/  # Payment Port implementation
├── sms/              # SMS/Notification Port implementation
├── wordpress/        # Content Source Port implementation
└── db/               # Prisma client instantiation, tenant-scoping wrapper
```

Only these adapters are allowed to import third-party SDKs (OpenAI SDK, payment SDK, etc.). Modules depend on the *port interface*, defined next to its usage in `core/` or the owning module's `application/` layer — not on the infrastructure package directly.

## 5. `src/app/` — Routes Only

```
src/app/
├── (public)/
│   ├── [locale]/
│   │   ├── page.tsx              # Home
│   │   ├── services/[slug]/
│   │   ├── gallery/
│   │   ├── faq/
│   │   ├── contact/
│   │   ├── booking/
│   │   └── blog/[slug]/
├── (portal)/
│   ├── patient/                   # requires patient auth
│   └── dashboard/                 # requires staff/doctor auth
├── api/
│   ├── webhooks/
│   │   ├── payment/
│   │   ├── sms/
│   │   └── n8n/
│   └── ai/closer/                 # thin route handler delegating to modules/closer-ai
└── layout.tsx
```

Route files must stay thin: parse params, call a module's `application`/`server` function, render. Any logic beyond that belongs in the module.

## 6. Naming & Placement Rules

- One feature = one folder under `modules/`. Do not create a "misc" or "shared-features" module — if something doesn't fit an existing module, that's a signal to name a new one, not a place to dump code.
- Cross-module UI reuse (buttons, cards, layout primitives) goes in `src/components/`, documented in COMPONENT_GUIDE.md — never copy-pasted between modules.
- Every ADR in `docs/adr/` is numbered and referenced from the module or doc it affects (see PROJECT_GUIDE.md for the ADR process).
