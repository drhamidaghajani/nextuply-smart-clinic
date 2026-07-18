import { isDatabaseConfigured, prisma } from "@/infrastructure/db/client";
import { getDefaultClinicId } from "@/core/tenancy/clinic";
import { formatDateForLocale } from "@/i18n/format-jalali-date";
import { formatPersianTimeRange } from "@/i18n/persian-format";
import type { Locale } from "@/i18n/locales";
import { WEEKDAY_LABELS } from "@/core/weekday-labels";

/**
 * The availability-based appointment-suggestion service (round 2026-07-15,
 * per Hamid's "the assistant must not invent appointment times" brief).
 * Plain module, not itself `"use server"` — called from the thin Server
 * Action wrapper in `get-available-appointment-options.ts`, same
 * repository-vs-action split as `lead-repository.ts`/`submit-booking-
 * request.ts`.
 *
 * Because `DoctorAvailabilitySlot` is a recurring WEEKLY pattern (see its
 * own doc-comment in `prisma/schema.prisma`), this expands each active
 * slot forward across a rolling window (default 14 days) into concrete
 * calendar-date occurrences, then filters out any occurrence that's
 * already at capacity. It NEVER returns:
 * - an inactive slot (`isActive: false` is excluded at the query level)
 * - a full occurrence (`remainingCapacity <= 0` is filtered before
 *   returning, not left for the caller to check)
 * - anything if `DATABASE_URL` isn't configured (returns `[]` — the
 *   assistant's own fallback-to-manual-entry logic handles an empty
 *   result exactly the same way it handles "no slots configured at all")
 *
 * It also never writes anything — this is a read/suggestion service only.
 * The actual booking write (which slot, which date) happens in
 * `submit-booking-request.ts` at the moment the patient submits, using
 * whatever option they picked here — a race is possible (two patients
 * picking the last remaining seat in the same window) but is explicitly
 * out of scope for "lite": the secretary reviews every request manually
 * before confirming (see `application/types.ts`'s `BookingAppointmentStatus`
 * doc-comment), which is the real backstop against overbooking, not
 * anything automated here.
 */

const ACTIVE_BOOKING_STATUSES = ["requested", "contacted", "confirmed"] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface AvailableAppointmentOption {
  slotId: string;
  /** ISO date-only, "YYYY-MM-DD". */
  date: string;
  /** 0 (Sunday) .. 6 (Saturday) — matches `DoctorAvailabilitySlot.weekday`. */
  weekday: number;
  startTime: string;
  endTime: string;
  remainingCapacity: number;
  labelFa: string;
  labelEn: string;
  labelAr: string;
}

