"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

import type { PatientStoriesDictionary, PatientStoryEvidence } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * "روایت‌های واقعی بیماران" (Patient Stories / Documentary) — the
 * homepage's final section, per Hamid's full design brief (see
 * HOMEPAGE_STORYBOARD.md §07 for the complete design spec this
 * implements). Built in three stages this round:
 * 1. A standalone HTML/CSS/JS mockup (Artifact) — pure visual design, no
 *    production code, per his first request ("طراحی UI و Layout... نه کد").
 * 2. He approved the direction and asked for the actual design (not more
 *    markdown) — the mockup above was that.
 * 3. He then asked for it wired into the real homepage as its last
 *    section ("این باید ادامه صفحه اصلی باشه نه یک صفحه جدا") — this file.
 * Colors/spacing here use this project's real Tailwind tokens
 * (`bg-deep-navy`, `text-gold`, `text-warm-white`, etc.) instead of the
 * mockup's standalone hex values — the mockup was a disposable prototype,
 * this is the real, maintained implementation.
 *
 * Layout: RTL-native, no `dir="ltr"` override. The hero video is first in
 * DOM and lands on the visual right under this page's natural `dir="rtl"`
 * flow; text is second, landing left — matching Hamid's explicit "ستون
 * راست = ویدئو، ستون چپ = متن" without re-introducing the `dir="ltr"`
 * overflow bug already hit and fixed once this cycle in
 * `case-gallery-section.tsx`/`patient-journey-section.tsx`.
 *
 * Evidence grid: same asymmetric CSS Grid `col-span`/`row-span`-per-item
 * technique already proven in `case-gallery-section.tsx`, not a new grid
 * system. Placeholder media (no real video/review/Instagram assets exist
 * yet — see the storyboard doc's Open Items) uses the same navy-gradient
 * + icon-motif treatment as every other placeholder in this project —
 * never a fabricated stock photo standing in for a real patient.
 *
 * Spotlight/dimming hover: a single `activeId` state at the section level
 * (not per-card CSS `:hover`) — sibling cards can't react to each other's
 * hover in plain CSS without `:has()`, and a shared state is simpler and
 * more predictable than relying on that. Hovering the hero video or any
 * evidence card sets `activeId`; every other item dims to ~40% opacity
 * while the active one lifts slightly and its border/shadow intensify.
 * Entrance (fade + slight rise, staggered across the grid) is Framer
 * Motion, matching this project's established split — Framer Motion owns
 * entrance, plain CSS/conditional classes own hover/interaction state.
 *
 * Round 2026-07-06, follow-up fixes (per Hamid):
 * - Trust badges (Google/Instagram) were wrapping onto separate lines on
 *   narrower widths — changed to `flex-nowrap` with trimmed padding/font
 *   size so they always sit side by side, with `overflow-x-auto` as a
 *   last-resort escape hatch rather than ever stacking.
 * - The closing "photo story" card is now the one deliberately LIGHT card
 *   in this dark section (`bg-cream`, centered text) instead of matching
 *   the rest — and rotates through 5 short quotes (`PhotoStoryCard`,
 *   fade-out/swap/fade-in on an interval), not one static line. Only the
 *   first quote is Hamid's own; the other 4 are draft copy he asked for
 *   ("۵ تا نوشته پیش‌فرض") — flagged in fa.ts with the same TODO(content)
 *   convention as `brandIntro`. The avatar next to each quote is a generic
 *   silhouette placeholder, not a fabricated photo of a specific patient —
 *   no real per-quote photos exist yet.
 *
 * Round 2026-07-06, later same day (per Hamid, two more corrections):
 * - Photo-story avatar moved from above the quote to beside it (a row, not
 *   a stack) and the card's own padding/type sizes shrunk — his direct
 *   feedback after seeing it stacked. `EVIDENCE_LAYOUT`'s `photo-1` went
 *   back to `row-span-1` (was bumped to `row-span-2` for the taller
 *   stacked version, no longer needed).
 * - Heading pinned to a flat 30px at `lg` and up (`lg:text-[30px]`,
 *   replacing `lg:text-5xl`/48px) — same "desktop-only, not all
 *   breakpoints" pattern used for the Hero/Smart Clinic Assistant/Why Dr.
 *   Sadighi headings earlier this cycle. The whole section also switched
 *   to `h-dvh` + `flex flex-col justify-center` (was natural/organic
 *   height) per his "کل سکشن در یک صفحه جا داده بشه" — every gap/padding/
 *   grid-row-height value in this file was tightened together with the
 *   heading change specifically to make the hero + full evidence grid fit
 *   one viewport, same one-viewport-budget exercise this project has done
 *   for `featured-services-section.tsx` and `case-gallery-section.tsx`.
 * - The gap between the hero row and the evidence grid was visibly larger
 *   than the grid's own internal row gap (he circled both in a screenshot,
 *   "۱" vs "۲") — the margin-top on the grid wrapper (`mt-*`) is now set
 *   to the exact same value as the grid's own `gap-*`, so both read as one
 *   consistent rhythm instead of two different gap sizes.
 */

