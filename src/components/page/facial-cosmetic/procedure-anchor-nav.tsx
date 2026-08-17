import type { FacialProcedure } from "@/content/facial-cosmetic-procedures";
import type { Locale } from "@/i18n/locales";

/**
 * Same-page anchor navigation for the Facial Cosmetic Surgery hub, per
 * Dr. Sadighi's 2026-08-17 feedback ("user can click each surgery type
 * and jump to that specific section on the same page").
 *
 * Deliberately a Server Component built from plain `<a href="#id">`
 * anchors — no client JS, no scroll listener, no active-state tracking.
 * Smooth scrolling comes from `html:has(.smooth-anchor-scroll)` in
 * globals.css (the same `:has()`-scoped pattern the homepage already
 * uses for `.homepage-scroll-snap`, so it never leaks to other pages),
 * and the sticky-header offset from each section's own `scroll-mt-*`.
 * Native anchors also mean the browser moves keyboard focus to the
 * target section, which a JS `scrollTo` would silently break.
 *
 * Mobile: a single horizontally-scrollable chip row. `snap-x` makes the
 * scroll settle on whole chips, and the row is deliberately allowed to
 * bleed to the viewport edge (negative margin + matching padding) so a
 * cut-off chip signals "there is more" rather than looking like a bug.
 */
export function ProcedureAnchorNav({
  procedures,
  locale,
  ariaLabel,
}: {
  procedures: readonly FacialProcedure[];
  locale: Locale;
  ariaLabel: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      data-header-bg="#faf7f1"
      className="border-y border-charcoal/10 bg-warm-white px-6 py-5 sm:px-8 sm:py-6"
    >
      <ul className="mx-auto -mx-6 flex max-w-5xl snap-x snap-mandatory gap-2.5 overflow-x-auto px-6 pb-1 sm:mx-auto sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {procedures.map((procedure) => (
          <li key={procedure.id} className="snap-start">
            <a
              href={`#${procedure.id}`}
              className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-charcoal/15 px-4 py-2 text-xs text-charcoal/70 transition-colors duration-200 hover:border-gold/50 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 sm:text-sm"
            >
              {procedure.title[locale]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
