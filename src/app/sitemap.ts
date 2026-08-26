import type { MetadataRoute } from "next";
import { SERVICES } from "@/content/services";
import { CARE_TOPICS } from "@/content/care-instructions";
import { FACIAL_PROCEDURES } from "@/content/facial-cosmetic-procedures";
import { KNOWLEDGE_ARTICLES } from "@/content/knowledge-articles";
import { SITE_URL } from "@/core/site-config";
import { localeHref } from "@/i18n/locale-href";
import { SUPPORTED_LOCALES } from "@/i18n/locales";

/**
 * Sitewide `sitemap.xml` (Next.js metadata route). Generated from each
 * content file's own exported list rather than hand-duplicated here.
 *
 * Round 2026-08-23 (final production URL restructuring): Persian URLs are
 * now root-based (via `localeHref`, never `/fa/...`) — Task 1's explicit
 * "sitemap uses the final production structure" requirement.
 *
 * Round 2026-08-23, same day (Task 2, English/Arabic translations): the
 * static structural pages (about/contact/services/care-instructions) DO
 * have real fa/en/ar content already — see `LanguageSwitcher`'s own doc-
 * comment ("All three locales now render the same page structure",
 * docs/adr/0005 then 0006) — so they're listed for all three locales, not
 * just Persian. Knowledge Center ARTICLES are different: only Persian is
 * guaranteed real content; an article is listed for `en`/`ar` ONLY when
 * `article.translations[locale]` actually exists — never a placeholder or
 * a Persian-body page under an `/en`/`/ar` URL (submitting an untranslated
 * page to Google would be worse than not listing it).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = SUPPORTED_LOCALES.flatMap((locale) => [
    { url: `${SITE_URL}${localeHref(locale)}`, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${SITE_URL}${localeHref(locale, "/about")}`, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${SITE_URL}${localeHref(locale, "/contact")}`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${SITE_URL}${localeHref(locale, "/knowledge")}`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${SITE_URL}${localeHref(locale, "/care-instructions")}`, changeFrequency: "monthly" as const, priority: 0.6 },
  ]);

  const serviceRoutes: MetadataRoute.Sitemap = SUPPORTED_LOCALES.flatMap((locale) =>
    SERVICES.map((service) => ({
      url: `${SITE_URL}${localeHref(locale, `/services/${service.slug}`)}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))
  );

  // Round 2026-08-26 (Facial Cosmetic Surgery restructuring) — the 7
  // procedure pages, one slug shared across every locale (see
  // `FacialProcedure.slug`'s own doc-comment), same pattern as `serviceRoutes`.
  const procedureRoutes: MetadataRoute.Sitemap = SUPPORTED_LOCALES.flatMap((locale) =>
    FACIAL_PROCEDURES.map((procedure) => ({
      url: `${SITE_URL}${localeHref(locale, `/services/facial-cosmetic-surgery/${procedure.slug}`)}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  );

  const careRoutes: MetadataRoute.Sitemap = SUPPORTED_LOCALES.flatMap((locale) =>
    CARE_TOPICS.map((topic) => ({
      url: `${SITE_URL}${localeHref(locale, `/care-instructions/${topic.slug}`)}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }))
  );

  const articleRoutes: MetadataRoute.Sitemap = KNOWLEDGE_ARTICLES.flatMap((article) => {
    const entries: MetadataRoute.Sitemap = [
      {
        url: `${SITE_URL}${localeHref("fa", `/knowledge/${article.slug}`)}`,
        lastModified: article.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      },
    ];
    if (article.translations?.en) {
      entries.push({
        url: `${SITE_URL}${localeHref("en", `/knowledge/${article.translations.en.slug}`)}`,
        lastModified: article.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
    if (article.translations?.ar) {
      entries.push({
        url: `${SITE_URL}${localeHref("ar", `/knowledge/${article.translations.ar.slug}`)}`,
        lastModified: article.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
    return entries;
  });

  return [...staticRoutes, ...serviceRoutes, ...procedureRoutes, ...careRoutes, ...articleRoutes];
}
