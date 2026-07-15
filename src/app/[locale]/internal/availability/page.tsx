import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InternalNav } from "@/components/internal/internal-nav";
import { WEEKDAY_DISPLAY_ORDER, WEEKDAY_LABELS as SHARED_WEEKDAY_LABELS } from "@/core/weekday-labels";
import { isSupportedLocale } from "@/i18n/locales";
import { isDatabaseConfigured } from "@/infrastructure/db/client";
import {
  createAvailabilitySlotAction,
  toggleAvailabilitySlotActiveAction,
  updateAvailabilitySlotAction,
} from "@/modules/smart-clinic-assistant/server/admin-actions";
import { getWeeklyAvailabilityOverview } from "@/modules/smart-clinic-assistant/server/availability-scheduler";
import { listDoctorAvailabilitySlots } from "@/modules/smart-clinic-assistant/server/availability-repository";

/** Staff-only tooling — must never be indexed, even though the middleware token gate + robots.ts's Disallow already keep it out of normal crawling. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Same per-request rendering requirement as `/internal/assistant-leads` — see that page's doc-comment for why. */
export const dynamic = "force-dynamic";

/**
 * Round 2026-07-15 (Clinic Operations Lite, per Hamid's contract-facing
 * staging brief) — replaces the earlier data-model-only placeholder with
 * a real, minimal recurring-WEEKLY availability editor backed by
 * `DoctorAvailabilitySlot` (see `prisma/schema.prisma`'s doc-comment on
 * that model for the exact scope: standing weekly slots, e.g. "Saturdays
 * 09:00–13:00", not a specific-date calendar — no drag-and-drop, a plain
 * table + form is deliberately enough here).
 *
 * All mutations go through Server Actions in `server/admin-actions.ts`,
 * protected by the same `INTERNAL_ADMIN_TOKEN` middleware gate as every
 * other `/internal/*` route (see that file's doc-comment for why no
 * separate check is added here). Zero client JS: every interactive
 * control is a plain `<form>` bound to a Server Action via `.bind()`.
 *
 * Round 2026-07-15, same day (availability-based booking): added a
 * Persian-first weekly BOARD above the existing edit table — a 7-column
 * (desktop) grid, each day showing its slots' next-occurrence used/
 * remaining capacity via `getWeeklyAvailabilityOverview`. This is a
 * second, calmer read of the same `DoctorAvailabilitySlot` data the
 * table already edits — no new state, no drag-and-drop, no calendar
 * library.
 */
const WEEKDAY_LABELS = SHARED_WEEKDAY_LABELS.fa;

