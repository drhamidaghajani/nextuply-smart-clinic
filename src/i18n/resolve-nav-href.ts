import { localeHref } from "./locale-href";
import type { Locale } from "./locales";

/**
 * Header nav, mobile menu, and the footer's "guide" column all carry
 * hash-only hrefs (`#services`, `#before-after`, `#why-dr-sadighi`, …)
 * pointing at homepage section ids. Those work fine ON the homepage
 * (plain in-page anchor scroll) but are silently broken everywhere else
 * — `href="#services"` on `/about` just appends the hash to `/about`,
 * which has no such id, so nothing happens. Prefixing with the current
 * locale's homepage path fixes both cases: on the homepage it's a
 * same-document anchor scroll as before, off it it's a real navigation
 * to the homepage that lands on the right section.
 *
 * Round 2026-08-23 (final production URL restructuring): delegates to
 * `localeHref` instead of hand-building `` `/${locale}${href}` `` — that
 * always produced `/fa#services` for Persian, a visible `/fa` this
 * restructuring removes. Persian now correctly gets a bare `#services`.
 */
export function resolveNavHref(href: string, locale: Locale): string {
  return href.startsWith("#") ? `${localeHref(locale)}${href}` : href;
}
