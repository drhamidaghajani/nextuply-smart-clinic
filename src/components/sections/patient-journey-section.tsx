"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";

import type { PatientJourneyDictionary } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * "Patient Journey" — second full rebuild (per Hamid's detailed two-column
 * brief, 2026-07-05, superseding the earlier single-centered-path
 * version). Same 5 stages, same GSAP ScrollTrigger foundation, but a
 * different structure and now with his real, final title+body copy
 * (replacing the previous round's draft text that had a
 * TODO(content)/sign-off flag — see fa.ts's doc-comment).
 *
 * Layout: two columns, one holds the journey path + stage text, the other
 * one large sticky media panel that crossfades to match whichever stage
 * is active. Hamid's brief used literal "چپ"/"راست" (physical left/
 * right: path on the left, media on the right) — a first version forced
 * that with a nested `dir="ltr"` wrapper around just this grid, which
 * caused a REAL, confirmed-by-testing bug: the page gained ~435px of
 * horizontal overflow (mixing directions plus this project's RTL-logical
 * utility classes doesn't compose safely), and because the page is RTL,
 * the browser's default horizontal scroll position showed the *blank*
 * side of that overflow rather than the actual content — the section
 * looked entirely empty despite every element existing with correct,
 * visible computed styles. Fixed by dropping the `dir="ltr"` override and
 * letting the grid follow the page's natural `dir="rtl"`: the path
 * column (first in DOM) now renders on the visual RIGHT, media on the
 * visual LEFT — mirrored from his literal wording, but stable. Flagged
 * rather than silently calling the mirrored version "close enough."
 *
 * Sticky media panel: `position: sticky` on the right column's inner
 * panel, NOT a GSAP/JS scroll-hijack. This project already tried (and
 * explicitly reverted, hero.tsx rounds 26-27) a JS-driven pin mechanism
 * because it fought the page's mandatory CSS scroll-snap
 * (`.snap-section`, globals.css) — plain CSS `position: sticky` is a
 * normal layout feature, not a scroll-hijack, and doesn't carry that same
 * risk; it naturally un-sticks once the (taller) left column's content
 * ends, no manual bounds math needed. The right column is grid-stretched
 * to the left column's full height automatically (default CSS Grid
 * `align-items: stretch`), which is what gives the sticky panel room to
 * stay pinned while text scrolls beside it.
 *
 * What's still GSAP ScrollTrigger + `scrub` (continuous, exactly tied to
 * scroll position, per his "دقیقاً با میزان اسکرول کاربر هماهنگ"): the
 * path's stroke draws in top-to-bottom (`stroke-dashoffset` scrubbed
 * 0→1 across the whole left column) and the glow particle travels the
 * path via `getPointAtLength`. What's a discrete state change instead
 * (`activeStage`, set via `onEnter`/`onEnterBack` on a per-stage
 * ScrollTrigger, not scrubbed): which stage's icon/title/description
 * read as "active" and which media the right panel shows — simpler than
 * scrubbing every stage's opacity continuously, and the CSS
 * `transition-all duration-500 ease-out` on each still reads as smooth,
 * not a hard cut.
 *
 * Media: real photos for all 5 stages, supplied 2026-07-06 (see
 * `REAL_PHOTOS` below) — `StageMedia` renders those via `next/image`. The
 * icon-on-gradient placeholder path stays as the fallback for any future
 * stage that ships without a photo, same "real content only, no
 * fabricated stock photo" rule this project follows everywhere else.
 *
 * Mobile (`<lg`): no sticky panel at all (a giant sticky image reads as
 * intrusive at phone width, and CSS sticky-sidebar needs a two-column
 * grid it no longer has) — each stage instead shows its own small
 * `StageMedia` inline, in normal flow, directly above its text. Same
 * icons/path/dots, straight-line path (`MOBILE_AMPLITUDE = 0`) as the
 * previous round.
 *
 * `useReducedMotion()`: skips ScrollTrigger entirely, shows the first
 * stage's media/active state statically, all stage text at full opacity.
 */

const VIEWBOX_WIDTH = 80;
const VIEWBOX_HEIGHT = 1000;
const STAGE_FRACTIONS = [0.05, 0.275, 0.5, 0.725, 0.95];
const DESKTOP_AMPLITUDE = 18;
const MOBILE_AMPLITUDE = 0;

