import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InternalNav } from "@/components/internal/internal-nav";
import { WEEKDAY_LABELS as SHARED_WEEKDAY_LABELS } from "@/core/weekday-labels";
import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { formatPersianCapacity, formatPersianDigits, formatPersianDateTime, formatPersianTimeRange } from "@/i18n/persian-format";
import { fa } from "@/i18n/dictionaries/fa";
import { isSupportedLocale } from "@/i18n/locales";
import { APPOINTMENT_STATUS_LABELS, isStagingTestRecord, LEAD_STATUS_LABELS, leadSourceLabel } from "@/modules/smart-clinic-assistant/admin/status-labels";
import { listRecentUrgentHandoffs } from "@/modules/smart-clinic-assistant/server/ai/conversation-repository";
import { getWeeklyAvailabilityOverview } from "@/modules/smart-clinic-assistant/server/availability-scheduler";
import { countPendingPaymentDrafts, listBookingRequestsForAdmin, listLeadsForAdmin } from "@/modules/smart-clinic-assistant/server/lead-repository";
import { requireInternalActor } from "@/modules/internal-ops/server/internal-auth";

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
 *
 * Round 2026-07-25 (Internal Operations Lite polish, per Hamid — real
 * staff-facing bugs from production screenshots): the `pt-[68px] lg:
 * pt-[88px]` wrapper `InternalNav` used to sit in was dead weight left
 * over from BEFORE the previous round's `SiteChrome` fix — it existed to
 * clear the PUBLIC site's fixed header, which no longer renders on
 * `/internal/*` at all (see `site-chrome.tsx`). Removed here and on every
 * other internal page — this alone is most of "too much empty space at
 * the top." Every number/date/time below now goes through
 * `persian-format.ts` instead of a raw JS template literal or
 * `formatDateTimeForLocale` (which produces Persian digits for dates but
 * left plain numbers — counts, capacities — untouched).
 */
