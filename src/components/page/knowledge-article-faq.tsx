import { PageFaq } from "@/components/page/page-faq";
import type { KnowledgeArticleFaqItem } from "@/content/knowledge-articles";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * Knowledge-specific FAQ wrapper (2026-09-13).
 *
 * `PageFaq` is shared by the services index, the facial-cosmetic index,
 * every procedure page, and the care-instruction pages, so restyling it
 * here would silently change four other route families. This wrapper owns
 * only the article-specific framing — locale direction, the section
 * anchor (`article-faq`, also used by the Table of Contents) and the
 * heading — and leaves the accordion itself untouched, including its
 * keyboard behaviour and reduced-motion handling.
 */
export function KnowledgeArticleFaq({
  items,
  heading,
  locale,
}: {
  items: readonly KnowledgeArticleFaqItem[];
  heading?: string;
  locale: Locale;
}) {
  if (items.length === 0) return null;

  return (
    <section dir={LOCALE_DIRECTION[locale]} id="article-faq" className="scroll-mt-28 pt-4">
      {heading ? <h2 className="mb-5 font-heading text-xl font-bold leading-snug text-charcoal sm:text-2xl">{heading}</h2> : null}
      <PageFaq items={items} />
    </section>
  );
}
