import type {
  KnowledgeArticleFaqItem,
  KnowledgeArticleMedicalReview,
  KnowledgeArticleReviewStatus,
  KnowledgeArticleTranslationStatus,
} from "@/content/knowledge-articles";
import type { BreadcrumbItem } from "@/components/page/premium-breadcrumb";
import { SITE_URL, absoluteUrl } from "@/core/site-config";
import { localeHref } from "@/i18n/locale-href";
import type { Locale } from "@/i18n/locales";

const HOME_LABEL: Record<Locale, string> = { fa: "خانه", en: "Home", ar: "الرئيسية" };

/**
 * Locale-matched to the exact phrasing already used in each dictionary's
 * `footer.tagline`/`hero.doctorName` (`src/i18n/dictionaries/*.ts`) — not
 * independently invented. Was a single Persian-only pair used verbatim in
 * every locale's JSON-LD until 2026-08-23, when live-verifying the first
 * `/en`/`/ar` Knowledge Center translations surfaced Persian author/
 * publisher names inside otherwise-English/Arabic structured data.
 */
export const CLINIC_NAME: Record<Locale, string> = {
  fa: "کلینیک دکتر علیرضا صدیقی",
  en: "Dr. Alireza Sadighi Aesthetic Clinic",
  ar: "عيادة الدكتور عليرضا صديقي للتجميل",
};
export const DOCTOR_NAME: Record<Locale, string> = {
  fa: "دکتر علیرضا صدیقی",
  en: "Dr. Alireza Sadighi",
  ar: "الدكتور عليرضا صديقي",
};

/**
 * BreadcrumbList JSON-LD — deliberately mirrors `PremiumBreadcrumb`'s own
 * "prepend Home" behavior (`components/page/premium-breadcrumb.tsx`) so the
 * visible trail and the schema trail are built from the same input and
 * never drift apart, without sharing more machinery than two small
 * consumers (one render, one JSON) justify.
 *
 * Round 2026-08-23 (final production URL restructuring): the Home entry's
 * href now goes through `localeHref` — Persian's own home is bare `/`, not
 * `/fa`.
 */
export function buildBreadcrumbJsonLd(items: readonly BreadcrumbItem[], locale: Locale) {
  const trail: BreadcrumbItem[] = [{ label: HOME_LABEL[locale], href: localeHref(locale) }, ...items];
  return {
    "@type": "BreadcrumbList" as const,
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

/** A complete standalone JSON-LD document for pages that do not wrap the breadcrumb node in an existing schema.org `@graph`. */
export function buildStandaloneBreadcrumbJsonLd(items: readonly BreadcrumbItem[], locale: Locale) {
  return {
    "@context": "https://schema.org" as const,
    ...buildBreadcrumbJsonLd(items, locale),
  };
}

/**
 * Batch SEO-01 (2026-09-13) — the 9 canonical commercial service pages
 * (`/services/<slug>` and `/services/facial-cosmetic-surgery/<procedure>`)
 * had no page-level structured data at all; only the 7 procedure pages
 * carried a bare `BreadcrumbList`. They now emit one `MedicalProcedure`
 * node plus that same breadcrumb, in one `@graph`, mirroring how
 * `buildKnowledgeArticleJsonLd` already composes its graph.
 *
 * Deliberately emits ONLY facts the page already renders and the
 * repository already owns: the page's own localized `name`/`description`
 * strings and the clinic name each locale's dictionary already uses
 * (via `CLINIC_NAME`). No `offers`, `priceRange`, `aggregateRating`,
 * `review`, `award`, `outcome`, `howPerformed` or `followup` — none of
 * those have an approved source in this repository, and inventing them to
 * chase a rich result is exactly the medical-claim fabrication this batch
 * is meant to avoid.
 *
 * `path` is the locale-neutral route only (`/services/rhinoplasty`);
 * `localeHref` applies the `/en`/`/ar` prefix (and the bare-root Persian
 * convention) so the emitted `url` can never drift from the canonical tag
 * the same page renders.
 */
export function buildMedicalProcedureJsonLd({
  name,
  description,
  path,
  locale,
  breadcrumbItems,
}: {
  name: string;
  description: string;
  path: string;
  locale: Locale;
  breadcrumbItems: readonly BreadcrumbItem[];
}) {
  const canonicalUrl = absoluteUrl(localeHref(locale, path));
  return {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "MedicalProcedure" as const,
        "@id": `${canonicalUrl}#procedure`,
        name,
        description,
        url: canonicalUrl,
        inLanguage: locale,
        provider: { "@type": "MedicalOrganization" as const, name: CLINIC_NAME[locale], url: SITE_URL },
      },
      buildBreadcrumbJsonLd(breadcrumbItems, locale),
    ],
  };
}

