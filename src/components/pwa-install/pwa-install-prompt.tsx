"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { PwaInstallDictionary } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

import { isDismissedWithinWindow, isMobileDevice, isRunningStandalone, usePwaInstall } from "./pwa-install-provider";

/**
 * Round 2026-09-25 (PWA install experience, per Hamid's brief). The one
 * install sheet, mounted once from `SiteChrome`'s public branch — so it
 * exists on patient-facing routes only and never on `/{locale}/internal/*`.
 *
 * Round 40 (2026-09-26, per Hamid): the per-browser "manual instructions" list
 * is REMOVED. It answered a question nobody was asking — a desktop visitor
 * does not come looking for an install inside the browser, and a long
 * Chrome/Safari/Firefox/Android/iOS tutorial read as noise. Two views remain:
 * the offer (`intro`), whose CTA installs on the patient's device, and the
 * genuinely-required iOS Add-to-Home-Screen steps. Entries no longer route
 * anywhere else, so pressing any entry here shows this same sheet.
 *
 * Three views, all reached by an explicit press: `intro` (the offer) and
 * `ios-steps` (Safari's real Add-to-Home-Screen taps) — added 2026-09-26 — plus
 * the auto-promotion that opens `intro` on its own. The popup *policy* below is
 * deliberately unchanged in this round; only the persistent entries' visibility
 * and their press target were changed, and popup behavior remains a separate,
 * later decision.
 *
 * TIMING (the brief's "after ~5 seconds OR after the first meaningful user
 * interaction"):
 * - Baseline: `AUTO_PROMPT_DELAY_MS` after this effect runs (i.e. after
 *   hydration, never before first paint).
 * - A meaningful interaction — a tap, a key press, or scrolling past
 *   `ENGAGEMENT_SCROLL_RATIO` of a viewport — may pull that deadline
 *   forward to `INTERACTION_SETTLE_MS` after the interaction, so the sheet
 *   never appears mid-gesture. It can only ever move the deadline EARLIER;
 *   the baseline still applies if the visitor never interacts.
 * - It never appears while the tab is hidden, and appears on becoming
 *   visible if the deadline already passed.
 * - Auto-promotion is mobile-only (see `isMobileDevice`), and is skipped
 *   entirely for anyone who dismissed it in the last 7 days, is already
 *   running the installed app, or has no working install path.
 *
 * MOTION: CSS transitions only, no animation library — and the global
 * `prefers-reduced-motion` rule in `globals.css` already collapses every
 * transition to 0.01ms sitewide, so reduced motion is handled by the same
 * one rule every other component here relies on.
 *
 * LAYOUT: `fixed` overlay, so opening/closing can never shift the page
 * (no CLS). It sits at `z-50` — above the floating assistant trigger
 * (`z-40`) and below `AssistantDrawer` (`z-[60]`), which therefore still
 * takes precedence if a patient opens the assistant while the sheet is up.
 */

