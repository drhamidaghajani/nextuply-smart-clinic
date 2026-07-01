# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/); dates in `YYYY-MM-DD`.

## [Unreleased]

### Added — 2026-07-01

- Full pre-implementation documentation set, written before any application code, per Hamid's design-before-code mandate:
  - `PROJECT_UNDERSTANDING.md` — product understanding, vision, short/long-term goals, risks, technical/UX/UI/AI/scalability recommendations, open questions.
  - `SYSTEM_ARCHITECTURE.md` — layered/Clean-Architecture-lite approach, multi-tenancy strategy (shared schema + `clinicId`), adapter/port boundaries for AI/payment/SMS/blog, AI layer design for Closer AI / Oracle AI.
  - `FOLDER_STRUCTURE.md` — concrete Next.js 15 feature-module layout.
  - `DESIGN_SYSTEM.md`, `UI_GUIDELINES.md`, `UX_GUIDELINES.md` — visual/interaction standards benchmarked against Apple, Stripe, Linear, Vercel, Raycast.
  - `CODING_STANDARDS.md`, `API_GUIDELINES.md`, `DATABASE_GUIDE.md`, `COMPONENT_GUIDE.md`, `DEPLOYMENT_GUIDE.md` — engineering conventions.
  - `CLAUDE.md` — standing engineering directives auto-loaded for AI-assisted development in this repo.
  - `README.md` — project entry point and document map.
- Persisted `VISION.md` and `ROADMAP.md` to the repository (previously only shared as conversation context).
- `CLAUDE.md` extended with standing CTO-mindset directives (3-year maintainability lens, explain-before-major-change, zero intentional tech debt, premium UI bar, no unnecessary dependencies); `PROJECT_UNDERSTANDING.md` §9 updated to name the explicit design benchmark (Apple, Stripe, Linear, Vercel, Raycast).

### Added — 2026-07-01 (design research)

- `CONTENT_INVENTORY.md` — real content extracted from Dr. Sadighi's current live site (dralirezasadighi.com): credentials, services, contact/hours, testimonials, existing before/after cases, blog topics.
- `DESIGN_SYSTEM.md` §9 — Reference Benchmarks: real Awwwards-caliber sites reviewed (Royal Clinic, Badrutt's Palace Hotel, Aesthetics Clinic) and explicit anti-patterns to avoid (Demophorius, the current live site, drwilliammiami.com, WebGL-spectacle-tier Awwwards sites).

### Decided

- Backend/data store: PostgreSQL + Prisma on a dedicated Iranian VPS.
- Multi-tenancy: single-tenant execution for Dr. Sadighi's clinic now, tenant-ready data model (`clinicId` on all tenant-owned tables) for future multi-clinic SaaS.
- AI provider access routed through an internal AI Gateway/proxy — no direct calls to OpenAI/Anthropic from Iran-hosted infrastructure.
- Dr. Sadighi is a real, signed client — the platform is built against his real content/brand, not a generic placeholder.
- **Data model correction**: added a `Location` entity (DATABASE_GUIDE.md) after discovering the real client operates two physical locations (Tehran and Tabriz) under one clinic/brand.
- **Design direction**: warm luxury-heritage color register (Royal Clinic / Badrutt's Palace inspired) over clinical-monochrome; motion tier set to cinematic GSAP scroll-storytelling with at most one restrained WebGL accent in the Hero — explicitly not Awwwards-flagship WebGL-spectacle tier.

### Open

See `PROJECT_UNDERSTANDING.md` §13 for unresolved decisions (payment gateway, SMS provider, patient auth strength, medical-record data scope, Sentinel's role in this product, Oracle AI competitor list) blocking parts of the implementation. Additionally: Tehran clinic address/hours, high-resolution real photography, and final brand assets (logo/colors) are needed from the client — see `CONTENT_INVENTORY.md` §7.
