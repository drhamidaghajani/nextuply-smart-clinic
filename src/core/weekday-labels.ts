import type { Locale } from "@/i18n/locales";

/**
 * `DoctorAvailabilitySlot.weekday` uses JS `Date.getDay()` convention
 * (0=Sunday..6=Saturday) as STORAGE — these are the DISPLAY labels for
 * each locale, in storage-index order (index 0 = Sunday, matching the
 * stored integer directly, so `WEEKDAY_LABELS.fa[slot.weekday]` always
 * works without a lookup table). Shared by `/internal/availability`,
 * `/internal/dashboard`, and `availability-scheduler.ts` — previously
 * each of the first two had their own local copy of the fa-only version;
 * this is the single source now that a third (locale-aware) consumer
 * exists.
 */
export const WEEKDAY_LABELS: Record<Locale, readonly string[]> = {
  fa: ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};

/**
 * Iranian week order (Saturday first) for display grids — storage stays
 * JS `Date.getDay()` convention. Typed as plain `readonly number[]` (not
 * `as const`'s narrow literal-union tuple) since it's compared against
 * Prisma's `weekday: Int` column, which TypeScript sees as a plain
 * `number`, not a `0|1|2|3|4|5|6` literal union.
 */
export const WEEKDAY_DISPLAY_ORDER: readonly number[] = [6, 0, 1, 2, 3, 4, 5];
