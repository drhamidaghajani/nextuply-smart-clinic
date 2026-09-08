"use client";

import { useEffect } from "react";

/**
 * Round 2026-09-08 (minimal PWA support, per Hamid) — registers
 * `public/sw.js`. Renders nothing; a bare `useEffect` with no dependency
 * on anything else, so it can't block or delay rendering of the page
 * around it.
 *
 * Production-only and fully fail-silent by design:
 * - `NODE_ENV !== "production"` bails immediately — a dev-mode service
 *   worker is a well-known source of "why am I seeing stale content"
 *   confusion during local work, and this project's own dev-server
 *   history already has enough of that class of problem without adding
 *   a cache layer to it.
 * - `"serviceWorker" in navigator` guards browsers/contexts without the
 *   API at all (older Safari, some in-app webviews) — the site works
 *   identically either way, this is a pure progressive enhancement.
 * - The `.catch(() => {})` on `register()` swallows any registration
 *   failure (scope conflicts, a network hiccup on `/sw.js` itself) —
 *   nothing here should ever surface an error to the patient-facing UI.
 *
 * Mounted only from `SiteChrome`'s public (non-`/internal/*`) branch —
 * see that component's own doc-comment. The service worker's OWN fetch
 * handler (`public/sw.js`) independently refuses to touch `/internal/*`
 * regardless of where it was registered from (a service worker's scope
 * covers the whole origin once active, not just the page that
 * registered it) — this placement is a second, belt-and-suspenders
 * layer, not the only thing keeping the internal dashboard uncached.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Silent — see doc-comment above.
    });
  }, []);

  return null;
}
