"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { PwaInstallDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";

/**
 * Round 2026-09-25 (PWA install experience, per Hamid's brief). This is the
 * ONE owner of "can this browser install the site right now, and what
 * happens when the patient asks to install" — the sheet and the footer
 * entry are both presentational consumers of it, so the two can never
 * disagree about whether an install action is currently possible.
 *
 * It reuses the existing PWA infrastructure rather than replacing it: the
 * manifest (`public/manifest.webmanifest`), the service worker
 * (`public/sw.js` — untouched, still the same conservative allowlist) and
 * its registration (`service-worker-register.tsx`) are all unchanged. What
 * is new here is only the *promotion/consent* layer that sits on top of
 * them.
 *
 * Three install paths exist:
 * - `"native"` — the browser supports/has offered a native install
 *   (Android/Chromium, and desktop Chromium/Edge). The prompt is still only
 *   ever replayed from an explicit CTA press.
 * - `"ios"` — iOS/iPadOS Safari exposes no programmatic install at all, so
 *   the "path" here is *instructions* (Share → Add to Home Screen → Add).
 *   Nothing is ever claimed to be automatic.
 * - `null` — the app is genuinely already running as an installed app.
 *
 * Round 2026-09-26 (Phase 1 — visible install entry). Two corrections to the
 * original 2026-09-25 model, both about *visibility*:
 *
 * 1. `"native"` is no longer conditional on a live `beforeinstallprompt`.
 *    Previously an absent event produced `null`, which made the footer entry
 *    invisible — and the event is *always* absent under `npm run dev`, because
 *    `ServiceWorkerRegister` is production-only and Chromium requires a service
 *    worker with a fetch handler before it will propose installs. Persistent
 *    discovery must not depend on a transient, browser-specific event, so the
 *    entry's visibility is now driven by state that is knowable on every
 *    browser. A held native prompt survives as an *enhancement* that changes
 *    what the CTA does at press time, never whether the entry exists.
 * 2. A stored "installed" marker no longer hides anything. Standalone/installed
 *    detection is runtime-only, so a stale key — or an install on a different
 *    profile — can never permanently remove the entry from a normal tab.
 *
 * 3. VISIBILITY AND ACTION ARE SEPARATED (Round 39, later the same day). This
 *    provider holds only ACTION state. It cannot unmount the entry: nothing
 *    it exposes is consulted for visibility, and it no longer publishes an
 *    `isInstalled` flag at all — that flag existed purely to remove the
 *    entry. Hiding an installed app's entry is now `display-mode` CSS in
 *    `globals.css`, resolved by the browser at paint time, which is why
 *    `server button present → hydrated button gone` can no longer happen.
 *
 * Everything is fail-silent and local: no network, no dependency, no
 * analytics, and no interaction with the Smart Clinic Assistant or booking.
 */

/**
 * The single key this feature writes: a purely local UI preference (popup
 * suppression), never patient data.
 */
const DISMISSED_UNTIL_STORAGE_KEY = "sadighi.pwa-install.dismissed-until";
const DISMISSAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * `beforeinstallprompt` is not in TypeScript's DOM lib (it is a de-facto
 * standard implemented by Chromium, not a spec'd event), so it is typed
 * minimally here — only the two members this feature actually touches.
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type PwaInstallView = "intro" | "ios-steps";

/**
 * Early capture, at MODULE scope rather than inside the provider's effect.
 * Chrome decides the site is installable on its own schedule and can fire
 * `beforeinstallprompt` before React has hydrated — a listener attached in
 * a `useEffect` would simply miss that event, and the install CTA would
 * never appear on that visit. Module evaluation happens when the client
 * bundle loads, which is strictly earlier, so this is the one place the
 * event can't be lost. The listener stays attached for the page's
 * lifetime; a later event just overwrites the (single-use) held reference.
 *
 * The `typeof window` guard is required: Next still evaluates client
 * component modules during SSR, where there is no window.
 */
let earlyInstallPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Suppressing the browser's own mini-infobar is what makes the custom
    // sheet the only place installation is offered — and, per the brief, the
    // held event is only ever replayed from an explicit CTA press.
    //
    // This module-level slot is the single source of truth for "a native
    // prompt is available right now". It is read at press time rather than
    // mirrored into React state, precisely so that visibility never depends
    // on it; and it is cleared the moment it is consumed, so a spent event
    // can never be replayed.
    event.preventDefault();
    earlyInstallPrompt = event as BeforeInstallPromptEvent;
  });
}

/* ------------------------------------------------------------------ */
/* Local preference storage — every access is guarded: private-mode or  */
/* disabled storage throws on `localStorage` access itself, and an      */
/* install prompt must never be the thing that breaks a page.           */
/* ------------------------------------------------------------------ */

function readPreference(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePreference(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — the suppression just becomes session-only,
    // a strictly smaller behavior change than surfacing an error.
  }
}

export function isDismissedWithinWindow(): boolean {
  const raw = readPreference(DISMISSED_UNTIL_STORAGE_KEY);
  if (!raw) return false;
  const until = Number(raw);
  return Number.isFinite(until) && Date.now() < until;
}

function rememberDismissal(): void {
  writePreference(DISMISSED_UNTIL_STORAGE_KEY, String(Date.now() + DISMISSAL_WINDOW_MS));
}

/* ------------------------------------------------------------------ */
/* Environment detection                                               */
/* ------------------------------------------------------------------ */

/**
 * Already running as an installed app → the entry is hidden (by the
 * `display-mode` CSS guard, never by removing it from the tree).
 *
 * Round 39 (2026-09-26): only `(display-mode: standalone)` is consulted.
 * `fullscreen` and `minimal-ui` were both REMOVED, because for this app they
 * can only ever be false positives:
 *
 * - The manifest declares `display: "standalone"`, so a real installed launch
 *   reports `standalone` — never `fullscreen`.
 * - A normal browser window can still match either: Chromium reports
 *   `minimal-ui` in some managed/app-style window states, and `fullscreen`
 *   matches any fullscreen mode (F11, fullscreen video, and — verified —
 *   Chrome's own device-emulation mode).
 *
 * A false positive here is not cosmetic: it suppressed the install popup AND,
 * via the old `data-standalone` attribute, removed the entries for the whole
 * session. Both are why "nothing shows on mobile" was reproducible.
 *
 * `document.referrer` starting with `android-app://` is how a Chrome Trusted
 * Web Activity reports itself; `navigator.standalone` is iOS Safari's own
 * pre-standard flag, which it needs because Safari does not implement
 * `display-mode: standalone` reliably on older versions.
 */
export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  if (document.referrer.startsWith("android-app://")) return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * iPadOS 13+ deliberately reports a macOS user agent, so the touch-point
 * count is the standard disambiguator (a real Mac reports 0).
 */
export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  return /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
}

