import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_ADMIN_COOKIE, INTERNAL_ADMIN_COOKIE_MAX_AGE_SECONDS, INTERNAL_USER_SESSION_COOKIE } from "@/core/internal-auth-cookie";
import { LEGACY_REDIRECTS } from "@/content/legacy-redirects";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/locales";

/**
 * Locale routing — see docs/adr/0002-fa-first-locale-scope.md and
 * docs/adr/0005-locale-rollout-en-ar.md. `fa` is the primary, fully-content
 * locale; `en`/`ar` now carry real chrome (header/footer) and a minimal
 * holding homepage per the 0005 rollout — still not full content parity.
 *
 * Round 2026-08-23 (final production URL restructuring, per Hamid — moving
 * from staging to dralirezasadighi.com): Persian is now served at the bare
 * root (`/`, `/knowledge/...`, `/about`, ...) with `/fa` never visible as a
 * canonical URL. The App Router page tree under `src/app/[locale]/` is
 * UNCHANGED — still keyed on a literal "fa" segment — this is achieved
 * entirely in middleware via `NextResponse.rewrite()`: a bare public path
 * is rewritten (server-internal only, invisible to the client/URL bar) to
 * `/fa<path>` so Next serves the existing `fa` page tree, while an
 * explicit visit to `/fa/...` gets a real 301 redirect to the bare
 * equivalent so `/fa` can never be indexed/bookmarked as canonical. `/en`
 * and `/ar` are unaffected — still real, visible prefixes.
 *
 * `/internal/*` is deliberately EXCLUDED from this whole change (per
 * Hamid's explicit "keep /internal out of this" instruction) — staff
 * always access it via its existing explicit `/fa/internal/...` (or
 * en/ar) URL, unindexed (`robots.ts` disallows it) and never linked from
 * any public bare path. A bare `/internal/...` visit still redirects
 * (not rewrites) to the explicit `/fa/internal/...` form, exactly as
 * before this round — see the dedicated check in `middleware()` below.
 */
function hasLocalePrefix(pathname: string) {
  return SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
}

function normalizeTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * Returns the bare-path equivalent of an explicit `/fa` or `/fa/...`
 * request, or `null` if `pathname` isn't such a request OR is specifically
 * `/fa/internal/...` (left alone entirely — see the doc-comment above).
 */
export function stripNonInternalFaPrefix(pathname: string): string | null {
  if (pathname !== "/fa" && !pathname.startsWith("/fa/")) return null;
  if (pathname.startsWith("/fa/internal")) return null;
  const stripped = pathname.slice("/fa".length);
  return stripped === "" ? "/" : stripped;
}

/**
 * WordPress → Knowledge Center migration (phase 1) — see
 * docs/migration/sadighi-wordpress-seo-audit/. Every legacy WordPress URL
 * (all of them bare, un-prefixed Persian/ASCII paths) needs to resolve to
 * its new destination in ONE redirect hop, not two: without this, a legacy
 * path would fall through to the generic bare-path -> `/{DEFAULT_LOCALE}`
 * redirect below and 404 at `/fa/<old-persian-slug>` — a route that was
 * never going to exist under the new URL structure. Both checks below run
 * BEFORE that generic redirect for exactly this reason.
 *
 * Two SEPARATE concerns, deliberately not conflated:
 * 1. `resolveHostCanonicalization` — www/http variants of the domain
 *    itself (a Search Console property, not a WordPress URL — see
 *    unmatched-gsc-priority.csv).
 * 2. `resolveLegacyPath` — old WordPress pathnames -> new pathnames,
 *    sourced from `content/legacy-redirects.ts`.
 * `middleware()` combines a hit on either (or both) into a single redirect,
 * never chaining — e.g. `http://www.dralirezasadighi.com/contact/` resolves
 * straight to `https://dralirezasadighi.com/fa/contact` in one hop.
 */
export const CANONICAL_HOST = "dralirezasadighi.com";
/**
 * Deliberately an allowlist of KNOWN variants of this one production
 * domain, not a blanket "hostname !== canonical" rule — the latter would
 * also rewrite `localhost` (local dev) and any preview/staging domain to
 * the production apex, which is not what this is for. Only these two
 * hostnames are ever touched.
 */
