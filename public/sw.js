/**
 * Minimal service worker — Round 2026-09-08 (minimal PWA support, per
 * Hamid). Hand-written, no build step, no Workbox — this project's
 * standing "avoid unnecessary dependencies" rule, and the whole scope
 * here is small enough not to need one.
 *
 * DESIGN: an ALLOWLIST, not a denylist. The `fetch` handler only ever
 * calls `event.respondWith(...)` for two narrow, well-understood cases
 * (content-hashed static assets, and top-level page navigations as a
 * network-first-with-offline-fallback safety net). Every other request —
 * `/internal/*`, Server Action POSTs, RSC payload fetches Next's own
 * router makes during client-side transitions, API routes, images not on
 * the explicit safe list — is left completely untouched (the handler
 * just returns without calling `respondWith`, so the browser handles it
 * exactly as if this service worker didn't exist). This is deliberately
 * safer than trying to enumerate and exclude every unsafe pattern:
 * anything NOT explicitly recognized as safe is never intercepted, so a
 * gap in the exclusion list can't silently start caching something it
 * shouldn't (authenticated dashboard data, a booking Server Action, a
 * fresh RSC payload).
 *
 * Nothing here touches booking/assistant logic, the internal dashboard,
 * or routing — it only ever observes requests already being made.
 */

const CACHE_VERSION = "sadighi-static-v1";
const OFFLINE_URL = "/offline.html";

// Content-hashed or otherwise stable — safe to cache-first indefinitely.
// Deliberately NOT including /media/ here: those are real clinic photos/
// video that can be swapped by a future content update, and blanket-
// caching them risks serving a stale/replaced asset — exactly the "stale
// clinical data" risk this task explicitly asked to avoid.
const SAFE_STATIC_PREFIXES = ["/_next/static/", "/icons/", "/fonts/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .catch(() => {
        // Offline page failed to pre-cache (e.g. first install with no
        // network) — non-fatal, just means no offline fallback yet.
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isInternalPath(pathname) {
  // Matches /internal/..., and the locale-prefixed /en/internal/...,
  // /ar/internal/... forms — never /fa/internal (Persian never shows a
  // /fa prefix, see middleware.ts) but the pattern is harmless either way.
  return /^\/(?:[a-z]{2}\/)?internal(?:\/|$)/.test(pathname);
}

function isSafeStaticAsset(pathname) {
  return SAFE_STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever consider same-origin GET requests. Server Actions and any
  // other mutation are POST — already excluded here, on top of never
  // matching either allowlisted case below.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Internal/admin area — always live, never cached, never served from
  // this worker's cache. Checked before anything else.
  if (isInternalPath(url.pathname)) return;

  // Case 1: safe static assets — cache-first, falling back to network
  // and populating the cache on first fetch.
  if (isSafeStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, responseClone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Case 2: top-level page navigations — network-first. This project's
  // content (leads, availability, service pages) changes too often to
  // ever serve a cached page as the primary response, so the cache is
  // used ONLY as an offline safety net when the network request fails
  // outright, never as a stale-but-working substitute.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Everything else (RSC payload fetches for client-side <Link>
  // transitions, API routes, non-whitelisted images, etc.) — untouched,
  // no caching, no interception.
});