const AUTO_PROMPT_DELAY_MS = 5000;
const INTERACTION_SETTLE_MS = 1500;
const ENGAGEMENT_SCROLL_RATIO = 0.3;
/** Matches the exit transition below; only used to unmount after it. */
const EXIT_MS = 300;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PwaInstallPrompt() {
  const { dict, locale, isSheetOpen, view, openSheet, requestInstall, dismiss } = usePwaInstall();

  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const isInstructions = view === "ios-steps";

  /* Auto-promotion — see the timing note above. */
  useEffect(() => {
    if (isSheetOpen) return;
    // Already running as the installed app → never promote installation.
    // Read from the runtime directly rather than from a stored/derived flag,
    // matching the entry's own visibility rule.
    if (isRunningStandalone()) return;
    if (isDismissedWithinWindow()) return;
    if (!isMobileDevice()) return;

    let hasRevealed = false;
    let revealTimer: number | undefined;
    let deadlineAt = Date.now() + AUTO_PROMPT_DELAY_MS;

    const reveal = () => {
      if (hasRevealed) return;
      if (isDismissedWithinWindow()) return;
      if (document.visibilityState !== "visible") return;
      hasRevealed = true;
      openSheet("intro");
    };

    const schedule = () => {
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(reveal, Math.max(0, deadlineAt - Date.now()));
    };

    const stopListeningForEngagement = () => {
      window.removeEventListener("pointerup", handleEngagement);
      window.removeEventListener("keydown", handleEngagement);
      window.removeEventListener("scroll", handleScroll);
    };

    const engage = () => {
      deadlineAt = Math.min(deadlineAt, Date.now() + INTERACTION_SETTLE_MS);
      schedule();
      stopListeningForEngagement();
    };

    function handleEngagement() {
      engage();
    }

    function handleScroll() {
      if (window.scrollY < window.innerHeight * ENGAGEMENT_SCROLL_RATIO) return;
      engage();
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") reveal();
    };

    schedule();
    window.addEventListener("pointerup", handleEngagement, { passive: true });
    window.addEventListener("keydown", handleEngagement);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearTimeout(revealTimer);
      stopListeningForEngagement();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isSheetOpen, openSheet]);

  /* Mount/visibility two-phase so BOTH the entrance and the exit actually
     transition — a single `isSheetOpen` flag would only ever animate in. */
  useEffect(() => {
    if (isSheetOpen) {
      setIsMounted(true);
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timer = window.setTimeout(() => setIsMounted(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [isSheetOpen]);

  /**
   * While open: background scroll is frozen (compensating for the removed
   * scrollbar so nothing shifts), focus moves into the sheet, Escape and
   * Tab are handled, and focus is returned to whatever was focused before.
   * The lock is released in the cleanup, so it is also released on unmount.
   *
   * `isMounted` is part of the dependency list on purpose: the sheet's DOM
   * only exists from the render AFTER `isSheetOpen` flips (the two-phase
   * entrance above), so on the first run of this effect `sheetRef` is still
   * null and focusing it would silently do nothing. Depending on
   * `isMounted` gives this effect the run where the ref is real. The
   * early-return runs deliberately return NO cleanup, so the acquire/release
   * pair still happens exactly once per open.
   */
  useEffect(() => {
    if (!isSheetOpen || !isMounted) return;

    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPaddingInlineEnd: body.style.paddingInlineEnd,
      htmlOverflow: documentElement.style.overflow,
    };

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingInlineEnd = `${scrollbarWidth}px`;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    sheetRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== "Tab") return;

      const container = sheetRef.current;
      if (!container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Defensive: if focus is somehow outside the sheet (it shouldn't be),
      // pull it back in instead of letting Tab escape into the page behind.
      if (!container.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      body.style.overflow = previous.bodyOverflow;
      body.style.paddingInlineEnd = previous.bodyPaddingInlineEnd;
      documentElement.style.overflow = previous.htmlOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [isSheetOpen, isMounted, dismiss]);

  const handleInstall = requestInstall;

  if (!isMounted) return null;

  return (
    <div dir={LOCALE_DIRECTION[locale]} className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        onClick={dismiss}
        className={`absolute inset-0 bg-deep-navy/40 transition-opacity duration-300 ease-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-lg flex-col rounded-t-[28px] border border-b-0 border-gold/20 bg-warm-white px-6 pt-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] shadow-[0_-18px_60px_-28px_rgba(15,23,42,0.5)] outline-none transition-[translate,opacity] duration-300 ease-out sm:bottom-6 sm:max-w-md sm:rounded-[28px] sm:border-b sm:px-8 sm:pb-8 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <span aria-hidden="true" className="mx-auto mb-5 block h-[3px] w-10 shrink-0 rounded-full bg-gold/45" />

        <div className="flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="font-heading text-lg font-semibold text-deep-navy sm:text-xl"
          >
            {isInstructions ? dict.instructionsTitle : dict.promptTitle}
          </h2>
          <button
            type="button"
            onClick={dismiss}
            aria-label={dict.closeLabel}
            className="-mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-charcoal/45 transition-colors duration-200 hover:bg-charcoal/5 hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className="h-4.5 w-4.5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {isInstructions ? (
          <IosInstructions dict={dict} locale={locale} onDone={dismiss} />
        ) : (
          <>
            <p className="mt-3 text-sm leading-7 text-charcoal/70">{dict.promptBody}</p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold text-warm-white transition-colors duration-200 hover:bg-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {dict.installCta}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-charcoal/12 px-8 text-sm font-medium text-charcoal/70 transition-colors duration-200 hover:border-charcoal/25 hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {dict.notNowCta}
              </button>
            </div>
            {/* Round 40 (per Hamid): one quiet line replacing the removed
                per-browser tutorial. It is always present rather than
                appearing only on failure — the sheet cannot know whether the
                browser will show its own dialog before it is asked, so
                guessing would make it flash in and out. */}
            <p className="mt-4 text-center text-xs leading-6 text-charcoal/50">{dict.unavailableNote}</p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The iPad/iPhone path — deliberately not a fake install button. iOS Safari
 * exposes no programmatic install at all, so this is the honest version:
 * the three real taps, in order, with nothing claimed to be automatic.
 */
function IosInstructions({
  dict,
  locale,
  onDone,
}: {
  dict: PwaInstallDictionary;
  locale: Locale;
  onDone: () => void;
}) {
  const numberFormat = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");

  return (
    <>
      <p className="mt-3 text-sm leading-7 text-charcoal/70">{dict.instructionsIntro}</p>

      <ol className="mt-5 flex flex-col gap-4">
        {dict.instructionsSteps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-xs font-semibold text-gold"
            >
              {numberFormat.format(index + 1)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-deep-navy">{step.title}</p>
              <p className="mt-1 text-xs leading-6 text-charcoal/60">{step.hint}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-5 rounded-2xl bg-deep-navy/[0.04] px-4 py-3 text-xs leading-6 text-charcoal/60">
        {dict.instructionsNote}
      </p>

      <button
        type="button"
        onClick={onDone}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-deep-navy px-8 text-sm font-semibold text-warm-white transition-colors duration-200 hover:bg-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {dict.instructionsDoneCta}
      </button>
    </>
  );
}
