#!/usr/bin/env python3
"""Turn extracted-articles.json (+ translations/*.json) into the real
src/content/knowledge-articles.ts."""
import json
from pathlib import Path

AUDIT_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = AUDIT_DIR.parent.parent.parent
IN_JSON = AUDIT_DIR / "scripts" / "extracted-articles.json"
TRANSLATIONS_DIR = AUDIT_DIR / "scripts" / "translations"
OUT_TS = REPO_ROOT / "src" / "content" / "knowledge-articles.ts"


def load_translations() -> dict:
    """Each docs/.../scripts/translations/<slug>.json holds {"en": {...}, "ar": {...}}
    (either key optional) — one file per article, authored directly (this is
    generated medical content, not mechanically extracted, so it lives as
    hand-reviewable JSON rather than being folded into extracted-articles.json)."""
    result = {}
    if not TRANSLATIONS_DIR.exists():
        return result
    for f in TRANSLATIONS_DIR.glob("*.json"):
        slug = f.stem
        result[slug] = json.loads(f.read_text(encoding="utf-8"))
    return result


def js_str(s: str) -> str:
    """A valid JS/TS double-quoted string literal — JSON string escaping is
    a strict subset of what TS accepts for a double-quoted literal, so
    json.dumps is a safe, bug-free way to escape Persian text, quotes, and
    backslashes without hand-rolling escaping rules."""
    return json.dumps(s or "", ensure_ascii=False)


def js_str_list(items) -> str:
    return "[" + ", ".join(js_str(x) for x in items) + "]"


def emit_faq(faq):
    if not faq:
        return "undefined"
    lines = ["["]
    for f in faq:
        lines.append(f"      {{ question: {js_str(f['question'])}, answer: {js_str(f['answer'])} }},")
    lines.append("    ]")
    return "\n".join(lines)


def emit_sections(sections):
    lines = ["["]
    for s in sections:
        heading = js_str(s["heading"]) if s.get("heading") else "undefined"
        paras = js_str_list(s["paragraphs"])
        lines.append(f"      {{ heading: {heading}, paragraphs: {paras} }},")
    lines.append("    ]")
    return "\n".join(lines)


def emit_translation(t):
    faq_field = f"\n      faq: {emit_faq(t['faq'])}," if t.get("faq") else ""
    return f"""{{
      slug: {js_str(t['slug'])},
      title: {js_str(t['title'])},
      seoTitle: {js_str(t['seoTitle'])},
      seoDescription: {js_str(t['seoDescription'])},
      excerpt: {js_str(t['excerpt'])},
      contentSections: {emit_sections(t['contentSections'])},{faq_field}
      translationStatus: "translated-needs-review",
    }}"""


def emit_translations_field(translations_for_article):
    if not translations_for_article:
        return ""
    parts = []
    for locale in ("en", "ar"):
        if locale in translations_for_article:
            parts.append(f"      {locale}: {emit_translation(translations_for_article[locale])},")
    if not parts:
        return ""
    return "\n    translations: {\n" + "\n".join(parts) + "\n    },"


