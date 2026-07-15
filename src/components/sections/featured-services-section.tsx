"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { ServiceTaxonomyItem } from "@/content/services";
import type { ServicesDictionary } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

import { ServiceTile } from "./service-tile";

/**
 * "Featured Services" — Section 4 of the homepage per
 * HOMEPAGE_STORYBOARD.md §2 "04", placed BEFORE Section 3 ("Why Dr.
 * Sadighi") in the live page per Hamid's earlier explicit instruction —
 * see page.tsx's doc-comment.
 *
 * Round 2026-07-04 (two-layer rebuild, since reverted): originally split
 * into a dark icon strip above a separate light-cream card grid.
 *
 * Round 2026-07-05 (merge correction): the two-layer split put each
 * item's full description in a different section than its icon —
 * merged into one section, each icon followed directly by its own
 * title/titleEn/subtitle.
 *
 * Round 2026-07-05, same day (cream theme + one-viewport correction, per
 * Hamid): three changes on top of the merge —
 * - CTA button ("مشاهده همه خدمات") removed entirely; `dict.cta` dropped
 *   from fa.ts too (had no other reader).
 * - Section background flipped from dark navy to `bg-cream`, panels to
 *   `bg-warm-white`, text to charcoal — but each icon still sits on a
 *   small solid `bg-deep-navy` badge, NOT flipped to a light background.
 *   That's deliberate, not a leftover: these 6 PNGs are white/near-white
 *   line-strokes drawn for a dark surface (every other icon use in this
 *   project assumes navy too) — put directly on cream they'd be
 *   invisible, the exact failure this project already hit once before
 *   with this same asset set. The dark badge is the fix, same one used
 *   historically. Hover glow (gold light behind the icon) now reads as a
 *   light glowing inside a dark badge sitting on a light card — same
 *   effect Hamid asked for, just re-grounded for the new theme.
 * - Hamid asked the whole section to be capped at one viewport, no
 *   taller ("اندازه سکشن کلی کاملا اندازه صفحه باشه بیشتر نشه") — this
 *   reverses the previous round's flagged `h-dvh` deviation; `h-dvh` is
 *   back, with every size/spacing value in this component shrunk
 *   (mobile-first) specifically to make 6 icon+title+titleEn+subtitle
 *   items plus the heading fit one screen. Mobile also switches to a
 *   2-column grid (3 rows) instead of 1 column (6 rows) for the same
 *   reason, and each subtitle is `line-clamp-2` so one unusually long
 *   line of copy can't blow the layout — on very short phone viewports
 *   this can visibly truncate a subtitle; accepted trade-off for the
 *   hard one-viewport constraint rather than silently ignoring it.
 *
 * Round 2026-07-05, later same day (icon recolor, per Hamid): the dark
 * circular badge behind each icon is gone — icons now sit directly on
 * the card. Since these PNGs are white-stroke line art (no navy-badge
 * backdrop to give them contrast anymore), each icon is recolored solid
 * `deep-navy` via a CSS `mask-image` (the PNG's alpha channel becomes a
 * mask over a solid-color `<span>`, not a `next/image` element/filter
 * hack) — an exact match to the `deep-navy` token regardless of the
 * source PNG's own color, so `next/image` was dropped in favor of a
 * plain masked `<span>` referencing the static `/icons/services/*.png`
 * path directly (mask-image needs a stable URL, not next/image's
 * optimized/varying one). On hover, the icon recolors to `gold` (the
 * closest match in this project's existing palette to Hamid's "navy or
 * orange" either/or) and scales up slightly — his other option was
 * "stay navy," trivial to swap back to if gold isn't what he meant.
 * Icons are also bigger than the previous round (no badge circle eating
 * into the available space actually left more headroom, not less).
 *
 * Round 2026-07-05, later still (per Hamid): each subtitle got 25px of
 * horizontal padding (`px-[25px]`, an explicit "just try this and see"
 * request, not tied to the design system's spacing scale) — makes the
 * description read as its own centered block instead of running the
 * full card width, at the cost of more line-wraps inside the same
 * `line-clamp-2` budget. The "جراحی فک و چانه" (jaw/chin surgery) card
 * — his stated core specialty — is now visually singled out: solid
 * `bg-deep-navy` card, gold-tinted ring, and its title/titleEn/subtitle
 * flipped to warm-white/gold-adjacent tones for contrast. Its icon
 * defaults to warm-white instead of navy (navy-on-navy would vanish)
 * and still recolors to gold on hover like every other card's icon.
 *
 * Round 2026-07-05, one more pass (per Hamid): icons bumped +10%
 * (35/53/62px at the three breakpoints, up from 32/48/56) and subtitle
 * padding bumped another +10px (`px-[35px]`, up from 25px) — both
 * arbitrary-value tweaks by request, not scale-driven.
 *
 * Round 2026-07-05, full calm-premium pass (per Hamid, reversing several
 * of the choices above) —
 * - The "جراحی فک و چانه" navy-filled card is GONE. Hamid was explicit:
 *   every card stays in the same light theme, at rest and on hover, no
 *   navy/dark card "fixed or temporary." That card's `isFeatured`
 *   branching for bg/text/icon color is removed entirely. Its only
 *   remaining distinction is a slightly warmer ring tint at rest
 *   (`ring-gold/25` vs `ring-charcoal/5` on the rest) — subtle enough
 *   that, per his instruction, no card should visually "shout" over the
 *   others; emphasis now comes from content + micro-interaction, not color
 *   inversion.
 * - Hover redefined to exactly four properties, nothing else: background
 *   warms slightly (`hover:bg-[#F7F0E4]`, the same warm hover tint this
 *   file used historically pre-two-layer, reused rather than inventing
 *   another one-off hex), ring opacity increases slightly, shadow deepens
 *   (`shadow-sm` → `shadow-xl`, both `shadow-charcoal` tinted — Tailwind's
 *   built-in blur progression reads as "soft," not a hand-tuned box-
 *   shadow), and the card lifts 2px (`hover:-translate-y-0.5`). Icon color
 *   no longer changes on hover (the previous gold recolor was a fifth,
 *   uninstructed hover effect) — everything shares one
 *   `transition-all duration-[900ms] ease-in-out`, no faster/sharper transitions
 *   mixed in anywhere in this component.
 * - Icons: still solid `deep-navy` via the same CSS `mask-image` technique
 *   (see round above), but now wrapped in a small circular container with
 *   a hairline `ring-deep-navy/10` (`group-hover:ring-deep-navy/20`) so
 *   the icon has a defined edge on the light card instead of floating
 *   free — per his "ring یا container خیلی ظریف" request. No glow, no
 *   fill color on the container itself.
 * - Typography: `titleEn` pulled tight against `title` (`-mt-0.5`, plus
 *   `uppercase tracking-wide` for an editorial secondary-label feel) so
 *   the two read as one unit; the gap before `subtitle` widened instead,
 *   separating "identity" from "description." `subtitle`'s fixed
 *   `px-[35px]` (added two rounds ago) is gone — per his explicit
 *   "توضیح... عرض خواناتری داشته باشد" this cycle reverses that squeeze —
 *   replaced with `leading-relaxed` and the card's own padding as the only
 *   width constraint. `line-clamp-2` stays as a safety net for the
 *   one-viewport rule below, but triggers far less often now that the
 *   text isn't artificially narrowed.
 * - Header: added an uppercase `eyebrow` line above the Persian heading
 *   (`dict.services.eyebrow`, one of the two exact strings Hamid proposed)
 *   with wide letter-tracking for an editorial feel; `subheading` tightened
 *   for concision (see fa.ts's doc-comment — same facts, fewer words).
 *
 * `h-dvh` one-viewport rule (round 2026-07-05 earlier) still applies and
 * was re-checked after all of the above; still fits.
 *
 * Round 2026-07-05, later still (per Hamid — a deliberate reversal of the
 * "no navy card, fixed or temporary" rule two rounds up, flagged as such
 * rather than silently re-applied): hover now goes navy after all —
 * `hover:bg-deep-navy` — with title/titleEn/subtitle and the icon
 * recoloring to warm-white and the icon container's ring flipping to
 * `warm-white/20` for contrast against the now-dark card. Rest state is
 * untouched (still light, still the subtle `ring-gold/25` cue on the
 * jaw-surgery card). Ring-on-hover changed from the neutral
 * charcoal-tint to `gold/30` uniformly, since a thin gold border reads
 * naturally against navy the same way this project's other dark surfaces
 * already use it — the previous neutral-ring choice was tuned for a light
 * hover state that no longer exists. Every recolored element keeps the
 * same `transition-colors duration-[900ms] ease-in-out` as the card's own
 * `transition-all`, so background/ring/shadow/lift/text/icon all animate
 * in lockstep.
 *
 * Round 2026-07-05, one more pass (per Hamid: "هاور باید خیلی نرم‌تر
 * باشه... رنگ هاور نرم‌تر و آهسته‌تر پخش بشه" — the navy hover above felt
 * too fast/abrupt): every hover transition's duration went from 500ms to
 * 900ms and the easing changed from `ease-out` to `ease-in-out`, still
 * applied uniformly across the card, ring, icon, and all three text
 * elements so nothing drifts out of sync.
 *
 * Typography: current live setting is Vazirmatn for everything
 * (DESIGN_SYSTEM.md §3, 2026-07-11).
 *
 * Motion (Framer Motion, gated by `useReducedMotion()`): heading/eyebrow/
 * subheading fade up on scroll-into-view; item panels stagger in (fade +
 * slight upward translate). Panel hover (bg/ring/shadow/lift, all on the
 * card div) is plain CSS/`:hover`, deliberately NOT Framer Motion, and
 * lives on a different element than the one Framer Motion writes its
 * entrance transform to — stacking a CSS hover transform on an element
 * Framer Motion also animates lets the inline style silently win and the
 * hover effect never appears (same reason documented in this project's
 * other card grids).
 */
