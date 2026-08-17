import Image from "next/image";

import { CARD_POINT_COUNT, type FacialProcedure } from "@/content/facial-cosmetic-procedures";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * One card in the "انواع جراحی‌های زیبایی صورت" overview grid — image,
 * title, summary, a few key points, and an anchor into that procedure's
 * own section further down the same page.
 *
 * The key points are `goals.slice(0, CARD_POINT_COUNT)` rather than a
 * separate authored field: a card can never drift from the section it
 * links to, and no claim appears on a card that the doctor didn't write.
 *
 * The whole card is one `<a>` (not a card with a nested link) so the
 * entire surface is a single tap target on mobile and one stop in the
 * tab order — the "مشاهده توضیحات" row at the bottom is a visual
 * affordance inside that link, not a second control.
 *
 * `aspect-[16/10]` matches the source images' native 1586×992 exactly,
 * so `object-cover` crops nothing at any breakpoint.
 */
export function ProcedureOverviewCard({
  procedure,
  locale,
  ctaLabel,
}: {
  procedure: FacialProcedure;
  locale: Locale;
  ctaLabel: string;
}) {
  const points = procedure.goals[locale].slice(0, CARD_POINT_COUNT);
  // Points toward the end of the reading direction — same convention the
  // service detail page already uses for its "back to services" link.
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "←" : "→";

  return (
    <a
      href={`#${procedure.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-warm-white transition-[border-color,box-shadow] duration-300 ease-out hover:border-gold/35 hover:shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
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
        <h3 className="text-balance text-base font-bold leading-snug text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:text-lg">
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

        <span className="mt-5 inline-flex items-center gap-1.5 pt-4 text-xs font-medium text-gold border-t border-charcoal/[0.07] sm:text-[13px]">
          {ctaLabel}
          <span aria-hidden className="transition-transform duration-300 ease-out group-hover:-translate-x-0.5 ltr:group-hover:translate-x-0.5">
            {arrow}
          </span>
        </span>
      </div>
    </a>
  );
}
