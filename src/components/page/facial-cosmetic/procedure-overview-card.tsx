"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

import { CARD_POINT_COUNT, type FacialProcedure } from "@/content/facial-cosmetic-procedures";
import type { FacialCosmeticPageDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";

import { ProcedureDetailPanel } from "./procedure-detail-panel";

/** SUPERSEDED (2026-08-26) — see `procedures-explorer.tsx`'s own doc-comment; kept per "do not delete files," no longer imported by any page. */
/** Same fade+height transition `PageFaq` uses elsewhere on this page — one motion language, not a second one invented here. */
const PANEL_TRANSITION = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

/**
 * One self-contained expandable procedure card: preview on top, and —
 * when open — that procedure's full detail INSIDE the same border.
 *
 * Round 2026-08-18 (second pass, per Hamid): the previous version made
 * the entire card a single `<button>` and rendered the detail elsewhere
 * (a shared panel under the grid on desktop). Both are fixed here, and
 * the two changes are related: a `<button>` may only contain phrasing
 * content, so as long as the whole card WAS the button, the detail
 * literally could not live inside it — it holds its own `<h4>`s, lists,
 * and a nested CTA button, none of which are legal inside `<button>`,
 * and a nested interactive control is an accessibility break besides.
 *
 * So the card is now an `<article>` whose disclosure control is the
 * "مشاهده / بستن توضیحات" row at the bottom of the preview. That row's
 * `before:absolute before:inset-0` stretches its hit area over the whole
 * preview region (the `.group.relative` wrapper), so tapping the image,
 * the title, or the summary still toggles the card — one control, one
 * tab stop, full-card tap target — while the real button element stays
 * small enough to legally contain only text, and the detail sits after
 * it as a plain sibling. The overlay deliberately covers ONLY the
 * preview wrapper, so the CTA inside the expanded detail stays clickable
 * rather than being swallowed by the card-wide hit area.
 *
 * `+`/`−` matches `PageFaq`'s existing accordion glyph on this page.
 *
 * Preview bullets are `goals.slice(0, CARD_POINT_COUNT)` rather than a
 * separately authored field, so a card can never drift from the detail
 * it opens and no claim appears that the doctor didn't write.
 */
export function ProcedureOverviewCard({
  procedure,
  locale,
  dict,
  isActive,
  onToggle,
}: {
  procedure: FacialProcedure;
  locale: Locale;
  dict: FacialCosmeticPageDictionary;
  isActive: boolean;
  onToggle: () => void;
}) {
  const points = procedure.goals[locale].slice(0, CARD_POINT_COUNT);
  const panelId = `procedure-detail-${procedure.id}`;

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-warm-white transition-[border-color,box-shadow] duration-300 ease-out ${
        isActive
          ? "border-gold/60 shadow-[0_20px_50px_-30px_rgba(201,161,90,0.45)]"
          : "border-charcoal/10 hover:border-gold/35 hover:shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)]"
      }`}
    >
      <div className="group relative">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream">
          <Image
            src={procedure.imagePath}
            alt={procedure.title[locale]}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>

        <div className="p-5 sm:p-6">
          <h3
            className={`text-balance text-base font-bold leading-snug transition-colors duration-300 ease-out sm:text-lg ${
              isActive ? "text-gold" : "text-charcoal group-hover:text-gold"
            }`}
          >
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

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isActive}
            aria-controls={panelId}
            className="mt-5 flex w-full items-center justify-between gap-2 border-t border-charcoal/[0.07] pt-4 text-xs font-medium text-gold before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 sm:text-[13px]"
          >
            {isActive ? dict.cardCtaClose : dict.cardCta}
            <span
              aria-hidden
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors duration-300 ease-out ${
                isActive ? "border-gold text-gold" : "border-charcoal/20 text-charcoal/40"
              }`}
            >
              {isActive ? "−" : "+"}
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isActive ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={PANEL_TRANSITION}
            className="overflow-hidden"
          >
            <div id={panelId} className="border-t border-charcoal/10 px-5 pb-6 pt-5 sm:px-6">
              <ProcedureDetailPanel procedure={procedure} locale={locale} dict={dict} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