export default async function AvailabilityAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dbConfigured = isDatabaseConfigured();
  let slots: Awaited<ReturnType<typeof listDoctorAvailabilitySlots>> = [];
  let overview: Awaited<ReturnType<typeof getWeeklyAvailabilityOverview>> = [];
  let loadError: string | null = null;

  if (dbConfigured) {
    try {
      [slots, overview] = await Promise.all([listDoctorAvailabilitySlots(), getWeeklyAvailabilityOverview()]);
      slots = [...slots].sort((a, b) => {
        const weekdayDiff = WEEKDAY_DISPLAY_ORDER.indexOf(a.weekday) - WEEKDAY_DISPLAY_ORDER.indexOf(b.weekday);
        return weekdayDiff !== 0 ? weekdayDiff : a.startTime.localeCompare(b.startTime);
      });
    } catch (error) {
      console.error("[availability-admin:load-failed]", error);
      loadError = "اتصال به پایگاه داده برقرار نشد. تنظیمات DATABASE_URL را بررسی کنید.";
    }
  }

  const createAction = createAvailabilitySlotAction.bind(null, locale);

  return (
    <main dir="rtl" className="min-h-dvh bg-warm-white text-charcoal">
      <div className="pt-[68px] lg:pt-[88px]">
        <InternalNav locale={locale} active="availability" />
      </div>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <h1 className="text-xl font-bold text-deep-navy">مدیریت زمان‌های حضور پزشک (داخلی)</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/70">
          بازه‌های هفتگیِ استاندارد حضور پزشک — نه یک تقویم روز‌به‌روز. این صفحه یک سامانه نوبت‌دهی آنلاین کامل نیست؛ فقط بازه‌های کلی
          هفتگی را برای هماهنگی داخلی منشی نگه می‌دارد.
        </p>

        {!dbConfigured && (
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">
            متغیر محیطی <code className="font-mono">DATABASE_URL</code> تنظیم نشده — امکان مدیریت بازه‌های زمانی وجود ندارد.
          </div>
        )}

        {loadError && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
        )}

        {dbConfigured && !loadError && overview.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-charcoal">نمای هفتگی ظرفیت‌ها</h2>
            <p className="mt-1 text-xs text-charcoal/50">ظرفیت نمایش‌داده‌شده مربوط به نزدیک‌ترین وقوعِ هر بازه در ۱۴ روز آینده است.</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
              {WEEKDAY_DISPLAY_ORDER.map((weekday) => {
                const daySlots = overview.filter((slot) => slot.weekday === weekday);
                return (
                  <div key={weekday} className="rounded-lg border border-charcoal/10 bg-cream p-3">
                    <p className="text-xs font-semibold text-deep-navy">{WEEKDAY_LABELS[weekday]}</p>
                    {daySlots.length === 0 ? (
                      <p className="mt-2 text-[11px] text-charcoal/35">بدون بازه</p>
                    ) : (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.slotId}
                            className={`rounded-md border px-2 py-1.5 text-[11px] ${
                              slot.isActive ? "border-charcoal/10 bg-warm-white" : "border-charcoal/5 bg-charcoal/[0.02] opacity-60"
                            }`}
                          >
                            <p dir="ltr" className="font-mono text-charcoal/80">
                              {slot.startTime}–{slot.endTime}
                            </p>
                            {slot.isActive ? (
                              <p className={`mt-0.5 ${slot.remainingCapacity === 0 ? "font-semibold text-red-600" : "text-charcoal/55"}`}>
                                {slot.usedCapacity}/{slot.capacity} {slot.remainingCapacity === 0 ? "(تکمیل)" : ""}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-charcoal/40">غیرفعال</p>
                            )}
                            {slot.note && <p className="mt-0.5 truncate text-charcoal/40">{slot.note}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {dbConfigured && !loadError && (
          <>
            <form action={createAction} className="mt-8 rounded-lg border border-charcoal/10 bg-cream p-5">
              <h2 className="text-sm font-semibold text-charcoal">افزودن بازه زمانی جدید</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                  روز هفته
                  <select name="weekday" required defaultValue="6" className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal">
                    {WEEKDAY_DISPLAY_ORDER.map((weekday) => (
                      <option key={weekday} value={weekday}>
                        {WEEKDAY_LABELS[weekday]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                  ساعت شروع
                  <input type="time" name="startTime" required defaultValue="09:00" className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal" />
                </label>
                <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                  ساعت پایان
                  <input type="time" name="endTime" required defaultValue="13:00" className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal" />
                </label>
                <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                  ظرفیت
                  <input type="number" name="capacity" min={1} defaultValue={1} className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal" />
                </label>
                <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                  یادداشت (اختیاری)
                  <input type="text" name="note" placeholder="مثلاً فقط مشاوره" className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal" />
                </label>
              </div>
              <button
                type="submit"
                className="mt-4 rounded-full bg-deep-navy px-5 py-2 text-xs font-semibold text-warm-white transition-colors duration-200 hover:bg-deep-navy/85"
              >
                افزودن بازه
              </button>
            </form>

            {slots.length === 0 ? (
              <div className="mt-6 rounded-lg border border-charcoal/10 bg-charcoal/[0.03] px-4 py-3 text-sm text-charcoal/60">
                هنوز هیچ بازه زمانی ثبت نشده است.
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-lg border border-charcoal/10">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-charcoal/10 bg-charcoal/[0.03] text-right text-xs text-charcoal/60">
                      <th className="px-3 py-2 font-medium">روز</th>
                      <th className="px-3 py-2 font-medium">ساعت</th>
                      <th className="px-3 py-2 font-medium">ظرفیت / یادداشت</th>
                      <th className="px-3 py-2 font-medium">وضعیت</th>
                      <th className="px-3 py-2 font-medium">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot) => {
                      const updateAction = updateAvailabilitySlotAction.bind(null, locale, slot.id);
                      const toggleAction = toggleAvailabilitySlotActiveAction.bind(null, locale, slot.id, !slot.isActive);
                      return (
                        <tr key={slot.id} className="border-b border-charcoal/5 last:border-0 align-top">
                          <td className="whitespace-nowrap px-3 py-3 font-medium">{WEEKDAY_LABELS[slot.weekday]}</td>
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-charcoal/70" dir="ltr">
                            {slot.startTime}–{slot.endTime}
                          </td>
                          <td className="px-3 py-3">
                            <form action={updateAction} className="flex flex-wrap items-center gap-2">
                              <input type="hidden" name="isActive" value={String(slot.isActive)} />
                              <input
                                type="number"
                                name="capacity"
                                min={1}
                                defaultValue={slot.capacity}
                                className="w-16 rounded-md border border-charcoal/15 px-2 py-1 text-xs"
                              />
                              <input
                                type="text"
                                name="note"
                                defaultValue={slot.note ?? ""}
                                placeholder="یادداشت"
                                className="w-40 rounded-md border border-charcoal/15 px-2 py-1 text-xs"
                              />
                              <button type="submit" className="rounded-full border border-charcoal/20 px-3 py-1 text-xs text-charcoal/70 transition-colors duration-200 hover:border-gold hover:text-gold">
                                ذخیره
                              </button>
                            </form>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${
                                slot.isActive ? "bg-deep-navy/10 text-deep-navy" : "bg-charcoal/10 text-charcoal/50"
                              }`}
                            >
                              {slot.isActive ? "فعال" : "غیرفعال"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <form action={toggleAction}>
                              <button type="submit" className="rounded-full border border-charcoal/20 px-3 py-1 text-xs text-charcoal/70 transition-colors duration-200 hover:border-gold hover:text-gold">
                                {slot.isActive ? "غیرفعال کردن" : "فعال کردن"}
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
