# Codex Project Handoff

Last reconciled: 2026-09-09  
Repository: Nextuply Smart Beauty Clinic Platform — Dr. Alireza Sadighi  
Production: https://dralirezasadighi.com  
Production host: `185.204.170.44`  
Production project path: `/opt/nextuply/apps/sadighi`

This document records evolving implementation state. Permanent operating rules live in the root `AGENTS.md`; product scope and design authority live in `Nextuply_Smart_Beauty_Clinic_Project_Documentation_FA.docx`.

## Executive status

The repository is an active production application, not a pre-implementation scaffold. It currently delivers a premium FA/EN/AR public website, conservative PWA, unified Smart Clinic Assistant, consultation/booking-request flow, WordPress/SEO migration infrastructure, and lightweight internal operations.

At reconciliation:

- Branch `main` matched `origin/main` at `a8400ee` (`feat: add minimal PWA support`).
- The public production site and localized Health Tourism routes were previously verified live.
- The exact deployed SHA, current container/database health, integrations, disk headroom, and backup state were not revalidated during this documentation-only onboarding.
- No product code, dependency, production data, commit, deployment, or Git history was changed.

## Current implementation

### Public experience

- Story-led homepage with Hero, Smart Clinic Assistant, featured services, doctor positioning, case gallery, treatment journey, patient stories, Knowledge Center, Video Hub, FAQ, and footer.
- About, contact, service index, eight primary service families, and facial-cosmetic procedure detail routes.
- Before/After gallery and care-instruction routes. The gallery publishes **40 real cases across 5 categories** from `content/before-after-cases.ts` (the single source of truth): 24 from the 2026-08-25 legacy upload served out of `public/media/before-after/`, plus 16 imported on 2026-09-25 and served as metadata-free WebP from `public/images/before-after/<treatment>/case-NN/`. Cases are paired strictly by numeric filename suffix; the 2026-09-25 batch had no incomplete pair and added the temporal/face-lift category.
- Knowledge Center with 40 migrated articles; translations exist only where content has been prepared.
- Health Tourism overview, visa, hotel, and transfer routes in FA/EN/AR; these are real localized pages, linked in the footer and represented in the sitemap.
- Persian public URLs are bare-root; English and Arabic remain prefixed.
- **Install experience (added 2026-09-25, per Hamid's brief):** a premium install bottom sheet plus a persistent «نصب اپلیکیشن» entry in the footer's راهنما column, built on the existing manifest/service worker without replacing them. Auto-promotion is mobile-only, ~5s after hydration or shortly after the first meaningful interaction, suppressed for 7 days on dismissal, never on `/{locale}/internal/*`, and never shown when the app already runs standalone. The native prompt is only ever invoked from an explicit CTA press; iOS gets a three-step manual instruction view instead, and browsers with no working install path show no CTA at all. The `fa` copy is Hamid's exact wording; `en`/`ar` mirror it in each locale's register.
- **Locale-aware install (added 2026-09-25, same round):** each locale links its own manifest — `fa` → `/manifest.webmanifest` (the static file), `en` → `/en/manifest.webmanifest`, `ar` → `/ar/manifest.webmanifest` — so an install launches the language it was started from. Manifest data lives in `src/core/pwa-manifest.ts`; the EN/AR manifests are prerendered per locale by `src/app/[locale]/manifest.webmanifest/route.ts`. `id`/`scope` remain `/` so it is still one app (no duplicate icons), `/fa/manifest.webmanifest` still 404s, and `[locale]/layout.tsx` now uses `generateMetadata` to resolve the per-locale `manifest` and iOS home-screen title.

### Smart Clinic Assistant

- One public assistant surface only; Oracle and Closer are not public identities.
- Local/deterministic service, urgency, safety, and handoff routing before AI.
- OTP-gated free-text AI and booking submission.
- Six-digit OTP, scrypt hash, five-minute expiry, attempt limits, digit normalization, and non-production-only development bypass.
- Assistant sessions are validated server-side.
- Consultation/booking requests persist leads, triage answers, booking requests, payment drafts, assistant messages, and SMS event records through Prisma when the database is configured.
- Booking status begins as requested; staff confirmation remains manual.
- Availability expands recurring weekly slots across a near-term date window and accounts for active request statuses.
- Payment integration is not live; `PaymentDraft` is preparatory and remains pending.
- OTP supports Melipayamak. General lifecycle SMS remains a no-op, while n8n notifications are fire-and-forget.
- AI calls go through an internal gateway boundary; direct provider fallback is structurally non-production.

### Internal operations

- Explicit `/fa/internal/...` routes for login, dashboard, leads/transcripts, appointments, availability, gallery, users, and settings.
- OWNER and SECRETARY roles plus an emergency bootstrap-token path.
- Server-rendered internal pages validate authenticated actors.
- Owner-only user management; appointment status/notes and availability CRUD are implemented.
- This is an internal-management foundation, not a full CRM, portal suite, or complex RBAC implementation.

### Stack and deployment

- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4.
- Framer Motion for component motion and GSAP/ScrollTrigger for the treatment journey.
- Prisma 6 and PostgreSQL.
- Next.js Server Actions.
- Four-stage Node 22 Alpine Docker image, non-root runtime, and explicit image-cache ownership.
- Production Docker Compose with isolated application/PostgreSQL services and Nginx Proxy Manager upstream networking.
- PostgreSQL data is bound under `/opt/nextuply/data/postgres/sadighi`; never prune or remove it.

## Major architectural decisions

1. **FA-root localization:** the source route tree is `[locale]`, but middleware rewrites bare Persian public URLs internally and redirects public `/fa` URLs to bare equivalents. Internal routes remain explicit `/fa/internal/...`.
2. **One Assistant Principle:** a single digital clinic reception is public. Possible future Oracle/Closer capabilities remain internal and unified behind it.
3. **Server-first public site:** public content and Knowledge resolution stay server-side where practical; interactive sections use narrow client boundaries.
4. **Static editorial content:** services, care guidance, and Knowledge content remain typed in source until a CMS has an approved need and authoring workflow.
5. **Explicit clinic scoping:** current repositories accept/use `clinicId`; `DEFAULT_CLINIC_ID` is the temporary single-clinic resolver. This is not full multi-tenant isolation.
6. **Verified assistant access:** server-side OTP/session validation gates costly AI and real submissions.
7. **AI boundary:** production AI belongs behind the internal AI Gateway, with minimal structured PII in its payload.
8. **Manual booking confirmation:** the assistant submits requests; it does not promise confirmed appointments or calendar ownership.
9. **Conservative PWA:** offline shell/static assets only, with internal/data/action/media traffic excluded. Install promotion sits on top of that unchanged base, is patient-facing routes only, and is never automatic — see the install-experience note under Public experience.
10. **Performance over framework purity:** native anchors remain on specific homepage links because Next navigation failed under video connection pressure.

## Verified production history

Facts carried forward from prior production verification unless newer evidence contradicts them:

- `manifest.webmanifest` (Persian, static), the generated `/en`/`/ar` manifests, `sw.js`, `offline.html`, and 192/512/maskable icons are live; the service worker was activated and running.
- Hero uses an optimized WebM (repository file 3,362,718 bytes) plus MP4 fallback (5,466,224 bytes); the ~20.5 MB original remains preserved as source. No hero poster is intended.
- Video Hub uses optimized sources.
- Heavy service/gallery assets were optimized.
- Knowledge homepage data was moved server-side, below-fold sections were split, and `AssistantDrawer` was deferred.
- Native anchors fixed unreliable performance-critical homepage navigation.
- Production disk once reached 99%, causing Docker/Next image-cache `ENOSPC` failures. Unused image/build cache was pruned safely; database volumes were not touched.
- Health Tourism routes are real, localized, linked, and live—not placeholders.

## Important recent commits

| Commit | Purpose | Behavior to preserve |
|---|---|---|
| `a8400ee` | Minimal PWA support | Conservative caching and internal/action/media exclusions |
| `3a73123` | Homepage navigation/UI fixes | Working Hero/doctor CTAs and route-aware header behavior |
| `4d5f4f9` | Video Hub optimization | Never restore the 20.5 MB source to repeated playback |
| `6389cba` | Mobile blocking-time reduction | Server Knowledge resolution, section splitting, lazy drawer |
| `29e990f` | Service/gallery image optimization | Keep optimized asset references and approved imagery |
| `7fbff63` | Hero video optimization | WebM/MP4 sources, original preserved, no audio/poster regression |
| `c3c5bad` | Reliable homepage navigation | Preserve native anchors where connection pressure broke Next links |
| `46ee840` | Health Tourism sitemap expansion | Keep all locale variants discoverable |

Other high-impact recent history:

- `1a133ae`: urgent rollback of the unwanted hero poster and jaw-image swap.
- `295cad3`: Docker image-cache ownership and production performance fixes.
- `a464798`: scroll-snap, assistant navigation, and procedure hero corrections.
- `6c61d99`: assistant Back/Menu UX, facial-cosmetic hierarchy, and patient-story rebuild.
- `7be3d4f`: Knowledge migration Batch 2.
- `677ce7d`: legacy redirect audit and `/contact` loop correction.
- `0d7a0ec`: Persian root routing, multilingual Knowledge, and legacy migration foundation.
- `148dff0`: mobile horizontal-overflow and iOS blank-scroll correction.
- `958e8a8`: internal-operations foundation.
- `7068972`: urgency and safety router ahead of normal matching.

## SEO and migration status

- The current legacy redirect table contains approximately 280 entries; an older comment says 278.
- Canonical host/protocol normalization and legacy redirects are designed to avoid redirect chains and self-loops.
- Forty migrated Knowledge articles are present (25 in the first batch, 15 in the second), plus the clinic-supplied S-Lift article implemented in FA/EN/AR. The S-Lift Persian source remains `needs-doctor-review`; both translations remain `translated-needs-review`.
- All migrated medical articles remain marked `needs-doctor-review`.
- English translations exist for roughly 28 articles and Arabic for roughly 26; translated medical copy also needs review.
- Batch 3/4 planning lists roughly 55 additional migration candidates, plus content that requires business/medical decisions, merging, redirect-only handling, or rejection.
- Route-level metadata coverage is incomplete; several EN/AR route families inherit Persian metadata.
- `metadataBase` is absent.
- Sitemap coverage omits at least the service index and Before/After index.
- Robots rules protect internal routes but do not explicitly declare the sitemap.
- Knowledge article/FAQ/breadcrumb schema exists; sitewide clinic/service/procedure schema remains incomplete. An uncommitted work-tree change (SEO-01, 2026-09-13) adds `MedicalProcedure` + `BreadcrumbList` JSON-LD to `/services/[slug]` and the facial-cosmetic procedure routes, a `Service → related Knowledge` editorial block on those same pages, and a shared `preferredMetaDescription` policy; the facial-cosmetic hub deliberately stays breadcrumb-only because it is a hub, not a procedure.
- Privacy-safe native GA4 measurement is implemented in the working tree for public production pages only, gated by `NEXT_PUBLIC_GA_MEASUREMENT_ID`. It uses manual canonical App Router page views and seven allowlisted events; it has not been committed or deployed. Because `gtag.js` survives a same-document App Router transition after the public analytics component unmounts, the shared route boundary now flips Google's documented `ga-disable-<measurement-id>` transmission switch on every internal route. A production-runtime browser probe verified zero attempted GA requests on both a fresh authenticated internal load and a public → authenticated-internal SPA transition (including delayed scroll, outbound-click, and custom-event probes), while the public page view still transmitted. Production still requires the GA4 Enhanced Measurement history-event page-view toggle to be disabled and a separate cookie/consent review.

## Known open issues

### Integrity and security

- A homepage Patient Journey CTA still appears to link to `/booking`, but no booking route exists. Prefer opening the existing assistant with booking intent unless a distinct route is explicitly approved.
- Booking submission can return success with `persisted: false`; a patient may see a success state after a database failure.
- Availability capacity is calculated before submission without a transactional capacity recheck, allowing a concurrency race.
- Assistant sessions have no production expiry.
- Some internal write Server Actions do not independently enforce `requireInternalActor` and role authorization.
- Staff/clinic scoping is incomplete: `DEFAULT_CLINIC_ID` and some globally scoped internal-user operations are single-clinic shortcuts.
- Emergency bootstrap-token authentication, long-lived bearer sessions, missing audit logs, and limited rate limiting need hardening.
- Patient free text can contain PII/medical details even when structured PII fields are excluded from AI payloads.
- Application code does not itself prove encryption-at-rest, backup, or restore guarantees claimed by older documentation.

### Reliability and operations

- OTP provider, database round-trip, AI Gateway, and n8n delivery health require current production verification.
- n8n notifications are not backed by a durable queue/retry policy.
- Lifecycle SMS is not implemented beyond OTP provider support.
- AI lead-summary generation is awaited before persistence and can add gateway latency.
- Current disk monitoring, backup schedule, and restore-test evidence are unknown after the prior 99% disk incident.
- There is no general automated unit/integration/E2E suite; checked-in verification scripts cover only specific concerns.

### UX, content, and media

- Video Hub still reuses the hero video and contains provisional duration/content.
- Some Before/After and Knowledge media remains large; `public/` is approximately 184 MB. The 2026-09-25 imported before/after set is optimized (4.97 MB of WebP) but the older `public/media/before-after/` PNGs are not, and the imported source photos are only 1254×1254 — below `CONTENT_INVENTORY.md` §8's 2000 px minimum, so higher-resolution re-exports from the clinic remain worthwhile.
- Medical article content and translations require doctor review.
- Remaining WordPress content needs migration, merge, reject, or redirect decisions.

## Current priority queue

1. **Technical SEO hardening:** add a deliberate `metadataBase`; complete locale-correct route metadata, canonical/hreflang generation, sitemap/robots coverage, and MedicalClinic/MedicalProcedure/Breadcrumb schema where appropriate.
2. **Analytics production verification and privacy follow-up:** after an explicitly approved deployment, verify GA4 DebugView/Realtime, disable Enhanced Measurement history-event page views, and decide cookie/consent handling through legal/privacy review. Search Console integration remains separate.
3. **Broken route/link repair:** verify every public CTA and replace the `/booking` dead end with the existing assistant booking intent unless product direction changes.
4. **Booking/lead integrity:** make persistence failures truthful, reserve/check availability transactionally, and verify failure/retry behavior.
5. **Content migration and clinical review:** complete remaining WordPress decisions, optimize required media, and obtain doctor approval for medical content in all locales.

Security/session hardening and a read-only production health audit should be included alongside the relevant priority rather than deferred indefinitely.

## Incomplete current-scope items

- Complete localized technical SEO across every public route family.
- GA4 production configuration/verification and cookie-consent decision; Search Console integration remains separate.
- Eliminate the broken `/booking` destination.
- Production-safe booking persistence and concurrency handling.
- Current evidence for database, OTP, AI Gateway, n8n, backups, restore, disk monitoring, and deployed SHA.
- Remaining Knowledge/WordPress migration and doctor review.
- Real Video Hub content and remaining media optimization.
- Automated route, locale, assistant, persistence, and internal-permission regression coverage.

Excluded future modules—full CRM, Patient Journey, portals, EHR, finance, follow-up, medical AI, multi-branch, SaaS, complex RBAC, medical storage, and full audit logging—are not “incomplete current scope” and must not be pulled into this queue without a new approval/contract decision.

## Documentation reconciliation

- `README.md` and some early planning files describe a pre-implementation project; current code is deployed and production-oriented.
- `VISION.md`, `ROADMAP.md`, `PROJECT_UNDERSTANDING.md`, and ideal folder/architecture documents describe a much larger future platform. They are not authorization to build excluded modules.
- The authoritative Persian project document describes PostgreSQL, Prisma, auth, RBAC, storage, notifications, and AI Gateway as future backend concepts. The current code has already implemented a constrained subset for the assistant and internal foundation; that does not broaden the contracted product scope.
- Early locale ADRs are historical and explicitly superseded by the full FA/EN/AR rollout.
- `docs/deployment.md` contains both older “not provisioned/no Docker dependency” assumptions and later concrete Docker production procedures.
- Some code comments still claim that no backend, drawer, video compression, availability wiring, or SMS support exists; those comments are stale relative to implementation.
- Typography comments mentioning an IRANSans/Vazirmatn split are stale; current CSS effectively uses Vazirmatn.
- Older AI usage notes describe at most two calls, while the current verified flow can allow three conversation operations plus lead summarization.
- Generic architecture guidance proposed automatic tenant injection; ADR-0004 deliberately implemented explicit scoped repository functions first.
- Claims about encryption, CI, monitoring, daily backups, and restore drills should be treated as unverified until production evidence exists.

## Maintenance rule

Update this handoff after material releases, production incidents, architectural or scope decisions, migrations, or changes to the priority queue. Record facts separately from unverified assumptions, and keep permanent behavior/safety rules in `AGENTS.md` rather than duplicating an ever-growing prompt here.