const NON_CANONICAL_KNOWN_HOSTS = new Set([CANONICAL_HOST, `www.${CANONICAL_HOST}`]);

/**
 * Takes plain `{ hostname, protocol }` rather than a `NextRequest` so it's
 * a pure function `scripts/verify-legacy-redirects.ts` (and any future
 * unit test) can call directly without constructing a Request/NextRequest.
 *
 * Callers MUST derive `hostname`/`protocol` from the `Host` and
 * `X-Forwarded-Proto` headers (see `hostAndProtocolFromRequest` below), NOT
 * from `request.nextUrl.hostname`/`.protocol` — verified directly against a
 * production build that those reflect the Node process's own bind
 * address/scheme (e.g. "localhost"/"http:"), not the client-facing
 * Host/scheme, at least in this self-hosted (non-Vercel-edge) deployment
 * shape (CLAUDE.md: "PostgreSQL + Prisma on a dedicated Iranian VPS"). A
 * `nextUrl`-based check silently never fired for any real host variant.
 */
export function resolveHostCanonicalization({ hostname, protocol }: { hostname: string; protocol: string }): boolean {
  if (!NON_CANONICAL_KNOWN_HOSTS.has(hostname)) return false;
  return hostname !== CANONICAL_HOST || protocol !== "https:";
}

/**
 * `Host` can carry a port (`localhost:3999`); `X-Forwarded-Proto` is what
 * a reverse proxy (nginx, or any standard setup in front of the VPS) sets
 * to the client's real scheme when it terminates TLS and proxies to Next
 * over plain HTTP internally — falls back to `nextUrl.protocol` only when
 * that header is absent (e.g. Next is the direct, unproxied edge itself).
 */
function hostAndProtocolFromRequest(request: NextRequest): { hostname: string; protocol: string } {
  const hostHeader = request.headers.get("host") ?? request.nextUrl.hostname;
  const hostname = hostHeader.split(":")[0];
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ? `${forwardedProto.split(",")[0].trim()}:` : request.nextUrl.protocol;
  return { hostname, protocol };
}

/**
 * `request.nextUrl.pathname` is percent-encoded (verified directly:
 * `/ایمپلنت.../` arrives as `/%D8%A7%DB%8C...`), but `LEGACY_REDIRECTS`'s
 * keys are decoded Persian text (matching how they were extracted from the
 * WordPress export and how they read in the CSV/markdown audit trail) —
 * without decoding here first, every Persian legacy path silently fails to
 * match. `decodeURIComponent` can throw on a malformed sequence; fall back
 * to the raw pathname rather than letting middleware itself 500.
 */
export function normalizeLegacyPath(pathname: string): string {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // malformed percent-encoding — fall through with the raw pathname, which simply won't match any map key
  }
  return decoded.length > 1 && decoded.endsWith("/") ? decoded.slice(0, -1) : decoded;
}

export function resolveLegacyPath(pathname: string): string | null {
  const normalized = normalizeLegacyPath(pathname);
  const target = LEGACY_REDIRECTS[normalized] ?? null;
  // P0 production incident (2026-08-26): a bad LEGACY_REDIRECTS row once
  // read `"/contact": "/contact"` — an old WordPress path that happened
  // to normalize to the SAME string as its own (correct) new-site target.
  // This function had no check for "the target IS the request," and the
  // caller below redirects unconditionally whenever this returns
  // non-null, so that one entry caused an infinite self-redirect on live
  // production (see docs/migration/sadighi-wordpress-seo-audit/
  // production-redirect-audit.csv). The generator now filters this out at
  // the data source too (generate_legacy_redirects_ts.py), but the
  // invariant "never redirect a request to itself" belongs here, at the
  // one place every caller goes through — not only in the data that feeds
  // it, which could regain this bug from a future source we don't control
  // as tightly (e.g. a new Rank Math export).
  if (target !== null && normalizeLegacyPath(target) === normalized) {
    return null;
  }
  return target;
}

