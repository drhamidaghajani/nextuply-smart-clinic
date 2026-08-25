import type { KnowledgeArticleFaqItem, KnowledgeArticleMedicalReview } from "@/content/knowledge-articles";
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
  faq?: readonly KnowledgeArticleFaqItem[];
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
      reviewedBy: { "@type": "Physician" as const, name: locale === "fa" ? content.medicalReview.reviewerName : DOCTOR_NAME[locale] },
      author: { "@type": "Physician" as const, name: DOCTOR_NAME[locale] },
      publisher: { "@type": "MedicalOrganization" as const, name: CLINIC_NAME[locale], url: SITE_URL },
    },
    buildBreadcrumbJsonLd(breadcrumbItems, locale),
  ];

  if (content.faq && content.faq.length > 0) {
    graph.push({
      "@type": "FAQPage" as const,
      "@id": `${canonicalUrl}#faq`,
      mainEntity: content.faq.map((item) => ({
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
