import Image from "next/image";

import { CARD_POINT_COUNT, type FacialProcedure } from "@/content/facial-cosmetic-procedures";
import type { Locale } from "@/i18n/locales";

/**
 * Round 2026-08-18 (doctor feedback, per Hamid): was an `<a href="#id">`
 * that scrolled down to a dedicated section — now a real disclosure
 * `<button>` that toggles the procedure's detail panel open in place, no
 * page jump. Kept as ONE whole-surface `<button>` (not a card with a
 * nested button) for the same reason it was one whole `<a>` before: a
 * single tap target on mobile, one stop in the tab order.
 *
 * `+`/`−` indicator matches `PageFaq`'s existing accordion glyph
 * convention on this same page, rather than inventing a second one.
 *
 * The key points are `goals.slice(0, CARD_POINT_COUNT)` rather than a
 * separate authored field: a card can never drift from the panel it
 * opens, and no claim appears on a card that the doctor didn't write.
 */
export function ProcedureOverviewCard({
  procedure,
  locale,
  ctaLabel,
  isActive,
  onToggle,
  panelId,
}: {
  procedure: FacialProcedure;
  locale: Locale;
  ctaLabel: string;
  isActive: boolean;
  onToggle: () => void;
  /** Space-separated ids of the (mobile and/or desktop) detail panel this card currently controls — see `ProceduresExplorer`. */
  panelId: string;
}) {
  const points = procedure.goals[locale].slice(0, CARD_POINT_COUNT);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isActive}
      aria-controls={panelId}
      className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-warm-white text-start transition-[border-color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 ${
        isActive
          ? "border-gold/60 shadow-[0_20px_50px_-30px_rgba(201,161,90,0.45)]"
          : "border-charcoal/10 hover:border-gold/35 hover:shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)]"
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream">
        <Image
          src={procedure.imagePath}
          alt={procedure.title[locale]}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className={`text-balance text-base font-bold leading-snug transition-colors duration-300 ease-out sm:text-lg ${isActive ? "text-gold" : "text-charcoal group-hover:text-gold"}`}>
          {procedure.title[locale]}
        </h3>
        <p className="mt-2.5 text-[13px] leading-6 text-charcoal/65 sm:text-sm sm:leading-7">{procedure.summary[locale]}</p>

        <ul className="mt-4 space-y-2">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-[12px] leading-5 text-charcoal/55 sm:text-[13px]">
              <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold/70" />
              {point}
            </li>
          ))}
        </ul>

        <span className="mt-5 flex items-center justify-between gap-2 border-t border-charcoal/[0.07] pt-4 text-xs font-medium text-gold sm:text-[13px]">
          {ctaLabel}
          <span
            aria-hidden
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors duration-300 ease-out ${
              isActive ? "border-gold text-gold" : "border-charcoal/20 text-charcoal/40"
            }`}
          >
            {isActive ? "−" : "+"}
          </span>
        </span>
      </div>
    </button>
  );
}