type EvidenceItem = PatientStoryEvidence;

// Round 2026-07-12 (per Hamid, screenshot-marked correction, mobile
// only): the video/review/instagram mosaic cards were pushing the section
// past one mobile viewport, clipping both the hero video above it and
// the grid itself. He asked to drop them from mobile entirely, keeping
// only `photo-1` (the cream patient-quote card, `PhotoStoryCard`) —
// `hidden sm:block` on the other four; desktop (`sm` and up) is
// untouched, still all 5. Removing 4 of 5 cards freed far more mobile
// height than needed (measured: content dropped to 481px in an 844px
// viewport) — so the earlier round's aggressive mobile compaction (hero
// video shrunk to `aspect-[16/8]`, a 12px play button, tight margins) was
// partly undone: video back to standard `aspect-video`, play button back
// to `h-16 w-16`, spacing loosened — a properly-presented section with
// one hero video and one quote card, not a cramped leftover layout.
const EVIDENCE_LAYOUT: Record<string, string> = {
  "video-1": "hidden sm:block col-span-2 row-span-2",
  "review-1": "hidden sm:block col-span-1 row-span-1",
  "instagram-1": "hidden sm:block col-span-1 row-span-2",
  "video-2": "hidden sm:block col-span-1 row-span-1",
  "photo-1": "col-span-2 row-span-1 sm:col-span-4",
};

function IconPlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 4l13 8-13 8V4z" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 1l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.2l6.1-.6z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconPerson({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20.5c0-4.14 3.86-6.5 8-6.5s8 2.36 8 6.5" />
    </svg>
  );
}

function IconGoogle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="#4285F4" d="M22.5 12.2c0-.8-.07-1.4-.2-2H12v3.8h6c-.13 1-.8 2.5-2.3 3.5l3.6 2.8c2.1-2 3.4-4.9 3.4-8.1z" />
      <path fill="#34A853" d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.6-2.8c-1 .7-2.3 1.1-4 1.1-3 0-5.6-2-6.6-4.8l-3.7 2.9C3.1 20.5 7.2 23 12 23z" />
      <path fill="#FBBC05" d="M5.4 13.7c-.25-.7-.4-1.5-.4-2.2s.15-1.5.4-2.2L1.7 6.4C1 8 .5 9.9.5 11.5s.5 3.5 1.2 5.1l3.7-2.9z" />
      <path fill="#EA4335" d="M12 5.4c1.7 0 2.9.7 3.6 1.3l2.7-2.6C16.7 2.4 14.1 1 12 1 7.2 1 3.1 3.5 1.7 6.4l3.7 2.9C6.4 6.4 9 5.4 12 5.4z" />
    </svg>
  );
}

