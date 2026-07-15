"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import type { KnowledgeCenterDictionary } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * "Knowledge Center" (مرکز دانش) — homepage section 08 per
 * HOMEPAGE_STORYBOARD.md, per Hamid's full editorial-magazine brief
 * (2026-07-06).
 *
 * Round 2026-07-07: scope narrowed to JUST the Editorial Highlight block
 * (1 feature article + 3 side articles — was 2 side articles, he asked
 * for a 3rd). The Video Strip and FAQ block that originally lived here
 * were pulled out into their own standalone sections,
 * `video-hub-section.tsx` and `faq-section.tsx`, per his explicit "این
 * سکشن باید... نه زیرمجموعه Knowledge Center" for both — this file no
 * longer owns either. Heading/subheading are new this round too (was
 * eyebrow-only before): his exact text, pinned to the project's standing
 * 30px/22px heading/subheading rule (DESIGN_SYSTEM.md §3, locked this
 * round after being corrected section-by-section) — the heading also
 * gets a touch of letter-spacing per his "کمی کشیده باشه".
 *
 * Editorial style, still flat (no cards, no shadows, thin dividers only)
 * per the original brief's "از Gridهای تکراری وبلاگی دور باش".
 *
 * RTL layout: feature article first in DOM = visual right under this
 * page's natural `dir="rtl"`, side articles second = visual left —
 * matching "سمت راست: مقاله اصلی" without any `dir="ltr"` override (same
 * established, bug-free pattern used everywhere else this cycle).
 *
 * Placeholder imagery: no real article photography exists yet, so
 * `CoverMotif` reuses this project's own real service line-icons
 * (`public/icons/services/<id>.png`) as a masked motif on a navy-gradient
 * tile — matching the icon-on-gradient placeholder language already
 * established in `case-gallery-section.tsx`/`patient-journey-section.tsx`.
 *
 * Content: two article titles and the three original topic labels are
 * Hamid's own exact words; everything else (leads, summaries, the 3rd
 * article) is draft text flagged with TODO(content) in fa.ts, same
 * convention as `brandIntro`'s manifesto — not treated as final copy.
 */

function CoverMotif({ iconId }: { iconId: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span
        aria-hidden
        className="block h-16 w-16 bg-warm-white/15 transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:h-20 sm:w-20"
        style={{
          WebkitMaskImage: `url(/icons/services/${iconId}.png)`,
          maskImage: `url(/icons/services/${iconId}.png)`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    </div>
  );
}

function IconArrow({ className, pointLeft }: { className?: string; pointLeft: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {pointLeft ? <path d="M19 12H5M11 6l-6 6 6 6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
    </svg>
  );
}

export function KnowledgeCenterSection({ dict, locale }: { dict: KnowledgeCenterDictionary; locale: Locale }) {
  const shouldReduceMotion = useReducedMotion();
  const isRtl = LOCALE_DIRECTION[locale] === "rtl";

  const fadeUp = (delay: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 18 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.6, delay: shouldReduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      id="knowledge-center"
      data-header-bg="#fcfbf4"
      dir={LOCALE_DIRECTION[locale]}
      className="snap-section relative flex h-dvh flex-col justify-center overflow-hidden bg-cream px-4 py-5 sm:px-8 sm:py-7 lg:py-8"
    >
      <div className="mx-auto w-full max-w-6xl">
        <motion.span {...fadeUp(0)} className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/40 sm:text-xs">
          {dict.eyebrow}
        </motion.span>
        <motion.h2
          {...fadeUp(shouldReduceMotion ? 0 : 0.05)}
          className="mt-2 text-balance text-lg font-extrabold leading-tight tracking-wide text-charcoal sm:mt-3 sm:text-2xl lg:text-[30px]"
        >
          {dict.heading}
        </motion.h2>
        <motion.p {...fadeUp(shouldReduceMotion ? 0 : 0.1)} className="mt-2 max-w-2xl text-xs leading-5 text-charcoal/60 sm:mt-3 sm:text-base lg:text-[22px] lg:leading-8">
          {dict.subheading}
        </motion.p>

        {/* Editorial Highlight — feature (right, first in DOM) + side
            articles (left), separated by a thin divider, not cards. */}
        <div className="mt-4 grid gap-5 border-t border-charcoal/10 pt-4 sm:mt-6 sm:gap-8 sm:pt-6 lg:grid-cols-[1.3fr_1fr] lg:gap-14 lg:pt-8">
          <motion.article {...fadeUp(shouldReduceMotion ? 0 : 0.08)} className="group">
            <Link href={dict.articles.feature.href} className="block">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-deep-navy to-[#1a2540] sm:aspect-[16/9] sm:rounded-2xl lg:aspect-[21/9]">
                <CoverMotif iconId={dict.articles.feature.iconId} />
              </div>
              <span className="mt-2.5 block text-[10px] font-semibold uppercase tracking-wide text-gold sm:mt-4 sm:text-xs">{dict.articles.feature.label}</span>
              <h3 className="mt-1 text-base font-extrabold leading-tight text-charcoal sm:mt-2 sm:text-xl lg:text-2xl">
                <span className="bg-gradient-to-l from-gold to-gold bg-[length:0%_2px] bg-right-bottom bg-no-repeat pb-1 transition-[background-size] duration-500 ease-out group-hover:bg-[length:100%_2px]">
                  {dict.articles.feature.title}
                </span>
              </h3>
              <p className="mt-1.5 line-clamp-2 max-w-xl text-xs leading-5 text-charcoal/65 sm:mt-3 sm:text-sm sm:leading-7">{dict.articles.feature.lead}</p>
              <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:mt-4 sm:text-sm">
                {dict.readMoreCta}
                <IconArrow
                  pointLeft={isRtl}
                  className={`h-3.5 w-3.5 transition-transform duration-300 ease-out sm:h-4 sm:w-4 ${isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
                />
              </span>
            </Link>
          </motion.article>

          <motion.div {...fadeUp(shouldReduceMotion ? 0 : 0.16)} className="flex flex-col divide-y divide-charcoal/10">
            {dict.articles.side.map((item) => (
              <Link key={item.href} href={item.href} className="group py-2.5 first:pt-0 last:pb-0 sm:py-4">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gold sm:text-xs">{item.label}</span>
                <h4 className="mt-1 line-clamp-1 text-sm font-bold leading-snug text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:text-base">
                  {item.title}
                </h4>
                <p className="mt-1 line-clamp-1 text-xs leading-5 text-charcoal/60 sm:line-clamp-2 sm:leading-6">{item.summary}</p>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
