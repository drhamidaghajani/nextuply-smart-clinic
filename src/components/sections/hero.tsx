import { HeroParallax } from "@/components/sections/hero-parallax";
import { HeroVideo } from "@/components/sections/hero-video";
import type { HeroDictionary } from "@/i18n/dictionary-types";

/**
 * HOMEPAGE_STORYBOARD.md §2 "01 — Hero". Round 8 (2026-07-07): plain
 * top-of-page section, fixed at the viewport height per Hamid's
 * reference. Round 11 (2026-07-10): switched h-screen (100vh) to h-dvh
 * (100dvh) — the correct viewport unit for real visible height. The 3D
 * box-roll/fold transition into Services (formerly
 * components/motion/cube-section-transition.*) was scrapped by Hamid
 * entirely in favor of this simpler layout-kit structure (Evonic
 * layout41 reference): Hero video up top, no CTA button per his standing
 * instruction.
 *
 * Round 18 (2026-07-11): looping down-arrow scroll hint added at the
 * bottom (down + fade + reappear) — removed in round 8's simplification,
 * brought back. Replaced entirely in round 2026-07-04 (see below) by a
 * traveling-light-line indicator; the old chevron/.animate-scroll-hint
 * animation no longer exists in globals.css.
 *
 * Round 19 (2026-07-11): the title now animates word-by-word instead of
 * as one block. Splitting is done here (render logic), not in fa.ts —
 * the dictionary still holds the plain title string.
 *
 * Round 21 (2026-07-11): word animation switched to .animate-word-flip-up
 * (hinged at each word's bottom edge, flips up into place — "نیم چرخ از
 * پایین به بالا") and re-timed so each word fully finishes, pauses, then
 * the next starts (WORD_ANIM_MS + WORD_PAUSE_MS, non-overlapping) — only
 * the title uses this; the doctor/specialty line keeps the original
 * .animate-rotate-in per Hamid's "این فقط برای متن [عنوان] هست".
 *
 * Rounds 26-27 wrapped this section in a sticky-pin + spacer mechanism
 * (video stays put while AiConcierge slides up to cover part of it, then
 * both exit together), including a brief attempt at splitting the text
 * into its own scroll-linked parallax layer. Round 28: Hamid asked to
 * revert to the plain pre-round-26 version — this <section> is simply
 * h-dvh again, no spacer, no sticky. Paired with restoring native CSS
 * scroll-snap (.snap-section, see globals.css) on both this section and
 * AiConcierge, so a small scroll auto-completes the transition to/from
 * the next section in either direction, same as rounds 21-25.
 *
 * Round 29 (2026-07-11): .hero-exit-fade (see globals.css) makes Hero
 * fade out as it scrolls past the viewport during the snap transition —
 * pure CSS scroll-driven animation (view-timeline), no JS. Hero and
 * AiConcierge don't overlap, so this fades Hero toward the page
 * background, not "into" AiConcierge — decorative, not a redesign of the
 * transition itself. Degrades gracefully (Hero just stays opaque) on
 * browsers without view-timeline support or with reduced-motion set.
 *
 * Round 30 (2026-07-11): mobile-first fix — the title/doctor-line had
 * been pinned to fixed desktop pixel sizes (60px / 22px) per an earlier
 * explicit request, with no smaller mobile step. This project is
 * mobile-first (PROJECT_GUIDE.md), so that was a real regression. Both
 * now scale up from a genuinely mobile-sized base (28px / 14px) through
 * sm/md/lg, reaching the same 60px / 22px only at the desktop end.
 *
 * Round 2026-07-04 — Awwwards-tier Hero brief (Apple/Stripe/Vercel/
 * Linear/Porsche/Bang & Olufsen inspiration, per Hamid). Changes:
 * - Overlay switched from a flat 70%-opacity wash to a top-to-bottom
 *   gradient scrim (lighter near the top, where the video should read as
 *   cinematic footage, heavier near the bottom where text/CTAs sit) —
 *   a flat wash read as "dark filter," not "subtle."
 * - Title scale extended to xl/2xl (up to 84px) — "Typography بسیار
 *   بزرگ" — and max-width widened so it still resolves to ~2 lines at
 *   the larger sizes instead of wrapping to 3-4.
 * - Two CTAs added below the subheadline (شروع مشاوره / مشاهده خدمات) —
 *   see fa.ts's hero.ctaPrimary/ctaSecondary doc-comment: this reverses
 *   the earlier "no CTA in Hero" instruction, flagged there rather than
 *   silently applied. Kept as plain pill buttons, no card/box wrapper,
 *   per Hamid's explicit "Hero نباید Box/Card داشته باشد."
 * - Two very low-opacity ambient light glows added in opposite corners
 *   (CSS only, slow breathing animation — see .animate-ambient-light in
 *   globals.css) — decorative texture, never competing with the video
 *   or text for attention.
 * - Scroll indicator redesigned from a looping chevron icon to a thin
 *   traveling light line (Apple/Linear-style minimal indicator) — see
 *   .animate-scroll-indicator in globals.css.
 * - Video gets a slow, continuous "Background Zoom" (Ken Burns-style
 *   scale breathing) — see .hero-video-zoom in globals.css /
 *   hero-video.tsx — plus a very limited (±8px) mouse-parallax on the
 *   text/CTA block via the new HeroParallax leaf client component.
 * - Not implemented from the brief: nothing dropped silently — every
 *   requested element (video, overlay, headline/subheadline/CTA
 *   structure, corner ambient light, scroll indicator, all five motion
 *   types) is present in this round.
 *
 * No navigation/header should be visible while the Hero video is playing
 * — not built yet, but constrains future header design.
 *
 * Video is real but NOT YET COMPRESSED (no ffmpeg in this environment) —
 * see hero-video.tsx / SYSTEM_ARCHITECTURE.md §10 for the outstanding
 * production requirement.
 *
 * Round 2026-07-05 (per Hamid: title 60px / doctor line 20px "at desktop
 * and up," confirmed explicitly, not a flat all-breakpoints size — that
 * would have reintroduced the exact regression round 30 fixed): mobile/
 * sm/md steps are untouched. Title's `xl`/`2xl` overrides (72px/84px) are
 * removed so it simply stays at `lg:text-[60px]` from laptop upward.
 * Doctor line's `lg` step changed from 22px to 20px and its `xl` override
 * (24px) removed the same way, so it holds at 20px from laptop upward.
 */
