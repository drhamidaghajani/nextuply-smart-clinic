import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InternalNav } from "@/components/internal/internal-nav";
import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { formatDateTimeForLocale } from "@/i18n/format-jalali-date";
import { fa } from "@/i18n/dictionaries/fa";
import { isSupportedLocale } from "@/i18n/locales";
import { ConversationTranscript } from "@/modules/smart-clinic-assistant/admin/conversation-transcript";
import {
  APPOINTMENT_STATUS_LABELS,
  EDITABLE_APPOINTMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
} from "@/modules/smart-clinic-assistant/admin/status-labels";
import { updateAppointmentStatusAction } from "@/modules/smart-clinic-assistant/server/admin-actions";
import { listBookingRequestsForAdmin } from "@/modules/smart-clinic-assistant/server/lead-repository";

/** Staff-only tooling — must never be indexed, even though the middleware token gate + robots.ts's Disallow already keep it out of normal crawling. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Same per-request rendering requirement as `/internal/assistant-leads` — see that page's doc-comment for why. */
export const dynamic = "force-dynamic";

const SERVICE_LABELS = Object.fromEntries(fa.assistantFlow.services.map((service) => [service.id, service.label]));

/**
 * Round 2026-07-15 (Clinic Operations Lite, per Hamid's contract-facing
 * staging brief) — was a read-only listing, now has ONE write path: a
 * secretary can update `appointmentStatus` (requested/contacted/
 * confirmed/cancelled — never `pending_payment`, see
 * `EDITABLE_APPOINTMENT_STATUSES`'s doc-comment, since no payment
 * gateway exists to drive that state) and an `internalNote`, per row.
 * Still explicitly NOT a CRM: no bulk actions, no assignment, no
 * appointment ever auto-marked "confirmed" by anything but this one
 * manual secretary action (see `application/types.ts`'s
 * `BookingAppointmentStatus` doc-comment). Protected by the same
 * `guardInternalRoute` middleware token as every other `/internal/*`
 * route — see `src/middleware.ts`.
 *
 * Also now shows a triage-answers summary (native `title` tooltip, zero
 * extra JS) and a link back to the lead's row on `/internal/assistant-
 * leads` — the two pages were previously unrelated views of overlapping
 * data with no way to jump between them.
 */