function buildPathD(amplitude: number) {
  const centerX = VIEWBOX_WIDTH / 2;
  const points = STAGE_FRACTIONS.map((fraction, index) => {
    const y = fraction * VIEWBOX_HEIGHT;
    const side = index % 2 === 0 ? 1 : -1;
    const x = centerX + side * amplitude;
    return { x, y };
  });

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
  }
  return d;
}

type IconProps = { className?: string };

function IconConsultation({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 5h16v11H8l-4 4V5z" />
    </svg>
  );
}

function IconTreatmentDesign({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3h6v3H9zM9 11h6M9 15h4" />
    </svg>
  );
}

function IconSurgery({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function IconRecovery({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.65-9.5 9-9.5 9z" />
      <path d="M4 12h3l2 3 2-6 2 3h4" />
    </svg>
  );
}

function IconFollowUp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4" />
    </svg>
  );
}

/**
 * `pointLeft` picks between two literal, mirrored path shapes (not a CSS
 * `scale-x` flip on the RTL version) — composing a Tailwind `scale-x`
 * flip with the hover `translate-x` utility is ambiguous about transform
 * order and easy to get backwards; two explicit paths are unambiguous.
 * RTL "forward" is visually left; LTR "forward" is visually right.
 */
function IconArrow({ className, pointLeft }: IconProps & { pointLeft: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {pointLeft ? <path d="M19 12H5M11 6l-6 6 6 6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
    </svg>
  );
}

const STAGE_ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  consultation: IconConsultation,
  "treatment-design": IconTreatmentDesign,
  surgery: IconSurgery,
  recovery: IconRecovery,
  "follow-up": IconFollowUp,
};

// Subtle per-stage gradient tint so the placeholder panels (stages with no
// entry in REAL_PHOTOS below) aren't visually identical.
const STAGE_GRADIENTS: Record<string, string> = {
  consultation: "from-deep-navy to-[#1a2540]",
  "treatment-design": "from-[#1a2540] to-deep-navy",
  surgery: "from-deep-navy to-[#0b1220]",
  recovery: "from-[#1a2540] to-[#0f1b33]",
  "follow-up": "from-deep-navy to-[#1a2540]",
};

// Round 2026-07-06: real photos supplied by Hamid for all 5 stages, per
// filename (his own 0001–0005 numbering, verified by content and renamed
// to match each stage's id — see this component's git history / the
// conversation this round for the mapping check: 0001 desk+anatomical-
// models → consultation, 0002 3D orthognathic planning → treatment-design,
// 0003 OR portrait → surgery, 0004 hospital bed → recovery, 0005 mirror
// before/after → follow-up). No stage needs the gradient+icon placeholder
// anymore, but STAGE_GRADIENTS/icons stay as the fallback path in case a
// future stage ships without a photo.
const REAL_PHOTOS: Partial<Record<string, string>> = {
  consultation: "/media/journey/consultation.jpeg",
  "treatment-design": "/media/journey/treatment-design.jpeg",
  surgery: "/media/journey/surgery.jpeg",
  recovery: "/media/journey/recovery.jpeg",
  "follow-up": "/media/journey/follow-up.jpeg",
};

type Step = PatientJourneyDictionary["steps"][number];

/**
 * `isActive` (2026-07-12, per Hamid — mobile photos should also "appear
 * stage-by-stage like desktop"): desktop already gets this via the sticky
 * panel's opacity crossfade between stages. Mobile has no sticky panel by
 * design (see this file's top doc-comment — each stage's photo sits
 * inline instead), so it had no equivalent staging cue: every photo sat
 * at full opacity regardless of scroll position, while the text right
 * next to it already dimmed/highlighted via the same `isActive` value.
 * Applying that same treatment here — not a new mechanism, just extending
 * the one already driving the text to the image beside it.
 */
