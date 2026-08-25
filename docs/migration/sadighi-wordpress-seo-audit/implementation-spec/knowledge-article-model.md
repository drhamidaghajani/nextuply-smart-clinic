# Knowledge Center Article Content Model — Phase 1

Planning only — no code written yet. This defines the shape phase-1 implementation should build toward; it is not itself a TypeScript file to paste in.

## Why this needs a new content source (an architectural call-out, not a silent decision)

Today's `/fa/knowledge/[slug]` route already exists (`src/app/[locale]/knowledge/[slug]/page.tsx`), but it reads from **3 hardcoded demo articles inline in `src/i18n/dictionaries/fa.ts`** (`KnowledgeArticle`: `slug`, `category`, `readTime`, `title`, `summary`, `body: string[]` — see `src/i18n/dictionary-types.ts:662`). That shape has no `seoTitle`/`seoDescription`, no FAQ, no hero image, no legacy-URL mapping, no medical-review attribution, no video embed, and no structured-data hooks — it was sized for 3 placeholder pieces, not 23 real medical articles with SEO history to protect.

Every other content taxonomy in this repo (`content/services.ts`, `content/care-instructions.ts`) keeps its **identity/taxonomy** in a dedicated `content/*.ts` file, but still keeps rich **per-locale body copy** inside `fa.ts`/`en.ts`/`ar.ts` as literal `as const` strings (see `CareTopicDetail` in `dictionary-types.ts:687` — the interface lives centrally, but the actual before/after/FAQ text for all 9 topics is typed data inside `fa.ts`). Following that pattern literally for 23 articles — each with a hero, several content sections, an FAQ, possibly a video embed — would add several thousand lines of medical prose directly into the already-large `fa.ts` dictionary object.

**This is exactly the kind of decision CLAUDE.md's Standing CTO Directives ask to be explained before implementing** (a new content-source shape counts as touching the folder structure/content-modeling convention). The recommendation below is not yet approved — it should be confirmed with Hamid before the first article is coded:

**Recommendation: a dedicated `src/content/knowledge-articles.ts`**, following the `services.ts`/`care-instructions.ts` split — but going one step further than care-instructions by keeping the *body content itself* there too (not in `fa.ts`), because at 23 articles (growing toward the full 185-item backlog across later phases) the volume genuinely justifies its own file, whereas 9 care topics' before/after copy did not yet cross that line when that decision was made. `fa.knowledge` in the dictionary shrinks to page-level chrome only (`eyebrow`, `heading`, CTA strings — the same role `CareInstructionsPageDictionary`'s top-level fields already play), matching the existing "chrome in the dictionary, identity/content in `content/`" split rather than inventing a third pattern.

## Field-by-field model

