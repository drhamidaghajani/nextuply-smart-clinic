# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/); dates in `YYYY-MM-DD`.

## [Unreleased]

### Changed — 2026-07-02

- **Process change (critical)**: Hamid rejected the autonomously-designed homepage. New rule, written into `CLAUDE.md`: no page or section is designed without Hamid supplying his own reference first; work proceeds strictly section-by-section (Hero → each section → Header → Footer → internal pages), one at a time.
- **Typography correction**: headings use Vazirmatn, body text uses IranSans (not Vazirmatn for everything) — `DESIGN_SYSTEM.md` §3 updated; font files pending from Hamid, intake spec added at `CONTENT_INVENTORY.md` §9, folder `public/fonts/iransans/` created.
- Fixed a dev-server runtime error (`Cannot find module './vendor-chunks/motion-dom.js'`) by clearing the stale `.next` build cache and restarting — a known Next.js dev-mode cache issue, not an application bug.

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

### Added — 2026-07-01 (implementation start)

- `docs/adr/0001-project-bootstrap.md`, `docs/adr/0002-fa-first-locale-scope.md` — first ADRs, written before scaffolding per PROJECT_GUIDE.md §1.
- `HOMEPAGE_STORYBOARD.md` — 11-section homepage blueprint (emotion flow, per-section goals/CTAs/motion) implementing Hamid's design brief image.
- `DESIGN_SYSTEM.md` — final color palette locked in (cream/gold/charcoal/deep-navy), §9 Reference Benchmarks, glassmorphism guardrail.
- **Next.js 15 app actually scaffolded**: TypeScript, Tailwind v4 (tokens wired to DESIGN_SYSTEM.md), ESLint (flat config via `FlatCompat`), `framer-motion`, `gsap`, `zod`. `[locale]` routing (`fa`/`en`/`ar`) with middleware redirect to `fa`.
- Homepage built end-to-end for `fa`: all 11 HOMEPAGE_STORYBOARD.md sections as real components with real copy from CONTENT_INVENTORY.md where available, honest placeholders (not stock photos) where real media is pending. `npm run build` and `npm run lint` pass clean; production server smoke-tested (HTTP 200 on `/fa`).
- GSAP ScrollTrigger choreography (Doctor Story, Patient Journey, AI Experience per the Motion Timeline) intentionally deferred to a follow-up pass — current cut ships Framer Motion entrance animations only, to avoid shipping unreviewed scroll-jacking behavior in one blind pass.
- `CONTENT_INVENTORY.md` §8 — asset intake spec (folder paths, naming, technical specs) for the Hero video and Before/After photos.
- Git initialized (`main` branch), first commit made. Not yet connected to a GitHub remote — pending Hamid's confirmation of repo name/visibility.

### Decided

- Backend/data store: PostgreSQL + Prisma on a dedicated Iranian VPS.
- Multi-tenancy: single-tenant execution for Dr. Sadighi's clinic now, tenant-ready data model (`clinicId` on all tenant-owned tables) for future multi-clinic SaaS.
- AI provider access routed through an internal AI Gateway/proxy — no direct calls to OpenAI/Anthropic from Iran-hosted infrastructure.
- Dr. Sadighi is a real, signed client — the platform is built against his real content/brand, not a generic placeholder.
- **Data model correction**: added a `Location` entity (DATABASE_GUIDE.md) after discovering the real client operates two physical locations (Tehran and Tabriz) under one clinic/brand.
- **Design direction**: warm luxury-heritage color register (Royal Clinic / Badrutt's Palace inspired) over clinical-monochrome; motion tier set to cinematic GSAP scroll-storytelling with at most one restrained WebGL accent in the Hero — explicitly not Awwwards-flagship WebGL-spectacle tier.
- **Color palette finalized** (superseding the earlier brown/burgundy placeholder): cream/warm-white/gold/charcoal/deep-navy, per Hamid's supplied reference — see DESIGN_SYSTEM.md §2.
- **Next.js pinned to v15** — `create-next-app@latest` resolved to Next 16; downgraded to match the version documented in VISION.md/ADR-0001 rather than silently drifting to the newer major version. Flagged to Hamid for confirmation.
- **fa-first build scope** (`docs/adr/0002`): Persian content ships now; English/Arabic content will be supplied by Hamid to match the finished Persian structure, per his instruction.

### Open

See `PROJECT_UNDERSTANDING.md` §13 for unresolved decisions (payment gateway, SMS provider, patient auth strength, medical-record data scope, Sentinel's role in this product, Oracle AI competitor list) blocking parts of the implementation. Additionally: Tehran clinic address/hours, high-resolution real photography, and final brand assets (logo/colors) are needed from the client — see `CONTENT_INVENTORY.md` §7.