function StageMedia({ step, isActive = true, className }: { step: Step; isActive?: boolean; className?: string }) {
  const Icon = STAGE_ICONS[step.id];
  const photoSrc = REAL_PHOTOS[step.id];
  const activeClass = isActive ? "opacity-100 scale-100" : "opacity-45 scale-[0.98]";

  if (photoSrc) {
    return (
      <div className={`relative overflow-hidden rounded-[28px] transition-all duration-500 ease-out ${activeClass} ${className ?? ""}`}>
        <Image src={photoSrc} alt={step.title} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br transition-all duration-500 ease-out ${STAGE_GRADIENTS[step.id]} ${activeClass} ${className ?? ""}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="h-20 w-20 text-warm-white/20 sm:h-24 sm:w-24 lg:h-28 lg:w-28" />
      </div>
    </div>
  );
}

export function PatientJourneySection({ dict, locale }: { dict: PatientJourneyDictionary; locale: Locale }) {
  const shouldReduceMotion = useReducedMotion();
  const isRtl = LOCALE_DIRECTION[locale] === "rtl";
  const [activeStage, setActiveStage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathBaseRef = useRef<SVGPathElement>(null);
  const pathProgressRef = useRef<SVGPathElement>(null);
  const particleRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);
    // Round 2026-07-12 (per Hamid — real mobile bug report: the gold
    // progress line/staged photo reveals didn't track scroll on his
    // phone). Verified the scrub mechanism itself updates correctly under
    // Playwright's mobile-viewport + touch emulation, so this couldn't be
    // reproduced directly here — but iOS Safari's momentum/elastic scroll
    // combined with `scroll-snap-type: y mandatory` (globals.css) plus the
    // mobile address-bar hide/show resizing the viewport mid-scroll are
    // both well-documented sources of exactly this symptom (ScrollTrigger
    // recalculating trigger start/end against a stale or resize-jittered
    // viewport). `ignoreMobileResize` is GSAP's own documented mitigation
    // for the address-bar-resize half of that; applied defensively.
    ScrollTrigger.config({ ignoreMobileResize: true });
    const mm = gsap.matchMedia();

    // See case-gallery-section.tsx's history for why BOTH conditions are
    // listed: `matchMedia` only fires its callback for conditions that
    // currently match, so a desktop-only entry would leave mobile with no
    // path/triggers set up at all.
    mm.add({ isDesktop: "(min-width: 1024px)", isMobile: "(max-width: 1023px)" }, (context) => {
      const { isDesktop } = context.conditions as { isDesktop: boolean };
      const amplitude = isDesktop ? DESKTOP_AMPLITUDE : MOBILE_AMPLITUDE;
      const d = buildPathD(amplitude);

      const basePath = pathBaseRef.current;
      const progressPath = pathProgressRef.current;
      if (!basePath || !progressPath) return undefined;
      basePath.setAttribute("d", d);
      progressPath.setAttribute("d", d);

      const totalLength = progressPath.getTotalLength();
      progressPath.style.strokeDasharray = `${totalLength}`;
      progressPath.style.strokeDashoffset = `${totalLength}`;

      const master = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top center",
        end: "bottom center",
        scrub: 1,
        onUpdate: (self) => {
          progressPath.style.strokeDashoffset = `${totalLength * (1 - self.progress)}`;
          const point = progressPath.getPointAtLength(self.progress * totalLength);
          particleRef.current?.setAttribute("cx", String(point.x));
          particleRef.current?.setAttribute("cy", String(point.y));
          glowRef.current?.setAttribute("cx", String(point.x));
          glowRef.current?.setAttribute("cy", String(point.y));
        },
      });

      const stageTriggers = stageRefs.current.map((el, index) => {
        if (!el) return null;
        return ScrollTrigger.create({
          trigger: el,
          start: "top 60%",
          end: "bottom 40%",
          onEnter: () => setActiveStage(index),
          onEnterBack: () => setActiveStage(index),
        });
      });

      return () => {
        master.kill();
        stageTriggers.forEach((trigger) => trigger?.kill());
      };
    });

    return () => mm.revert();
  }, [shouldReduceMotion]);

  return (
    // No `overflow-hidden` here on purpose: it's the classic gotcha that
    // silently breaks `position: sticky` on any descendant (the right
    // column's media panel) when an ancestor between it and the scrolling
    // viewport has `overflow` set to anything but `visible` — confirmed by
    // testing (the panel would disappear a short way into the scroll
    // instead of staying pinned). Trade-off: the decorative blur glow
    // below can bleed a few px past this section's top edge into the
    // previous section instead of being clipped — imperceptible given
    // it's a low-opacity, heavily blurred `pointer-events-none` glow.
    //
    // Round 2026-07-12 (real bug, per Hamid): `start-1/2` (logical) paired
    // with `-translate-x-1/2` (a physical transform — CSS has no logical
    // `translate-inline` equivalent) was the actual root cause of a real
    // ~435px page-wide horizontal-overflow bug. Under `dir="rtl"`,
    // `start-1/2` resolves to `right: 50%`, and `-translate-x-1/2` still
    // shifts left by 50% of the element's own width regardless of
    // direction — instead of centering, the two combined to push this
    // whole 420px circle almost entirely off-screen to the left. Fixed by
    // using physical `left-1/2` instead: centering is direction-symmetric
    // (unlike "put this on the reading-start side," it doesn't need to
    // flip between RTL/LTR), so `left` is the *correct* choice here, not
    // an exception to this project's logical-properties convention.
    // (Previously misdiagnosed at the html/body level with a blanket
    // `overflow-x: hidden` — reverted, since that broke `position:
    // sticky` sitewide, this section's media panel included; see the
    // note above about why this section stays overflow-visible.)
    <section data-header-bg="#fcfbf4" dir={LOCALE_DIRECTION[locale]} className="snap-section relative bg-cream px-6 py-16 sm:px-10 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-balance text-2xl font-bold leading-tight text-charcoal sm:text-3xl lg:text-[30px]">{dict.heading}</h2>
      </div>

      {/* Two-column grid — NOT wrapped in `dir="ltr"` (see doc-comment: an
          earlier version forced that, to match Hamid's literal "left
          column"/"right column" wording, and it caused a real bug —
          confirmed by testing — where the page gained ~435px of invisible
          horizontal overflow, and being on an RTL page, the browser's
          default scroll position showed the *blank* side of that
          overflow, not the actual content). Left as-is under the page's
          natural `dir="rtl"` instead: the path column (first in DOM)
          renders on the visual RIGHT, the media column on the visual
          LEFT — mirrored from his literal spec, but correct and stable.
          Flagged to him rather than silently declared "close enough." */}
      <div ref={containerRef} className="relative mx-auto mt-14 grid max-w-6xl gap-x-16 lg:grid-cols-2">
        <div className="relative">
          <svg aria-hidden className="pointer-events-none absolute inset-y-0 start-0 h-full w-16 overflow-visible" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} preserveAspectRatio="none">
            <path ref={pathBaseRef} fill="none" stroke="rgba(42,42,40,0.12)" strokeWidth={2} />
            {!shouldReduceMotion && (
              <>
                <path ref={pathProgressRef} fill="none" stroke="#C9A15A" strokeWidth={2} strokeLinecap="round" />
                <circle ref={glowRef} r={14} fill="#C9A15A" opacity={0.35} style={{ filter: "blur(9px)" }} />
                <circle ref={particleRef} r={5} fill="#C9A15A" style={{ filter: "drop-shadow(0 0 6px #C9A15A)" }} />
              </>
            )}
          </svg>

          {dict.steps.map((step, index) => {
            const Icon = STAGE_ICONS[step.id];
            const isActive = shouldReduceMotion ? index === 0 : activeStage === index;
            return (
              <div
                key={step.id}
                ref={(el) => {
                  stageRefs.current[index] = el;
                }}
                className="relative flex min-h-[60vh] flex-col justify-center py-8 ps-20 text-start lg:min-h-screen"
              >
                <StageMedia step={step} isActive={isActive} className="mb-6 aspect-[16/10] w-full lg:hidden" />
                <Icon
                  className={`mb-4 h-9 w-9 transition-colors duration-500 ease-out ${isActive ? "text-gold" : "text-charcoal/30"}`}
                />
                <h3 className={`text-lg leading-snug transition-all duration-500 ease-out sm:text-xl ${isActive ? "font-bold text-charcoal" : "font-semibold text-charcoal/40"}`}>
                  {step.title}
                </h3>
                <p className={`mt-3 max-w-md text-sm leading-7 transition-opacity duration-500 ease-out sm:text-base ${isActive ? "text-charcoal/70 opacity-100" : "text-charcoal/50 opacity-60"}`}>
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>

        <div className="relative hidden lg:block">
          <div className="sticky top-24 h-[70vh] overflow-hidden rounded-[28px]">
            {dict.steps.map((step, index) => (
              <div
                key={step.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  (shouldReduceMotion ? index === 0 : activeStage === index) ? "opacity-100" : "opacity-0"
                }`}
              >
                <StageMedia step={step} className="h-full w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-6 max-w-3xl text-center">
        <Link href="/booking" className="group inline-flex items-center gap-2 text-base font-semibold text-gold">
          {dict.cta}
          <IconArrow
            pointLeft={isRtl}
            className={`h-4 w-4 transition-transform duration-200 ${isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
          />
        </Link>
      </div>
    </section>
  );
}