def emit_article(a, translations_for_article=None):
    faq_field = f"\n    faq: {emit_faq(a['faq'])}," if a["faq"] else ""
    service_field = f"\n    serviceRelation: {js_str(a['serviceRelation'])}," if a["serviceRelation"] else ""
    note = f"\n    // {a['note']}" if a.get("note") else ""

    media = a.get("media") or {}
    media_status = media.get("mediaStatus", "missing")
    needs_media_review = media.get("needsMediaReview", True)
    source_image_url = media.get("sourceImageUrl", "")
    local_image_path = media.get("localImagePath", "")
    hero_field = (
        f'\n    heroImage: {{ src: {js_str(local_image_path)}, alt: {js_str(a["title"])} }},'
        if media_status == "migrated" and local_image_path
        else ""
    )
    translations_field = emit_translations_field(translations_for_article)

    return f"""  {{{note}
    postId: {js_str(a['postId'])},
    slug: {js_str(a['slug'])},
    legacyUrls: {js_str_list(a['legacyUrls'])},
    title: {js_str(a['title'])},
    seoTitle: {js_str(a['seoTitle'])},
    seoDescription: {js_str(a['seoDescription'])},
    excerpt: {js_str(a['excerpt'])},
    topicCluster: {js_str(a['topicCluster'])},{service_field}
    medicalReview: {{
      reviewerName: "دکتر علیرضا صدیقی",
      reviewerCredentialsRef: "about",
      // Inherited from the original WordPress post_modified date — this is
      // NOT a fresh post-migration clinical re-review. Flagged in
      // manual-decisions-needed.md-adjacent follow-up: a real medical QA
      // pass should update this once Dr. Sadighi has re-read the migrated
      // copy, per CLAUDE.md's "real content, not placeholder" standard.
      reviewedAt: {js_str(a['updatedAt'])},
    }},
    // Content status workflow (Track 3, 2026-08-23) — every migrated article
    // defaults to needs-doctor-review; see doctor-review-list.csv. This is
    // internal editorial metadata, never emitted in public JSON-LD.
    reviewStatus: "needs-doctor-review",
    // Persian is always the source (never a translation) — see translations below.
    translationStatus: "source",
    publishedAt: {js_str(a['publishedAt'])},
    updatedAt: {js_str(a['updatedAt'])},
    readingTime: {js_str(a['readingTime'])},
    contentSections: {emit_sections(a['contentSections'])},{faq_field}
    structuredDataType: {js_str(a['structuredDataType'])},{hero_field}{translations_field}
    // Media audit trail (Track 4, 2026-08-23) — see media-migration/media-review-list.csv.
    // sourceImageUrl is provenance ONLY, never rendered as a live <img src> —
    // per Hamid's "do not hotlink old WordPress images permanently" rule,
    // only heroImage.src (a downloaded local /media/knowledge/... file) is ever used for display.
    mediaStatus: {js_str(media_status)},
    needsMediaReview: {"true" if needs_media_review else "false"},
    sourceImageUrl: {js_str(source_image_url)},
    localImagePath: {js_str(local_image_path)},
  }},"""


