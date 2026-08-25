# Phase-1 Implementation Plan — WordPress → Knowledge Center Migration

Planning only. Nothing in this document has been implemented, committed, or pushed. It describes what the next coding pass should build, once `manual-decisions-needed.md`'s open items are resolved.

## Overview

Phase 1 protects the 30 URLs identified in `../phase-1-plan/p0-launch-list.csv` (plus 3 urgent additions — see `legacy-redirects-spec.csv`) from SEO loss at domain relaunch: 23 become real Knowledge Center articles, 2 redirect to existing About/Contact pages, 1 (the homepage) needs no new rule, and the rest are either resolved redirects to existing service pages or blocked pending the decisions in `manual-decisions-needed.md`. Everything here is additive — no existing route, page, or component is redesigned; new content slots into the visual language the Knowledge Center pages already established (see Article template strategy).

## What will be implemented in Phase 1

1. A legacy-URL redirect layer in `src/middleware.ts`, resolving all 33 `legacy-redirects-spec.csv` rows in a single hop, before the existing locale-prefix redirect.
2. A real Knowledge Center content model (`src/content/knowledge-articles.ts`, pending confirmation of decision #6 in `manual-decisions-needed.md`) holding the 23 phase-1 articles, replacing today's 3-article demo data.
3. `generateMetadata`, JSON-LD (Article/MedicalWebPage + FAQPage + BreadcrumbList), and canonical-URL emission on the article page.
4. A `sitemap.ts` covering the real, live routes (services, care-instructions, about, contact, and the new knowledge articles).
5. Article hero images sourced for the 21 of 23 articles that had a WordPress thumbnail on record (2 need a fresh image — see `phase-1-article-import-list.csv`).

**Not implemented in phase 1:** the remaining ~155 WordPress posts/pages, en/ar article translations, a tag/category browsing UI, or any CMS/admin authoring tool — see "Out of scope" below.

## Files likely to be added/modified in the Next.js repo

**New:**
- `src/content/knowledge-articles.ts` — the 23-article content model (pending decision #6).
- `src/content/legacy-redirects.ts` — `Record<string, string>` of old pathname → new pathname, the single source of truth `src/middleware.ts` consults (generated from `legacy-redirects-spec.csv`, not hand-retyped).
- `src/lib/seo/structured-data.ts` (or similar) — small pure functions building the Article/MedicalWebPage, FAQPage, and BreadcrumbList JSON-LD objects from an article. No JSON-LD exists anywhere in the codebase today; this is genuinely new surface, kept as plain data-shaping functions, not a schema library dependency.
- `src/app/sitemap.ts` — Next.js metadata-route sitemap generator (only `robots.ts` exists today; no sitemap at all yet).
- `src/components/page/medical-review-badge.tsx` — small presentational component for the "reviewed by Dr. Alireza Sadighi" byline (reused across all 23 articles, not duplicated markup per article).
- `src/components/page/aparat-embed.tsx` — thin `<iframe>` wrapper for Aparat's own embed URL contract, defined now even though 0 of the 23 phase-1 articles use it (see `knowledge-article-model.md`), so the first video-bearing article in a later phase doesn't need new plumbing.

**Modified:**
- `src/middleware.ts` — add host/protocol canonicalization + legacy-path lookup, both running before the existing bare-path → `/fa` redirect (see Redirect middleware strategy).
- `src/i18n/dictionary-types.ts` — `KnowledgeArticle`/`KnowledgePageDictionary` interfaces updated: page-level chrome stays, per-article fields move to the new content model (mirrors the existing chrome/content split already used for services and care-instructions).
- `src/i18n/dictionaries/fa.ts` — `knowledge` section shrinks to chrome only; the 3 demo articles are removed once real content replaces them.
- `src/app/[locale]/knowledge/[slug]/page.tsx` — reads from the new content model, gains `generateMetadata`, JSON-LD emission, medical-review byline, and (only where present) FAQ + Aparat embed rendering. Layout grammar (PageHero, Reveal, breadcrumb, related-articles grid) is **kept as-is**, not redesigned.
- `src/app/[locale]/knowledge/page.tsx` — needs to render 23 articles instead of 3. **This is flagged, not silently done**: CLAUDE.md's section-by-section design rule means the index page's visual layout for 23+ items (pagination? topic filtering? the current "1 featured + rest in a grid" pattern probably doesn't scale as-is) needs Hamid's reference before any redesign. The safe, non-redesigning phase-1 default is to extend the existing `EditorialCardGrid` with all 23 items and no pagination — functionally correct, visually unreviewed — and treat any further layout change as its own follow-up needing a design reference, same as every other section in this project.
- `src/content/services.ts` / `care-instructions.ts` (possibly) — if service pages should gain a "further reading" list pulled from `relatedServices`, that's a small addition to how those pages render, not to their taxonomy data.

**Not modified:** `next.config.ts` (redirects stay in middleware, not Next's static `redirects()` — see below), Prisma schema (no DB involvement — see Knowledge Center route strategy), any `/internal/*` route or auth flow.

## Redirect middleware strategy

Two checks are added to `middleware()` in `src/middleware.ts`, both running **before** the existing `if (hasLocalePrefix(pathname))` / bare-path-to-`/fa` logic, and both resolving in a single hop (never chaining two redirects for one request):

1. **Host/protocol canonicalization** — if `request.nextUrl.hostname !== "dralirezasadighi.com"` (catches `www.`) or `request.nextUrl.protocol !== "https:"`, rebuild the URL on the canonical host/scheme, **carrying the resolved pathname from step 2** if applicable, and redirect once. This is a general rule (any non-canonical host/scheme), not a single hardcoded string match — see decision #5 in `manual-decisions-needed.md`.
2. **Legacy-path lookup** — normalize the incoming pathname (strip trailing slash, since every WordPress URL in the export ends in `/` but Next's own routing is trailing-slash-sensitive) and look it up in `src/content/legacy-redirects.ts`. A hit redirects (301) straight to the new path; a miss falls through to the existing locale-prefix logic unchanged.

```ts
// illustrative shape, not final code
export function middleware(request: NextRequest) {
  const canonicalRedirect = resolveHostCanonicalization(request); // step 1
  const legacyRedirect = resolveLegacyPath(request.nextUrl.pathname); // step 2
  if (canonicalRedirect || legacyRedirect) {
    const target = legacyRedirect ?? canonicalRedirect!.pathname;
    return NextResponse.redirect(buildCanonicalUrl(target), 301);
  }
  // ...existing hasLocalePrefix / internal-route / bare-path logic, unchanged
}
```

All redirects are **301** (per this task's explicit instruction) via `NextResponse.redirect(url, 301)`. The existing `matcher` (`/((?!_next|.*\\..*).*)`) already covers every legacy WordPress path (none contain a dot or `_next`), so no matcher change is needed.

**Sequencing constraint (from `legacy-redirects-spec.csv`'s `notes` column):** a redirect rule for a `migrate-to-knowledge-center` row must not go live before that article is actually published — enabling the rule first turns a working old page into a 301 to a 404. The `legacy-redirects.ts` map should be populated incrementally, article-by-article, not all at once on day one, unless every article ships simultaneously.

## Knowledge Center route strategy

The existing `/{locale}/knowledge` and `/{locale}/knowledge/[slug]` routes are kept — no new route segment is introduced. `generateStaticParams` continues to statically pre-render every article at build time (matches this repo's existing all-static-content pattern; no dynamic DB-backed rendering is introduced). Content stays in a typed TypeScript file (`src/content/knowledge-articles.ts`), not Postgres — even though Prisma/Postgres is already wired up elsewhere in this repo (bookings, leads), pulling 23 static articles into the DB now would be new CMS-shaped infrastructure with no authoring UI to justify it yet, directly against CLAUDE.md's "do not build a full CMS yet."

## Article template strategy

The current `[slug]/page.tsx` layout (`PageHero` with breadcrumb, `Reveal`-animated content, `EditorialCardGrid` for related articles, closing `AssistantCtaSection`) is **already the approved premium/editorial grammar** for this route (see its own doc-comment: "brings every internal page's opening moment up to the same bar as the homepage sections"). Phase 1 extends this template rather than replacing it:

- `contentSections` render as heading + paragraph blocks inside the same `max-w-xl` reading column already used.
- `medicalReview` renders as a small badge/byline near the top of the article (new `MedicalReviewBadge` component) — this is the one genuinely new visual element, and per CLAUDE.md's section-by-section rule, its exact treatment (badge shape, placement, icon vs. text) should get a quick visual check with Hamid before finishing, even though it's small — not treated as an autonomous design call.
- `faq` (where present) renders as a simple accordion or stacked Q&A list — reuse the visual pattern already established for care-instructions' `PageFaqItem` rendering rather than inventing a new one.
- `aparatEmbeds` (none in phase 1, but modeled) render as a responsive `<iframe>` inside the reading column, same width as the hero image.
- The **Smart Clinic Assistant CTA at the bottom stays exactly as-is** (`AssistantCtaSection`, `intent="articles"`) — this is the only assistant-related UI on the page, named correctly per this task's constraint (public site refers to "Smart Clinic Assistant," never Oracle/Closer).

## SEO metadata strategy

`generateMetadata` on `[slug]/page.tsx` (new — the route has none today) emits:
- `title`: `article.seoTitle`
- `description`: `article.seoDescription`
- `alternates.canonical`: `${SITE_URL}/fa/knowledge/${slug}` — requires a canonical site-URL constant, which doesn't exist anywhere in the codebase yet (no `metadataBase` is set in any layout). Adding one (e.g. `NEXT_PUBLIC_SITE_URL` or a shared constant) is itself a small new piece of shared infrastructure, needed by this, the sitemap, and JSON-LD `@id` fields alike — implement once, reuse everywhere, not three separate hardcoded strings.
- `openGraph`: title/description/image from `heroImage`, `type: "article"`.

Rank Math data is reused where present (`phase-1-article-import-list.csv`'s `seo_title_source`/`seo_description_source` — 13 of 23 articles have none and need fresh copy authored, not scraped/generated).

## Schema strategy

One `<script type="application/ld+json">` per article, combining multiple types via `@graph` (no JSON-LD exists anywhere in this codebase today — this establishes the pattern, not a full site-wide schema rollout):

- **`MedicalWebPage`** for genuinely clinical/procedural articles, **`Article`** for the few informational/brand pieces (per-article `structuredDataType`) — includes `medicalAudience`, `about` (linking the procedure), `reviewedBy` (Physician, name "دکتر علیرضا صدیقی"), `datePublished`/`dateModified`.
- **`FAQPage`**, additive, only emitted when `article.faq` is non-empty.
- **`BreadcrumbList`**, always emitted, derived from the same `Home → Knowledge Center → {title}` structure the visible `PremiumBreadcrumb` already renders — one source of truth for the breadcrumb text, two representations (visual + schema) generated from it, not authored twice.

No `Physician`/`MedicalOrganization` top-level schema is added to the About page or site-wide in phase 1 — that's a separate, broader SEO pass, out of scope here (see below).

## Sitemap strategy

New `src/app/sitemap.ts` (Next.js metadata route → `/sitemap.xml`), listing only routes with real content today: homepage, the 8 service pages (`getServiceHref`), the 9 care-instruction pages (`getCareInstructionHref`), about, contact, and the 23 phase-1 knowledge articles (once published) — generated from each content file's existing exported list, not hand-duplicated. `en`/`ar` routes are excluded for now per the ADR-scoped minimal-locale rollout (no point submitting placeholder-content pages to Google). `lastModified` uses each article's `updatedAt`.

## Testing checklist

- [ ] Every row in `legacy-redirects-spec.csv` with `priority: P0` resolves in exactly one hop (curl `-I` from the old URL, confirm a single `301` straight to the expected `new_path`, not a redirect chain).
- [ ] No redirect loop is introduced (a legacy path whose target itself 404s or re-redirects).
- [ ] The `www`/`http` canonicalization rule is tested against all four host/scheme combinations, not just the one Search Console happened to index (see decision #5).
- [ ] Existing behavior is unbroken: `/internal/*` auth guard, the bare-path → `/fa` redirect for genuinely new (non-legacy) paths, and the `/api` passthrough — all regression-tested since `src/middleware.ts` is being edited directly.
- [ ] Every migrated article's JSON-LD validates (Google's Rich Results Test or an offline schema.org validator) for at least one `MedicalWebPage` + `FAQPage` example and one plain `Article` example.
- [ ] `sitemap.xml` includes all 23 new article URLs and zero legacy WordPress URLs.
- [ ] Canonical tags point to the new `/fa/knowledge/...` URL on every migrated article, never the old WordPress URL.
- [ ] `robots.txt` behavior is unchanged (`/internal/*` still disallowed).
- [ ] RTL layout, Vazirmatn/IRANSans fonts, and existing motion (`Reveal`) render correctly on the new article sections — no visual regression against the already-approved editorial grammar.
- [ ] Manual click-through of all 30 P0-LAUNCH old URLs on a staging deploy, end to end, before cutover.
- [ ] Lighthouse/performance spot-check on an article with a hero image (and, once relevant, an Aparat embed) — video embeds are a common performance regression source.

## Rollback notes

- No destructive or DB-schema changes are involved — content lives in a typed TypeScript file, redirects live in a typed data file consulted by middleware. Rollback is a standard git revert + redeploy, nothing to unwind at the infrastructure level.
- Because the redirect map is application-level (not DNS/CDN-level aliasing), a single wrong rule is a one-line data-file fix + redeploy, not an infra change.
- Recommend keeping the WordPress install/DB reachable (read-only, off public DNS) for a period after cutover, specifically to re-check content for any of the `manual-decisions-needed.md` items if a decision needs revisiting after launch.
- If a redirect is enabled before its destination article is ready (the sequencing risk noted above), the fix is either to fast-track the article or temporarily remove that one map entry — not a full rollback.

## What is intentionally out of scope

- The remaining ~155 WordPress posts/pages not in the P0-LAUNCH list (phases 2+, per `../migration-summary.md`'s P1/P2/P3 buckets).
- English/Arabic Knowledge Center article content — the model supports it structurally later, but no en/ar copy is written in phase 1.
- Any tag/category browsing UI on the new site (tag-archive traffic is redirected to the closest existing page instead, per `manual-decisions-needed.md` item 3).
- A CMS or admin authoring UI for articles — content is edited via PR like every other `content/*.ts` file in this repo.
- An automated WordPress-to-Next.js content importer/script — the 23 articles are migrated by hand from the WXR export, per `phase-1-article-import-list.csv`'s per-article notes.
- Self-hosting or re-encoding video — Aparat embeds (when they appear in later phases) stay as Aparat embeds.
- Site-wide `Physician`/`MedicalOrganization` schema, or resolving the 6 open decisions in `manual-decisions-needed.md` themselves — this plan describes what happens once those are resolved, not the resolution.
- DNS/domain cutover and WordPress decommissioning.
- Any UI surface for Oracle or Closer — neither is referenced anywhere in this plan; the only AI-facing UI touched is the existing Smart Clinic Assistant CTA, unchanged.