function GlassCard({
  active,
  dimmed,
  className,
  onEnter,
  onLeave,
  children,
}: {
  active: boolean;
  dimmed: boolean;
  className?: string;
  onEnter: () => void;
  onLeave: () => void;
  children: ReactNode;
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ease-out ${
        active
          ? "-translate-y-1 scale-[1.015] border-gold/45 bg-warm-white/[0.09] shadow-[0_26px_60px_-15px_rgba(0,0,0,0.55)]"
          : "border-warm-white/10 bg-warm-white/[0.05]"
      } ${dimmed ? "opacity-40 saturate-[0.8] brightness-90" : "opacity-100"} ${className ?? ""}`}
      style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
    >
      {children}
    </div>
  );
}

export function PatientStoriesSection({ dict, locale }: { dict: PatientStoriesDictionary; locale: Locale }) {
  const shouldReduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);

  const fadeUp = (delay: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 18 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.6, delay: shouldReduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  const isDimmed = (id: string) => activeId !== null && activeId !== id;

  return (
    <section
      data-header-bg="#0f172a"
      dir={LOCALE_DIRECTION[locale]}
      className="snap-section relative flex h-dvh flex-col justify-center overflow-hidden bg-deep-navy px-4 py-6 sm:px-8 sm:py-7 lg:py-8"
    >
      {/* Cinematic ambient light — same decorative-glow pattern used across
          this project's dark sections, not a new visual language. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 end-[-8%] h-[460px] w-[460px] rounded-full bg-gold/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 start-[-10%] h-[380px] w-[380px] rounded-full bg-warm-white/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Hero: video first in DOM = visual right under natural dir="rtl",
            per Hamid's explicit "ستون راست = ویدئو". */}
        <div className="grid items-center gap-5 sm:gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <motion.div {...fadeUp(shouldReduceMotion ? 0 : 0.1)}>
            <div
              onMouseEnter={() => setActiveId("hero-video")}
              onMouseLeave={() => setActiveId(null)}
              className={`group relative aspect-video overflow-hidden rounded-2xl border transition-all duration-500 ease-out ${
                activeId === "hero-video"
                  ? "border-gold/50 shadow-[0_30px_70px_-18px_rgba(0,0,0,0.65)]"
                  : "border-gold/25 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]"
              } ${activeId !== null && activeId !== "hero-video" ? "opacity-40 saturate-[0.8] brightness-90" : "opacity-100"}`}
              style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-deep-navy to-[#1a2540]" />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 80% at 30% 40%, rgba(201,161,90,0.16), transparent 65%), radial-gradient(50% 60% at 75% 70%, rgba(250,247,241,0.08), transparent 60%)",
                }}
              />
              <button
                type="button"
                aria-label={dict.playAriaLabel}
                className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-deep-navy/40 transition-all duration-300 ease-out sm:h-20 sm:w-20 ${
                  activeId === "hero-video" ? "scale-105 bg-gold/20 shadow-[0_0_30px_8px_rgba(201,161,90,0.3)]" : "animate-pulse"
                }`}
              >
                <IconPlay className="h-6 w-6 translate-x-[-2px] text-warm-white sm:h-7 sm:w-7" />
              </button>
              <span className="absolute bottom-4 end-4 rounded-full border border-warm-white/15 bg-deep-navy/60 px-3 py-1.5 text-xs text-warm-white/70 backdrop-blur-sm">
                {dict.videoLabel}
              </span>
            </div>
          </motion.div>

          <motion.div {...fadeUp(shouldReduceMotion ? 0 : 0.02)}>
            <h2 className="text-balance bg-gradient-to-l from-gold to-warm-white bg-clip-text text-xl font-extrabold leading-tight text-transparent sm:text-2xl lg:text-[30px]">
              {dict.heading}
            </h2>
            <p className="mt-2.5 max-w-lg text-xs leading-6 text-warm-white/65 sm:mt-3 sm:text-sm sm:leading-6 lg:text-base lg:leading-8">{dict.subheading}</p>

            {/* Per Hamid: these two must sit side by side, never stacked —
                `flex-nowrap` guarantees one row; sizing/padding is trimmed
                down (vs. the first pass) specifically so both fit on one
                line even on narrow phone widths instead of wrapping. */}
            <div className="mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto sm:mt-5">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-warm-white/15 bg-warm-white/5 px-3 py-1.5 text-xs text-warm-white/70 backdrop-blur-sm sm:text-sm">
                <IconGoogle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">
                  {dict.moreThanLabel} <span className="border-b border-dashed border-gold/50 text-gold">«{dict.googleReviewCount}»</span>{" "}
                  {dict.googleBadge}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-warm-white/15 bg-warm-white/5 px-3 py-1.5 text-xs text-warm-white/70 backdrop-blur-sm sm:text-sm">
                <IconInstagram className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">{dict.instagramBadge}</span>
              </span>
            </div>
          </motion.div>
        </div>

        {/* Emotional evidence grid — asymmetric, per case-gallery-section.tsx's
            established col-span/row-span technique. */}
        <div className="mt-6 grid auto-rows-[120px] grid-cols-2 gap-2 sm:mt-3 sm:auto-rows-[100px] sm:grid-cols-4 sm:gap-3 lg:auto-rows-[115px]">
          {dict.evidence.map((item, index) => (
            <motion.div key={item.id} {...fadeUp(shouldReduceMotion ? 0 : 0.15 + index * 0.08)} className={EVIDENCE_LAYOUT[item.id] ?? "col-span-1 row-span-1"}>
              <EvidenceCard
                item={item}
                photoStories={dict.photoStories}
                verifiedOnGoogleLabel={dict.verifiedOnGoogleLabel}
                shouldReduceMotion={Boolean(shouldReduceMotion)}
                active={activeId === item.id}
                dimmed={isDimmed(item.id)}
                onEnter={() => setActiveId(item.id)}
                onLeave={() => setActiveId(null)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EvidenceCard({
  item,
  photoStories,
  verifiedOnGoogleLabel,
  shouldReduceMotion,
  active,
  dimmed,
  onEnter,
  onLeave,
}: {
  item: EvidenceItem;
  photoStories: PatientStoriesDictionary["photoStories"];
  verifiedOnGoogleLabel: string;
  shouldReduceMotion: boolean;
  active: boolean;
  dimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  if (item.type === "video") {
    return (
      <GlassCard active={active} dimmed={dimmed} onEnter={onEnter} onLeave={onLeave} className="h-full">
        <div
          className={`absolute inset-0 bg-gradient-to-br from-deep-navy to-[#1a2540] transition-[filter] duration-500 ease-out ${
            active ? "brightness-125" : ""
          }`}
        />
        <span className="absolute start-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 bg-deep-navy/50">
          <IconPlay className="h-2.5 w-2.5 translate-x-[-1px] text-warm-white" />
        </span>
        <p
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-deep-navy/80 to-transparent px-4 py-3 text-sm font-semibold text-warm-white transition-transform duration-500 ease-out ${
            active ? "translate-y-0" : "translate-y-1"
          }`}
        >
          {item.caption}
        </p>
      </GlassCard>
    );
  }

  if (item.type === "review") {
    return (
      <GlassCard active={active} dimmed={dimmed} onEnter={onEnter} onLeave={onLeave} className="flex h-full flex-col gap-2.5 p-5">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <IconStar key={i} className="h-3.5 w-3.5 text-gold" />
          ))}
        </div>
        <p className="text-sm leading-7 text-warm-white/75">{item.quote}</p>
        <span className="text-sm font-semibold text-warm-white">{item.name}</span>
        <span className="mt-auto inline-flex w-fit items-center gap-1.5 text-[11px] text-warm-white/45">
          <IconGoogle className="h-3 w-3" />
          {verifiedOnGoogleLabel}
        </span>
      </GlassCard>
    );
  }

  if (item.type === "instagram") {
    return (
      <GlassCard active={active} dimmed={dimmed} onEnter={onEnter} onLeave={onLeave} className="flex h-full flex-col">
        <div className="relative flex-1 bg-gradient-to-br from-[#33253f] to-[#12101c]">
          <span
            className={`absolute end-3 top-3 flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-300 ease-out ${
              active ? "bg-gradient-to-br from-[#f3b45a] via-[#d6446f] to-[#7a4fd6] text-warm-white" : "bg-deep-navy/40 text-warm-white/70"
            }`}
          >
            <IconInstagram className="h-4 w-4" />
          </span>
        </div>
        <p className="px-4 py-3 text-sm font-medium text-warm-white/80">{item.caption}</p>
      </GlassCard>
    );
  }

  // photo — cream card (deliberately the one light card in this otherwise
  // dark section, per Hamid's explicit ask), rotating through 5 quotes.
  return <PhotoStoryCard stories={photoStories} active={active} dimmed={dimmed} onEnter={onEnter} onLeave={onLeave} shouldReduceMotion={shouldReduceMotion} />;
}

function PhotoStoryCard({
  stories,
  active,
  dimmed,
  onEnter,
  onLeave,
  shouldReduceMotion,
}: {
  stories: PatientStoriesDictionary["photoStories"];
  active: boolean;
  dimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
  shouldReduceMotion: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Cycle through the 5 quotes — fade out, swap, fade in — one at a time,
  // per Hamid's "یکی یکی ظاهر بشن و محو بشن". Skipped under reduced motion
  // (shows the first quote statically) rather than fading without a
  // vestibular-safe alternative.
  useEffect(() => {
    if (shouldReduceMotion || stories.length <= 1) return;
    const cycle = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % stories.length);
        setVisible(true);
      }, 500);
    }, 4200);
    return () => window.clearInterval(cycle);
  }, [shouldReduceMotion, stories.length]);

  const current = stories[index];

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`relative flex h-full flex-row items-center justify-center gap-3 overflow-hidden rounded-2xl border px-5 py-4 text-center transition-all duration-500 ease-out ${
        active
          ? "-translate-y-1 scale-[1.015] border-gold/50 bg-cream shadow-[0_26px_60px_-15px_rgba(0,0,0,0.22)]"
          : "border-charcoal/10 bg-cream"
      } ${dimmed ? "opacity-40 saturate-[0.85] brightness-95" : "opacity-100"}`}
    >
      {/* Generic placeholder avatar — no real distinct patient photos
          exist for these draft quotes yet (see fa.ts's TODO), so this is
          an anonymous silhouette, not a fabricated stock photo standing
          in for a specific person. Sits beside the text, not above it
          (per Hamid's correction), so the box reads as a compact row. */}
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-warm-white text-charcoal/35">
        <IconPerson className="h-5 w-5" />
      </span>
      <div className={`transition-opacity ${shouldReduceMotion ? "" : "duration-500 ease-out"} ${visible ? "opacity-100" : "opacity-0"}`}>
        <p className="max-w-lg text-sm leading-7 text-charcoal sm:text-base">{current.quote}</p>
        <p className="mt-1 text-xs font-semibold text-gold sm:text-sm">{current.meta}</p>
      </div>
    </div>
  );
}
