import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InternalNav } from "@/components/internal/internal-nav";
import { WEEKDAY_LABELS as SHARED_WEEKDAY_LABELS } from "@/core/weekday-labels";
import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { formatDateTimeForLocale } from "@/i18n/format-jalali-date";
import { fa } from "@/i18n/dictionaries/fa";
import { isSupportedLocale } from "@/i18n/locales";
import { APPOINTMENT_STATUS_LABELS, LEAD_STATUS_LABELS } from "@/modules/smart-clinic-assistant/admin/status-labels";
import { getWeeklyAvailabilityOverview } from "@/modules/smart-clinic-assistant/server/availability-scheduler";
import { countPendingPaymentDrafts, listBookingRequestsForAdmin, listLeadsForAdmin } from "@/modules/smart-clinic-assistant/server/lead-repository";

/** Staff-only tooling — must never be indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Same per-request rendering requirement as every other `/internal/*` page — see `assistant-leads/page.tsx`'s doc-comment for why. */
export const dynamic = "force-dynamic";

const SERVICE_LABELS = Object.fromEntries(fa.assistantFlow.services.map((service) => [service.id, service.label]));
const WEEKDAY_LABELS = SHARED_WEEKDAY_LABELS.fa;

/**
 * Clinic Operations Dashboard Lite (round 2026-07-15, per Hamid's
 * contract-facing secretary-UX brief) — the one landing page after
 * `/internal/login`. Pulls the same read functions the three existing
 * pages already use (`listBookingRequestsForAdmin`, `listLeadsForAdmin`,
 * `listDoctorAvailabilitySlots`) rather than adding parallel summary-only
 * queries — this stays a thin aggregation view, not a new data source of
 * its own. Every number here is a live count from the real tables when
 * `DATABASE_URL` is configured; nothing is estimated or cached.
 */
