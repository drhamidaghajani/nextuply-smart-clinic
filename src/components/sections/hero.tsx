import { Button } from "@/components/ui/button";
import { HeroVideo } from "@/components/sections/hero-video";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/**
 * HOMEPAGE_STORYBOARD.md §2 "01 — Hero".
 *
 * Video is real (supplied 2026-07-01) but NOT YET COMPRESSED: served as-is
 * from public/media/video/hero-doctor.mp4 (1920x1080, 33s, ~20MB) because
 * this environment has no ffmpeg to produce the trimmed/compressed MP4+WebM
 * pair CONTENT_INVENTORY.md §8 calls for. This violates the <3s load budget
 * in SYSTEM_ARCHITECTURE.md §10 — do not ship this to production without
 * compressing it first (target: trim to 10–20s, re-encode to ~2–5MB).
 */
export function Hero({ dict }: { dict: Dictionary["hero"] }) {
  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden bg-deep-navy text-warm-white">
      <HeroVideo src="/media/video/hero-doctor.mp4" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-deep-navy/50 via-deep-navy/30 to-deep-navy/90"
      />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20 pt-32 text-center sm:px-8">
        <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-6xl">
          {dict.headline}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-warm-white/80 sm:text-lg">
          {dict.subheadline}
        </p>
        <div className="mt-10">
          <Button href="#booking">{dict.ctaPrimary}</Button>
        </div>
      </div>
    </section>
  );
}