```ts
interface KnowledgeArticle {
  /** URL segment under /{locale}/knowledge/[slug] — Persian, preserved verbatim from the
   *  original WordPress permalink wherever it was already a real (non-auto-generated) slug,
   *  per phase-1-article-import-list.csv's `proposed_slug`. Locale-scoped: en/ar articles
   *  (out of scope for phase 1) would get their own slugs, not a transliteration of this one. */
  slug: string;

  /** Every WordPress URL that must 301 here after migration — the redirect source of truth
   *  for this article, cross-checked against legacy-redirects-spec.csv rather than duplicating
   *  the mapping in two places by hand. Almost always length 1; length 2 for an article that
   *  absorbs a resolved collision (e.g. blepharoplasty, once post_id 7212 is confirmed
   *  canonical — see collision-review.md) or a renamed/historical permalink variant
   *  (unmatched-gsc-priority.csv's `redirect-to-knowledge-article` rows). */
  legacyUrls: readonly string[];

  /** Persian display title (H1). Editorial, not necessarily identical to seoTitle. */
  title: string;

  /** <title> tag content — reuse rank_math_title from wordpress-content-inventory.csv where
   *  present and under ~60 chars; author fresh where empty (13 of 23 phase-1 articles have no
   *  rank_math_title — see phase-1-article-import-list.csv's seo_title_source column). */
  seoTitle: string;

  /** Meta description, ~150-160 chars. Same reuse-or-author rule as seoTitle. */
  seoDescription: string;

  /** 1-2 sentence dek shown on the Knowledge Center index/related-article cards
   *  (same role as today's KnowledgeArticle.summary). Distinct from seoDescription —
   *  editorial voice for humans, not search-snippet-optimized. */
  excerpt: string;

  /** One of the 12 topic_cluster values already established in the stage-1/2 audit
   *  (migration-map-draft.csv) — reused here, not a new taxonomy. Drives which service
   *  page(s) this article cross-links to via relatedServices. */
  topicCluster:
    | "orthognathic-surgery" | "advanced-dental-implant" | "impacted-tooth-surgery"
    | "rhinoplasty" | "facial-cosmetic-surgery" | "blepharoplasty"
    | "facial-trauma-surgery" | "care-instructions" | "doctor-profile"
    | "clinic-info" | "general-dental" | "uncategorized";

  /** Which existing ServiceTaxonomyId (content/services.ts) this article supports —
   *  optional because doctor-profile/clinic-info/general-dental articles have none.
   *  Drives the "related service" CTA and the service page's own "further reading" list
   *  (the inverse link — service page → article — should be a computed lookup over this
   *  field, not a second hand-maintained list). */
  serviceRelation?: ServiceTaxonomyId;

  /** Medical review attribution — every migrated medical article needs a visible,
   *  schema-carrying claim that Dr. Alireza Sadighi reviewed the content, both for
   *  patient trust (DESIGN_SYSTEM.md's "medical-trust" bar) and for Google's medical-content
   *  E-E-A-T signals (see Schema strategy in implementation-plan.md). */
  medicalReview: {
    reviewerName: "دکتر علیرضا صدیقی";
    reviewerCredentialsRef: "about"; // links to the About page's credential detail, not duplicated text
    reviewedAt: string; // ISO date — set at actual review time, not import time
  };

  /** ISO date strings. publishedAt should carry over the original WordPress post_date
   *  where the article is a faithful migration (preserves apparent content age/authority
   *  signal); updatedAt is set fresh whenever the migrated copy is edited going forward. */
  publishedAt: string;
  updatedAt: string;

  /** Precomputed at author time (word count / ~200wpm for Persian), not derived at
   *  render time — avoids a body-parsing dependency for a cosmetic label. e.g. "۶ دقیقه مطالعه". */
  readingTime: string;

  /** Local path under public/media/knowledge/<slug>/, following the existing
   *  public/media/care-instructions/<slug>.png convention. See "Media" note below —
   *  WordPress thumbnail_ids are on record but the actual files were not exported and
   *  must be re-sourced (phase-1-article-import-list.csv's needs_media_import column). */
  heroImage: { src: string; alt: string };

  /** The article body, broken into typed sections rather than one opaque HTML/markdown
   *  blob — matches this codebase's existing pattern of structured, typed content
   *  (CareTopicDetail's discrete beforeCare/afterCare/warningSigns arrays) over a rich-text
   *  field, and avoids introducing an MDX/markdown rendering dependency (none exists in
   *  package.json today — CLAUDE.md's "avoid unnecessary libraries" rule). A heading + one
   *  or more paragraphs per section is sufficient for this content; no need for a richer
   *  block-editor schema at 23-article scale. */
  contentSections: readonly {
    heading?: string;
    paragraphs: readonly string[];
  }[];

  /** Optional — omitted entirely for articles with no natural Q&A structure. Renders as
   *  visible FAQ UI (reusing the existing PageFaqItem-style pattern already used in
   *  care-instructions) AND feeds FAQPage schema (see Schema strategy). Several phase-1
   *  articles are literally titled "۲۵ سوال متداول در مورد..." (25 FAQs about...) in the
   *  original WordPress content — those are the clearest FAQ-schema candidates and should
   *  be restructured into this field rather than left as body paragraphs. */
  faq?: readonly { question: string; answer: string }[];

  /** Aparat video embeds the article depends on. Confirmed via wordpress-content-inventory.csv's
   *  has_aparat column: NONE of the 23 phase-1 articles have has_aparat = True, so this field
   *  is optional/empty for every phase-1 article — defined now so the model doesn't need a
   *  breaking change when a later phase migrates a video-bearing post. Render as a plain
   *  <iframe src="https://www.aparat.com/video/embed/videohash/..."> (Aparat's own embed
   *  contract) — no video SDK/dependency needed. */
  aparatEmbeds?: readonly { videoHash: string; title: string }[];

  /** ServiceTaxonomyIds to cross-link at the end of the article — usually just
   *  [serviceRelation], but an article can reasonably point at more than one
   *  (e.g. a chin/jaw-angle article touching both orthognathic-surgery and
   *  facial-cosmetic-surgery). */
  relatedServices: readonly ServiceTaxonomyId[];

  /** Other article slugs to surface as "related reading" — same topicCluster by default,
   *  computed at build time rather than hand-maintained per article (avoids the two-lists-
   *  drift problem), with room for an explicit override array later if editorial judgment
   *  ever needs to differ from the computed set. Not needed as an authored field in phase 1. */
  relatedArticles?: readonly string[];

  /** Absolute canonical URL for <link rel="canonical"> and JSON-LD @id — computed as
   *  `${SITE_URL}/fa/knowledge/${slug}` at render time, not hand-authored per article
   *  (a stored field here would drift from the actual route). Listed for completeness of
   *  what the article page needs to emit, not as a field to store on the content object. */
  canonicalPath: string; // derived, not stored — see implementation-plan.md's SEO metadata strategy

  /** Which JSON-LD type this article emits — MedicalWebPage for genuinely clinical/procedural
   *  content (the majority of phase 1: jaw surgery, implants, rhinoplasty, wisdom teeth,
   *  blepharoplasty), plain Article for content that's informational/brand-adjacent rather
   *  than procedural (e.g. "بهترین متخصص ایمپلنت تبریز" — a "why choose this doctor" piece).
   *  FAQPage is layered on top additively when `faq` is present, not a replacement value —
   *  see Schema strategy in implementation-plan.md for how the two combine via @graph. */
  structuredDataType: "MedicalWebPage" | "Article";
}
```

