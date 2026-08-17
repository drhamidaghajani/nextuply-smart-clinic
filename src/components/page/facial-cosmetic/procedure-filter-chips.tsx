import type { FacialProcedure, FacialProcedureId } from "@/content/facial-cosmetic-procedures";
import type { Locale } from "@/i18n/locales";

/**
 * Round 2026-08-18 (doctor feedback, per Hamid): replaces the previous
 * `ProcedureAnchorNav`, which was `<a href="#id">` links that scrolled
 * the page down to a dedicated section per procedure. Those sections no
 * longer exist — everything now expands in place (see
 * `ProceduresExplorer`) — so this is real `<button>`s that switch the
 * active procedure, never navigation. Kept as a chip row (rather than
 * removed outright) because it's still useful as a quick jump BETWEEN
 * procedures without scrolling back up to the grid to pick a different
 * card, which the doctor's brief explicitly offered as the preferred
 * option over removing it.
 */
export function ProcedureFilterChips({
  procedures,
  locale,
  ariaLabel,
  activeId,
  onSelect,
}: {
  procedures: readonly FacialProcedure[];
  locale: Locale;
  ariaLabel: string;
  activeId: FacialProcedureId | null;
  onSelect: (id: FacialProcedureId) => void;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-header-bg="#faf7f1"
      className="border-y border-charcoal/10 bg-warm-white px-6 py-5 sm:px-8 sm:py-6"
    >
      <ul className="mx-auto -mx-6 flex max-w-5xl snap-x snap-mandatory gap-2.5 overflow-x-auto px-6 pb-1 sm:mx-auto sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {procedures.map((procedure) => {
          const isActive = activeId === procedure.id;
          return (
            <li key={procedure.id} className="snap-start">
              <button
                type="button"
                onClick={() => onSelect(procedure.id)}
                aria-pressed={isActive}
                className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-full border px-4 py-2 text-xs transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 sm:text-sm ${
                  isActive ? "border-gold bg-gold/10 text-gold" : "border-charcoal/15 text-charcoal/70 hover:border-gold/50 hover:text-gold"
                }`}
              >
                {procedure.title[locale]}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
