import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

const LABEL: Record<Locale, string> = { fa: "فهرست مطالب", en: "Table of Contents", ar: "جدول المحتويات" };

/**
 * Quiet in-page table of contents for long-form Knowledge Center
 * articles — plain anchor links to each heading, no scroll-spy/active-
 * state tracking (that's interactive complexity this content doesn't
 * need; a calm static list matches the "no overbuilt UI" brief). Callers
 * decide the "enough sections" threshold; this component just renders
 * whatever list it's given.
 */
export function ArticleToc({ headings, locale }: { headings: readonly { id: string; text: string }[]; locale: Locale }) {
  if (headings.length === 0) return null;
  return (
    <nav dir={LOCALE_DIRECTION[locale]} aria-label={LABEL[locale]} className="rounded-2xl border border-charcoal/10 bg-cream/60 px-6 py-5 sm:px-7 sm:py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{LABEL[locale]}</p>
      <ol className="mt-3 space-y-2">
        {headings.map((h, index) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="flex gap-3 text-sm leading-6 text-charcoal/70 transition-colors duration-200 hover:text-gold">
              <span aria-hidden className="shrink-0 text-charcoal/35">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{h.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
