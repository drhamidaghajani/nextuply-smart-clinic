import type { Locale } from "./locales";

/**
 * Locale-aware date formatting via the platform `Intl` API — no date
 * library added, per Hamid's explicit instruction (see
 * `docs/adr/0004-assistant-persistence-schema.md`). `Intl` with the
 * `u-ca-persian` calendar extension already produces correct Jalali dates
 * with Persian digits and month names natively (verified:
 * `new Date("2026-07-12")` → "۲۱ تیر ۱۴۰۵"); `en`/`ar` use the ordinary
 * Gregorian calendar via their own `Intl` locales — a library would be
 * pure duplication for any of the three.
 *
 * `ar` stays Gregorian (not Hijri) per Task 4/6 of the 2026-07-13 locale
 * rollout brief ("Arabic localized Gregorian unless product decision
 * changes") — flagged here since it's a real, revisitable product call,
 * not an oversight.
 */
const INTL_LOCALE_TAG: Record<Locale, string> = {
  fa: "fa-IR-u-ca-persian",
  en: "en-US",
  ar: "ar",
};

export function formatJalaliDate(date: Date | string): string {
  return formatDateForLocale(date, "fa");
}

export function formatJalaliDateTime(date: Date | string): string {
  return formatDateTimeForLocale(date, "fa");
}

export function formatDateForLocale(date: Date | string, locale: Locale): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(INTL_LOCALE_TAG[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function formatDateTimeForLocale(date: Date | string, locale: Locale): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(INTL_LOCALE_TAG[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