export default async function AppointmentsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dbConfigured = isDatabaseConfigured();
  let bookings: Awaited<ReturnType<typeof listBookingRequestsForAdmin>> = [];
  let loadError: string | null = null;

  if (dbConfigured) {
    try {
      bookings = await listBookingRequestsForAdmin();
    } catch (error) {
      console.error("[appointments-admin:load-failed]", error);
      loadError = "اتصال به پایگاه داده برقرار نشد. تنظیمات DATABASE_URL را بررسی کنید.";
    }
  }

  return (
    <main dir="rtl" className="min-h-dvh bg-warm-white text-charcoal">
      <div className="pt-[68px] lg:pt-[88px]">
        <InternalNav locale={locale} active="appointments" />
      </div>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <h1 className="text-xl font-bold text-deep-navy">درخواست‌های نوبت (داخلی)</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/70">
          فهرست درخواست‌های نوبت ثبت‌شده — این صفحه یک سامانه مدیریت کامل نیست؛ فقط وضعیت نوبت و یک یادداشت داخلی قابل ویرایش است. هیچ
          نوبتی به‌صورت خودکار «تأییدشده» علامت‌گذاری نمی‌شود.
        </p>

        {!dbConfigured && (
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">
            متغیر محیطی <code className="font-mono">DATABASE_URL</code> تنظیم نشده — هیچ درخواستی ذخیره‌سازی نمی‌شود و این صفحه چیزی برای نمایش ندارد.
          </div>
        )}

        {loadError && <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}

        {dbConfigured && !loadError && bookings.length === 0 && (
          <div className="mt-6 rounded-lg border border-charcoal/10 bg-charcoal/[0.03] px-4 py-3 text-sm text-charcoal/60">
            هنوز هیچ درخواست نوبتی ثبت نشده است.
          </div>
        )}

        {bookings.length > 0 &&
          (() => {
            // Round 2026-07-15 (availability-based booking): capacity per
            // slot+date, computed once in-memory from the already-fetched
            // list (no extra queries) — a booking "uses" its slot's
            // capacity only while in an active status (requested/
            // contacted/confirmed); cancelled requests never count, so
            // cancelling correctly frees up the seat here too.
            const ACTIVE_FOR_CAPACITY = new Set(["requested", "contacted", "confirmed"]);
            const usageBySlotDate = new Map<string, number>();
            for (const b of bookings) {
              if (!b.selectedSlotId || !b.appointmentDate || !ACTIVE_FOR_CAPACITY.has(b.appointmentStatus)) continue;
              const key = `${b.selectedSlotId}|${b.appointmentDate.toISOString().slice(0, 10)}`;
              usageBySlotDate.set(key, (usageBySlotDate.get(key) ?? 0) + 1);
            }

            return (
              <div className="mt-6 overflow-x-auto rounded-lg border border-charcoal/10">
                <table className="w-full min-w-[1080px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-charcoal/10 bg-charcoal/[0.03] text-right text-xs text-charcoal/60">
                      <th className="px-3 py-2 font-medium">نام بیمار</th>
                      <th className="px-3 py-2 font-medium">موبایل</th>
                      <th className="px-3 py-2 font-medium">خدمت</th>
                      <th className="px-3 py-2 font-medium">زمان ترجیحی / ظرفیت</th>
                      <th className="px-3 py-2 font-medium">خلاصه غربالگری</th>
                      <th className="px-3 py-2 font-medium">وضعیت نوبت / یادداشت</th>
                      <th className="px-3 py-2 font-medium">وضعیت پرداخت</th>
                      <th className="px-3 py-2 font-medium">گفتگو با دستیار</th>
                      <th className="px-3 py-2 font-medium">تاریخ ثبت</th>
                      <th className="px-3 py-2 font-medium">سرنخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => {
                      const latestPayment = booking.paymentDrafts[0] ?? null;
                      const triageAnswers = booking.lead.triageAnswers;
                      const statusOptions = EDITABLE_APPOINTMENT_STATUSES.includes(booking.appointmentStatus)
                        ? EDITABLE_APPOINTMENT_STATUSES
                        : [...EDITABLE_APPOINTMENT_STATUSES, booking.appointmentStatus];
                      const updateAction = updateAppointmentStatusAction.bind(null, locale, booking.id);

                      const capacityKey =
                        booking.selectedSlotId && booking.appointmentDate
                          ? `${booking.selectedSlotId}|${booking.appointmentDate.toISOString().slice(0, 10)}`
                          : null;
                      const usedForSlot = capacityKey ? (usageBySlotDate.get(capacityKey) ?? 0) : null;
                      const slotCapacity = booking.availabilitySlot?.capacity ?? null;
                      const isOverCapacity = usedForSlot !== null && slotCapacity !== null && usedForSlot > slotCapacity;

                      return (
                        <tr id={`booking-${booking.id}`} key={booking.id} className="border-b border-charcoal/5 align-top last:border-0">
                          <td className="px-3 py-3">{booking.lead.fullName}</td>
                          <td className="px-3 py-3 font-mono" dir="ltr">
                            {booking.lead.mobile}
                          </td>
                          <td className="px-3 py-3">
                            {booking.lead.selectedService ? (SERVICE_LABELS[booking.lead.selectedService] ?? booking.lead.selectedService) : "—"}
                          </td>
                          <td className="px-3 py-3 text-charcoal/70">
                            <p>
                              {booking.preferredDate ?? "—"}
                              {booking.preferredTimeRange ? ` (${booking.preferredTimeRange})` : ""}
                            </p>
                            {slotCapacity !== null && usedForSlot !== null && (
                              <span
                                className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                                  isOverCapacity ? "bg-red-100 text-red-700" : "bg-charcoal/10 text-charcoal/60"
                                }`}
                              >
                                {isOverCapacity ? "⚠ " : ""}
                                ظرفیت {usedForSlot}/{slotCapacity}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-charcoal/70">
                            {triageAnswers.length > 0 ? (
                              <span
                                title={triageAnswers.map((answer) => `${answer.questionText}: ${answer.answer}`).join("\n")}
                                className="cursor-help underline decoration-dotted decoration-charcoal/30"
                              >
                                {triageAnswers.length} پاسخ
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <form action={updateAction} className="flex min-w-[220px] flex-col gap-1.5">
                              <select
                                name="appointmentStatus"
                                defaultValue={booking.appointmentStatus}
                                className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1 text-xs text-charcoal"
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {APPOINTMENT_STATUS_LABELS[status]}
                                  </option>
                                ))}
                              </select>
                              {isOverCapacity && booking.appointmentStatus !== "confirmed" && (
                                <p className="text-[11px] leading-4 text-red-600">⚠ این بازه تکمیل شده — پیش از تأیید، ظرفیت را بررسی کنید.</p>
                              )}
                              <input
                                type="text"
                                name="internalNote"
                                defaultValue={booking.internalNote ?? ""}
                                placeholder="یادداشت داخلی"
                                className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1 text-xs text-charcoal"
                              />
                              <button
                                type="submit"
                                className="self-start rounded-full border border-charcoal/20 px-3 py-1 text-xs text-charcoal/70 transition-colors duration-200 hover:border-gold hover:text-gold"
                              >
                                بروزرسانی
                              </button>
                            </form>
                          </td>
                          <td className="px-3 py-3">{latestPayment ? PAYMENT_STATUS_LABELS[latestPayment.paymentStatus] : "—"}</td>
                          <td className="px-3 py-3">
                            <ConversationTranscript sessions={booking.lead.assistantSessions} locale={locale} serviceLabels={SERVICE_LABELS} />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-charcoal/60">{formatDateTimeForLocale(booking.createdAt, locale)}</td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <a href={`/${locale}/internal/assistant-leads#lead-${booking.lead.id}`} className="text-xs text-gold hover:text-gold-hover">
                              مشاهده سرنخ
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
      </div>
    </main>
  );
}
