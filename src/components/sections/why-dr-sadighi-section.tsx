"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import type { DoctorStoryDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";

/**
 * "Why Dr. Sadighi" — Section 3 of the homepage (HOMEPAGE_STORYBOARD.md
 * §2 "03").
 *
 * Round 2026-07-04 (second redesign, same day): Hamid sent a full
 * "Mission & Values" rebrief with a reference dashboard-style screenshot
 * ("inspiration for layout only, do not copy the style directly") and a
 * proper studio headshot of Dr. Sadighi, replacing the intraoperative
 * photo used in the first version of this section. Structural changes
 * from that first version:
 * - Right column is now a cluster: the portrait plus 2 small metric
 *   cards, staggered — not just a bare portrait.
 * - Left column gained a plain bulleted values list (dot markers, not the
 *   01/02/03 numbered list from the first version) and a real CTA
 *   `Link`, not an inert button — see the note above the button below.
 *
 * Real-content flag, again — same issue as before, not a new one: the
 * rebrief's "metric cards" reused the exact same two fabricated example
 * numbers (+12 years, 3,000+ cases) alongside one real fact (two cities).
 * `dict.metrics` uses only confirmed facts (two-city practice, the
 * fellowship) — see fa.ts's doctorStory doc-comment. Ask the client for
 * real experience-years/case-count figures if those should ship later;
 * they don't ship as placeholders in the meantime.
 *
 * Photo: expects `public/media/doctor-headshot.jpeg` (a DIFFERENT file
 * from `doctor-portrait.jpeg`, which is the earlier intraoperative photo
 * — kept separate rather than overwritten, in case that photo is still
 * wanted elsewhere later, per the earlier conversation about where it
 * might fit). Hamid needs to save the new headshot there; this component
 * only references the path.
 *
 * CTA: links to `/dr-sadighi`, per Hamid's brief ("a dedicated Dr.
 * Sadighi bio page") — that route does NOT exist yet in this app. Using a
 * real `next/link` (not an inert placeholder button, unlike the Smart
 * Clinic Assistant section's controls) because this is a real intended
 * navigation, not a future-backend placeholder — but it will 404 until
 * that page is built. Flagging here rather than shipping a silently
 * broken link without a note.
 *
 * Spelling note (repeated from the first version): both of Hamid's briefs
 * for this section spell the doctor's name "Sedighi" in the requested
 * component name; the rest of this codebase (fa.ts, docs) consistently
 * uses "Sadighi." Kept the existing spelling for consistency —
 * `WhyDrSadighiSection`, not `WhyDrSedighiSection`.
 *
 * Motion (Framer Motion, gated by `useReducedMotion()`): title/paragraph
 * fade + upward translate; values list staggers ~150ms apart; portrait
 * does a gentle scale-up-into-focus (0.96 → 1) + fade, per Hamid's "smart
 * feeling, as if the image is gently focusing into view"; metric cards
 * stagger in from below with a very slight easing overshoot (a mild
 * bezier curve, not a spring/bounce — see CARD_TRANSITION below) per his
 * explicit "very small overshoot... no bouncing, no cheap spring
 * animations" distinction; CTA gets a gentle hover scale + background
 * tint, no shimmer/sweep (that effect lives on the Smart Clinic
 * Assistant's primary CTA, not here — this brief asked for something
 * calmer).
 *
 * Round 2026-07-04 (third pass, same day): Hamid sent the exact same
 * reference screenshot again and asked to match it literally ("عین همین
 * طرح"), which on its face conflicted with his own earlier "layout
 * inspiration only, don't copy the style" instruction — flagged before
 * touching anything, since a literal copy would mean shipping the
 * reference's stock photos of strangers, an irrelevant "80+ Doctors
 * Online" stat (this is a single-surgeon practice), and generic English
 * copy. He confirmed: match the reference's STRUCTURE (two-tone bold
 * title, 2-column ring-icon values grid, a real grid-based image+card
 * cluster instead of loosely staggered absolute cards) with this
 * project's own real content, on a light background instead of the
 * reference's navy. Not a fabricated-content situation this time — a
 * legitimate visual-structure request, executed with what was already
 * real (photo, metrics, values) restyled to match.
 *
 * Round 2026-07-04 (fifth pass, same day): section is now `h-dvh` (100%
 * viewport height, matching hero.tsx and the Smart Clinic Assistant
 * section) with a full navy background (same `bg-gradient-to-br
 * from-deep-navy to-[#1a2540]` used there) instead of cream — text colors
 * flipped to warm-white/gold accordingly, since charcoal-on-cream tokens
 * don't read on a dark surface. Same overflow-hidden/clipping tradeoff
 * as before applies here now too: content taller than one screen gets
 * clipped rather than scrolled.
 *
 * Also this pass: the headshot Hamid placed turned out to be
 * `doctor-portrait.png` — a PNG, not the `doctor-headshot.jpeg` this
 * component expected, AND dangerously close in name to
 * `doctor-portrait.jpeg` (the surgical photo already in use elsewhere in
 * this file) — exactly the kind of near-collision that caused the
 * previous "photo not showing" bug. Both files renamed on disk to be
 * unambiguous: `doctor-headshot.png` (calm portrait) and
 * `doctor-surgery.jpg` (the OR photo) — no two doctor images in this
 * project share a name stem anymore.
 *
 * Round 2026-07-05 (per Hamid: mobile was broken, plus headline size):
 * this section is `h-dvh` + `overflow-hidden` (round above), and at
 * mobile widths the stacked visual-cluster + full text column were
 * taller than one screen — the CTA and part of the values list were
 * being silently clipped off the bottom, not just "a bit tight." Every
 * size/spacing value in this component now has a genuinely small mobile
 * base (photo cluster capped at `max-w-[220px]`, metric-card text down to
 * `text-xs`/`text-[8px]`, body paragraph `text-[11px] leading-5`, CTA
 * `text-xs px-5 py-2`, etc.) scaling up through `sm`/`lg` back to the
 * original desktop sizes — sm/lg values are unchanged from before. The
 * values list also switched from `grid-cols-1 sm:grid-cols-2` to a flat
 * `grid-cols-2` (2 columns even on mobile, bullets/text shrunk to match)
 * since a single mobile column of 3-4 lines was a large part of the
 * excess height; the odd-count-last-item full-width span moved from
 * `sm:col-span-2` to a plain `col-span-2` to match. Headline is also a
 * flat 30px at `lg` and up now (`lg:text-[30px]`, replacing `lg:text-5xl`
 * /48px) per his explicit desktop-size request — same pattern as the
 * Hero and Smart Clinic Assistant headline changes this cycle.
 */
