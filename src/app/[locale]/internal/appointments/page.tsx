import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InternalNav } from "@/components/internal/internal-nav";
import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { formatPersianCapacity, formatPersianDateTime, formatPersianDigits, formatPersianPhone, formatPersianTimeRange, formatPersianWeekdayDate } from "@/i18n/persian-format";
import { fa } from "@/i18n/dictionaries/fa";
import { isSupportedLocale } from "@/i18n/locales";
import { ConversationTranscript } from "@/modules/smart-clinic-assistant/admin/conversation-transcript";
import {
  APPOINTMENT_STATUS_LABELS,
  EDITABLE_APPOINTMENT_STATUSES,
  hasUrgentHandoff,
  isStagingTestRecord,
  paymentStatusLabel,
} from "@/modules/smart-clinic-assistant/admin/status-labels";
import { updateAppointmentStatusAction } from "@/modules/smart-clinic-assistant/server/admin-actions";
import { listBookingRequestsForAdmin } from "@/modules/smart-clinic-assistant/server/lead-repository";
import { requireInternalActor } from "@/modules/internal-ops/server/internal-auth";
import type { BookingAppointmentStatus } from "@/modules/smart-clinic-assistant/application/types";

/** Staff-only tooling — must never be indexed, even though the middleware token gate + robots.ts's Disallow already keep it out of normal crawling. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Same per-request rendering requirement as `/internal/assistant-leads` — see that page's doc-comment for why. */
export const dynamic = "force-dynamic";

const SERVICE_LABELS = Object.fromEntries(fa.assistantFlow.services.map((service) => [service.id, service.label]));

const STATUS_ERROR_MESSAGE = "بروزرسانی وضعیت انجام نشد. لطفاً دوباره تلاش کنید یا اتصال اینترنت را بررسی کنید.";
const STATUS_UPDATED_MESSAGE = "وضعیت نوبت با موفقیت بروزرسانی شد.";

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
 * `BookingAppointmentStatus` doc-comment).
 *
 * Round 2026-07-25 (Internal Operations Lite polish, per Hamid — real
 * staff-facing bugs): full-width layout (was capped at `max-w-6xl`,
 * cramped for a 10-column table); a real desktop TABLE + a mobile CARD
 * layout built from the same per-booking view model (not two separately
 * maintained render paths); every date/number goes through
 * `persian-format.ts`; `updateAppointmentStatusAction` now redirects with
 * `?statusUpdated=1`/`?statusError=1` (see that action's own doc-comment
 * for the actual persistence-bug root cause) which this page renders as a
 * visible banner; synthetic staging test records are filtered from the
 * default view.
 */
