import { getServiceById } from "@/content/services";
import { KNOWLEDGE_ARTICLES, type KnowledgeTopicCluster } from "@/content/knowledge-articles";
import type { Locale } from "@/i18n/locales";

/**
 * Server-only resolution for the homepage Knowledge Center section
 * (`KnowledgeCenterSection`). Extracted 2026-09-03 (P1 mobile TBT audit)
 * from that component itself, where this same logic lived — moving it
 * here (and out of a `"use client"` file) is the actual fix, not a
 * refactor for its own sake: `knowledge-articles.ts` is 961KB of source
 * (full body/contentSections/faq/translations for ~90 articles),
 * imported for exactly 4 short excerpts. A "use client" file that
 * imports a value (not just a type) from a module pulls that module's
 * runtime code into the CLIENT bundle regardless of how little of it is
 * actually used — confirmed directly in the production build, where the
 * homepage's largest JS chunk contained this file's full article data
 * (titles, excerpts, legacy URLs, etc. for articles never even shown)
 * verbatim as string literals. Called only from `page.tsx` (a Server
 * Component) now, so none of `knowledge-articles.ts`'s ~90-article
 * payload ever reaches the client — only the ~4 small resolved objects
 * below do, serialized once as RSC props, same as any other server-
 * computed prop.
 *
 * Hamid's own priority-ordered list (2026-08-25) — first is the feature
 * slot, next 3 are the side list. Unchanged from the original.
 */
const FEATURED_SLUGS = [
  "ایمپلنت-اقساطی-در-تبریز-با-دکتر-علیرضا",
  "جراحی-فک-نی-نی-سایت",
  "جراحی-بینی-به-سبک-اروپایی-زیبایی-و-تقا",
  "جراحی-دندان-عقل-با-بیهوشی-در-تبریز",
] as const;

/** Everything `KnowledgeCenterSection` actually renders — deliberately NOT the full `KnowledgeArticle` shape. */
export interface ResolvedHomepageArticle {
  slug: string;
  title: string;
  excerpt: string;
  topicCluster: KnowledgeTopicCluster;
  updatedAt: string;
  heroImage?: { src: string; alt: string };
  /** `getServiceById(article.serviceRelation)?.iconKey` — resolved here so the client never needs `services.ts`'s `getServiceById` either. */
  serviceIconKey?: string;
}

export function resolveFeaturedHomepageArticles(locale: Locale): ResolvedHomepageArticle[] {
  const resolved: ResolvedHomepageArticle[] = [];
  for (const slug of FEATURED_SLUGS) {
    const article = KNOWLEDGE_ARTICLES.find((a) => a.slug === slug);
    if (!article) continue;
    const content = locale === "fa" ? article : article.translations?.[locale];
    if (!content) continue;
    resolved.push({
      slug: content.slug,
      title: content.title,
      excerpt: content.excerpt,
      topicCluster: article.topicCluster,
      updatedAt: article.updatedAt,
      heroImage: article.heroImage,
      serviceIconKey: article.serviceRelation ? getServiceById(article.serviceRelation)?.iconKey : undefined,
    });
  }
  return resolved;
}
