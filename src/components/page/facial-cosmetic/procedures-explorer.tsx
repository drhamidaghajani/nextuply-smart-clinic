"use client";

import { useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import type { FacialProcedure, FacialProcedureId } from "@/content/facial-cosmetic-procedures";
import type { FacialCosmeticPageDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";

import { ProcedureOverviewCard } from "./procedure-overview-card";

/**
 * SUPERSEDED (2026-08-26, Facial Cosmetic Surgery restructuring, per Dr.
 * Sadighi): no longer imported by any page — the parent
 * `services/facial-cosmetic-surgery/page.tsx` now renders
 * `ProcedureLinkCard`s (plain links to each procedure's own dedicated
 * page under `[procedure]/page.tsx`) instead of this in-place expanding
 * explorer. Kept in the repo per his explicit "do not delete files"
 * instruction — safe to delete in a future pass once confirmed unused
 * elsewhere, along with `ProcedureOverviewCard`/`ProcedureDetailPanel`.
 */
/**
 * Holds which procedure is open and renders the card grid. The one
 * client boundary this page needs; everything else stays a Server
 * Component.
 *
 * Round 2026-08-18 (second pass, per Hamid — the first pass was wrong):
 * this component no longer renders any detail panel of its own. It used
 * to mount two — a per-card one for mobile and a shared one under the
 * whole grid for desktop — which is what produced the detached
 * "panel below everything" block on desktop and an awkward gap on
 * mobile. Expansion now belongs entirely to `ProcedureOverviewCard`,
 * which renders the detail inside its own border, so there is exactly
 * one mount point, one DOM position, and identical behavior at every
 * breakpoint.
 *
 * Round 2026-08-18 (third pass, per Hamid): the filter-chip row above
 * the grid is gone too. It selected a card by id without scrolling to
 * it, which made sense when it opened a shared panel anyone could see
 * regardless of scroll position — once expansion moved inside each
 * card, a chip could activate a card that was off-screen with no
 * visible effect, which is worse than not having the chips. No
 * replacement affordance was added (no scroll-into-view) — the grid
 * itself is the only way to pick a procedure now, per his explicit
 * "no page jump" / "no scrollIntoView" instruction.
 *
 * `items-start` on the grid is load-bearing, not cosmetic: CSS Grid
 * stretches items to their row's height by default, so with the old
 * `h-full` cards an expanded card dragged every sibling in its row to
 * the same height, leaving them as tall, mostly-empty boxes. With
 * `items-start` each card sizes to its own content and only the open one
 * grows. (Its row still reserves the taller height — that's inherent to
 * grid without masonry — but the closed cards no longer stretch into it.)
 */
export function ProceduresExplorer({
  procedures,
  locale,
  dict,
}: {
  procedures: readonly FacialProcedure[];
  locale: Locale;
  dict: FacialCosmeticPageDictionary;
}) {
  const [activeId, setActiveId] = useState<FacialProcedureId | null>(null);

  function toggle(id: FacialProcedureId) {
    setActiveId((current) => (current === id ? null : id));
  }

  return (
    <section id="procedures" data-header-bg="#fcfbf4" className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-24 lg:scroll-mt-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold sm:text-sm">{dict.proceduresEyebrow}</p>
            <h2 className="mt-3 text-balance text-xl font-bold leading-tight text-charcoal sm:text-2xl lg:text-[30px]">{dict.proceduresHeading}</h2>
            <p className="mt-3 text-sm leading-7 text-charcoal/70 sm:text-base">{dict.proceduresLead}</p>
          </div>
        </Reveal>

        <div className="mt-12 grid items-start gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {procedures.map((procedure, index) => (
            <Reveal key={procedure.id} delay={Math.min(index, 3) * 0.06}>
              <ProcedureOverviewCard
                procedure={procedure}
                locale={locale}
                dict={dict}
                isActive={activeId === procedure.id}
                onToggle={() => toggle(procedure.id)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