## How the model supports each requirement

- **Persian content** — every text field above is Persian-first (this codebase's `fa.ts` is `as const`-typed literal Persian strings; the same discipline applies here). `en`/`ar` article translations are out of scope for phase 1 (see implementation-plan.md) — the type shape doesn't currently need `Record<Locale, string>` wrapping for these fields, matching how `content/services.ts`'s `title`/`subtitle` *do* use `Record<Locale, string>` today only because services already have en/ar copy; knowledge articles don't yet, so over-generalizing to multi-locale now would be exactly the kind of premature abstraction CODING_STANDARDS.md §11 rejects. Revisit this field's type when/if the en/ar Knowledge Center rollout is actually scoped.
- **Legacy WordPress URL mapping** — `legacyUrls`, cross-referenced against `legacy-redirects-spec.csv` as the single source of truth for which old URL(s) resolve to this article.
- **Article schema** — `structuredDataType`, `medicalReview`, `publishedAt`/`updatedAt`, `heroImage`, `title` together carry everything `MedicalWebPage`/`Article` JSON-LD needs (see implementation-plan.md's Schema strategy for the exact emitted shape).
- **FAQ schema where relevant** — the optional `faq` array, additive via `@graph` only when non-empty.
- **Breadcrumb schema** — not a field on the article at all; breadcrumb JSON-LD is derived from the route (`Home → Knowledge Center → {title}`), same information the page's `PremiumBreadcrumb` component already renders visually (`src/components/page/page-hero.tsx`) — reuse that data, don't duplicate it as a stored field.
- **Medical review attribution by Dr. Alireza Sadighi** — the `medicalReview` object, rendered as a visible byline/reviewed-by note on every article (not just buried in schema) — matches the "medical-trust" premium-UI bar in CLAUDE.md.
- **Aparat/video embeds** — `aparatEmbeds`, optional and empty for all of phase 1's 23 articles today, present in the model so a future phase's video-bearing posts don't need a schema migration.

## What is deliberately NOT in this model (scope discipline)

- No rich-text/block-editor schema, no MDX — `contentSections.paragraphs: string[]` is enough for this content and this dependency budget.
- No CMS-editing fields (draft/publish workflow state, author accounts, revision history) — CLAUDE.md explicitly says not to build a full CMS yet; this is a typed data file, edited via PR like every other `content/*.ts` file in this repo today.
- No `relatedArticles` authoring UI — computed by topic cluster, not hand-picked, to avoid a maintenance burden at 23+ articles.
- No per-article `Record<Locale, string>` — see the Persian-content note above; would be speculative given no en/ar knowledge content is scoped.