function todayUtcMidnight(): Date {
  const now = new Date();
  // Local-time getters deliberately here (not UTC) — "today" means the
  // clinic's own local calendar day (the server's configured timezone),
  // not UTC's. Every later step in this module uses pure UTC arithmetic
  // on the resulting Date so DST/timezone can't cause an off-by-one drift
  // across the loop below.
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Round 2026-07-26 (public-assistant Persian digit fix, per Hamid — bug:
 * the Persian confirmation card showed "09:00–13:00" instead of "۰۹:۰۰ تا
 * ۱۳:۰۰"): `startTime`/`endTime` are stored as plain `"HH:mm"` strings
 * (see `DoctorAvailabilitySlot`'s own doc-comment) and were appended here
 * RAW regardless of locale — `formatDateForLocale` above already
 * Jalali/Persian-digit-formats the date portion, but nothing touched the
 * time portion. `fa` now goes through `persian-format.ts`'s
 * `formatPersianTimeRange` (Persian digits + "تا", not an en-dash) — the
 * one centralized formatter for exactly this, reused here rather than
 * re-implemented. `en`/`ar` are unchanged (still Western-digit `HH:mm`
 * with an en-dash) — this fix is scoped to the reported Persian-UI bug,
 * not a locale-formatting overhaul.
 */
function buildLabel(date: Date, startTime: string, endTime: string, locale: Locale): string {
  const weekdayLabel = WEEKDAY_LABELS[locale][date.getUTCDay()];
  const dateLabel = formatDateForLocale(date, locale);
  const separator = locale === "en" ? "," : "،";
  const timeRange = locale === "fa" ? formatPersianTimeRange(startTime, endTime) : `${startTime}–${endTime}`;
  return `${weekdayLabel} ${dateLabel}${separator} ${timeRange}`;
}

export async function getAvailableAppointmentOptions({
  daysAhead = 14,
  maxOptions = 8,
}: { daysAhead?: number; maxOptions?: number } = {}): Promise<AvailableAppointmentOption[]> {
  if (!isDatabaseConfigured()) return [];

  const clinicId = getDefaultClinicId();

  let activeSlots: Awaited<ReturnType<typeof prisma.doctorAvailabilitySlot.findMany>>;
  try {
    activeSlots = await prisma.doctorAvailabilitySlot.findMany({
      where: { clinicId, isActive: true },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
  } catch (error) {
    console.error("[availability-scheduler:load-slots-failed]", error);
    return [];
  }
  if (activeSlots.length === 0) return [];

  const today = todayUtcMidnight();
  const rangeEnd = addUtcDays(today, daysAhead);

  let existingBookings: { selectedSlotId: string | null; appointmentDate: Date | null }[];
  try {
    existingBookings = await prisma.bookingRequest.findMany({
      where: {
        clinicId,
        selectedSlotId: { not: null },
        appointmentDate: { gte: today, lt: rangeEnd },
        appointmentStatus: { in: [...ACTIVE_BOOKING_STATUSES] },
      },
      select: { selectedSlotId: true, appointmentDate: true },
    });
  } catch (error) {
    console.error("[availability-scheduler:load-bookings-failed]", error);
    return [];
  }

  const usedCounts = new Map<string, number>();
  for (const booking of existingBookings) {
    if (!booking.selectedSlotId || !booking.appointmentDate) continue;
    const key = `${booking.selectedSlotId}|${toDateKey(booking.appointmentDate)}`;
    usedCounts.set(key, (usedCounts.get(key) ?? 0) + 1);
  }

  const options: AvailableAppointmentOption[] = [];
  for (let i = 0; i < daysAhead && options.length < maxOptions; i++) {
    const date = addUtcDays(today, i);
    const weekday = date.getUTCDay();
    const slotsForDay = activeSlots.filter((slot) => slot.weekday === weekday);

    for (const slot of slotsForDay) {
      const dateKey = toDateKey(date);
      const used = usedCounts.get(`${slot.id}|${dateKey}`) ?? 0;
      const remaining = slot.capacity - used;
      if (remaining <= 0) continue; // never return a full occurrence

      options.push({
        slotId: slot.id,
        date: dateKey,
        weekday,
        startTime: slot.startTime,
        endTime: slot.endTime,
        remainingCapacity: remaining,
        labelFa: buildLabel(date, slot.startTime, slot.endTime, "fa"),
        labelEn: buildLabel(date, slot.startTime, slot.endTime, "en"),
        labelAr: buildLabel(date, slot.startTime, slot.endTime, "ar"),
      });

      if (options.length >= maxOptions) break;
    }
  }

  return options;
}

/**
 * For the internal admin surfaces (`/internal/availability`'s weekly
 * board, `/internal/dashboard`'s snapshot) — one row per slot (active AND
 * inactive, unlike `getAvailableAppointmentOptions` above which only ever
 * returns active/open ones), showing its NEXT upcoming occurrence within
 * the lookahead window and that occurrence's used/remaining capacity.
 * "Next occurrence" is necessarily a simplification for a recurring
 * weekly slot — a secretary glancing at a board wants "how does next
 * Saturday look", not every future date at once; this stays consistent
 * with the "lite, not a full scheduling engine" scope everywhere else.
 */
export interface SlotOccupancyOverview {
  slotId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
  note: string | null;
  /** ISO date-only of the next occurrence within the lookahead window, or `null` if none falls in it. */
  nextOccurrenceDate: string | null;
  usedCapacity: number;
  remainingCapacity: number;
}

export async function getWeeklyAvailabilityOverview({ daysAhead = 14 }: { daysAhead?: number } = {}): Promise<SlotOccupancyOverview[]> {
  if (!isDatabaseConfigured()) return [];

  const clinicId = getDefaultClinicId();

  let allSlots: Awaited<ReturnType<typeof prisma.doctorAvailabilitySlot.findMany>>;
  try {
    allSlots = await prisma.doctorAvailabilitySlot.findMany({
      where: { clinicId },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
  } catch (error) {
    console.error("[availability-scheduler:load-slots-failed]", error);
    return [];
  }
  if (allSlots.length === 0) return [];

  const today = todayUtcMidnight();
  const rangeEnd = addUtcDays(today, daysAhead);

  let existingBookings: { selectedSlotId: string | null; appointmentDate: Date | null }[];
  try {
    existingBookings = await prisma.bookingRequest.findMany({
      where: {
        clinicId,
        selectedSlotId: { not: null },
        appointmentDate: { gte: today, lt: rangeEnd },
        appointmentStatus: { in: [...ACTIVE_BOOKING_STATUSES] },
      },
      select: { selectedSlotId: true, appointmentDate: true },
    });
  } catch (error) {
    console.error("[availability-scheduler:load-bookings-failed]", error);
    return [];
  }

  const usedCounts = new Map<string, number>();
  for (const booking of existingBookings) {
    if (!booking.selectedSlotId || !booking.appointmentDate) continue;
    const key = `${booking.selectedSlotId}|${toDateKey(booking.appointmentDate)}`;
    usedCounts.set(key, (usedCounts.get(key) ?? 0) + 1);
  }

  return allSlots.map((slot) => {
    let nextOccurrenceDate: string | null = null;
    for (let i = 0; i < daysAhead; i++) {
      const date = addUtcDays(today, i);
      if (date.getUTCDay() === slot.weekday) {
        nextOccurrenceDate = toDateKey(date);
        break;
      }
    }

    const usedCapacity = nextOccurrenceDate ? (usedCounts.get(`${slot.id}|${nextOccurrenceDate}`) ?? 0) : 0;

    return {
      slotId: slot.id,
      weekday: slot.weekday,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      isActive: slot.isActive,
      note: slot.note,
      nextOccurrenceDate,
      usedCapacity,
      remainingCapacity: Math.max(0, slot.capacity - usedCapacity),
    };
  });
}
