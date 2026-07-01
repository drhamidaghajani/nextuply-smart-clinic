import { HeroVideo } from "@/components/sections/hero-video";
import type { Dictionary } from "@/i18n/dictionaries/fa";

/**
 * HOMEPAGE_STORYBOARD.md §2 "01 — Hero".
 *
 * Layout locked to Hamid's reference (drwilliammiami.com, 2026-07-02):
 * full-bleed video, flat dark overlay (#0B1120, DESIGN_SYSTEM.md §2), big
 * bold title, lighter "Name | Specialty" line underneath, scroll indicator
 * at the very bottom. Video is deliberately slowed (HeroVideo's default
 * 0.6x) per his note. No CTA button in the Hero, per his explicit call.
 * Copy confirmed 2026-07-02 (not a placeholder).
 *
 * NOTE for later header work: Hamid was explicit that no navigation/header
 * should be visible while the Hero video is playing — there is no header
 * built yet, so nothing to hide here, but this constrains the header design
 * when we get to it (see HOMEPAGE_STORYBOARD.md §2 "01 — Hero" note).
 *
 * Video is real but NOT YET COMPRESSED (no ffmpeg in this environment) —
 * see hero-video.tsx / SYSTEM_ARCHITECTURE.md §10 for the outstanding
 * production requirement.
 */
export function Hero({ dict }: { dict: Dictionary["hero"] }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-deep-navy text-warm-white">
      <HeroVideo src="/media/video/hero-doctor.mp4" />
      <div aria-hidden className="absolute inset-0 bg-deep-navy/70" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 text-center sm:px-8">
        <h1 className="text-balance text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl md:text-6xl">
          {dict.title}
        </h1>
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 text-balance text-3xl font-light leading-tight text-warm-white/80 sm:text-5xl md:text-6xl">
          <span>{dict.doctorName}</span>
          <span aria-hidden className="text-warm-white/40">
            |
          </span>
          <span>{dict.doctorSpecialty}</span>
        </p>
      </div>

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-8 z-10 flex justify-center text-warm-white/60"
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
