"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import type { FaqSectionDictionary } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * "FAQ" (پرسش‌های متداول بیماران) — a standalone homepage section, per
 * Hamid's full brief (2026-07-07). Explicitly pulled OUT of
 * `knowledge-center-section.tsx`'s old single-accordion FAQ block into
 * its own section ("به‌صورت یک بلوک مستقل در صفحه باشد، نه زیرمجموعه
 * Knowledge Center") — now a 2-column grid of independently-expandable
 * cards with category tabs, not a single accordion list.
 *
 * Structure:
 * - Header (heading/subheading/intro line, his exact text) — pinned to
 *   the project's standing 30px/22px heading/subheading rule
 *   (DESIGN_SYSTEM.md §3).
 * - Category pill tabs (3, matching real specialties already in this
 *   project: رینوپلاستی / ایمپلنت / فک و صورت).
 * - 2-column card grid (RTL: right + left columns on desktop, single
 *   column on mobile) — each card expands/collapses independently (his
 *   brief describes per-card expand, not a shared single-open state like
 *   the FAQ block this replaced).
 *
 * State: `selectedCategory` filters `dict.items`; each card tracks its
 * own open/closed state in a `Set<number>` of open indices (global index
 * into `dict.items`, stable across category filtering) rather than a
 * single `openIndex`, since multiple cards can be open at once here.
 * Category switch re-renders the filtered list with a fade + small
 * translateY, per his explicit motion spec.
 *
 * Background: `bg-cream` for the section, cards `bg-warm-white` — the
 * same card-on-cream contrast already established in
 * `featured-services-section.tsx`, reused rather than inventing a new
 * "semi-light" tone from scratch.
 *
 * Content: category labels and the 3 example questions are close to
 * Hamid's own tone guidance ("فقط برای درک لحن، نه محتوای دقیق" — he was
 * explicit these are style examples, not final copy); one example
 * question per category was kept close to his wording, the rest is
 * draft copy in the same spirit — all flagged TODO(content) in fa.ts,
 * pending the medical team's real sign-off per his own note.
 *
 * Round 2026-07-07: bumped to 6 questions per category (18 total, was 2/6);
 * fa.ts questions were rewritten deliberately short (not just CSS-clamped)
 * so the question line fits on one line at realistic card widths — backed
 * by a `line-clamp-1` on the question as a hard safety net regardless of
 * content length. Section compacted to `h-dvh` so it fits one viewport
 * (matches the same treatment on `knowledge-center-section.tsx` and
 * `video-hub-section.tsx`), and the card grid now switches to 3 columns at
 * `lg` (was 2) so 6 cards read as 2 short rows instead of 3 taller ones.
 * Also fixed a grid row-stretch bug: opening one card was silently growing
 * its same-row sibling too, because CSS Grid's default `align-items:
 * stretch` was forcing every card in a row to match the tallest one; fixed
 * with `items-start` on the grid container (see inline comment above it).
 */

function IconPlusMinus({ isOpen, className }: { isOpen: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" className={`transition-opacity duration-200 ease-out ${isOpen ? "opacity-0" : "opacity-100"}`} />
    </svg>
  );
}

type FaqItemWithIndex = FaqSectionDictionary["items"][number] & { globalIndex: number };

function FaqCard({ item, isOpen, onToggle, shouldReduceMotion }: { item: FaqItemWithIndex; isOpen: boolean; onToggle: () => void; shouldReduceMotion: boolean }) {
  return (
    <div
      className={`rounded-xl border bg-warm-white px-4 py-3 transition-all duration-300 ease-out hover:shadow-md sm:px-6 sm:py-4 ${
        isOpen ? "border-gold/30 shadow-md" : "border-charcoal/10 shadow-sm"
      }`}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 text-start sm:gap-4">
        <span className="line-clamp-1 text-xs font-bold leading-snug text-charcoal sm:text-sm lg:text-base">{item.question}</span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ease-out sm:h-7 sm:w-7 ${
            isOpen ? "border-gold text-gold" : "border-charcoal/20 text-charcoal/40"
          }`}
        >
          <IconPlusMinus isOpen={isOpen} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="line-clamp-3 pt-2 text-[11px] leading-5 text-charcoal/65 sm:pt-4 sm:text-sm sm:leading-7">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type CategoryId = string;

export function FaqSection({ dict, locale }: { dict: FaqSectionDictionary; locale: Locale }) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(dict.categories[0]!.id);
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  const itemsWithIndex: FaqItemWithIndex[] = dict.items.map((item, globalIndex) => ({ ...item, globalIndex }));
  const filtered = itemsWithIndex.filter((item) => item.category === selectedCategory);

  const toggle = (index: number) => {
    setOpenIndices((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const fadeUp = (delay: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 18 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.6, delay: shouldReduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      id="faq"
      data-header-bg="#fcfbf4"
      dir={LOCALE_DIRECTION[locale]}
      className="snap-section relative flex h-dvh flex-col justify-center overflow-hidden bg-cream px-4 py-5 sm:px-8 sm:py-7 lg:py-8"
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2 {...fadeUp(0)} className="text-balance text-lg font-extrabold leading-tight text-charcoal sm:text-2xl lg:text-[30px]">
            {dict.heading}
          </motion.h2>
          <motion.p {...fadeUp(shouldReduceMotion ? 0 : 0.06)} className="mt-2 text-xs leading-5 text-charcoal/60 sm:mt-3 sm:text-base lg:text-[22px] lg:leading-8">
            {dict.subheading}
          </motion.p>
          <motion.p {...fadeUp(shouldReduceMotion ? 0 : 0.1)} className="mt-1.5 text-[10px] text-charcoal/40 sm:mt-3 sm:text-sm">
            {dict.intro}
          </motion.p>
        </div>

        <motion.div {...fadeUp(shouldReduceMotion ? 0 : 0.12)} className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-2.5">
          {dict.categories.map((category) => {
            const isActive = category.id === selectedCategory;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ease-out sm:px-5 sm:py-2 sm:text-sm ${
                  isActive ? "border-gold bg-gold/10 text-gold" : "border-charcoal/15 text-charcoal/60 hover:border-charcoal/30 hover:text-charcoal"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </motion.div>

        {/* `items-start` is load-bearing: CSS Grid defaults to
            `align-items: stretch`, which was making the sibling card in the
            same row grow to match an opened card's height. `items-start`
            lets each card size to its own content instead. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={selectedCategory}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 grid items-start gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          >
            {filtered.map((item) => (
              <FaqCard
                key={item.globalIndex}
                item={item}
                isOpen={openIndices.has(item.globalIndex)}
                onToggle={() => toggle(item.globalIndex)}
                shouldReduceMotion={Boolean(shouldReduceMotion)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
