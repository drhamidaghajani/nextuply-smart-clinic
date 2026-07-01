import { NextRequest, NextResponse } from "next/server";

/**
 * Locale routing scaffold — see docs/adr/0002-fa-first-locale-scope.md.
 * `fa` is the only locale with real content right now; `en`/`ar` are
 * structurally supported so adding them later is a content change,
 * not a routing rewrite.
 */
const SUPPORTED_LOCALES = ["fa", "en", "ar"] as const;
const DEFAULT_LOCALE = "fa";

function hasLocalePrefix(pathname: string) {
  return SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (hasLocalePrefix(pathname) || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
