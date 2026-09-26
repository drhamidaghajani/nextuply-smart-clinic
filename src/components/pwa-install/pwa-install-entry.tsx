"use client";

import { usePwaInstall } from "./pwa-install-provider";

/**
 * Round 2026-09-26 (Phase 1 — visible install entry). Two corrections, both
 * about *visibility*, and both driven by what the owner actually saw on
 * `http://localhost:3001`:
 *
 * 1. This used to hide itself whenever no native `beforeinstallprompt` was
 *    held, so it was invisible on every desktop browser that offers no
 *    native install — and permanently invisible under `npm run dev`, because
 *    `ServiceWorkerRegister` is production-only and Chromium refuses to
 *    propose installs without a service worker. Persistent discovery must not
 *    depend on a transient, browser-specific event, so the rule is now:
 *
 *      public site + not running as the installed app = VISIBLE ENTRY
 * 2. It now has a second, equally permanent mount point inside the mobile
 *    menu's secondary-action area, because on a phone the footer entry is
 *    only reachable by scrolling to the very bottom of the page.
 *
 * Round 40 (2026-09-26, per Hamid). Two product corrections, both his:
 *
 * 1. The footer entry is a MOBILE affordance, so it no longer appears on a
 *    desktop browser — nobody goes hunting for an app install inside a
 *    desktop page. This is enforced in CSS (`globals.css`, keyed on the
 *    fine-pointer/hover media query), NOT with a JS device check, so the
 *    footer can never flip in or out during hydration.
 * 2. Pressing EITHER entry (footer or mobile menu) now opens the same bottom
 *    sheet the automatic promotion uses — the identical popup, with the same
 *    CTA that installs on the patient's device. Previously an entry press
 *    jumped straight to a per-browser "manual instructions" list, which Hamid
 *    explicitly rejected as useless. That list is gone; the only views left
 *    are the native offer and iOS's genuinely-required Add-to-Home-Screen
 *    steps, and which one appears is decided by the press itself
 *    (`requestInstall`), exactly as the auto-promotion does.
 *
 * VISIBILITY AND ACTION REMAIN SEPARATE. This component renders
 * unconditionally — there is no provider-state gate, no early `return null`.
 * The only things that hide it are CSS: `display-mode: standalone` (already
 * installed) and the desktop media query in point 1.
 *
 * The label is the dictionary's `installCta` — the same string as the sheet's
 * primary CTA, so the entries, the sheet, and the auto-promotion can never
 * drift apart. Styling reuses the surrounding footer/menu link language (small
 * text, the existing hover-to-gold transition); no card, banner, badge, or new
 * visual system.
 */

const FOOTER_LINK_CLASS =
  "pwa-install-entry pwa-install-entry--footer text-sm leading-6 text-warm-white/60 transition-colors duration-200 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

/**
 * The mobile menu's secondary area is a `flex flex-col items-center` stack
 * between the language switcher and the consultation CTA, so this mirrors
 * those rows rather than the footer's tighter link list.
 */
const MOBILE_MENU_LINK_CLASS =
  "pwa-install-entry text-center text-sm text-warm-white/55 transition-colors duration-200 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export type PwaInstallEntryPlacement = "footer" | "mobileMenu";

/**
 * `placement` exists only because the two required mount points need
 * different wrappers, and guessing would produce invalid markup: the footer's
 * راهنما column is a `<ul>` (hence a real `<li>`), while the mobile menu's
 * secondary area is a flex column that must not receive a list item.
 */
export function PwaInstallEntry({
  placement = "footer",
  onAfterOpen,
}: {
  placement?: PwaInstallEntryPlacement;
  /**
   * Runs right after the sheet is asked to open. The mobile menu uses it to
   * close itself, so the two overlays are never open at the same time.
   */
  onAfterOpen?: () => void;
} = {}) {
  const { dict, openSheet } = usePwaInstall();

  const button = (
    <button
      type="button"
      // Round 40 (per Hamid): pressing an entry opens the SAME sheet the
      // automatic promotion opens — identical view, identical copy, identical
      // CTA — and that sheet's button is what installs on the patient's
      // device. This is deliberately `openSheet("intro")` and not
      // `requestInstall()`: the latter would fire the browser's native dialog
      // straight from this press and skip the popup the owner asked to see
      // again.
      //
      // The auto-promotion calls the exact same `openSheet("intro")`, so the
      // two paths cannot diverge.
      onClick={() => {
        openSheet("intro");
        onAfterOpen?.();
      }}
      className={placement === "footer" ? FOOTER_LINK_CLASS : MOBILE_MENU_LINK_CLASS}
    >
      {dict.installCta}
    </button>
  );

  if (placement === "mobileMenu") return button;

  return <li>{button}</li>;
}