const WORD_ANIM_MS = 320;
const WORD_PAUSE_MS = 120;
const DOCTOR_LINE_PAUSE_MS = 200;

export function Hero({ dict }: { dict: HeroDictionary }) {
  const titleWords = dict.title.split(" ");
  const wordStep = WORD_ANIM_MS + WORD_PAUSE_MS;
  const doctorLineDelay = (titleWords.length - 1) * wordStep + WORD_ANIM_MS + DOCTOR_LINE_PAUSE_MS;

  const ctaDelay = doctorLineDelay + 500;

  return (
    <section
      data-header-bg="#0f172a"
      data-header-hero
      className="snap-section hero-exit-fade relative flex h-dvh w-full items-center justify-center overflow-hidden bg-deep-navy"
    >
      <HeroVideo src="/media/video/hero-doctor.mp4" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-deep-navy/35 via-deep-navy/50 to-deep-navy/75"
      />

      <div
        aria-hidden
        className="animate-ambient-light pointer-events-none absolute -top-24 start-[-10%] h-[420px] w-[420px] rounded-full bg-gold/20 blur-[110px]"
      />
      <div
        aria-hidden
        className="animate-ambient-light pointer-events-none absolute -bottom-32 end-[-10%] h-[480px] w-[480px] rounded-full bg-warm-white/10 blur-[130px]"
        style={{ animationDelay: "3s" }}
      />

      <HeroParallax>
        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 text-center text-warm-white sm:px-8 xl:max-w-5xl">
          <h1 className="text-balance text-[28px] font-bold uppercase leading-tight tracking-tight sm:text-[40px] md:text-[52px] lg:text-[60px]">
            {titleWords.map((word, index) => (
              <span key={`${word}-${index}`}>
                <span
                  className="animate-word-flip-up inline-block"
                  style={{ animationDelay: `${index * wordStep}ms`, animationDuration: `${WORD_ANIM_MS}ms` }}
                >
                  {word}
                </span>
                {index < titleWords.length - 1 ? " " : null}
              </span>
            ))}
          </h1>
          <p
            className="animate-rotate-in mt-4 font-heading text-[14px] font-light tracking-[0.1em] text-warm-white/80 sm:mt-6 sm:whitespace-nowrap sm:text-[18px] sm:tracking-[0.15em] lg:text-[20px] lg:tracking-[0.2em]"
            style={{ animationDelay: `${doctorLineDelay}ms` }}
          >
            {dict.doctorName}
            <span aria-hidden className="mx-3 text-warm-white/40">
              |
            </span>
            {dict.doctorSpecialty}
          </p>

          <div
            className="animate-rotate-in mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4 lg:mt-12"
            style={{ animationDelay: `${ctaDelay}ms` }}
          >
            <button
              type="button"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-gold px-7 py-3 text-sm font-semibold text-deep-navy transition-all duration-200 hover:bg-gold-hover active:scale-[0.98] sm:px-9 sm:py-3.5 sm:text-base"
            >
              {dict.ctaPrimary}
            </button>
            {/* Anchor, not a button: scrolls to Featured Services (#services)
                — a same-page hash link needs no client JS, so Hero stays a
                Server Component rather than converting the whole file for
                one button (per Hamid's 2026-07-12 ask). */}
            <a
              href="#services"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-warm-white/30 px-7 py-3 text-sm font-semibold text-warm-white transition-all duration-200 hover:border-warm-white/60 active:scale-[0.98] sm:px-9 sm:py-3.5 sm:text-base"
            >
              {dict.ctaSecondary}
            </a>
          </div>
        </div>
      </HeroParallax>

      <div aria-hidden className="absolute inset-x-0 bottom-8 z-10 flex justify-center">
        <span className="relative h-11 w-px overflow-hidden bg-warm-white/20">
          <span className="animate-scroll-indicator absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-transparent via-warm-white to-transparent" />
        </span>
      </div>
    </section>
  );
}
