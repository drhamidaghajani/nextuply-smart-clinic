import Image from "next/image";
import Link from "next/link";

import { CARD_POINT_COUNT, type FacialProcedure } from "@/content/facial-cosmetic-procedures";
import { localeHref } from "@/i18n/locale-href";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * Round 2026-08-26 (Facial Cosmetic Surgery restructuring, per Dr.
 * Sadighi — reversing the 2026-08-17/08-18 in-page-explorer decision):
 * each procedure is now a real, clickable service entry that opens its
 * own dedicated page, not an in-place expanding accordion. This is
 * `ProcedureOverviewCard`'s preview half (same image/title/summary/point-
 * list markup, so the parent landing page reads as a continuation of the
 * same visual language) with the disclosure trigger replaced by a plain
 * link to `/services/facial-cosmetic-surgery/[procedure]` — no
 * `isActive`/`onToggle`/expanding panel, and no client-side state at all,
 * so this stays a Server Component.
 */
export function ProcedureLinkCard({
  procedure,
  locale,
  ctaLabel,
}: {
  procedure: FacialProcedure;
  locale: Locale;
  ctaLabel: string;
}) {
  const points = procedure.goals[locale].slice(0, CARD_POINT_COUNT);
  const href = localeHref(locale, `/services/facial-cosmetic-surgery/${procedure.slug}`);
  const isRtl = LOCALE_DIRECTION[locale] === "rtl";

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-warm-white transition-[border-color,box-shadow] duration-300 ease-out hover:border-gold/35 hover:shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)]"
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

        <span className="mt-5 flex items-center justify-between gap-2 border-t border-charcoal/[0.07] pt-4 text-xs font-medium text-gold sm:text-[13px]">
          {ctaLabel}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d={isRtl ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6"} />
          </svg>
        </span>
      </div>
    </Link>
  );
}
