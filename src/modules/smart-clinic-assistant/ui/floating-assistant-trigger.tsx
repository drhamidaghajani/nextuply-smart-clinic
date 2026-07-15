"use client";

import { usePathname } from "next/navigation";

import { getDictionary } from "@/i18n/get-dictionary";

import { useAssistant } from "./assistant-provider";

/**
 * Floating entry point to the Smart Clinic Assistant, mounted once in the
 * root layout so it's present on every page.
 *
 * Round 2026-07-09 (correction pass, per Hamid: "too large and visually
 * intrusive... no giant background blob... no aggressive pulse"): dropped
 * the `.animate-sonar` pulse ring entirely and removed the `sm:` size
 * bump — one flat 56px circle at every breakpoint. Hover is the only
 * motion: a subtle scale, no idle animation.
 *
 * Round 2026-07-11 (per Hamid, from a reference screenshot): two changes
 * from his reference —
 * 1. Moved from `end-*` (left, under this page's RTL) to `start-*`
 *    (literal right side) — his reference showed it on the right.
 * 2. Background swapped from the gold gradient to a solid navy
 *    (`bg-deep-navy`), and the icon swapped from the SparkMark (shared
 *    with the homepage assistant card) to a two-bubble "chat" icon,
 *    matching his reference image exactly (navy circle, white chat-bubble
 *    icon) rather than the previous gold/spark treatment. This is a real
 *    identity change for this one trigger, not a small tweak — flagged
 *    as such rather than silently kept gold "for brand consistency."
 *
 * Round 2026-07-13 (header polish/correction round, per Hamid — "Keep
 * bottom-right position... stay fixed across the entire site"): `start-5`
 * was a real bug once `en` (LTR) shipped — logical `start` is the RIGHT
 * edge only under RTL; under `en` it silently put this button at the
 * bottom-LEFT instead (confirmed via Playwright before this fix), which
 * contradicts his explicit "bottom-right, regardless of locale." Switched
 * to physical `end-5`→`right-5` (not a logical property) since the
 * request here is a literal screen-side, not a reading-direction-relative
 * one — same category of deliberate physical-over-logical exception this
 * project already applies to `tel:` link `dir="ltr"` and centering
 * transforms elsewhere. Also added a subtle gold-tinted border and
 * softened the shadow into more of an ambient glow, per this round's
 * "subtle premium border or gold accent... very soft shadow/glow" ask —
 * size/position/icon otherwise unchanged (no redesign).
 *
 * Position: `fixed`, bottom offset accounts for iOS safe-area via
 * `env()`. Opens with `intent: "general"` — a generic entry point, not
 * consultation-specific (Header's CTA is the consultation-specific one).
 *
 * Round 2026-07-15 (Clinic Operations Dashboard Lite): hidden on
 * `/{locale}/internal/*` — a patient-facing "chat with us" bubble
 * floating over the secretary's internal ops dashboard is confusing and
 * out of place there; this is the one place on the site that
 * deliberately isn't a patient-facing surface.
 */
export function FloatingAssistantTrigger() {
  const { open, locale } = useAssistant();
  const dict = getDictionary(locale);
  const pathname = usePathname();

  if (/^\/[a-z]{2}\/internal(\/|$)/.test(pathname)) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => open("general", "floating")}
      aria-label={dict.assistantFlow.ui.openButtonLabel}
      className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-deep-navy text-warm-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45),0_0_20px_-4px_rgba(201,161,90,0.25)] transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
      style={{ bottom: "max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))" }}
    >
      <ChatBubblesIcon className="h-6 w-6" />
    </button>
  );
}

/** Two overlapping speech bubbles, matching Hamid's reference screenshot. */
function ChatBubblesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 4.5a5 5 0 0 1 5 5c0 1.06-.31 2.04-.85 2.87l.85 3.13-3.13-.85a4.98 4.98 0 0 1-1.87.35 5 5 0 0 1-5-5 5 5 0 0 1 5-5Z" />
      <path d="M9.5 10.86A5 5 0 0 0 5 15.5c0 .78.18 1.52.5 2.18L5 20.5l2.82-.65c.66.32 1.4.5 2.18.5a5 5 0 0 0 4.87-3.85" />
    </svg>
  );
}