/**
 * `/{locale}/internal/...` route guard — see
 * `src/app/[locale]/internal/assistant-leads/page.tsx`'s own doc-comment
 * for the full picture. This is a lightweight staging-appropriate gate,
 * NOT production-grade auth: a single shared bearer token, no accounts,
 * no audit log, no rate limiting, plain string comparison (not
 * constant-time). Real staff auth is still an open item
 * (PROJECT_UNDERSTANDING.md §13) — this exists only so the route isn't
 * wide open to anyone who finds the URL in the meantime.
 *
 * Two ways in, both set the SAME httpOnly cookie (name/options exported
 * below so `server/admin-actions.ts`'s login/logout actions use the
 * exact same cookie, not a second hand-copied definition that could
 * drift):
 * 1. `/fa/internal/login`'s access-code form (round 2026-07-15, Clinic
 *    Operations Dashboard Lite) — the intended secretary-facing path.
 * 2. The original `?token=<INTERNAL_ADMIN_TOKEN>` query-param flow, kept
 *    for backward compatibility ("existing token mechanism if already
 *    used" per Hamid's brief) — still cleans the URL after setting the
 *    cookie so the token never lingers in browser history/referrer
 *    headers.
 *
 * Round 2026-07-15 (per Hamid — secretary UX): an unauthenticated visit
 * to any OTHER `/internal/*` route now redirects to `/{locale}/internal/
 * login` instead of a flat 404. Flagging the trade-off explicitly rather
 * than silently changing it: the previous 404 was a deliberate "don't
 * even confirm this route exists" choice; redirecting to a login page
 * does reveal that an internal system exists. Accepted here because (a)
 * this gate was already documented as "staging-appropriate, not
 * production-grade" — the token is the real protection, not route
 * secrecy — and (b) a non-technical secretary needs a working, guided
 * entry point, which a bare 404 can't provide. `/internal/login` itself
 * is exempt from this redirect (obviously — it has to be reachable to
 * log in), and an ALREADY-authenticated visit to `/internal/login`
 * redirects forward to the dashboard instead of showing the form again.
 * If `INTERNAL_ADMIN_TOKEN` is unset in production, every `/internal/*`
 * route — including `/internal/login` — still 404s, unchanged from
 * before: there is no code to check a login form against, so "internal
 * access must be blocked" applies to the login page too.
 */
const INTERNAL_ROUTE_PATTERN = /^\/[a-z]{2}\/internal(\/|$)/;
const INTERNAL_LOGIN_ROUTE_PATTERN = /^\/[a-z]{2}\/internal\/login(\/|$)/;

function loginPathFor(pathname: string): string {
  const locale = pathname.split("/")[1];
  return `/${locale}/internal/login`;
}

function dashboardPathFor(pathname: string): string {
  const locale = pathname.split("/")[1];
  return `/${locale}/internal/dashboard`;
}

