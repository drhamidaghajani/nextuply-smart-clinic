"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

import type { VideoHubDictionary, VideoHubVideo } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * "Video Hub" (ویدئوهای مستند و آموزشی) — a standalone homepage section,
 * per Hamid's full brief (2026-07-07). Explicitly pulled OUT of
 * `knowledge-center-section.tsx`'s old Video Strip block into its own
 * section ("این سکشن باید... یک سکشن مستقل، نه زیرمجموعه Knowledge
 * Center") — a full curated cinematic video hub, not a simple strip:
 * category tabs, one large featured video, and a horizontal carousel of
 * the rest.
 *
 * Structure (2026-07-08, current):
 * - Header (heading/subheading, his exact text) — pinned to the
 *   project's standing 30px/22px heading/subheading rule
 *   (DESIGN_SYSTEM.md §3).
 * - Video area: 1 big featured video + its caption, plus the OTHER 2
 *   videos in the current category as small "up next" thumbnails — see
 *   the 2026-07-08 round note below for why this replaced the earlier
 *   featured-block + separate-carousel-row structure.
 * - Category pill tabs, below the whole video area.
 *
 * State (matches his explicit ask for a React-shaped explanation):
 * `selectedCategory` (id of the active tab) and `featuredId` (id of the
 * video currently shown large). Clicking a tab sets `selectedCategory`
 * AND resets `featuredId` to that category's first video ("Featured
 * Video را روی اولین ویدئوی آن دسته قرار دهد"); clicking a thumbnail
 * only changes `featuredId`. `smallVideos` is derived, not stored: the
 * category's videos minus whichever one is currently featured. The
 * featured block crossfades (Framer Motion `AnimatePresence`, keyed on
 * `featuredId`) — video frame and caption each crossfade independently,
 * per his explicit motion spec.
 *
 * Placeholder imagery: no real video footage exists yet. Round 2026-07-07,
 * Hamid asked explicitly ("فعلا از ویدیو هیرو استفاده کن") to swap the
 * earlier icon-on-gradient motif for the real Hero video file playing
 * (muted, looped) in every box so the boxes aren't empty during review;
 * see `VideoPlaceholder` (ambient thumbnails) and `FeaturedVideo`
 * (interactive). Duration `«?»` is an explicit placeholder, not a
 * fabricated timestamp.
 *
 * Round 2026-07-07: tabs moved to render BELOW the featured video (were
 * above it); fixed a layout-jank bug on tab switch caused by the featured
 * video and caption text each rendering inside their own top-level
 * `AnimatePresence` as direct grid children — during the crossfade,
 * AnimatePresence briefly mounts BOTH the exiting and entering element, so
 * the grid saw 3–4 items instead of 2 for a frame. Fixed by giving each
 * side its own fixed grid cell with crossfading children layered
 * `absolute inset-0` inside it instead of at the grid level.
 *
 * Round 2026-07-08: two more fixes from Hamid's review —
 * 1) The section still didn't fit one viewport, and he asked for the
 *    layout itself to change rather than just shrinking further: big
 *    video + 2 small "up next" thumbnails side-by-side, replacing the old
 *    featured-block-then-separate-3-video-carousel structure (which
 *    stacked two full video-height rows). Since each category has exactly
 *    3 videos, this is a pure re-flow — 1 big + 2 small — nothing dropped.
 *    Desktop layout is big-video-LEFT, small-thumbnails-RIGHT, his literal
 *    left/right spec — done via `grid-template-columns` track order
 *    (small column defined first = rightmost under this page's `dir=
 *    "rtl"`, big column second = leftmost), NOT a `dir="ltr"` override
 *    (this project's established anti-pattern). Mobile collapses to one
 *    column and uses `order-*` to put the big video visually first
 *    regardless of source order, since the side-by-side spec doesn't
 *    apply once stacked.
 * 2) Clicking the featured video did nothing (dead decorative play
 *    button). `FeaturedVideo` now actually plays on click: unmutes,
 *    shows native controls, hides the play-button overlay. Its `isPlaying`
 *    state is intentionally local (not lifted to the parent) — the
 *    component remounts on every featured-video change via the
 *    `AnimatePresence` key above it, so switching videos naturally resets
 *    playback state for free.
 *
 * Content: category labels are Hamid's own exact words; two featured-
 * style example titles from his brief were used for two videos, the rest
 * (draft summaries/titles) are draft copy flagged with TODO(content) in
 * fa.ts, same convention as `brandIntro`'s manifesto.
 */

type Video = VideoHubVideo;

/**
 * TEMP placeholder (2026-07-07, Hamid's explicit "فعلا" ask): every video
 * box — featured and all 3 carousel slots — plays the real Hero video file
 * so the boxes aren't empty during review. Swap for real per-video
 * footage once it exists; this is not final content.
 */
function VideoPlaceholder() {
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      src="/media/video/hero-doctor.mp4"
      autoPlay
      loop
      muted
      playsInline
    />
  );
}

/**
 * The big featured video, with real click-to-play (2026-07-08 fix — the
 * old featured block was a static preview with a decorative play button
 * that did nothing). `isPlaying` is local state, not lifted to the parent:
 * this component remounts on every `key={featured.id}` change (see the
 * `AnimatePresence` below), so switching videos naturally resets it back
 * to the muted ambient-preview state without any extra wiring.
 */
function FeaturedVideo({ playAriaLabel }: { playAriaLabel: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);
    const el = videoRef.current;
    if (el) {
      el.muted = false;
      void el.play();
    }
  };

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/media/video/hero-doctor.mp4"
        autoPlay
        loop
        muted={!isPlaying}
        controls={isPlaying}
        playsInline
        onClick={!isPlaying ? handlePlay : undefined}
      />
      {!isPlaying && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/15" />
          <button
            type="button"
            onClick={handlePlay}
            aria-label={playAriaLabel}
            className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-deep-navy/40 transition-all duration-300 ease-out hover:scale-105 hover:shadow-[0_0_30px_8px_rgba(201,161,90,0.3)] sm:h-16 sm:w-16 lg:h-20 lg:w-20"
          >
            <IconPlay className="h-5 w-5 translate-x-[-2px] text-warm-white sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
          </button>
        </>
      )}
    </div>
  );
}

function IconPlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 4l13 8-13 8V4z" />
    </svg>
  );
}

function IconArrow({ className, pointLeft }: { className?: string; pointLeft: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {pointLeft ? <path d="M19 12H5M11 6l-6 6 6 6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
    </svg>
  );
}

type CategoryId = string;
type VideoId = string;

export function VideoHubSection({ dict, locale }: { dict: VideoHubDictionary; locale: Locale }) {
  const shouldReduceMotion = useReducedMotion();
  const isRtl = LOCALE_DIRECTION[locale] === "rtl";
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(dict.categories[0]!.id);
  const [featuredId, setFeaturedId] = useState<VideoId>(dict.videos.find((v) => v.category === dict.categories[0]!.id)!.id);

  const categoryLabel = (id: string) => dict.categories.find((c) => c.id === id)?.label ?? id;
  const filteredVideos = dict.videos.filter((v) => v.category === selectedCategory);
  const featured: Video = dict.videos.find((v) => v.id === featuredId) ?? filteredVideos[0]!;
  const smallVideos = filteredVideos.filter((v) => v.id !== featured.id).slice(0, 2);

  const handleCategoryClick = (categoryId: CategoryId) => {
    setSelectedCategory(categoryId);
    const first = dict.videos.find((v) => v.category === categoryId);
    if (first) setFeaturedId(first.id);
  };

  const fadeUp = (delay: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 18 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.6, delay: shouldReduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      id="videos"
      data-header-bg="#0f172a"
      dir={LOCALE_DIRECTION[locale]}
      className="snap-section relative flex h-dvh flex-col justify-center overflow-hidden bg-deep-navy px-4 py-5 sm:px-8 sm:py-7 lg:py-8"
    >
      <div aria-hidden className="pointer-events-none absolute -top-24 end-[-8%] h-[460px] w-[460px] rounded-full bg-gold/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 start-[-10%] h-[380px] w-[380px] rounded-full bg-warm-white/5 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2 {...fadeUp(0)} className="text-balance text-xl font-extrabold leading-tight text-warm-white sm:text-2xl lg:text-[30px]">
            {dict.heading}
          </motion.h2>
          <motion.p {...fadeUp(shouldReduceMotion ? 0 : 0.06)} className="mt-2 text-xs leading-5 text-warm-white/65 sm:mt-3 sm:text-base lg:text-[22px] lg:leading-8">
            {dict.subheading}
          </motion.p>
        </div>

        {/* Video area — big featured video + its caption on one side, the
            other 2 videos of this category as small "up next" thumbnails
            on the other, replacing the old separate below-the-fold
            carousel row entirely (3 videos/category = 1 big + 2 small,
            nothing dropped) — per Hamid's explicit 2026-07-08 layout ask,
            mainly to make the section actually fit one viewport.
            Desktop: big video visually LEFT, small thumbnails visually
            RIGHT — his literal left/right spec, so unlike this project's
            usual "natural RTL order" convention, achieved here via
            `grid-template-columns` track order (small col defined first =
            rightmost under RTL, big col second = leftmost) rather than a
            `dir="ltr"` override. Mobile: `order-*` puts the big video
            visually first (above) regardless of source order, since a
            side-by-side spec doesn't apply once the grid collapses to one
            column. */}
        <div className="mt-5 grid items-start gap-3 sm:mt-7 sm:gap-4 lg:grid-cols-[1fr_1.7fr] lg:gap-6">
          {/* Small thumbnails — source-first (visual right at lg). */}
          <div className="order-2 flex gap-3 lg:order-none lg:flex-col lg:gap-4">
            {smallVideos.map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={() => setFeaturedId(video.id)}
                className="group flex-1 text-start"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-deep-navy to-[#1a2540] shadow-[0_16px_36px_-12px_rgba(0,0,0,0.45)] transition-shadow duration-300 ease-out group-hover:shadow-[0_20px_44px_-10px_rgba(0,0,0,0.55)] sm:rounded-xl">
                  <VideoPlaceholder />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent transition-opacity duration-300 ease-out group-hover:opacity-70" />
                  <span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/60 bg-deep-navy/40 transition-transform duration-300 ease-out group-hover:scale-110 sm:h-9 sm:w-9">
                    <IconPlay className="h-3 w-3 translate-x-[-1px] text-warm-white sm:h-3.5 sm:w-3.5" />
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-1 text-[10px] font-semibold text-warm-white sm:mt-2 sm:text-xs">{video.title}</p>
              </button>
            ))}
          </div>

          {/* Big featured video + caption — source-second (visual left at lg). */}
          <div className="order-1 lg:order-none">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-gold/25 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)] sm:rounded-2xl">
              <AnimatePresence initial={false}>
                <motion.div
                  key={featured.id}
                  className="absolute inset-0"
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-deep-navy to-[#1a2540]" />
                  <FeaturedVideo playAriaLabel={dict.playAriaLabel} />
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={featured.id + "-text"}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="mt-2.5 line-clamp-1 text-sm font-extrabold leading-snug text-warm-white sm:mt-4 sm:text-lg lg:text-xl">{featured.title}</h3>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-warm-white/50 sm:mt-2.5 sm:gap-3 sm:text-xs">
                  <span className="rounded-full border border-warm-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1">{categoryLabel(featured.category)}</span>
                  <span>{featured.duration}</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-gold">
                    {dict.detailsCta}
                    <IconArrow pointLeft={isRtl} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Category pill tabs — below the whole video area per Hamid's
            correction (were above it before). */}
        <motion.div {...fadeUp(shouldReduceMotion ? 0 : 0.1)} className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-2.5">
          {dict.categories.map((category) => {
            const isActive = category.id === selectedCategory;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryClick(category.id)}
                className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ease-out sm:px-5 sm:py-2 sm:text-sm ${
                  isActive ? "border-gold bg-gold/10 text-gold" : "border-warm-white/20 text-warm-white/60 hover:border-warm-white/40 hover:text-warm-white"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
