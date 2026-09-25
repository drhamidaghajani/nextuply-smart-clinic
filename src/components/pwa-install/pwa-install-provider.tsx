"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

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
 * Three install paths exist, and only two of them are real:
 * - `"native"` — the browser gave us a `beforeinstallprompt` event we are
 *   holding (Android/Chromium, and desktop Chromium/Edge). We can install
 *   for real, but only after an explicit CTA press.
 * - `"ios"` — iOS/iPadOS Safari exposes no programmatic install at all, so
 *   the "path" here is *instructions* (Share → Add to Home Screen → Add).
 *   Nothing is ever claimed to be automatic.
 * - `null` — no working path (unsupported browser, an already-consumed
 *   prompt, or the app is already installed). No CTA is rendered at all in
 *   this state: a button that can't install is worse than no button.
 *
 * Everything is fail-silent and local: no network, no dependency, no
 * analytics, and no interaction with the Smart Clinic Assistant or booking.
 */

/**
 * These two keys are the only things this feature ever writes — both purely
 * local UI preferences, never patient data.
 */
const DISMISSED_UNTIL_STORAGE_KEY = "sadighi.pwa-install.dismissed-until";
const INSTALLED_STORAGE_KEY = "sadighi.pwa-install.installed";
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

export type PwaInstallPath = "native" | "ios";
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

function rememberInstalled(): void {
  writePreference(INSTALLED_STORAGE_KEY, "1");
}

/* ------------------------------------------------------------------ */
/* Environment detection                                               */
/* ------------------------------------------------------------------ */

/**
 * Already running as an installed app → never promote installation again.
 * `display-mode` covers the standard case; `navigator.standalone` is iOS
 * Safari's own pre-standard flag (Safari does not implement `display-mode:
 * standalone` reliably on older versions); the `android-app://` referrer is
 * how a Chrome Trusted Web Activity reports itself.
 */
export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  if (document.referrer.startsWith("android-app://")) return true;
  return ["(display-mode: standalone)", "(display-mode: fullscreen)", "(display-mode: minimal-ui)"].some(
    (query) => window.matchMedia(query).matches,
  );
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
  /** The working install path right now, or `null` when there isn't one. */
  path: PwaInstallPath | null;
  isInstalled: boolean;
  isSheetOpen: boolean;
  view: PwaInstallView;
  /** Opens the sheet directly in `view` — the caller decides, because the
   * footer entry (explicit intent) and the auto-promotion differ on iOS. */
  openSheet: (view: PwaInstallView) => void;
  /** The one install action: native prompt on Chromium, instructions on iOS. */
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
  const [path, setPath] = useState<PwaInstallPath | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [view, setView] = useState<PwaInstallView>("intro");
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isRunningStandalone() || readPreference(INSTALLED_STORAGE_KEY) === "1") {
      setIsInstalled(true);
      return;
    }

    if (isIosDevice()) {
      setPath("ios");
    } else if (earlyInstallPrompt) {
      // Fired before hydration — see the module-scope note above.
      deferredPromptRef.current = earlyInstallPrompt;
      setPath("native");
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      // Suppressing the browser's own mini-infobar is what makes the custom
      // sheet the only place installation is offered — and, per the brief,
      // the held event is only ever replayed from an explicit CTA press.
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setPath("native");
    };

    const handleInstalled = () => {
      deferredPromptRef.current = null;
      setPath(null);
      rememberInstalled();
      setIsInstalled(true);
      setIsSheetOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  /**
   * Opening the sheet is explicit about which view to show: an explicit
   * entry point on iOS jumps straight to the instructions (that IS the
   * install action there), while the auto-promotion opens the intro and
   * lets the CTA lead into the steps.
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
    const deferred = deferredPromptRef.current;

    if (!deferred) {
      // iOS has no programmatic install — show the manual steps instead.
      if (isIosDevice()) {
        setView("ios-steps");
        setIsSheetOpen(true);
      }
      return;
    }

    // The held event is single-use: clear it before awaiting so a second
    // press (or a double-tap) can't call `prompt()` twice.
    deferredPromptRef.current = null;

    void (async () => {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;

        if (choice.outcome === "accepted") {
          rememberInstalled();
          setIsInstalled(true);
          setIsSheetOpen(false);
          return;
        }

        // The patient declined the browser's own dialog — treated exactly
        // like a decline here: nothing is asked again for 7 days. The
        // footer entry disappears with the `path` reset below, which is
        // honest (the browser is no longer offering an install) rather
        // than a CTA that would do nothing.
        rememberDismissal();
        setIsSheetOpen(false);
      } catch {
        // `prompt()` can reject (event already consumed, user gesture
        // lost). Nothing to recover — fall back to "not installable now".
        setIsSheetOpen(false);
      } finally {
        setPath(null);
      }
    })();
  }, []);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      dict,
      locale,
      path: isInstalled ? null : path,
      isInstalled,
      isSheetOpen,
      view,
      openSheet,
      requestInstall,
      dismiss,
    }),
    [dict, locale, path, isInstalled, isSheetOpen, view, openSheet, requestInstall, dismiss],
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
