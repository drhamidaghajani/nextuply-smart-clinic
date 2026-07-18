import { formatDateForLocale, formatDateTimeForLocale } from "./format-jalali-date";

/**
 * Round 2026-07-25 (Internal Operations Lite polish, per Hamid — critical
 * staff-facing bug: Gregorian dates/Latin digits showing up throughout
 * `/internal/*`): the ONE place every internal-admin page formats a
 * number, date, time, phone, or capacity pair for display. The internal
 * dashboard is Persian-only by design (see every internal page's own
 * doc-comment history — staff copy was never locale-switched), so these
 * are deliberately NOT locale-parametrized like `format-jalali-date.ts`
 * (which the PUBLIC, multi-locale site still uses as-is, unchanged) —
 * every function here always produces Persian-digit, Jalali-calendar
 * output, because that's the only output `/internal/*` ever needs.
 *
 * Delegates the actual Jalali calendar math to `format-jalali-date.ts`'s
 * `Intl`-based formatters (`formatDateForLocale`/`formatDateTimeForLocale`
 * called with `"fa"`) rather than re-implementing it — this file only
 * adds what that one doesn't already cover: digit-only conversion, a
 * time-only formatter, a weekday+date combo, phone formatting, and
 * capacity/count pairs.
 */

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;

/** Converts every ASCII digit 0-9 in `value` to its Persian digit — the one primitive every other formatter below builds on. Non-digit characters (separators, `/`, `:`, `+`) pass through unchanged. */
export function formatPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]!);
}

/** Jalali date, no weekday — e.g. "۳ مرداد ۱۴۰۵". Delegates to `format-jalali-date.ts` (already Persian-digit by construction via `Intl`'s `fa-IR-u-ca-persian` locale). */
export function formatPersianDate(date: Date | string): string {
  return formatDateForLocale(date, "fa");
}

/** Jalali date + time — e.g. "۳ مرداد ۱۴۰۵، ۰۹:۳۰". */
export function formatPersianDateTime(date: Date | string): string {
  return formatDateTimeForLocale(date, "fa");
}

/**
 * Weekday + Jalali date — e.g. "شنبه، ۳ مرداد ۱۴۰۵", the exact format
 * used for appointment day labels throughout `/internal/*`.
 */
export function formatPersianWeekdayDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

/** Time only, Persian digits — e.g. "۰۹:۳۰". Accepts a `Date`/ISO string, OR a plain `"HH:mm"` string (`DoctorAvailabilitySlot.startTime`/`endTime` are stored as plain strings, not `Date`s — see that model's doc-comment). */
export function formatPersianTime(dateOrTime: Date | string): string {
  if (typeof dateOrTime === "string" && /^\d{1,2}:\d{2}$/.test(dateOrTime)) {
    return formatPersianDigits(dateOrTime);
  }
  const value = typeof dateOrTime === "string" ? new Date(dateOrTime) : dateOrTime;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { hour: "2-digit", minute: "2-digit" }).format(value);
}

/** A "HH:mm تا HH:mm" time-range label with Persian digits — e.g. "۰۹:۰۰ تا ۱۳:۰۰". */
export function formatPersianTimeRange(startTime: string, endTime: string): string {
  return `${formatPersianTime(startTime)} تا ${formatPersianTime(endTime)}`;
}

/** Digits-only Persian rendering of a mobile/phone number — e.g. "۰۹۱۲۰۰۰۰۰۰۰". Empty/missing input returns the given fallback (default "شماره ثبت نشده"), never an empty string that could be mistaken for a real (blank) value. */
export function formatPersianPhone(phone: string | null | undefined, fallback = "شماره ثبت نشده"): string {
  if (!phone || !phone.trim()) return fallback;
  return formatPersianDigits(phone.trim());
}

/** "used/total" with Persian digits — e.g. `formatPersianCapacity(2, 10)` → "۲/۱۰". */
export function formatPersianCapacity(used: number, total: number): string {
  return `${formatPersianDigits(used)}/${formatPersianDigits(total)}`;
}

/** `"{count} {label}"` with a Persian-digit count — e.g. `formatPersianCount(3, "سؤال از دستیار")` → "۳ سؤال از دستیار". */
export function formatPersianCount(count: number, label: string): string {
  return `${formatPersianDigits(count)} ${label}`;
}
