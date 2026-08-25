import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from "./locales";

/**
 * SINGLE SOURCE OF TRUTH for building a locale-aware internal href — added
 * 2026-08-23 for the final production URL restructuring (Persian at root,
 * `/en`/`/ar` prefixed). Every one of the ~103 places across the app that
 * used to interpolate `` `/${locale}/...` `` directly must go through this
 * function instead: that pattern always produced `/fa/...` for Persian,
 * which is exactly the visible-`/fa` canonical the restructuring removes.
 *
 * `path` should start with "/" (e.g. "/about", "/knowledge/slug") or be
 * omitted/empty for the locale's homepage.
 */
export function localeHref(locale: Locale, path = ""): string {
  const normalizedPath = path === "" || path === "/" ? "" : path;
  if (locale === DEFAULT_LOCALE) {
    return normalizedPath || "/";
  }
  return `/${locale}${normalizedPath}`;
}

/**
 * The inverse of `localeHref`'s prefixing — given a pathname as
 * `usePathname()` reports it, returns the locale-agnostic path underneath
 * (e.g. "/en/services/x" -> "/services/x"). Needed anywhere that must
 * reconstruct "this same page, in a different language" from the CURRENT
 * url — today, only `LanguageSwitcher`.
 *
 * Strips a leading `fa` segment too, not just `en`/`ar` — verified
 * directly against a production build that `usePathname()` on a bare
 * Persian route (e.g. viewing `/about`) reports `/fa/about`, the
 * REWRITTEN internal path from `middleware.ts`, not the bare URL the
 * address bar shows. Treating `fa` as "never a prefix to strip" (this
 * function's first version) produced `href="/fa/about"` for the Persian
 * button and doubly-prefixed `href="/en/fa/about"` for English — a real,
 * visible bug caught by curling the rendered HTML, not by inspection.
 * Stripping is safe either way: if `segments[0]` isn't a locale at all
 * (a bare path with no rewrite-visible prefix, should that ever occur),
 * the `isSupportedLocale` check simply fails and nothing is removed.
 */
export function pathWithoutLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isSupportedLocale(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

/** The locale a pathname (as `usePathname()` reports it, which may be the rewritten `/fa/...` form — see `pathWithoutLocalePrefix`) is currently showing. */
export function localeFromPathname(pathname: string): Locale {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return firstSegment && isSupportedLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE;
}