/**
 * Round 2026-07-13 (taxonomy correction, per Hamid): `items` is now the
 * shared `src/content/services.ts` taxonomy (not `dict.items`, which no
 * longer exists — see `ServicesDictionary`'s doc-comment). Each card is
 * now a real `<Link>` to `/[locale]/services/[slug]` — previously this
 * section had NO navigation at all (see this file's own history above);
 * visuals/motion are untouched, only the outer `<div>` became a `<Link>`
 * with the exact same classes.
 */
export function FeaturedServicesSection({
  dict,
  items,
  locale,
}: {
  dict: ServicesDictionary;
  items: readonly ServiceTaxonomyItem[];
  locale: Locale;
}) {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = (delay: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 16 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.5, delay: shouldReduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      id="services"
      data-header-bg="#fcfbf4"
      dir={LOCALE_DIRECTION[locale]}
      className="snap-section relative flex h-dvh flex-col justify-center overflow-hidden bg-cream px-4 py-4 sm:px-8 sm:py-6 lg:py-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 start-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="text-center">
          <motion.span
            {...fadeUp(0)}
            className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-charcoal/40 sm:text-[11px]"
          >
            {dict.eyebrow}
          </motion.span>
          <motion.h2
            {...fadeUp(shouldReduceMotion ? 0 : 0.06)}
            className="mt-1 text-balance text-lg font-bold leading-tight text-charcoal sm:mt-1.5 sm:text-2xl lg:text-3xl"
          >
            {dict.heading}
          </motion.h2>
          <motion.p
            {...fadeUp(shouldReduceMotion ? 0 : 0.12)}
            className="mx-auto mt-1 max-w-2xl text-[11px] leading-5 text-charcoal/60 sm:mt-2 sm:text-sm lg:text-base"
          >
            {dict.subheading}
          </motion.p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-3 sm:gap-4 lg:mt-8 lg:gap-5">
          {items.map((item, index) => (
            <motion.div key={item.id} {...fadeUp(shouldReduceMotion ? 0 : 0.16 + index * 0.06)}>
              <ServiceTile item={item} locale={locale} isFeatured={item.id === "orthognathic-surgery"} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
