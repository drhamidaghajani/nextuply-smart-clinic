import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

export interface KnowledgeRelatedArticleItem {
  key: string;
  href: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  meta?: string;
}

const LABEL: Record<Locale, string> = {
  fa: "مطالب مرتبط",
  en: "Continue reading",
  ar: "قراءات ذات صلة",
};

/**
 * End-of-article "continue reading" section (2026-09-13).
 *
 * Deliberately its own component rather than a reuse of
 * `EditorialCardGrid`: that grid is shared with the Services index and the
 * Knowledge index, so restyling it for the article footer would change two
 * other pages. The composition here is one featured item plus a compact
 * hairline-separated list — editorial hierarchy instead of a repeated card
 * grid, with the existing related-article selection logic untouched.
 */
export function KnowledgeRelatedArticles({
  items,
  locale,
}: {
  items: readonly KnowledgeRelatedArticleItem[];
  locale: Locale;
}) {
  if (items.length === 0) return null;

  const [featured, ...rest] = items;
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "←" : "→";

  // `max-[1060px]:pr-14` is the same physical assistant safe zone the article
  // shell carries (see page.tsx), derived from this block's own geometry: the
  // container is 896px wide and centred, so its trailing edge stops clearing
  // the trigger's 76px footprint at `(50vw + 448) > (100vw - 77)`, i.e. 1050px
  // — 1060 keeps the same ~4px optical clearance the article uses. Below it the
  // block sits under the bubble while scrolling; above it the geometry is
  // provably clear, so nothing wider is touched.
  return (
    <div dir={LOCALE_DIRECTION[locale]} className="mx-auto max-w-4xl max-[1060px]:pr-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{LABEL[locale]}</p>

      {featured ? (
        <Reveal>
          <Link
            href={featured.href}
            className="group mt-6 block border-t border-charcoal/10 pt-7 transition-colors duration-300 ease-out"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gold">{featured.eyebrow}</p>
            <h3 className="mt-2 max-w-3xl font-heading text-xl font-bold leading-snug text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:text-2xl">
              {featured.title}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/60 sm:text-base">{featured.subtitle}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-gold">
              {featured.meta}
              <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                {arrow}
              </span>
            </span>
          </Link>
        </Reveal>
      ) : null}

      {rest.length > 0 ? (
        <ul className="mt-10 border-t border-charcoal/10">
          {rest.map((item) => (
            <li key={item.key} className="border-b border-charcoal/10">
              <Link
                href={item.href}
                className="group flex items-baseline justify-between gap-6 py-5 transition-colors duration-300 ease-out hover:text-gold"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-gold/80">{item.eyebrow}</span>
                  <span className="mt-1 block text-base font-semibold leading-snug text-charcoal transition-colors duration-300 ease-out group-hover:text-gold">
                    {item.title}
                  </span>
                </span>
                <span aria-hidden className="shrink-0 text-charcoal/25 transition-colors duration-300 ease-out group-hover:text-gold">
                  {arrow}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