/**
 * Locale-neutral shape one Knowledge Center article page resolves itself
 * to before building schema — either the Persian `KnowledgeArticle`
 * directly, or an en/ar `KnowledgeArticleTranslation` merged with its
 * parent article's locale-invariant fields (medicalReview,
 * structuredDataType, dates). `slug` is passed explicitly rather than
 * read off a shared `article.slug` because Task 2 (2026-08-23) gives
 * English/Arabic their OWN slugs — this function must never assume which
 * locale's slug it's looking at.
 */
export interface ResolvedKnowledgeContent {
  slug: string;
  title: string;
  seoDescription: string;
  publishedAt: string;
  updatedAt: string;
  structuredDataType: "MedicalWebPage" | "Article";
  medicalReview: KnowledgeArticleMedicalReview;
  reviewStatus: KnowledgeArticleReviewStatus;
  translationStatus: KnowledgeArticleTranslationStatus;
  faq?: readonly KnowledgeArticleFaqItem[];
}

/**
 * One source of truth for every public medical-review claim. A translated
 * page is approved only when both the source article and that translation
 * are doctor-approved; source Persian content requires source approval.
 */
export function isKnowledgeContentMedicallyReviewed(
  content: Pick<ResolvedKnowledgeContent, "reviewStatus" | "translationStatus">,
  locale: Locale
): boolean {
  return content.reviewStatus === "doctor-approved" && (locale === "fa" || content.translationStatus === "doctor-approved");
}

/**
 * Full JSON-LD graph for one Knowledge Center article page: the article
 * itself (MedicalWebPage for genuinely clinical/procedural content, plain
 * Article otherwise — per `structuredDataType`), an additive FAQPage only
 * when `faq` is non-empty, and a BreadcrumbList always. Combined via
 * `@graph` rather than three separate `<script>` tags — one emission point
 * per page.
 */
export function buildKnowledgeArticleJsonLd(content: ResolvedKnowledgeContent, locale: Locale, breadcrumbItems: readonly BreadcrumbItem[]) {
  const canonicalUrl = absoluteUrl(localeHref(locale, `/knowledge/${content.slug}`));
  const isMedicallyReviewed = isKnowledgeContentMedicallyReviewed(content, locale);
  const validFaqItems = content.faq?.filter((item) => item.question.trim().length > 0 && item.answer.trim().length > 0) ?? [];

  const medicalFields =
    content.structuredDataType === "MedicalWebPage"
      ? {
          medicalAudience: { "@type": "Patient" as const },
          about: { "@type": "MedicalProcedure" as const, name: content.title },
        }
      : {};

  const graph: object[] = [
    {
      "@type": content.structuredDataType,
      "@id": `${canonicalUrl}#article`,
      url: canonicalUrl,
      headline: content.title,
      description: content.seoDescription,
      inLanguage: locale,
      datePublished: content.publishedAt,
      dateModified: content.updatedAt,
      ...medicalFields,
      ...(isMedicallyReviewed
        ? { reviewedBy: { "@type": "Physician" as const, name: locale === "fa" ? content.medicalReview.reviewerName : DOCTOR_NAME[locale] } }
        : {}),
      author: { "@type": "Physician" as const, name: DOCTOR_NAME[locale] },
      publisher: { "@type": "MedicalOrganization" as const, name: CLINIC_NAME[locale], url: SITE_URL },
    },
    buildBreadcrumbJsonLd(breadcrumbItems, locale),
  ];

  if (validFaqItems.length > 0) {
    graph.push({
      "@type": "FAQPage" as const,
      "@id": `${canonicalUrl}#faq`,
      mainEntity: validFaqItems.map((item) => ({
        "@type": "Question" as const,
        name: item.question,
        acceptedAnswer: { "@type": "Answer" as const, text: item.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * hreflang alternates for one Knowledge Center article — `fa`/`fa-IR` at
 * its Persian slug, `en`/`ar` only for locales that actually have a
 * translation (never point hreflang at a page that doesn't exist), and
 * `x-default` at the Persian root per Hamid's explicit instruction ("the
 * Persian root URL, unless the existing site architecture has a better
 * global default" — it doesn't; Persian is the primary, fully-content
 * locale, see docs/adr/0002-fa-first-locale-scope.md).
 */
export function buildKnowledgeArticleHreflangAlternates(faSlug: string, translations: { en?: { slug: string }; ar?: { slug: string } } | undefined) {
  const languages: Record<string, string> = {
    fa: absoluteUrl(`/knowledge/${faSlug}`),
    "fa-IR": absoluteUrl(`/knowledge/${faSlug}`),
  };
  if (translations?.en) languages.en = absoluteUrl(`/en/knowledge/${translations.en.slug}`);
  if (translations?.ar) languages.ar = absoluteUrl(`/ar/knowledge/${translations.ar.slug}`);
  languages["x-default"] = absoluteUrl(`/knowledge/${faSlug}`);
  return languages;
}