export default async function InternalDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dbConfigured = isDatabaseConfigured();
  let bookings: Awaited<ReturnType<typeof listBookingRequestsForAdmin>> = [];
  let leads: Awaited<ReturnType<typeof listLeadsForAdmin>> = [];
  let overview: Awaited<ReturnType<typeof getWeeklyAvailabilityOverview>> = [];
  let pendingPayments = 0;
  let loadError: string | null = null;

  if (dbConfigured) {
    try {
      [bookings, leads, overview, pendingPayments] = await Promise.all([
        listBookingRequestsForAdmin(),
        listLeadsForAdmin(),
        getWeeklyAvailabilityOverview(),
        countPendingPaymentDrafts(),
      ]);
    } catch (error) {
      console.error("[internal-dashboard:load-failed]", error);
      loadError = "اتصال به پایگاه داده برقرار نشد. تنظیمات DATABASE_URL را بررسی کنید.";
    }
  }

  const requestedCount = bookings.filter((booking) => booking.appointmentStatus === "requested").length;
  const contactedCount = bookings.filter((booking) => booking.appointmentStatus === "contacted").length;
  const confirmedCount = bookings.filter((booking) => booking.appointmentStatus === "confirmed").length;
  const newLeadsCount = leads.filter((lead) => lead.status === "new").length;
  const activeSlots = overview.filter((slot) => slot.isActive);
  // Round 2026-07-15 (availability-based booking): "today"/"tomorrow" here
  // means "the next 2 upcoming occurrence dates across active slots" —
  // simplest faithful reading of "today's/tomorrow's active slots" for a
  // recurring weekly pattern (a literal calendar day might have zero
  // slots at all, in which case showing the nearest 2 occurrence days is
  // more useful to a secretary than an empty "today" panel).
  const upcomingOccurrenceDates = [...new Set(activeSlots.map((slot) => slot.nextOccurrenceDate).filter((d): d is string => d !== null))]
    .sort()
    .slice(0, 2);
  const upcomingSlots = activeSlots.filter((slot) => slot.nextOccurrenceDate && upcomingOccurrenceDates.includes(slot.nextOccurrenceDate));

  const summaryCards = [
    { label: "درخواست‌های جدید نوبت", value: requestedCount },
    { label: "تماس گرفته‌شده", value: contactedCount },
    { label: "نوبت‌های تأییدشده", value: confirmedCount },
    { label: "لیدهای جدید", value: newLeadsCount },
    { label: "بازه‌های فعال هفتگی", value: activeSlots.length },
    { label: "پرداخت‌های در انتظار", value: pendingPayments },
  ];

  return (
    <main dir="rtl" className="min-h-dvh bg-warm-white">
      <div className="pt-[68px] lg:pt-[88px]">
        <InternalNav locale={locale} active="dashboard" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <h1 className="text-2xl font-bold text-deep-navy">داشبورد داخلی کلینیک</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/70">
          مدیریت درخواست‌های نوبت، پیگیری لیدها و تنظیم ظرفیت‌های دکتر صدیقی.
        </p>
        <p className="mt-2 text-xs text-charcoal/45">دسترسی داخلی محافظت‌شده</p>

        {!dbConfigured && (
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">
            متغیر محیطی <code className="font-mono">DATABASE_URL</code> تنظیم نشده — آمار و فهرست‌ها در دسترس نیست.
          </div>
        )}
        {loadError && <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}

        {dbConfigured && !loadError && activeSlots.length === 0 && (
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">
            هنوز ظرفیت نوبت‌دهی دکتر تعریف نشده است. برای فعال شدن پیشنهاد زمان توسط دستیار، ابتدا تقویم دکتر را تنظیم کنید.
          </div>
        )}

        {dbConfigured && !loadError && (
          <>
            {/* Summary cards */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-charcoal/10 bg-cream p-4">
                  <p className="text-2xl font-bold text-deep-navy">{card.value}</p>
                  <p className="mt-1 text-xs leading-5 text-charcoal/60">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <a href={`/${locale}/internal/appointments`} className="rounded-full bg-deep-navy px-4 py-2 text-xs font-semibold text-warm-white transition-colors duration-200 hover:bg-deep-navy/85">
                مشاهده درخواست‌های نوبت
              </a>
              <a href={`/${locale}/internal/availability`} className="rounded-full border border-charcoal/20 px-4 py-2 text-xs font-semibold text-charcoal/75 transition-colors duration-200 hover:border-gold hover:text-gold">
                مدیریت تقویم دکتر
              </a>
              <a href={`/${locale}/internal/assistant-leads`} className="rounded-full border border-charcoal/20 px-4 py-2 text-xs font-semibold text-charcoal/75 transition-colors duration-200 hover:border-gold hover:text-gold">
                مشاهده لیدها
              </a>
            </div>

            {/* Work panels */}
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <section className="rounded-xl border border-charcoal/10 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-deep-navy">درخواست‌های نوبت</h2>
                  <a href={`/${locale}/internal/appointments`} className="text-xs text-gold hover:text-gold-hover">
                    مشاهده همه
                  </a>
                </div>
                {bookings.length === 0 ? (
                  <p className="mt-4 text-xs text-charcoal/50">هنوز درخواستی ثبت نشده است.</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3">
                    {bookings.slice(0, 5).map((booking) => (
                      <li key={booking.id} className="flex items-center justify-between gap-3 border-b border-charcoal/5 pb-3 text-xs last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-charcoal">{booking.lead.fullName}</p>
                          <p className="mt-0.5 text-charcoal/50">
                            {booking.lead.selectedService ? (SERVICE_LABELS[booking.lead.selectedService] ?? booking.lead.selectedService) : "—"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-deep-navy/10 px-2.5 py-0.5 text-deep-navy">
                          {APPOINTMENT_STATUS_LABELS[booking.appointmentStatus]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-charcoal/10 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-deep-navy">لیدهای جدید</h2>
                  <a href={`/${locale}/internal/assistant-leads`} className="text-xs text-gold hover:text-gold-hover">
                    مشاهده همه
                  </a>
                </div>
                {leads.length === 0 ? (
                  <p className="mt-4 text-xs text-charcoal/50">هنوز سرنخی ثبت نشده است.</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3">
                    {leads.slice(0, 5).map((lead) => (
                      <li key={lead.id} className="flex items-center justify-between gap-3 border-b border-charcoal/5 pb-3 text-xs last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-charcoal">{lead.fullName}</p>
                          <p className="mt-0.5 text-charcoal/50">
                            {lead.selectedService ? (SERVICE_LABELS[lead.selectedService] ?? lead.selectedService) : "—"} · {lead.source}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-deep-navy/10 px-2.5 py-0.5 text-deep-navy">{LEAD_STATUS_LABELS[lead.status]}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-charcoal/10 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-deep-navy">ظرفیت‌های دکتر — نزدیک‌ترین روزها</h2>
                  <a href={`/${locale}/internal/availability`} className="text-xs text-gold hover:text-gold-hover">
                    مدیریت
                  </a>
                </div>
                {activeSlots.length === 0 ? (
                  <p className="mt-4 text-xs text-charcoal/50">هنوز بازه فعالی تعریف نشده است.</p>
                ) : upcomingSlots.length === 0 ? (
                  <p className="mt-4 text-xs text-charcoal/50">در ۱۴ روز آینده بازه‌ای یافت نشد.</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3">
                    {upcomingSlots.map((slot) => (
                      <li key={`${slot.slotId}-${slot.nextOccurrenceDate}`} className="flex items-center justify-between gap-3 border-b border-charcoal/5 pb-3 text-xs last:border-0 last:pb-0">
                        <span className="font-medium text-charcoal">{WEEKDAY_LABELS[slot.weekday]}</span>
                        <span dir="ltr" className="font-mono text-charcoal/60">
                          {slot.startTime}–{slot.endTime}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 ${
                            slot.remainingCapacity === 0 ? "bg-red-100 text-red-700" : "bg-deep-navy/10 text-deep-navy"
                          }`}
                        >
                          {slot.usedCapacity}/{slot.capacity} {slot.remainingCapacity === 0 ? "تکمیل" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-charcoal/10 bg-white p-5">
                <h2 className="text-sm font-semibold text-deep-navy">پرداخت‌ها</h2>
                <p className="mt-4 text-2xl font-bold text-deep-navy">{pendingPayments}</p>
                <p className="mt-1 text-xs text-charcoal/60">پیش‌نویس پرداخت در وضعیت «در انتظار»</p>
                <p className="mt-3 text-xs leading-5 text-charcoal/45">
                  درگاه پرداخت واقعی هنوز متصل نیست — هیچ پرداختی در این سامانه «پرداخت‌شده» علامت‌گذاری نمی‌شود مگر با تأیید واقعی درگاه.
                </p>
              </section>
            </div>
          </>
        )}

        <p className="mt-10 text-[11px] text-charcoal/35">
          آخرین بروزرسانی صفحه: {formatDateTimeForLocale(new Date(), locale)}
        </p>
      </div>
    </main>
  );
}