/**
 * Auto-promotion is for phones/tablets only — a desktop visitor gets the
 * sheet only if they explicitly ask for it, per the brief's
 * "auto-promotion should prioritize mobile users". Coarse pointer is kept
 * as a second signal so an Android tablet whose UA doesn't say "Mobile"
 * still counts.
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  if (isIosDevice() || /Android|Mobile|Opera Mini|IEMobile/i.test(navigator.userAgent)) return true;
  return window.matchMedia("(pointer: coarse)").matches;
}

interface PwaInstallContextValue {
  dict: PwaInstallDictionary;
  locale: Locale;
  isSheetOpen: boolean;
  view: PwaInstallView;
  /** Opens the sheet directly in `view` — the caller decides, because an
   * explicit entry point (explicit intent) and the auto-promotion differ. */
  openSheet: (view: PwaInstallView) => void;
  /**
   * The one install action. On a real native prompt it installs immediately
   * on the patient's device; on iOS (which exposes no programmatic install)
   * it reveals the three Add-to-Home-Screen steps. If a browser offers
   * neither — no prompt held and not iOS — it says so in one short line
   * rather than inventing a per-browser tutorial.
   */
  requestInstall: () => void;
  /** Closes the sheet and suppresses auto-promotion for 7 days. */
  dismiss: () => void;
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({
  dict,
  locale,
  children,
}: {
  dict: PwaInstallDictionary;
  locale: Locale;
  children: React.ReactNode;
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [view, setView] = useState<PwaInstallView>("intro");

  useEffect(() => {
    // Standalone hiding is owned by CSS (`display-mode` in `globals.css`),
    // which the browser resolves live and which the server and client agree
    // on. The ONE case CSS cannot cover is iOS Safari, which historically
    // does not resolve `display-mode` — so the attribute below is written
    // ONLY for `navigator.standalone === true`.
    //
    // Round 39 (2026-09-26): it deliberately does NOT mirror the
    // `display-mode` media queries. Doing so made a JS effect the authority
    // for hiding on every platform, and an effect that runs once can latch a
    // wrong reading for the whole session — the exact class of bug that kept
    // removing this entry. Now no desktop/mobile browser can reach this path
    // at all; only a genuine installed iOS app can, where it is correct.
    const markIosStandalone = () => {
      if (typeof navigator !== "undefined" && (navigator as Navigator & { standalone?: boolean }).standalone === true) {
        document.body.dataset.standalone = "true";
      }
    };
    markIosStandalone();

    const handleInstalled = () => {
      earlyInstallPrompt = null;
      setIsSheetOpen(false);
    };

    const handleVisibility = () => {
      // Re-check when the tab becomes visible again, so a launch that changes
      // display mode (an install completing, a resume into the installed app)
      // is picked up instead of leaving a stale reading in place.
      if (document.visibilityState === "visible") markIosStandalone();
    };

    window.addEventListener("appinstalled", handleInstalled);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("appinstalled", handleInstalled);
      document.removeEventListener("visibilitychange", handleVisibility);
      delete document.body.dataset.standalone;
    };
  }, []);

  /**
   * Opening the sheet is explicit about which view to show: an explicit
   * entry point jumps straight to the iOS instructions when that IS the
   * install action there, while the auto-promotion opens the intro and lets
   * the CTA lead there.
   */
  const openSheet = useCallback((nextView: PwaInstallView) => {
    setView(nextView);
    setIsSheetOpen(true);
  }, []);

  const dismiss = useCallback(() => {
    rememberDismissal();
    setIsSheetOpen(false);
  }, []);

  const requestInstall = useCallback(() => {
    // The module-level slot is read at press time (not mirrored into state),
    // and cleared before awaiting: the event is single-use, so this also
    // stops a second press or a double-tap from calling `prompt()` twice.
    const deferred = earlyInstallPrompt;

    if (!deferred) {
      // No native prompt held. iOS exposes no programmatic install at all, so
      // its three real steps are the honest answer; anything else is told
      // plainly that this browser installs from its own menu — rather than a
      // long per-browser tutorial, which is noise on a desktop and was
      // explicitly rejected by the owner.
      setView(isIosDevice() ? "ios-steps" : "intro");
      setIsSheetOpen(true);
      return;
    }

    earlyInstallPrompt = null;

    void (async () => {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;

        if (choice.outcome === "accepted") {
          // The CSS `display-mode` guard hides the entry once the installed
          // app is actually running; nothing here removes it from the tree.
          setIsSheetOpen(false);
          return;
        }

        // The patient declined the browser's own dialog — treated exactly
        // like a decline here: nothing is asked again for 7 days. Only the
        // automatic promotion is suppressed; the entry itself stays visible,
        // because installing is still possible on this browser.
        rememberDismissal();
        setIsSheetOpen(false);
      } catch {
        // `prompt()` can reject (event already consumed, user gesture lost).
        // Keep the sheet open on the intro so the patient still sees the
        // offer instead of a press that appears to do nothing.
        setView("intro");
        setIsSheetOpen(true);
      }
    })();
  }, []);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      dict,
      locale,
      isSheetOpen,
      view,
      openSheet,
      requestInstall,
      dismiss,
    }),
    [dict, locale, isSheetOpen, view, openSheet, requestInstall, dismiss],
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall(): PwaInstallContextValue {
  const value = useContext(PwaInstallContext);
  if (!value) {
    throw new Error("usePwaInstall must be used inside <PwaInstallProvider>.");
  }
  return value;
}
