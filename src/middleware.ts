import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_ADMIN_COOKIE, INTERNAL_ADMIN_COOKIE_MAX_AGE_SECONDS } from "@/core/internal-auth-cookie";

/**
 * Locale routing scaffold — see docs/adr/0002-fa-first-locale-scope.md and
 * docs/adr/0005-locale-rollout-en-ar.md. `fa` is the primary, fully-content
 * locale; `en`/`ar` now carry real chrome (header/footer) and a minimal
 * holding homepage per the 0005 rollout — still not full content parity.
 */
const SUPPORTED_LOCALES = ["fa", "en", "ar"] as const;
const DEFAULT_LOCALE = "fa";

function hasLocalePrefix(pathname: string) {
  return SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
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
  if (cookieToken === requiredToken) {
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

  if (hasLocalePrefix(pathname)) {
    return guardInternalRoute(request) ?? NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
