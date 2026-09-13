import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

const LABEL: Record<Locale, string> = { fa: "فهرست مطالب", en: "Table of Contents", ar: "جدول المحتويات" };

/**
 * Summary text for the MOBILE disclosure variant (2026-09-13). Separate from
 * `LABEL` on purpose: the desktop rail keeps the formal "Table of Contents"
 * heading, while the collapsed mobile row reads as a conversational prompt
 * ("On this page"), which is what makes a `<details>` feel native rather than
 * like a broken accordion.
 */
const DISCLOSURE_LABEL: Record<Locale, string> = { fa: "در این مقاله", en: "On this page", ar: "في هذا المقال" };

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
    <nav dir={LOCALE_DIRECTION[locale]} aria-label={LABEL[locale]} className="border-t border-charcoal/15 pt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{LABEL[locale]}</p>
      <ol className="mt-4 space-y-2.5">
        {headings.map((h, index) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="flex gap-3 text-sm leading-6 text-charcoal/65 transition-colors duration-200 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <span aria-hidden className="shrink-0 tabular-nums text-charcoal/30">
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

/**
 * Mobile disclosure variant (2026-09-13). A long, fully expanded TOC sitting
 * between the article lead and the body pushes the actual content a full
 * screen down on a phone, so mobile gets a native `<details>` instead:
 * collapsed by default, no JavaScript, no client component, and it inherits
 * the browser's own keyboard and screen-reader semantics for free.
 *
 * Callers render this only where the desktop rail's `ArticleToc` is not
 * already visible at that breakpoint (see the article shell in
 * `knowledge/[slug]/page.tsx`) — the two variants are never on screen
 * together, so a reader never sees the same list twice.
 */
export function ArticleTocDisclosure({
  headings,
  locale,
}: {
  headings: readonly { id: string; text: string }[];
  locale: Locale;
}) {
  if (headings.length === 0) return null;
  return (
    <details dir={LOCALE_DIRECTION[locale]} className="group border-y border-charcoal/15">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold [&::-webkit-details-marker]:hidden">
        {DISCLOSURE_LABEL[locale]}
        <span
          aria-hidden
          className="text-base leading-none text-charcoal/40 transition-transform duration-200 ease-out group-open:rotate-180 motion-reduce:transition-none"
        >
          ⌄
        </span>
      </summary>
      <ol className="space-y-2.5 pb-5">
        {headings.map((h, index) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="flex gap-3 text-sm leading-6 text-charcoal/65 transition-colors duration-200 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <span aria-hidden className="shrink-0 tabular-nums text-charcoal/30">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{h.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