def main():
    articles = json.loads(IN_JSON.read_text(encoding="utf-8"))
    articles.sort(key=lambda a: a["slug"])
    translations = load_translations()

    body = "\n".join(emit_article(a, translations.get(a["slug"])) for a in articles)
    translated_count = {
        "en": sum(1 for slug, t in translations.items() if "en" in t),
        "ar": sum(1 for slug, t in translations.items() if "ar" in t),
    }

    header = '''import type { ServiceTaxonomyId } from "./services";
import type { Locale } from "@/i18n/locales";

/**
 * SINGLE SOURCE OF TRUTH for Knowledge Center articles — migration from the
 * legacy WordPress site (dralirezasadighi.com), per
 * docs/migration/sadighi-wordpress-seo-audit/. 40 articles:
 *
 * Batch 1 (25 articles, 2026-08-23): the 23 approved `migrate-to-knowledge-
 * center` URLs from phase-1-plan/p0-launch-list.csv, plus 2 URL-collision
 * posts resolved by Hamid's explicit decision — بلفاروپلاستی canonicalized
 * on post_id 7212 (the newer, richer of two duplicate posts — see
 * collision-review.md), and the fat-injection FAQ collision migrated as its
 * Persian post only (post_id 8597; English post_id 13413 excluded pending a
 * separate /en slug decision).
 *
 * Batch 2 (15 articles, 2026-08-26): the highest-priority remaining
 * WordPress posts approved for this contract — see
 * remaining-article-migration-plan.csv, batch-2-import-list.csv, and
 * merge-recommendations.csv. Several consolidate multiple duplicate/near-
 * duplicate WP permalinks into ONE final article (extract_articles.py's
 * `extra_legacy` field) — e.g. 4 posts about digital/CAS jaw surgery
 * technology collapse into a single جراحی-فک-دیجیتال article. Two of these
 * (Facial Asymmetry Due to Trauma, Recessed Lower Jaw) have a genuine
 * English WordPress original as their `translations.en` — extracted
 * mechanically from that real English post
 * (extract_batch2_translations.py), never machine-translated from Persian.
 *
 * Content is extracted verbatim from the WordPress `content:encoded` HTML
 * (docs/migration/.../scripts/extract_articles.py) — real clinical content
 * already published under Dr. Sadighi's name, not placeholder copy, per
 * PROJECT_UNDERSTANDING.md's "content is real" rule. `contentSections`/`faq`
 * are mechanically parsed from the original HTML structure (numbered
 * "N - question?" headings become `faq` entries; everything else becomes
 * heading+paragraph sections) — not rewritten or embellished. A human
 * medical-content pass (see each article's `medicalReview.reviewedAt`
 * comment) is still a real follow-up, not done here.
 *
 * Two articles (`جراحی برجستگی پیشانی`, `نمونه درمان`) remain OUT of this
 * file — Hamid's decision was to keep them blocked for manual content
 * review; do not add them here until that review happens and a slug is
 * confirmed (see manual-decisions-needed.md items 4).
 *
 * `heroImage`/`mediaStatus`/`sourceImageUrl`/`localImagePath` (Track 4,
 * 2026-08-23): real photos were downloaded from dralirezasadighi.com/wp-
 * content/uploads for Batch 1 articles where one could be verified — see
 * media-migration/media-review-list.csv and migrate_media.py for the full
 * discovery/selection/rejection trail. Batch 2 (2026-08-26): the production
 * domain cutover means dralirezasadighi.com/wp-content/uploads/ no longer
 * resolves to the old WordPress media library at all (verified directly —
 * every image URL now 404s/connection-fails through the new Next.js app,
 * not a rate limit) — every Batch 2 article is `mediaStatus: "missing"` as
 * a result, not a rejection of the source images' quality. `heroImage` is
 * only ever set to a LOCAL downloaded file path; `sourceImageUrl` is
 * provenance metadata only and must never be used as a live image src (no
 * permanent hotlinking to the old WordPress site). Articles with no
 * verified image render the premium no-image editorial hero state instead
 * — see knowledge/[slug]/page.tsx.
 */

export interface KnowledgeArticleFaqItem {
  question: string;
  answer: string;
}

export interface KnowledgeArticleSection {
  heading?: string;
  paragraphs: readonly string[];
}

export interface KnowledgeArticleAparatEmbed {
  videoHash: string;
  title: string;
}

export interface KnowledgeArticleMedicalReview {
  reviewerName: string;
  /** Points at the About page's own credential detail — not duplicated text. */
  reviewerCredentialsRef: "about";
  reviewedAt: string;
}

/** Editorial content-status workflow — internal, never emitted in public JSON-LD (see src/core/structured-data.ts). */
export type KnowledgeArticleReviewStatus = "imported" | "needs-doctor-review" | "doctor-approved" | "needs-rewrite";

export type KnowledgeArticleMediaStatus = "migrated" | "missing" | "low-confidence" | "needs-manual-selection";

/** "source" for the Persian article itself; every translation is "translated-needs-review" in phase 1 (no doctor-approved translations exist yet). */
export type KnowledgeArticleTranslationStatus = "source" | "translated-needs-review" | "doctor-approved";

/**
 * One language's full content for an article — same shape as the Persian
 * top-level fields deliberately (one content shape, not two), so page
 * components can treat "Persian" and "a translation" uniformly once
 * resolved to this type. Round 2026-08-23 (final production URL
 * restructuring, Task 2): English/Arabic get their OWN clean slugs (e.g.
 * `dental-implant-installments-tabriz`, not the Persian slug reused under
 * a prefix) — `slug` here, not `KnowledgeArticle.slug`, is what
 * `/en/knowledge/[slug]` and `/ar/knowledge/[slug]` actually match against.
 */
export interface KnowledgeArticleTranslation {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  contentSections: readonly KnowledgeArticleSection[];
  faq?: readonly KnowledgeArticleFaqItem[];
  translationStatus: KnowledgeArticleTranslationStatus;
}

export type KnowledgeTopicCluster =
  | "orthognathic-surgery"
  | "advanced-dental-implant"
  | "impacted-tooth-surgery"
  | "rhinoplasty"
  | "facial-cosmetic-surgery"
  | "blepharoplasty"
  | "facial-trauma-surgery"
  | "care-instructions"
  | "doctor-profile"
  | "clinic-info"
  | "general-dental"
  | "uncategorized";

export interface KnowledgeArticle {
  /** Original WordPress post_id — kept for traceability back to the source export, not used by any route. */
  postId: string;
  /** URL segment under /{locale}/knowledge/[slug] — the original WordPress Persian slug, preserved verbatim. */
  slug: string;
  /** Every legacy WordPress URL that must 301 here — cross-checked against legacy-redirects-spec.csv, not duplicated by hand. */
  legacyUrls: readonly string[];
  title: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  topicCluster: KnowledgeTopicCluster;
  /** Which service this article supports — omitted for topics with no service page (doctor-profile, clinic-info, care-instructions, general-dental, uncategorized). */
  serviceRelation?: ServiceTaxonomyId;
  medicalReview: KnowledgeArticleMedicalReview;
  /** Defaults to "needs-doctor-review" for every phase-1 migrated article — see doctor-review-list.csv. Applies uniformly across Persian AND every translation (medical accuracy review, not a per-language concern). */
  reviewStatus: KnowledgeArticleReviewStatus;
  /** Always "source" — Persian is never itself a translation. Symmetric with each entry in `translations[locale].translationStatus`. */
  translationStatus: "source";
  /** English/Arabic content, when it exists. Never fall back to Persian body when a key is absent — the article is simply unavailable in that language (see knowledge/[slug]/page.tsx's not-translated state) per Hamid's explicit "do not fallback to Persian" instruction. */
  translations?: { en?: KnowledgeArticleTranslation; ar?: KnowledgeArticleTranslation };
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  contentSections: readonly KnowledgeArticleSection[];
  /** Present only for the "۲۵ سوال متداول..." (FAQ-style) source posts — additive to contentSections, not a replacement. */
  faq?: readonly KnowledgeArticleFaqItem[];
  /** None of the 25 phase-1 articles have one (has_aparat = False for all — see wordpress-content-inventory.csv) — field exists so a future video-bearing article needs no interface change. */
  aparatEmbeds?: readonly KnowledgeArticleAparatEmbed[];
  structuredDataType: "MedicalWebPage" | "Article";
  /** Only ever a LOCAL downloaded file under /media/knowledge/<slug>/ — never a live WordPress URL. Absent when mediaStatus !== "migrated". */
  heroImage?: { src: string; alt: string };
  mediaStatus: KnowledgeArticleMediaStatus;
  needsMediaReview: boolean;
  /** Provenance/audit only (the original WordPress image URL this article's heroImage was downloaded from, if any) — NEVER render this as a live <img src>. */
  sourceImageUrl: string;
  /** Same value as heroImage.src when present; kept as its own field for the audit trail even though heroImage is what components actually render. */
  localImagePath: string;
}

export const KNOWLEDGE_ARTICLES: readonly KnowledgeArticle[] = [
'''

    footer = '''
];

/**
 * Verified directly against `next dev`/`next start` (2026-08-23): the
 * `slug` param this codebase's Next.js version hands a dynamic `[slug]`
 * route is still percent-encoded for non-ASCII segments (`params.slug`
 * arrived as `"%D8%A7%DB%8C..."`, not the decoded Persian text), even
 * though `KNOWLEDGE_ARTICLES.slug` and `generateStaticParams`'s own
 * literal Persian strings are NOT encoded — every Persian article 404'd
 * until this function decoded its input first. Decoding lives here, once,
 * rather than in every call site, so no future caller can forget it.
 */
function decodeSlugParam(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug; // malformed percent-encoding — fall through with the raw slug, which simply won't match anything
  }
}

/** Persian-only lookup (Persian's slug lives at the article's own top level, not inside `translations`). */
export function getKnowledgeArticleBySlug(slug: string): KnowledgeArticle | undefined {
  const decoded = decodeSlugParam(slug);
  return KNOWLEDGE_ARTICLES.find((article) => article.slug === decoded);
}

/**
 * Locale-aware content resolution for `/{locale}/knowledge/[slug]` (Task 2,
 * 2026-08-23) — for `fa`, matches the article's own top-level fields
 * (already `KnowledgeArticleTranslation`-shaped in substance, just not the
 * type, since Persian predates the translation feature); for `en`/`ar`,
 * matches against `translations[locale].slug`, which is a DIFFERENT string
 * than the Persian slug by design (a real English/Arabic slug, not the
 * Persian one reused under a prefix). Returns `undefined` — never a
 * Persian fallback — when no translation exists for that locale, exactly
 * per Hamid's "do not fallback to Persian" instruction; the caller is
 * responsible for rendering the localized "not available" state.
 */
export function getKnowledgeArticleByLocalizedSlug(
  locale: "en" | "ar",
  slug: string
): { article: KnowledgeArticle; content: KnowledgeArticleTranslation } | undefined {
  const decoded = decodeSlugParam(slug);
  for (const article of KNOWLEDGE_ARTICLES) {
    const content = article.translations?.[locale];
    if (content && content.slug === decoded) {
      return { article, content };
    }
  }
  return undefined;
}

/** True when two articles are "related": same topic cluster, or — when both name one — the same related service. Shared by both `getRelatedKnowledgeArticles` variants below so fa and en/ar can never quietly diverge on what counts as related. */
function isRelatedArticle(article: KnowledgeArticle, candidate: KnowledgeArticle): boolean {
  if (candidate.slug === article.slug) return false;
  if (candidate.topicCluster === article.topicCluster) return true;
  return Boolean(article.serviceRelation) && candidate.serviceRelation === article.serviceRelation;
}

export function getRelatedKnowledgeArticles(article: KnowledgeArticle, limit = 4): readonly KnowledgeArticle[] {
  return KNOWLEDGE_ARTICLES.filter((candidate) => isRelatedArticle(article, candidate)).slice(0, limit);
}

/** Same-topic-or-service articles that ALSO have a translation for `locale` — used by the `/en`/`/ar` knowledge index and article "related" rail, which must never link to an untranslated article. */
export function getRelatedKnowledgeArticlesForLocale(
  article: KnowledgeArticle,
  locale: "en" | "ar",
  limit = 4
): readonly { article: KnowledgeArticle; content: KnowledgeArticleTranslation }[] {
  const related: { article: KnowledgeArticle; content: KnowledgeArticleTranslation }[] = [];
  for (const candidate of KNOWLEDGE_ARTICLES) {
    if (!isRelatedArticle(article, candidate)) continue;
    const content = candidate.translations?.[locale];
    if (content) related.push({ article: candidate, content });
    if (related.length >= limit) break;
  }
  return related;
}

/**
 * Most-recently-updated articles for a locale, excluding the current one —
 * powers the article detail page's sidebar "Latest articles" block
 * (2026-08-25 staging QA pass). `fa` reads every article's own top-level
 * fields; `en`/`ar` only ever include articles that actually have a
 * translation for that locale — same "never link to an untranslated
 * article" rule as `getRelatedKnowledgeArticlesForLocale`. Sorted by
 * `updatedAt` (an ISO `YYYY-MM-DD` string, so a plain string comparison
 * already sorts chronologically — no `Date` parsing needed).
 */
export function getLatestKnowledgeArticles(
  locale: Locale,
  limit = 4,
  excludeSlug?: string
): readonly { article: KnowledgeArticle; content: KnowledgeArticleTranslation }[] {
  const candidates: { article: KnowledgeArticle; content: KnowledgeArticleTranslation }[] = [];
  for (const article of KNOWLEDGE_ARTICLES) {
    if (locale === "fa") {
      if (article.slug === excludeSlug) continue;
      candidates.push({ article, content: { ...article, translationStatus: article.translationStatus } });
    } else {
      const content = article.translations?.[locale];
      if (!content || content.slug === excludeSlug) continue;
      candidates.push({ article, content });
    }
  }
  return candidates.sort((a, b) => (a.article.updatedAt < b.article.updatedAt ? 1 : -1)).slice(0, limit);
}
'''

    OUT_TS.write_text(header + body + footer, encoding="utf-8")
    print(f"Wrote {len(articles)} articles -> {OUT_TS} (en translations: {translated_count['en']}, ar translations: {translated_count['ar']})")


if __name__ == "__main__":
    main()