function guardInternalRoute(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!INTERNAL_ROUTE_PATTERN.test(pathname)) {
    return null;
  }

  const requiredToken = process.env.INTERNAL_ADMIN_TOKEN;
  const isLoginRoute = INTERNAL_LOGIN_ROUTE_PATTERN.test(pathname);

  if (!requiredToken) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(null, { status: 404 });
    }
    console.warn(
      "[internal-route-guard] INTERNAL_ADMIN_TOKEN is not set — /internal routes are unprotected in this (non-production) environment."
    );
    return null;
  }

  const cookieToken = request.cookies.get(INTERNAL_ADMIN_COOKIE)?.value;
  // Round 2026-07-24 (Internal Operations Lite, Part B) — a real
  // `InternalUser` login sets a DIFFERENT cookie (`INTERNAL_USER_SESSION_COOKIE`,
  // an opaque `InternalUserSession` id, not a value this Edge-runtime
  // guard can compare against anything meaningful). This layer only
  // checks that the cookie is PRESENT — a deliberate, documented two-tier
  // trade-off, not an oversight: Edge middleware here has no Postgres
  // access to actually verify the session (no driver adapter added for
  // this "lite" pass). The REAL check — does this session exist, is it
  // unexpired, is the user still active — happens server-side on every
  // page via `internal-auth.ts`'s `requireInternalActor`, which redirects
  // to login itself if a stale/expired cookie slipped through here.
  const hasUserSessionCookie = Boolean(request.cookies.get(INTERNAL_USER_SESSION_COOKIE)?.value);

  if (cookieToken === requiredToken || hasUserSessionCookie) {
    // Already authenticated — send them forward instead of re-showing the login form.
    if (isLoginRoute) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = dashboardPathFor(pathname);
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
    return null;
  }

  const queryToken = request.nextUrl.searchParams.get("token");
  if (queryToken === requiredToken) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("token");
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(INTERNAL_ADMIN_COOKIE, requiredToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: INTERNAL_ADMIN_COOKIE_MAX_AGE_SECONDS,
    });
    return response;
  }

  // Not authenticated at all — the login page itself must stay reachable; everything else redirects there.
  if (isLoginRoute) {
    return null;
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = loginPathFor(pathname);
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsHostCanonicalization = resolveHostCanonicalization(hostAndProtocolFromRequest(request));
  const legacyTarget = resolveLegacyPath(pathname);

  if (needsHostCanonicalization || legacyTarget) {
    // Collapse to a single hop regardless of shape: a legacy path already
    // carries its full root-Persian destination (e.g. /knowledge/...,
    // never /fa/knowledge/...); an explicit /fa/... request reached via a
    // host variant collapses straight to its bare equivalent (not to
    // /fa/... on the canonical host, which would otherwise need a SECOND
    // 301 once the "/fa/* -> bare" rule below sees the follow-up request);
    // any other bare path is already the correct canonical form as-is —
    // it needs no prefix here at all, unlike before this round, since
    // bare paths are now served via a REWRITE (see below), not a redirect.
    const rawEffectivePathname = legacyTarget ?? stripNonInternalFaPrefix(pathname) ?? pathname;
    const effectivePathname = normalizeTrailingSlash(rawEffectivePathname);

    // A plain `URL`, NOT `request.nextUrl.clone()` — verified directly
    // against a production build that `NextURL` re-appends a trailing
    // slash on `.toString()`/the redirect's Location header whenever the
    // ORIGINAL request had one, regardless of what `.pathname` is set to
    // afterward. A fresh `URL` has no such memory of the original
    // request's shape.
    const url = new URL(`${effectivePathname}${request.nextUrl.search}`, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(url, 301);
  }

  // Explicit /fa/... visit (not a legacy path, not a host-canonicalization
  // case, e.g. someone's old bookmark or a stray internal link) — 301 to
  // the bare equivalent, single hop, so /fa is never left reachable as its
  // own canonical URL. /fa/internal/... is exempt (returns null) and falls
  // through to the ordinary hasLocalePrefix passthrough below, unchanged.
  const faStripped = stripNonInternalFaPrefix(pathname);
  if (faStripped) {
    const url = new URL(`${normalizeTrailingSlash(faStripped)}${request.nextUrl.search}`, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(url, 301);
  }

  if (hasLocalePrefix(pathname)) {
    // /en/..., /ar/..., and /fa/internal/... (the only /fa path that
    // reaches this branch — see stripNonInternalFaPrefix above).
    return guardInternalRoute(request) ?? NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (pathname === "/internal" || pathname.startsWith("/internal/")) {
    // /internal/* is explicitly OUT of this round's URL restructuring —
    // preserved exactly as before: redirect to the explicit /fa/internal/...
    // form (never rewritten to look bare), since staff tooling isn't part
    // of the public URL scheme and changing it has no SEO upside.
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Every other bare path is a genuine public Persian URL under the final
  // production structure (/, /knowledge/..., /about, ...). Rewrite —
  // NEVER redirect — to the existing `fa` page tree: the client's URL bar
  // keeps the bare path exactly as requested; only Next's internal routing
  // sees "/fa<path>". This is what makes `/fa` invisible as a canonical
  // URL without moving a single page file.
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
