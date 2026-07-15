"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import type { AiConciergeDictionary } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";
import { ASSISTANT_SECTION_ID, useAssistant, type AssistantIntent } from "@/modules/smart-clinic-assistant";

/** Matches dict.aiConcierge.chips' order exactly (see CHIP_ICONS below, same order). */
const CHIP_INTENTS: AssistantIntent[] = ["cost_question", "before_after", "articles", "general", "image_upload_future"];

/**
 * "Smart Clinic Assistant" — the section directly under Hero.
 *
 * Round 2026-07-04: full rebuild against Hamid's own detailed
 * Awwwards-tier component spec (Next.js 15 + Framer Motion + Tailwind),
 * replacing the previous implementation (ai-concierge.tsx +
 * assistant-visual-panel.tsx + reveal-on-view.tsx, all deleted). He chose
 * this path explicitly after I flagged three real conflicts with the
 * project's established conventions — recorded here so the "why" survives
 * even though his direction was followed as given:
 *
 * 1. His spec asked for hardcoded Persian strings in the component. Kept
 *    everything driven by `dict: Dictionary["aiConcierge"]` instead — the
 *    site's only i18n mechanism (see fa.ts) exists specifically so content
 *    lives in one place; hardcoding here would silently fork it and break
 *    once an `en`/`ar` locale is populated. This is the one place this
 *    file diverges from his literal instruction — flagged, not silent.
 * 2. His spec asked for one monolithic component. Honored as asked: this
 *    is a single file, and — unlike hero.tsx/ai-concierge.tsx's previous
 *    Server-Component-plus-leaf-Client-Component split — the whole thing
 *    is now a Client Component (see the "use client" above), since nearly
 *    every visual piece here is Framer-Motion-driven.
 * 3. His spec asked for Framer Motion in place of the project's existing
 *    CSS + IntersectionObserver reveal system (reveal-on-view.tsx, now
 *    deleted). Honored as asked — see the entrance/title-reveal/ticker
 *    animations below, all Framer Motion.
 *
 * Two pieces from the previous implementation intentionally did NOT carry
 * over, since his new spec doesn't mention them: the "highlights" trio
 * that used to orbit above the headline, and the sixth quick-action chip
 * "تماس" (the new spec lists exactly 5 chips). Both are easy to re-add if
 * he wants them back — flagging rather than assuming.
 *
 * The avatar's rotating ring keeps a plain CSS animation (`.animate-emblem-
 * spin`, globals.css) rather than Framer Motion — a continuous conic-
 * gradient rotation is exactly what CSS `animation` already does natively
 * and reliably; Framer Motion is used everywhere else in this file
 * (entrance, title reveal, sample-question ticker, hover states) where it
 * adds real value over CSS.
 *
 * Scope is UI/UX only, per Hamid: no CRM, patient journey, AI backend, or
 * workflow. The textarea, chips, and both CTAs are intentionally inert —
 * to wire this to a real assistant backend later: replace `handleSubmit`
 * (currently a no-op) with a call to the chat API / Closer AI gateway
 * (SYSTEM_ARCHITECTURE.md §6/§8 — always through the internal AI Gateway,
 * never a direct model call from this Iran-hosted frontend), and replace
 * `ctaPrimary`'s onClick with whatever opens the real chat surface.
 *
 * RTL note: the whole app sets `dir` at the `<html>` level
 * ([locale]/layout.tsx), so this section doesn't set its own `dir`. Column
 * order below matches the CURRENT, already-approved layout from the
 * previous implementation (assistant card physically on the right,
 * text/chips physically on the left) — his new spec labels them "LEFT
 * COLUMN (text)" / "RIGHT COLUMN (assistant card)" using literal screen
 * sides, which is the same arrangement already live, so the card is kept
 * first in DOM (renders at the reading-start/right side in this RTL
 * grid) and the text column second (renders left).
 *
 * Round 2026-07-04 (same day, fifth follow-up): a visible diagonal seam
 * showed up in the navy background — root cause was `bg-gradient-to-br
 * from-deep-navy via-deep-navy to-[#1a2540]`: the duplicate `via-deep-navy`
 * stop makes the gradient sit flat for the first half then ramp into the
 * lighter tone for the second half, and that flat-to-ramp kink is exactly
 * what the eye reads as a hard edge across a large navy surface. Removed
 * the redundant middle stop for a single smooth 2-stop gradient. Also
 * widened the horizontal lighting overlay from a `w-2/3` div (whose own
 * right edge was a second candidate for a visible seam) to the section's
 * full width, fading to transparent well inside it either way.
 *
 * Round 2026-07-04 (same day, fourth follow-up): a fresh, very detailed
 * "polish" brief from Hamid arrived that overlapped heavily with what's
 * already here (glassmorphism values, avatar pulse+glow, real typewriter,
 * entrance stagger, title reveal, button/chip hover — all already
 * matched it almost verbatim). Applied only the genuine deltas:
 * - Modest spacing bumps (title→description, description→chips on the
 *   text column; avatar→eyebrow→message box on the card) — deliberately
 *   SMALL, not the "generous airy" amount his brief literally asked for.
 *   He confirmed keeping the fixed `h-dvh` (100% viewport) from the
 *   previous round takes priority over maximizing breathing room, since
 *   the two directly trade off against each other on a real fixed-height,
 *   overflow-hidden screen.
 * - Primary CTA background is now a subtle top-to-bottom gold gradient
 *   (was a flat `bg-gold`) with a brightness bump on hover instead of a
 *   flat color swap, since a gradient can't hover-swap to another flat
 *   color the same way.
 * - Secondary CTA's border opacity raised (25%→35% rest, 50%→60% hover)
 *   for better contrast against the navy card, per his ask.
 * - The "برآورد اولیه هزینه" chip (index 0) gets a visibly stronger gold
 *   border/fill than the other four — his brief asked to emphasize it as
 *   the highest-intent action.
 * - Added a faint horizontal gold gradient across the section, biased
 *   toward the assistant card's side, suggesting light coming from the
 *   assistant rather than a flat navy field.
 * - Card radius adjusted from 32px to 24px to match his spec's number.
 * NOT changed: chip icons stay always-visible rather than fading in on
 * hover — his new brief asked for the fade-in again, but that's the exact
 * behavior he explicitly asked me to drop two rounds ago ("همون آیکون‌ها
 * بهتر بود"); keeping the more recent, more specific instruction rather
 * than the older pattern resurfacing in a reused brief.
 *
 * Round 2026-07-04 (same day, third follow-up): section is now `h-dvh`
 * (100% viewport height), matching hero.tsx's approach, with the content
 * vertically centered via flex instead of top-aligned. Real risk worth
 * flagging: the section keeps `overflow-hidden`, so on a viewport where
 * the content is taller than one screen (more likely on very short mobile
 * viewports, or if the sample-question/description text wraps to extra
 * lines), the excess is now CLIPPED rather than scrollable — the previous
 * mobile-compaction pass was a best-effort, unverified-on-device
 * estimate, not a guarantee everything fits.
 *
 * Round 2026-07-04 (same day, second follow-up): tried per Hamid's
 * explicit "test it, tell me to revert if it's not good" — the navy
 * background moved from the inner max-w-6xl card onto the outer
 * `<section>` itself (full-bleed, no cream margin on the sides, no
 * rounded corners at the screen edge), with content still constrained to
 * max-w-6xl and centered inside it. Also compacted the mobile layout
 * (smaller avatar/textarea/spacing at the base breakpoint only — sm:/lg:
 * are largely unchanged) aiming to fit the whole section within one
 * mobile screen without an internal scroll area, per his request. Revert
 * point if he doesn't like it: restore `bg-cream` + the two blurred
 * decorative circles on the section, and put `rounded-[40px] bg-gradient-
 * to-br ... shadow-[...]` back on the inner div instead of the section.
 *
 * Round 2026-07-04 (same day, follow-up): three real fixes plus two
 * requested style changes.
 * - The sample-question area used a fade/slide crossfade, not an actual
 *   typewriter — replaced with a real type-then-erase character loop
 *   (see the effect below) with a blinking cursor.
 * - That area's ghost text was rendering directly on top of the
 *   textarea's own native `placeholder`, since both said something at
 *   once — the native placeholder is now empty until the user actually
 *   focuses the field, so only one is ever visible.
 * - The headline was invisible again, for a NEW reason this time: its
 *   `whileInView` was on the `<motion.h2>` itself, and that element's own
 *   `initial={{ x: "100%" }}` — combined with the parent's
 *   `overflow-hidden` — meant Framer Motion's IntersectionObserver could
 *   compute near-zero visible intersection for the h2's own transformed
 *   box, so it might never fire. Fixed by moving `whileInView` to the
 *   (untransformed, always-correctly-positioned) wrapper div and driving
 *   the h2 purely off inherited variant state — same category of bug as
 *   the two earlier `mask-wipe` failures (a hidden starting state fooling
 *   the "is this visible yet" check), different specific cause.
 * - Chips regained their real per-action icons (Calculator, Gallery,
 *   Book, Care, Upload) instead of a generic dot, always visible rather
 *   than fading in on hover, per his "همون آیکون‌ها بهتر بود."
 * - Text column, chips, and headline are now center-aligned at every
 *   breakpoint (dropped the `lg:text-start`/`lg:justify-start` overrides)
 *   and the message box + section vertical padding were both reduced
 *   roughly by half.
 *
 * Round 2026-07-05 (per Hamid): headline font-size at desktop (`lg` and
 * up) set to a flat 30px (`lg:text-[30px]`, replacing `lg:text-5xl`/48px)
 * — smaller than the previous desktop size, an explicit request, not a
 * mistake. Added `text-center` directly on the `h2` too, even though the
 * wrapper above it already centers everything — belt-and-suspenders per
 * his explicit ask, in case a future edit to the wrapper ever changes
 * that inherited alignment.
 *
 * Round 2026-07-09 (per Hamid, light connection only — NOT a redesign):
 * the CTAs and chips below were inert (see "Scope is UI/UX only" above).
 * They now call the shared `useAssistant()` hook (src/modules/smart-clinic-assistant) —
 * `ctaPrimary` ("شروع گفتگو") opens with intent "general", `ctaSecondary`
 * ("رزرو مشاوره") with "consultation", and each chip with the intent
 * matching its meaning (`CHIP_INTENTS`, same order as the chips array).
 * Since no real assistant drawer exists yet, `open()`'s current effect is
 * just scrolling to this section (see assistant-provider.tsx) — so
 * clicking these while already here does effectively nothing visible yet
 * beyond the (harmless) re-scroll; that's expected until a real panel
 * exists. Also added `id={ASSISTANT_SECTION_ID}` to the section root so
 * that scroll-fallback has a target. No visual/layout change in this
 * round.
 */
