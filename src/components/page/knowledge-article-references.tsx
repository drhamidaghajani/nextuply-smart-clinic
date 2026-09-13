import type { KnowledgeArticleReference } from "@/content/knowledge-articles";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/** Exported so the Table of Contents uses the exact same localized heading the section renders. */
export const KNOWLEDGE_REFERENCES_HEADING: Record<Locale, string> = {
  fa: "منابع علمی و مطالعه بیشتر",
  en: "Scientific references and further reading",
  ar: "المراجع العلمية وقراءة إضافية",
};

const VIEW_SOURCE: Record<Locale, string> = {
  fa: "مشاهده منبع",
  en: "View source",
  ar: "عرض المصدر",
};

/**
 * Scientific references block (2026-09-13). Rendered structurally by the
 * article template between the last content section and the FAQ — never as
 * a manually positioned content section — and it participates in the Table
 * of Contents through the stable `article-references` anchor.
 *
 * Titles are printed verbatim in their original language (`dir="ltr"
 * lang="en"` for the English scientific titles, so they read correctly
 * inside an RTL layout); only the surrounding chrome localizes. Every
 * entry is a plain external `<a>` — `localeHref` must never touch these.
 *
 * Spacing was tightened in the 2026-09-13 editorial-shell pass: an article
 * with five sources was previously a very tall stack on a phone, so the row
 * padding, leader gap and link chrome were made more scholarly and compact
 * while the title/source type sizes went UP (16px / 12.5px) — compact is
 * achieved by cutting vertical air, not by shrinking the citation to
 * something unreadable. The source line also moved from `/50` to `/60`,
 * which was washing out against the cream surface.
 */
export function KnowledgeArticleReferences({
  references,
  locale,
}: {
  references: readonly KnowledgeArticleReference[];
  locale: Locale;
}) {
  if (references.length === 0) return null;

  return (
    <section dir={LOCALE_DIRECTION[locale]} id="article-references" className="scroll-mt-28 pt-4">
      <h2 className="font-heading text-xl font-bold leading-snug text-charcoal sm:text-2xl">{KNOWLEDGE_REFERENCES_HEADING[locale]}</h2>
      <span aria-hidden className="mt-4 block h-px w-16 bg-gold/50" />
      <ol className="mt-5 border-t border-charcoal/10">
        {references.map((reference, index) => (
          <li key={reference.href} className="border-b border-charcoal/10 py-4">
            <div className="flex gap-3">
              <span aria-hidden className="pt-1 font-heading text-[11px] font-bold leading-5 text-gold/50">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p dir="ltr" lang="en" className="text-start text-[16px] font-medium leading-7 text-charcoal sm:text-[17px]">
                  {reference.title}
                </p>
                <p className="mt-1 text-[12.5px] leading-5 text-charcoal/60 sm:text-[13px] sm:leading-6">{reference.source}</p>
                <a
                  href={reference.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-gold/85 underline decoration-gold/25 underline-offset-4 transition-colors duration-200 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {VIEW_SOURCE[locale]}
                  <span aria-hidden>↗</span>
                </a>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
