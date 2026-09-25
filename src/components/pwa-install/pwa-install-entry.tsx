"use client";

import { usePwaInstall } from "./pwa-install-provider";

/**
 * Round 2026-09-25 (PWA install experience, per Hamid's brief) — the
 * persistent, reusable install entry. Rendered inside the footer's راهنما
 * column, the one existing patient-facing menu that already lists
 * site-level actions, so installation is reachable any time without
 * touching the header or reworking navigation (the brief explicitly rules
 * that out).
 *
 * Two deliberate behaviors:
 * - Renders NOTHING when there is no working install path on this browser
 *   (unsupported browser, no held `beforeinstallprompt`, already
 *   installed). A visible button that cannot install anything is worse
 *   than no button.
 * - While the app is being promoted/served on the server the entry is
 *   absent (availability is only knowable on the client), so it appears
 *   one hydration tick later. It is appended to the END of the footer's
 *   link list, which grows the footer downward instead of moving anything
 *   above it.
 *
 * The label is the same dictionary string as the sheet's primary CTA — the
 * same action, so it can never drift out of sync.
 */
export function PwaInstallEntry() {
  const { dict, path, openSheet } = usePwaInstall();

  if (!path) return null;

  return (
    <li>
      <button
        type="button"
        // On iOS the instructions ARE the install action, so the entry goes
        // straight there; elsewhere the intro gives the CTA its context.
        onClick={() => openSheet(path === "ios" ? "ios-steps" : "intro")}
        className="text-sm leading-6 text-warm-white/60 transition-colors duration-200 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {dict.installCta}
      </button>
    </li>
  );
}