export function WhyDrSadighiSection({ dict, locale }: { dict: DoctorStoryDictionary; locale: Locale }) {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = (delay: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 20 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.6, delay: shouldReduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  // A very slight overshoot via easing (not a spring) — per Hamid's
  // explicit distinction between "small overshoot for cards" and "no
  // bouncing anywhere else" in the same brief.
  const cardTransition = (delay: number) => ({
    duration: shouldReduceMotion ? 0.01 : 0.7,
    delay: shouldReduceMotion ? 0 : delay,
    ease: [0.34, 1.1, 0.64, 1] as const,
  });

  return (
    <section
      id="why-dr-sadighi"
      data-header-bg="#0f172a"
      className="snap-section relative flex h-dvh items-center overflow-hidden bg-gradient-to-br from-deep-navy to-[#1a2540] px-4 py-3 sm:px-8 sm:py-10 lg:py-12"
    >
      <div className="mx-auto grid max-w-6xl gap-3 sm:gap-8 lg:grid-cols-2 lg:items-center lg:gap-20">
        {/* Visual cluster — DOM-first, renders on the right in this RTL
            layout. Round 2026-07-04 (fifth pass, same day): Hamid sent the
            exact HTML/CSS of the arrangement he wants — two independent
            rows (not a spanning portrait), each pairing one photo with one
            stat card, cross-axis-aligned to opposite edges (row 1 bottom-
            aligned, row 2 top-aligned) with the second row's stat card
            inset from its own edge. Rebuilt to match that structure
            exactly, translated for RTL: his HTML kept the same child
            order under `dir="rtl"`, which flips the visual result — first
            child in each row lands on the right here, same as everywhere
            else in this file.
            Second photo is the intraoperative shot from earlier in this
            project (consent confirmed) — no second unrelated "lifestyle"
            photo exists, and a stock one is off the table for the same
            reason as before. */}
        <div className="mx-auto flex w-full max-w-[220px] flex-col gap-2 sm:max-w-sm sm:gap-4 md:max-w-md lg:mx-0 lg:gap-6">
          {/* Row 1 — headshot + metric 0, bottom-aligned. */}
          <div className="flex items-end gap-2 sm:gap-4 lg:gap-5">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[297/342] flex-[3] overflow-hidden rounded-2xl shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:rounded-[28px]"
            >
              <Image
                src="/media/doctor-headshot.png"
                alt={dict.portraitAlt}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover object-top"
                priority={false}
              />
            </motion.div>

            {/* Metric cards — cream/navy/gold only, thin border/minimal
                shadow, per Hamid's explicit "no harsh gradients or overly
                bright neon colors" — deliberately not the reference's
                saturated purple/cyan card colors. */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={cardTransition(shouldReduceMotion ? 0 : 0.3)}
              className="flex flex-[2] flex-col justify-center rounded-lg bg-deep-navy p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.3)] sm:rounded-2xl sm:p-4 lg:p-5"
            >
              <p className="font-heading text-xs font-bold text-gold sm:text-2xl lg:text-3xl">{dict.metrics[0].value}</p>
              <p className="mt-0.5 text-[8px] leading-tight text-warm-white/80 sm:mt-1 sm:text-xs sm:leading-5">{dict.metrics[0].label}</p>
            </motion.div>
          </div>

          {/* Row 2 — metric 1 (inset from its own edge) + second photo, top-aligned. */}
          <div className="flex items-start gap-2 sm:gap-4 lg:gap-5">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={cardTransition(shouldReduceMotion ? 0 : 0.45)}
              className="ms-3 flex flex-[2] flex-col justify-center rounded-lg border border-gold/25 bg-warm-white p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.1)] sm:ms-8 sm:rounded-2xl sm:p-4"
            >
              <p className="font-heading text-[10px] font-bold text-charcoal sm:text-lg lg:text-xl">{dict.metrics[1].value}</p>
              <p className="mt-0.5 text-[8px] leading-tight text-charcoal/60 sm:mt-1 sm:text-xs sm:leading-5">{dict.metrics[1].label}</p>
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.96 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={cardTransition(shouldReduceMotion ? 0 : 0.6)}
              className="relative aspect-[290/253] flex-[3] overflow-hidden rounded-lg shadow-[0_20px_50px_rgba(15,23,42,0.15)] sm:rounded-2xl"
            >
              <Image
                src="/media/doctor-surgery.jpg"
                alt={dict.surgeryAlt}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover object-[75%_25%]"
              />
            </motion.div>
          </div>
        </div>

        {/* Text column — DOM-second, renders on the left in this RTL layout. */}
        <div className="mt-3 text-center sm:mt-6 lg:mt-0 lg:text-start">
          <motion.h2 {...fadeUp(0)} className="text-balance text-lg font-bold leading-tight text-warm-white sm:text-2xl lg:text-[30px]">
            {/* Two-tone title, per the reference's confident bold-word
                treatment — the final word carries the gold accent. */}
            {dict.headline.split(" ").map((word, index, words) => (
              <span key={`${word}-${index}`} className={index === words.length - 1 ? "text-gold" : undefined}>
                {word}
                {index < words.length - 1 ? " " : ""}
              </span>
            ))}
          </motion.h2>

          <motion.p
            {...fadeUp(shouldReduceMotion ? 0 : 0.15)}
            className="mt-1.5 text-[11px] leading-5 text-warm-white/70 sm:mt-4 sm:text-base sm:leading-7 lg:mt-6 lg:text-lg lg:leading-9"
          >
            {dict.body}
          </motion.p>

          {/* Values — 2-column grid with a ring-style bullet (a small
              gold ring with a filled center dot), matching the reference's
              icon language rather than a plain dot. Kept 2-column at every
              breakpoint (not just sm+) so the list stays compact enough on
              mobile to fit one viewport — see this file's doc-comment. */}
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:mt-6 sm:gap-x-8 sm:gap-y-4 lg:mt-8">
            {dict.principles.map((principle, index) => (
              <motion.li
                key={principle}
                {...fadeUp(shouldReduceMotion ? 0 : 0.3 + index * 0.15)}
                className={`flex items-center justify-center gap-1.5 sm:gap-3 lg:justify-start ${
                  index === dict.principles.length - 1 && dict.principles.length % 2 !== 0 ? "col-span-2" : ""
                }`}
              >
                <span
                  aria-hidden
                  className="relative flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2 border-gold sm:h-5 sm:w-5"
                >
                  <span className="h-1 w-1 rounded-full bg-gold sm:h-1.5 sm:w-1.5" />
                </span>
                <span className="text-[10px] text-warm-white/80 sm:text-base">{principle}</span>
              </motion.li>
            ))}
          </ul>

          <motion.div {...fadeUp(shouldReduceMotion ? 0 : 0.75)} className="mt-3 sm:mt-6 lg:mt-10">
            <motion.div whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }} transition={{ duration: 0.2 }} className="inline-block">
              <Link
                href={`/${locale}/about`}
                className="inline-flex items-center justify-center rounded-full border border-gold px-5 py-2 text-xs font-semibold text-warm-white transition-colors duration-200 hover:bg-gold/10 hover:text-gold sm:px-8 sm:py-3.5 sm:text-sm"
              >
                {dict.cta}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