export function SmartClinicAssistantSection({ dict, locale }: { dict: AiConciergeDictionary; locale: Locale }) {
  const shouldReduceMotion = useReducedMotion();
  const isRtl = LOCALE_DIRECTION[locale] === "rtl";
  const { open } = useAssistant();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isErasing, setIsErasing] = useState(false);
  const [hasFocusedInput, setHasFocusedInput] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayText(dict.sampleQuestions[questionIndex]);
      return;
    }

    const currentQuestion = dict.sampleQuestions[questionIndex];
    let timeoutId: ReturnType<typeof setTimeout>;

    if (!isErasing) {
      if (displayText.length < currentQuestion.length) {
        timeoutId = setTimeout(() => setDisplayText(currentQuestion.slice(0, displayText.length + 1)), 45);
      } else {
        timeoutId = setTimeout(() => setIsErasing(true), 1800);
      }
    } else if (displayText.length > 0) {
      timeoutId = setTimeout(() => setDisplayText(currentQuestion.slice(0, displayText.length - 1)), 18);
    } else {
      setIsErasing(false);
      setQuestionIndex((current) => (current + 1) % dict.sampleQuestions.length);
    }

    return () => clearTimeout(timeoutId);
  }, [displayText, isErasing, questionIndex, dict.sampleQuestions, shouldReduceMotion]);

  const entranceInitial = shouldReduceMotion ? false : { opacity: 0, y: 40 };
  const entranceInView = shouldReduceMotion ? undefined : { opacity: 1, y: 0 };
  const hoverTransition = { duration: shouldReduceMotion ? 0.01 : 0.2 };

  return (
    <motion.section
      id={ASSISTANT_SECTION_ID}
      data-header-bg="#0f172a"
      className="snap-section relative flex h-dvh items-center overflow-hidden bg-gradient-to-br from-deep-navy to-[#1a2540] py-4 shadow-[0_50px_120px_rgba(11,17,32,0.3)] sm:py-8 lg:py-12"
      initial={entranceInitial}
      whileInView={entranceInView}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Subtle horizontal lighting: a low-opacity gold glow biased toward
          the assistant card's side (the DOM-first/right side in this RTL
          grid), fading fully to transparent well before the section's
          own edges — spans the FULL section width (not a narrower
          w-2/3 div) specifically so its own boundary can never itself
          become a visible seam. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(to ${isRtl ? "left" : "right"}, rgba(201,161,90,0.10), transparent 55%)` }}
      />

      <div
        aria-hidden
        className="animate-ambient-light pointer-events-none absolute -top-16 start-1/4 h-64 w-64 rounded-full bg-gold/20 blur-[100px]"
      />
      <div
        aria-hidden
        className="animate-ambient-light pointer-events-none absolute -bottom-20 end-1/4 h-72 w-72 rounded-full bg-warm-white/10 blur-[110px]"
        style={{ animationDelay: "2.5s" }}
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="relative grid gap-5 p-4 sm:gap-8 sm:p-8 lg:grid-cols-2 lg:items-center lg:gap-14 lg:p-10">
          {/* Assistant card — DOM-first, renders on the right in this RTL layout. */}
          <motion.div
            initial={entranceInitial}
            whileInView={entranceInView}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.55, delay: shouldReduceMotion ? 0 : 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[24px] border-[1px] p-4 sm:p-7 lg:p-8"
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(201, 161, 90, 0.22)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.55)",
            }}
          >
            <div className="flex justify-center">
              <AssistantAvatar shouldReduceMotion={Boolean(shouldReduceMotion)} />
            </div>

            <div className="mt-3.5 flex items-center justify-center gap-2 sm:mt-5 sm:gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-sonar rounded-full bg-gold" />
                <span className="absolute inset-0 animate-sonar rounded-full bg-gold" style={{ animationDelay: "0.7s" }} />
                <span className="relative h-2 w-2 rounded-full bg-gold" />
              </span>
              <p className="text-center text-[13px] font-semibold tracking-[0.1em] text-gold sm:text-[18px] sm:tracking-[0.2em] lg:text-[20px] lg:tracking-[0.25em]">
                {dict.eyebrow}
              </p>
            </div>
            <p className="mt-1.5 text-center text-[11px] text-warm-white/50 sm:mt-2 sm:text-sm">{dict.onlineStatus}</p>

            {/* Message area: a real type-then-erase character loop through
                the sample questions (state machine in the effect above) as
                a ghost-text preview — disappears permanently once the user
                actually focuses the textarea. The textarea's own native
                placeholder stays empty until then so the two never render
                on top of each other. */}
            <div className="relative mt-4 rounded-3xl border-2 border-warm-white/25 bg-warm-white/[0.14] p-3 shadow-[inset_0_2px_16px_rgba(0,0,0,0.3)] transition-colors duration-200 focus-within:border-gold/60 focus-within:bg-warm-white/[0.18] sm:mt-6 sm:p-4">
              <textarea
                rows={2}
                placeholder={hasFocusedInput ? dict.inputPlaceholder : ""}
                onFocus={() => setHasFocusedInput(true)}
                className="min-h-[52px] w-full resize-none bg-transparent text-xs leading-6 text-warm-white placeholder:text-warm-white/50 focus:outline-none sm:min-h-[90px] sm:text-base sm:leading-8"
              />
              {!hasFocusedInput ? (
                <div className="pointer-events-none absolute inset-3 flex items-start sm:inset-4">
                  <p className="text-xs leading-6 text-warm-white/70 sm:text-base sm:leading-8">
                    {displayText}
                    <span className="ms-1 inline-block h-3.5 w-[2px] animate-pulse bg-warm-white/60 align-middle sm:h-4" />
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:gap-3">
              <motion.button
                type="button"
                onClick={() => open("general", "homepage")}
                initial="rest"
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                variants={{ rest: { y: 0 }, hover: { y: -1 } }}
                transition={hoverTransition}
                className="relative inline-flex flex-1 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-gold to-gold-hover px-6 py-2.5 text-sm font-semibold text-deep-navy transition-[filter] duration-200 hover:brightness-105 sm:px-8 sm:py-4"
              >
                {/* Light-sweep: a diagonal shimmer that inherits the button's
                    "hover" variant state (Framer Motion propagates a parent's
                    active variant label to children that define matching
                    variants but no animation props of their own). */}
                <motion.span
                  aria-hidden
                  variants={{ rest: { x: "-120%" }, hover: { x: "220%" } }}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.6, ease: "easeInOut" }}
                  className="pointer-events-none absolute inset-y-0 start-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
                <span className="relative">{dict.ctaPrimary}</span>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => open("consultation_booking", "homepage")}
                whileHover={{ scale: shouldReduceMotion ? 1 : 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={hoverTransition}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-warm-white/35 px-6 py-2.5 text-sm font-semibold text-warm-white transition-colors duration-200 hover:border-gold/60 sm:px-8 sm:py-4"
              >
                {dict.ctaSecondary}
              </motion.button>
            </div>
          </motion.div>

          {/* Text column — DOM-second, renders on the left in this RTL layout. */}
          <motion.div
            initial={entranceInitial}
            whileInView={entranceInView}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.55, delay: shouldReduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            {/* Title reveal: whileInView lives on this wrapper (never
                transformed, so it's always geometrically where it looks
                like it is) rather than on the h2 itself — see this file's
                doc-comment for why putting it on the h2 directly made the
                headline invisible. The h2 only has `variants` and inherits
                the wrapper's animation state. */}
            <motion.div
              className="overflow-hidden"
              initial={shouldReduceMotion ? false : "hidden"}
              whileInView={shouldReduceMotion ? undefined : "visible"}
              viewport={{ once: true, amount: 0.4 }}
            >
              <motion.h2
                variants={{ hidden: { x: "100%" }, visible: { x: "0%" } }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-balance text-center text-xl font-bold leading-snug text-warm-white sm:text-4xl lg:text-[30px]"
              >
                {dict.headline}
              </motion.h2>
            </motion.div>

            <p className="mt-4 text-sm leading-6 text-warm-white/70 sm:mt-7 sm:text-lg sm:leading-9">{dict.description}</p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:mt-9 sm:gap-2.5">
              {dict.chips.map((chip, index) => {
                const Icon = CHIP_ICONS[index];
                // "برآورد اولیه هزینه" (index 0) is the highest-intent
                // action — a cost estimate is usually the deciding factor
                // before booking — so it gets a visibly stronger gold
                // accent than the other chips, per Hamid's explicit ask.
                const isEmphasized = index === 0;
                return (
                  <motion.button
                    key={chip}
                    type="button"
                    onClick={() => open(CHIP_INTENTS[index], "homepage")}
                    whileHover={{ y: shouldReduceMotion ? 0 : -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={hoverTransition}
                    className={`inline-flex items-center gap-1.5 rounded-2xl border px-2.5 py-2 text-[11px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md transition-colors duration-200 sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-sm ${
                      isEmphasized
                        ? "border-gold/45 bg-gold/10 text-warm-white hover:border-gold/70 hover:bg-gold/15"
                        : "border-warm-white/15 bg-warm-white/[0.08] text-warm-white hover:border-gold/40 hover:bg-warm-white/[0.12]"
                    }`}
                  >
                    {Icon ? <Icon className="h-3 w-3 shrink-0 text-gold sm:h-4 sm:w-4" /> : null}
                    <span className="whitespace-nowrap">{chip}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

function AssistantAvatar({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <motion.div
      className="relative flex h-14 w-14 items-center justify-center sm:h-24 sm:w-24"
      animate={shouldReduceMotion ? undefined : { scale: [1, 1.03, 1] }}
      transition={shouldReduceMotion ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Rotating ring: continuous CSS animation, not Framer Motion — see
          the file's doc-comment for why. Radial highlight behind the spark
          per Hamid's "زیر آواتار یک هایلایت شعاعی طلایی برای عمق." */}
      <div
        aria-hidden
        className="animate-emblem-spin absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0%,rgba(201,161,90,0.75)_20%,transparent_40%)]"
      />
      <div aria-hidden className="absolute inset-[3px] rounded-full bg-deep-navy" />
      <div aria-hidden className="absolute inset-2 rounded-full border border-gold/25" />
      <div aria-hidden className="animate-ambient-light absolute inset-5 rounded-full bg-gold/25 blur-md" />
      <SparkMark className="animate-emblem-pulse relative h-5 w-5 text-gold sm:h-9 sm:w-9" />
    </motion.div>
  );
}

/**
 * Original abstract mark, not Dr. Sadighi's real clinic logo (none has
 * been supplied yet) — a placeholder standing in for "the assistant's
 * mark" until a real logo/brand asset exists.
 */
function SparkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c.7 3.8 2.9 6 6.7 6.7-3.8.7-6 2.9-6.7 6.7-.7-3.8-2.9-6-6.7-6.7C9.1 8.7 11.3 6.5 12 2Z" />
    </svg>
  );
}

/** Matches dict.aiConcierge.chips' order exactly. */
const CHIP_ICONS = [CalculatorIcon, GalleryIcon, BookIcon, CareIcon, UploadIcon];

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="4.5" y="3" width="15" height="18" rx="2.5" />
      <path d="M8 7.5h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16v2" strokeLinecap="round" />
    </svg>
  );
}

function GalleryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M20.5 15.5 15 10l-8.5 8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19a1 1 0 0 1 1 1v14.5a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 0 4 22V5.5Z"
        strokeLinejoin="round"
      />
      <path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20" strokeLinecap="round" />
    </svg>
  );
}

function CareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path
        d="M12 20.5s-7-4.4-7-9.7A4.3 4.3 0 0 1 9.3 6.5 4 4 0 0 1 12 7.9a4 4 0 0 1 2.7-1.4 4.3 4.3 0 0 1 4.3 4.3c0 5.3-7 9.7-7 9.7Z"
        strokeLinejoin="round"
      />
      <path d="M9.5 11h1.3l.9-1.8 1.4 3.2.9-1.4h1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M12 15V4M12 4 7.5 8.5M12 4l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 15v3.5A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5V15" strokeLinecap="round" />
    </svg>
  );
}
