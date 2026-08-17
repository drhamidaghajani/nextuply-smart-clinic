"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import type { FacialProcedure, FacialProcedureId } from "@/content/facial-cosmetic-procedures";
import type { FacialCosmeticPageDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";

import { ProcedureDetailPanel } from "./procedure-detail-panel";
import { ProcedureFilterChips } from "./procedure-filter-chips";
import { ProcedureOverviewCard } from "./procedure-overview-card";

/** Same fade+height accordion transition `PageFaq` already uses elsewhere on this page — one motion language, not a second one invented for this section. */
const PANEL_TRANSITION = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

/**
 * Round 2026-08-18 — replaces the previous "click a card, scroll down to
 * its own dedicated section" flow per Dr. Sadighi's direct feedback:
 * cards now expand IN PLACE, no page jump. This is the one client
 * boundary this page needs (everything else stays a Server Component);
 * kept as a single component (chips + heading + grid + panel) rather
 * than lifting state up into the page, because the page has no other
 * reason to be a Client Component and Next.js already lets a Server
 * Component render one freely.
 *
 * WHY THE DETAIL PANEL MOUNTS IN TWO PLACES: the doctor's own brief asks
 * for two different positions by viewport — mobile wants the panel
 * "immediately below that card" (true accordion, in the single-column
 * flow), desktop wants "one shared panel under the grid" (explicitly
 * called out as the simplest option). One flat list of cards can't
 * satisfy both from a single fixed DOM position — a panel placed after
 * card 2 of 7 sits in the wrong place once the grid becomes 2–3 columns,
 * and a panel placed after the whole grid sits far from whichever card
 * was actually tapped on a single-column phone screen. So each card is
 * followed by its OWN mobile-only panel mount (`sm:hidden`, only
 * rendered when that exact card is active), and one shared desktop-only
 * mount (`hidden sm:block`) sits after the grid. Only one is ever
 * visible at a given viewport — `hidden`/`display:none` also removes an
 * element from the accessibility tree, so nothing is announced twice —
 * and both read from the exact same `FACIAL_PROCEDURES` entry via
 * `ProcedureDetailPanel`, so there is exactly one authored copy of the
 * detail content, never two to keep in sync.
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
  const activeProcedure = procedures.find((procedure) => procedure.id === activeId) ?? null;

  function toggle(id: FacialProcedureId) {
    setActiveId((current) => (current === id ? null : id));
  }

  return (
    <>
      <ProcedureFilterChips procedures={procedures} locale={locale} ariaLabel={dict.navAriaLabel} activeId={activeId} onSelect={toggle} />

      <section id="procedures" data-header-bg="#fcfbf4" className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-24 lg:scroll-mt-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold sm:text-sm">{dict.proceduresEyebrow}</p>
              <h2 className="mt-3 text-balance text-xl font-bold leading-tight text-charcoal sm:text-2xl lg:text-[30px]">{dict.proceduresHeading}</h2>
              <p className="mt-3 text-sm leading-7 text-charcoal/70 sm:text-base">{dict.proceduresLead}</p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {procedures.map((procedure, index) => {
              const isActive = activeId === procedure.id;
              const mobilePanelId = `procedure-panel-${procedure.id}-mobile`;
              const desktopPanelId = `procedure-panel-${procedure.id}-desktop`;
              return (
                <Reveal key={procedure.id} delay={Math.min(index, 3) * 0.06}>
                  <ProcedureOverviewCard
                    procedure={procedure}
                    locale={locale}
                    ctaLabel={dict.cardCta}
                    isActive={isActive}
                    onToggle={() => toggle(procedure.id)}
                    panelId={`${mobilePanelId} ${desktopPanelId}`}
                  />

                  {/* Mobile-only inline accordion — directly below THIS card. */}
                  <div className="sm:hidden">
                    <AnimatePresence initial={false}>
                      {isActive ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={PANEL_TRANSITION}
                          className="overflow-hidden"
                        >
                          <div className="pt-4">
                            <ProcedureDetailPanel procedure={procedure} locale={locale} dict={dict} id={mobilePanelId} />
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Desktop/tablet — one shared panel under the whole grid. */}
          <div className="hidden sm:block">
            <AnimatePresence mode="wait" initial={false}>
              {activeProcedure ? (
                <motion.div
                  key={activeProcedure.id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={PANEL_TRANSITION}
                  className="overflow-hidden"
                >
                  <div className="pt-8">
                    <ProcedureDetailPanel
                      procedure={activeProcedure}
                      locale={locale}
                      dict={dict}
                      id={`procedure-panel-${activeProcedure.id}-desktop`}
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  );
}