export default async function InternalDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const actor = await requireInternalActor(locale);

  const dbConfigured = isDatabaseConfigured();
  let bookings: Awaited<ReturnType<typeof listBookingRequestsForAdmin>> = [];
  let leads: Awaited<ReturnType<typeof listLeadsForAdmin>> = [];
  let overview: Awaited<ReturnType<typeof getWeeklyAvailabilityOverview>> = [];
  let pendingPayments = 0;
  let urgentHandoffs: Awaited<ReturnType<typeof listRecentUrgentHandoffs>> = [];
  let loadError: string | null = null;

  if (dbConfigured) {
    try {
      [bookings, leads, overview, pendingPayments, urgentHandoffs] = await Promise.all([
        listBookingRequestsForAdmin(),
        listLeadsForAdmin(),
        getWeeklyAvailabilityOverview(),
        countPendingPaymentDrafts(),
        listRecentUrgentHandoffs(),
      ]);
    } catch (error) {
      console.error("[internal-dashboard:load-failed]", error);
      loadError = "در حال حاضر امکان اتصال به پایگاه داده وجود ندارد. لطفاً لحظاتی دیگر دوباره تلاش کنید.";
    }
  }

  // Round 2026-07-25 (Part C/G) — the synthetic staging test record must
  // never appear in an operational count/list a secretary actually works
  // from. Filtered here, once, before anything below reads `bookings`/`leads`.
  bookings = bookings.filter((booking) => !isStagingTestRecord(booking.lead));
  leads = leads.filter((lead) => !isStagingTestRecord(lead));

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
    { label: "تماس‌گرفته‌شده", value: contactedCount },
    { label: "نوبت‌های تأییدشده", value: confirmedCount },
    { label: "لیدهای جدید", value: newLeadsCount },
    { label: "بازه‌های فعال هفتگی", value: activeSlots.length },
    { label: "پرداخت‌های در انتظار", value: pendingPayments },
  ];

  return (
    <main dir="rtl" className="min-h-dvh bg-warm-white">
      <InternalNav locale={locale} active="dashboard" actor={actor} />

      <div className="mx-auto max-w-7xl px-6 py-6 sm:px-8">
        <h1 className="text-2xl font-bold text-deep-navy">داشبورد داخلی کلینیک</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/70">
          این بخش برای مدیریت درخواست‌های نوبت، لیدها و پیگیری‌های اولیه کلینیک استفاده می‌شود.
        </p>

        {!dbConfigured && (
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">
            آمار و فهرست‌ها موقتاً در دسترس نیست.
          </div>
        )}
        {loadError && <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}

        {/* Round 2026-07-24 (Internal Operations Lite, Part E) — urgent requests surfaced FIRST, above every other panel, per "urgent requests highlighted." Reuses the existing handoff system-message log — see `listRecentUrgentHandoffs`'s doc-comment. */}
        {dbConfigured && !loadError && urgentHandoffs.length > 0 && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-50/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-red-800">
              <span aria-hidden>⚑</span> درخواست‌های فوری اخیر
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {urgentHandoffs.map((handoff) => (
                <div key={handoff.id} className="rounded-xl border border-red-200/70 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-red-900">{handoff.fullName ?? "نام ثبت نشده"}</p>
                    <span className="whitespace-nowrap text-[11px] text-red-600/60">{formatPersianDateTime(handoff.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-red-700/80" dir="ltr">
                    {handoff.mobile ? formatPersianDigits(handoff.mobile) : "شماره ثبت نشده"}
                  </p>
                  {handoff.serviceSlug && SERVICE_LABELS[handoff.serviceSlug] && (
                    <p className="mt-1 text-[11px] text-red-700/70">خدمت مرتبط: {SERVICE_LABELS[handoff.serviceSlug]}</p>
                  )}
                  <p className="mt-1.5 text-xs leading-5 text-red-800/90">{handoff.content.replace(/^handoff:\s*/, "")}</p>
                  <a
                    href={handoff.leadId ? `/${locale}/internal/assistant-leads#lead-${handoff.leadId}` : `/${locale}/internal/assistant-leads`}
                    className="mt-2.5 inline-block text-xs font-medium text-red-800 underline decoration-dotted underline-offset-2 hover:text-red-900"
                  >
                    مشاهده و پیگیری →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  <p className="text-2xl font-bold text-deep-navy">{formatPersianDigits(card.value)}</p>
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
                  <h2 className="text-sm font-semibold text-deep-navy">درخواست‌های نوبت اخیر</h2>
                  <a href={`/${locale}/internal/appointments`} className="text-xs text-gold hover:text-gold-hover">
                    مشاهده همه
                  </a>
                </div>
                {bookings.length === 0 ? (
                  <p className="mt-4 text-xs text-charcoal/50">هنوز درخواستی ثبت نشده است.</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {bookings.slice(0, 5).map((booking) => (
                      <li key={booking.id} className="flex items-center justify-between gap-3 border-b border-charcoal/5 pb-3.5 text-xs last:border-0 last:pb-0">
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
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {leads.slice(0, 5).map((lead) => (
                      <li key={lead.id} className="flex items-center justify-between gap-3 border-b border-charcoal/5 pb-3.5 text-xs last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-charcoal">{lead.fullName}</p>
                          <p className="mt-0.5 text-charcoal/50">
                            {lead.selectedService ? (SERVICE_LABELS[lead.selectedService] ?? lead.selectedService) : "—"} · {leadSourceLabel(lead.source)}
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
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {upcomingSlots.map((slot) => (
                      <li key={`${slot.slotId}-${slot.nextOccurrenceDate}`} className="flex items-center justify-between gap-3 border-b border-charcoal/5 pb-3.5 text-xs last:border-0 last:pb-0">
                        <span className="font-medium text-charcoal">{WEEKDAY_LABELS[slot.weekday]}</span>
                        <span className="text-charcoal/60">{formatPersianTimeRange(slot.startTime, slot.endTime)}</span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 ${
                            slot.remainingCapacity === 0 ? "bg-red-100 text-red-700" : "bg-deep-navy/10 text-deep-navy"
                          }`}
                        >
                          {formatPersianCapacity(slot.usedCapacity, slot.capacity)} {slot.remainingCapacity === 0 ? "تکمیل" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-charcoal/10 bg-white p-5">
                <h2 className="text-sm font-semibold text-deep-navy">پرداخت‌ها</h2>
                <p className="mt-4 text-2xl font-bold text-deep-navy">{formatPersianDigits(pendingPayments)}</p>
                <p className="mt-1 text-xs text-charcoal/60">پیش‌نویس پرداخت در وضعیت «در انتظار»</p>
                <p className="mt-3 text-xs leading-5 text-charcoal/45">
                  درگاه پرداخت آنلاین هنوز متصل نیست — پرداخت‌ها با هماهنگی مستقیم تیم کلینیک نهایی می‌شوند.
                </p>
              </section>
            </div>
          </>
        )}

        <p className="mt-10 text-[11px] text-charcoal/35">آخرین بروزرسانی صفحه: {formatPersianDateTime(new Date())}</p>
      </div>
    </main>
  );
}