export default async function AppointmentsAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ statusError?: string; statusUpdated?: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const actor = await requireInternalActor(locale);
  const { statusError, statusUpdated } = await searchParams;

  const dbConfigured = isDatabaseConfigured();
  let bookings: Awaited<ReturnType<typeof listBookingRequestsForAdmin>> = [];
  let loadError: string | null = null;

  if (dbConfigured) {
    try {
      bookings = await listBookingRequestsForAdmin();
    } catch (error) {
      console.error("[appointments-admin:load-failed]", error);
      loadError = "در حال حاضر امکان اتصال به پایگاه داده وجود ندارد. لطفاً لحظاتی دیگر دوباره تلاش کنید.";
    }
  }

  // Round 2026-07-25 (Part C/G) — never shown in the default operational view.
  bookings = bookings.filter((booking) => !isStagingTestRecord(booking.lead));

  // Round 2026-07-15 (availability-based booking): capacity per slot+date,
  // computed once in-memory from the already-fetched list (no extra
  // queries) — a booking "uses" its slot's capacity only while in an
  // active status (requested/contacted/confirmed); cancelled requests
  // never count, so cancelling correctly frees up the seat here too.
  const ACTIVE_FOR_CAPACITY = new Set(["requested", "contacted", "confirmed"]);
  const usageBySlotDate = new Map<string, number>();
  for (const b of bookings) {
    if (!b.selectedSlotId || !b.appointmentDate || !ACTIVE_FOR_CAPACITY.has(b.appointmentStatus)) continue;
    const key = `${b.selectedSlotId}|${b.appointmentDate.toISOString().slice(0, 10)}`;
    usageBySlotDate.set(key, (usageBySlotDate.get(key) ?? 0) + 1);
  }

  const rows = bookings.map((booking) => {
    const latestPayment = booking.paymentDrafts[0] ?? null;
    const triageAnswers = booking.lead.triageAnswers;
    const statusOptions = EDITABLE_APPOINTMENT_STATUSES.includes(booking.appointmentStatus)
      ? EDITABLE_APPOINTMENT_STATUSES
      : [...EDITABLE_APPOINTMENT_STATUSES, booking.appointmentStatus];

    const capacityKey = booking.selectedSlotId && booking.appointmentDate ? `${booking.selectedSlotId}|${booking.appointmentDate.toISOString().slice(0, 10)}` : null;
    const usedForSlot = capacityKey ? (usageBySlotDate.get(capacityKey) ?? 0) : null;
    const slotCapacity = booking.availabilitySlot?.capacity ?? null;
    const isOverCapacity = usedForSlot !== null && slotCapacity !== null && usedForSlot > slotCapacity;

    // Round 2026-07-25 (Part F) — the real, structured appointment date
    // (Jalali weekday + Persian-digit time range) takes priority over the
    // free-typed `preferredDate`/`preferredTimeRange` fallback strings,
    // which only exist for the "no slot picked" manual path.
    const timeLabel = booking.appointmentDate
      ? `${formatPersianWeekdayDate(booking.appointmentDate)}${booking.availabilitySlot ? ` — ساعت ${formatPersianTimeRange(booking.availabilitySlot.startTime, booking.availabilitySlot.endTime)}` : ""}`
      : booking.preferredDate
        ? `${booking.preferredDate}${booking.preferredTimeRange ? ` (${booking.preferredTimeRange})` : ""}`
        : "زمان هنوز مشخص نشده";

    return {
      booking,
      latestPayment,
      triageAnswers,
      statusOptions,
      usedForSlot,
      slotCapacity,
      isOverCapacity,
      timeLabel,
      isUrgent: hasUrgentHandoff(booking.lead.assistantSessions),
      updateAction: updateAppointmentStatusAction.bind(null, locale, booking.id),
    };
  });

  return (
    <main dir="rtl" className="min-h-dvh bg-warm-white text-charcoal">
      <InternalNav locale={locale} active="appointments" actor={actor} />
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold text-deep-navy">درخواست‌های نوبت</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/70">
          این بخش برای پیگیری درخواست‌های نوبت و بروزرسانی وضعیت هر بیمار استفاده می‌شود.
        </p>

        {!dbConfigured && (
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">درخواست‌های نوبت موقتاً در دسترس نیست.</div>
        )}
        {loadError && <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}
        {statusError && <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{STATUS_ERROR_MESSAGE}</div>}
        {statusUpdated && <div className="mt-6 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{STATUS_UPDATED_MESSAGE}</div>}

        {dbConfigured && !loadError && bookings.length === 0 && (
          <div className="mt-6 rounded-lg border border-charcoal/10 bg-charcoal/[0.03] px-4 py-3 text-sm text-charcoal/60">هنوز هیچ درخواست نوبتی ثبت نشده است.</div>
        )}

        {rows.length > 0 && (
          <>
            {/* Desktop: full-width table, horizontally scrollable if the viewport is still narrower than the content. */}
            <div className="mt-6 hidden overflow-x-auto rounded-xl border border-charcoal/10 lg:block">
              <table className="w-full min-w-[1200px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-charcoal/10 bg-charcoal/[0.03] text-right text-xs text-charcoal/60">
                    <th className="px-3 py-2.5 font-medium">نام بیمار</th>
                    <th className="px-3 py-2.5 font-medium">موبایل</th>
                    <th className="px-3 py-2.5 font-medium">خدمت</th>
                    <th className="px-3 py-2.5 font-medium">زمان / ظرفیت</th>
                    <th className="px-3 py-2.5 font-medium">خلاصه غربالگری</th>
                    <th className="px-3 py-2.5 font-medium">وضعیت نوبت / یادداشت</th>
                    <th className="px-3 py-2.5 font-medium">وضعیت پرداخت</th>
                    <th className="px-3 py-2.5 font-medium">گفت‌وگو با دستیار</th>
                    <th className="px-3 py-2.5 font-medium">تاریخ ثبت</th>
                    <th className="px-3 py-2.5 font-medium">سرنخ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ booking, latestPayment, triageAnswers, statusOptions, usedForSlot, slotCapacity, isOverCapacity, timeLabel, isUrgent, updateAction }) => (
                    <tr id={`booking-${booking.id}`} key={booking.id} className="border-b border-charcoal/5 align-top last:border-0">
                      <td className="px-3 py-3">
                        <p className="font-medium">{booking.lead.fullName}</p>
                        {isUrgent && (
                          <span className="mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                            نیازمند پیگیری فوری
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3" dir="ltr">
                        {formatPersianPhone(booking.lead.mobile)}
                      </td>
                      <td className="px-3 py-3">{booking.lead.selectedService ? (SERVICE_LABELS[booking.lead.selectedService] ?? booking.lead.selectedService) : "—"}</td>
                      <td className="px-3 py-3 text-charcoal/70">
                        <p>{timeLabel}</p>
                        {slotCapacity !== null && usedForSlot !== null && (
                          <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${isOverCapacity ? "bg-red-100 text-red-700" : "bg-charcoal/10 text-charcoal/60"}`}>
                            {isOverCapacity ? "⚠ " : ""}
                            ظرفیت {formatPersianCapacity(usedForSlot, slotCapacity)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-charcoal/70">
                        {triageAnswers.length > 0 ? (
                          <span title={triageAnswers.map((answer) => `${answer.questionText}: ${answer.answer}`).join("\n")} className="cursor-help underline decoration-dotted decoration-charcoal/30">
                            {formatPersianDigits(triageAnswers.length)} پاسخ
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusForm action={updateAction} status={booking.appointmentStatus} statusOptions={statusOptions} internalNote={booking.internalNote} isOverCapacity={isOverCapacity} />
                      </td>
                      <td className="px-3 py-3">{paymentStatusLabel(latestPayment?.paymentStatus)}</td>
                      <td className="px-3 py-3">
                        <ConversationTranscript sessions={booking.lead.assistantSessions} serviceLabels={SERVICE_LABELS} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-charcoal/60">{formatPersianDateTime(booking.createdAt)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <a href={`/${locale}/internal/assistant-leads#lead-${booking.lead.id}`} className="text-xs text-gold hover:text-gold-hover">
                          مشاهده سرنخ
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/tablet: one card per booking, same data as the table row. */}
            <div className="mt-6 flex flex-col gap-4 lg:hidden">
              {rows.map(({ booking, latestPayment, triageAnswers, statusOptions, usedForSlot, slotCapacity, isOverCapacity, timeLabel, isUrgent, updateAction }) => (
                <div id={`booking-${booking.id}`} key={booking.id} className="rounded-xl border border-charcoal/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-deep-navy">{booking.lead.fullName}</p>
                      <p className="mt-0.5 text-xs text-charcoal/60" dir="ltr">
                        {formatPersianPhone(booking.lead.mobile)}
                      </p>
                    </div>
                    {isUrgent && <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">نیازمند پیگیری فوری</span>}
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <dt className="text-charcoal/45">خدمت</dt>
                      <dd className="mt-0.5 text-charcoal/80">{booking.lead.selectedService ? (SERVICE_LABELS[booking.lead.selectedService] ?? booking.lead.selectedService) : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-charcoal/45">وضعیت پرداخت</dt>
                      <dd className="mt-0.5 text-charcoal/80">{paymentStatusLabel(latestPayment?.paymentStatus)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-charcoal/45">زمان</dt>
                      <dd className="mt-0.5 text-charcoal/80">{timeLabel}</dd>
                    </div>
                    {slotCapacity !== null && usedForSlot !== null && (
                      <div className="col-span-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${isOverCapacity ? "bg-red-100 text-red-700" : "bg-charcoal/10 text-charcoal/60"}`}>
                          {isOverCapacity ? "⚠ " : ""}
                          ظرفیت {formatPersianCapacity(usedForSlot, slotCapacity)}
                        </span>
                      </div>
                    )}
                    {triageAnswers.length > 0 && (
                      <div className="col-span-2">
                        <dt className="text-charcoal/45">خلاصه غربالگری</dt>
                        <dd className="mt-0.5 text-charcoal/80">{formatPersianDigits(triageAnswers.length)} پاسخ ثبت شده</dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-3 border-t border-charcoal/5 pt-3">
                    <StatusForm action={updateAction} status={booking.appointmentStatus} statusOptions={statusOptions} internalNote={booking.internalNote} isOverCapacity={isOverCapacity} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-charcoal/5 pt-3 text-xs">
                    <ConversationTranscript sessions={booking.lead.assistantSessions} serviceLabels={SERVICE_LABELS} />
                    <a href={`/${locale}/internal/assistant-leads#lead-${booking.lead.id}`} className="text-gold hover:text-gold-hover">
                      مشاهده سرنخ
                    </a>
                  </div>
                  <p className="mt-2 text-[11px] text-charcoal/40">ثبت‌شده در {formatPersianDateTime(booking.createdAt)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

/** Shared status-update form — identical between the desktop table cell and the mobile card, one definition instead of two drifting copies. */
function StatusForm({
  action,
  status,
  statusOptions,
  internalNote,
  isOverCapacity,
}: {
  action: (formData: FormData) => void | Promise<void>;
  status: BookingAppointmentStatus;
  statusOptions: readonly BookingAppointmentStatus[];
  internalNote: string | null;
  isOverCapacity: boolean;
}) {
  return (
    <form action={action} key={status} className="flex min-w-[220px] flex-col gap-1.5">
      <select name="appointmentStatus" defaultValue={status} className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-xs text-charcoal">
        {statusOptions.map((option) => (
          <option key={option} value={option}>
            {APPOINTMENT_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      {isOverCapacity && status !== "confirmed" && <p className="text-[11px] leading-4 text-red-600">⚠ این بازه تکمیل شده — پیش از تأیید، ظرفیت را بررسی کنید.</p>}
      <input type="text" name="internalNote" defaultValue={internalNote ?? ""} placeholder="یادداشت داخلی" className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-xs text-charcoal" />
      <button type="submit" className="self-start rounded-full border border-charcoal/20 px-3 py-1.5 text-xs text-charcoal/70 transition-colors duration-200 hover:border-gold hover:text-gold">
        بروزرسانی
      </button>
    </form>
  );
}
