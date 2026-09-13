import Link from "next/link";

import { ContentSection } from "@/components/page/content-section";
import { Reveal } from "@/components/motion/reveal";
import { localeHref } from "@/i18n/locale-href";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

export interface ServiceRelatedKnowledgeItem {
  /** Knowledge Center URL segment for THIS locale — English/Arabic articles have their own slugs. */
  slug: string;
  title: string;
}

/**
 * SEO-01 (2026-09-13) — the service→knowledge direction of the intent
 * ownership graph: the Knowledge Center articles a canonical service or
 * procedure page may send readers to, so commercial pages stop being dead
 * ends and informational demand keeps resolving to the article that serves
 * it. The reverse direction (knowledge→service) is unchanged: it already
 * lives on every article page as the typed `serviceRelation` link.
 *
 * Reuses `ContentSection` and the bordered link-row rhythm the facial
 * cosmetic procedure page's "other procedures" list already established —
 * same `rounded-xl border-charcoal/10` row, same `Reveal`, same 200ms
 * colour transition. No new motion, no new dependency, no new visual
 * language, and deliberately not a card grid. The row fill flips with
 * `tone` so a row still reads as raised above whichever of the two
 * established section backgrounds it sits on; callers stay responsible for
 * keeping the page's cream → warm-white alternation intact.
 *
 * Renders nothing when there is no matching article. There is no fallback
 * to loosely-related articles on purpose: pointing a patient at the wrong
 * treatment is worse than pointing at none, and an empty section would be
 * exactly the generic SEO box this block is meant not to be.
 */
export function ServiceRelatedKnowledge({
  locale,
  heading,
  items,
  tone,
  headerBg,
}: {
  locale: Locale;
  heading: string;
  items: readonly ServiceRelatedKnowledgeItem[];
  tone: "cream" | "warm-white";
  headerBg?: string;
}) {
  if (items.length === 0) return null;

  const arrowPath = LOCALE_DIRECTION[locale] === "rtl" ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6";

  return (
    <ContentSection heading={heading} tone={tone} headerBg={headerBg}>
      <div className="grid gap-3">
        {items.map((item, index) => (
          <Reveal key={item.slug} delay={Math.min(index, 3) * 0.06}>
            <Link
              href={localeHref(locale, `/knowledge/${item.slug}`)}
              className={`group flex items-center justify-between gap-3 rounded-xl border border-charcoal/10 p-4 transition-colors duration-200 hover:border-gold/40 ${
                tone === "cream" ? "bg-warm-white" : "bg-cream"
              }`}
            >
              <span className="text-sm font-medium leading-6 text-charcoal transition-colors duration-200 group-hover:text-gold">{item.title}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0 text-charcoal/30 transition-colors duration-200 group-hover:text-gold"
              >
                <path d={arrowPath} />
              </svg>
            </Link>
          </Reveal>
        ))}
      </div>
    </ContentSection>
  );
}
