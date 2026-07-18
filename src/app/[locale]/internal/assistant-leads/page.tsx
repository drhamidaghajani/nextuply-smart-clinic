import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InternalNav } from "@/components/internal/internal-nav";
import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { formatPersianDateTime, formatPersianDigits, formatPersianPhone } from "@/i18n/persian-format";
import { fa } from "@/i18n/dictionaries/fa";
import { isSupportedLocale } from "@/i18n/locales";
import { ConversationTranscript } from "@/modules/smart-clinic-assistant/admin/conversation-transcript";
import {
  CONTACT_METHOD_LABELS,
  hasUrgentHandoff,
  isStagingTestRecord,
  LEAD_STATUS_LABELS,
  leadSourceLabel,
} from "@/modules/smart-clinic-assistant/admin/status-labels";
import { listLeadsForAdmin } from "@/modules/smart-clinic-assistant/server/lead-repository";
import { requireInternalActor } from "@/modules/internal-ops/server/internal-auth";

/** Staff-only tooling — must never be indexed, even though the middleware token gate + robots.ts's Disallow already keep it out of normal crawling. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Forces per-request rendering. Without this, Next.js statically
 * prerenders this route at build time (confirmed: `npm run build` marked
 * it `●` SSG alongside the locale layout's `generateStaticParams`) since
 * nothing here otherwise reads a request-time API — which would freeze
 * the leads list at whatever existed when the build ran and never show a
 * new submission again. A real bug caught during this round's build
 * verification, not a defensive default.
 */
export const dynamic = "force-dynamic";

const SERVICE_LABELS = Object.fromEntries(fa.assistantFlow.services.map((service) => [service.id, service.label]));

/**
 * Internal-only view of Smart Clinic Assistant leads, per Hamid's
 * 2026-07-13 persistence-pass brief.
 *
 * Round 2026-07-25 (Internal Operations Lite polish, per Hamid — real
 * staff-facing bugs): full-width layout with a real desktop table + a
 * mobile card layout from the same view model (matches `/internal/
 * appointments`'s pattern); every date/number goes through
 * `persian-format.ts`; `Lead.source` now shows a friendly Persian label
 * (`leadSourceLabel`) instead of the raw English enum value; the
 * synthetic staging test record is filtered from the default view;
 * "نیازمند پیگیری فوری" badge when this lead's conversation logged an
 * urgent handoff.
 */
export default async function AssistantLeadsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  const actor = await requireInternalActor(locale);

  const dbConfigured = isDatabaseConfigured();
  let leads: Awaited<ReturnType<typeof listLeadsForAdmin>> = [];
  let loadError: string | null = null;

  if (dbConfigured) {
    try {
      leads = await listLeadsForAdmin();
    } catch (error) {
      console.error("[assistant-leads-admin:load-failed]", error);
      loadError = "در حال حاضر امکان اتصال به پایگاه داده وجود ندارد. لطفاً لحظاتی دیگر دوباره تلاش کنید.";
    }
  }

  // Round 2026-07-25 (Part C/G) — never shown in the default operational view.
  leads = leads.filter((lead) => !isStagingTestRecord(lead));

  const rows = leads.map((lead) => {
    const latestBooking = lead.bookingRequests[0] ?? null;
    const questionCount = lead.assistantSessions.reduce((sum, session) => sum + session.messages.filter((m) => m.role === "user").length, 0);
    const allMessageDates = lead.assistantSessions.flatMap((session) => session.messages.map((m) => m.createdAt.getTime()));
    const lastInteraction = allMessageDates.length > 0 ? new Date(Math.max(...allMessageDates)) : lead.createdAt;
    return { lead, latestBooking, questionCount, lastInteraction, isUrgent: hasUrgentHandoff(lead.assistantSessions) };
  });

  return (
    <main dir="rtl" className="min-h-dvh bg-warm-white text-charcoal">
      <InternalNav locale={locale} active="assistant-leads" actor={actor} />
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold text-deep-navy">لیدهای دستیار هوشمند</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/70">
          این بخش برای پیگیری سرنخ‌های ثبت‌شده از دستیار هوشمند کلینیک استفاده می‌شود.
        </p>

        {!dbConfigured && <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">فهرست لیدها موقتاً در دسترس نیست.</div>}
        {loadError && <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}

        {dbConfigured && !loadError && rows.length === 0 && (
          <div className="mt-6 rounded-lg border border-charcoal/10 bg-charcoal/[0.03] px-4 py-3 text-sm text-charcoal/60">هنوز هیچ سرنخی ثبت نشده است.</div>
        )}

        {rows.length > 0 && (
          <>
            {/* Desktop: full-width table. */}
            <div className="mt-6 hidden overflow-x-auto rounded-xl border border-charcoal/10 lg:block">
              <table className="w-full min-w-[1200px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-charcoal/10 bg-charcoal/[0.03] text-right text-xs text-charcoal/60">
                    <th className="px-3 py-2.5 font-medium">نام</th>
                    <th className="px-3 py-2.5 font-medium">موبایل</th>
                    <th className="px-3 py-2.5 font-medium">خدمت / علاقه‌مندی</th>
                    <th className="px-3 py-2.5 font-medium">مسیر ورود</th>
                    <th className="px-3 py-2.5 font-medium">وضعیت</th>
                    <th className="px-3 py-2.5 font-medium">روش تماس</th>
                    <th className="px-3 py-2.5 font-medium">تعداد سؤال‌ها</th>
                    <th className="px-3 py-2.5 font-medium">آخرین تعامل</th>
                    <th className="px-3 py-2.5 font-medium">گفت‌وگو با دستیار</th>
                    <th className="px-3 py-2.5 font-medium">اقدام</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ lead, latestBooking, questionCount, lastInteraction, isUrgent }) => (
                    <tr id={`lead-${lead.id}`} key={lead.id} className="border-b border-charcoal/5 last:border-0">
                      <td className="px-3 py-3">
                        <p className="font-medium">{lead.fullName}</p>
                        {isUrgent && <span className="mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">نیازمند پیگیری فوری</span>}
                      </td>
                      <td className="px-3 py-3" dir="ltr">
                        {formatPersianPhone(lead.mobile)}
                      </td>
                      <td className="px-3 py-3">{lead.selectedService ? (SERVICE_LABELS[lead.selectedService] ?? lead.selectedService) : "—"}</td>
                      <td className="px-3 py-3 text-charcoal/70">{leadSourceLabel(lead.source)}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center rounded-full bg-deep-navy/10 px-2.5 py-0.5 text-xs text-deep-navy">{LEAD_STATUS_LABELS[lead.status]}</span>
                      </td>
                      <td className="px-3 py-3 text-charcoal/70">{lead.preferredContactMethod ? CONTACT_METHOD_LABELS[lead.preferredContactMethod] : "—"}</td>
                      <td className="px-3 py-3 text-charcoal/70">{questionCount > 0 ? `${formatPersianDigits(questionCount)} سؤال از دستیار` : "—"}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-charcoal/60">{formatPersianDateTime(lastInteraction)}</td>
                      <td className="px-3 py-3">
                        <ConversationTranscript sessions={lead.assistantSessions} serviceLabels={SERVICE_LABELS} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {latestBooking ? (
                          <a href={`/${locale}/internal/appointments#booking-${latestBooking.id}`} className="text-xs text-gold hover:text-gold-hover">
                            مشاهده نوبت
                          </a>
                        ) : (
                          <span className="text-xs text-charcoal/35">بدون درخواست نوبت</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/tablet: one card per lead, same data as the table row. */}
            <div className="mt-6 flex flex-col gap-4 lg:hidden">
              {rows.map(({ lead, latestBooking, questionCount, lastInteraction, isUrgent }) => (
                <div id={`lead-${lead.id}`} key={lead.id} className="rounded-xl border border-charcoal/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-deep-navy">{lead.fullName}</p>
                      <p className="mt-0.5 text-xs text-charcoal/60" dir="ltr">
                        {formatPersianPhone(lead.mobile)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center rounded-full bg-deep-navy/10 px-2.5 py-0.5 text-xs text-deep-navy">{LEAD_STATUS_LABELS[lead.status]}</span>
                      {isUrgent && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">نیازمند پیگیری فوری</span>}
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <dt className="text-charcoal/45">خدمت / علاقه‌مندی</dt>
                      <dd className="mt-0.5 text-charcoal/80">{lead.selectedService ? (SERVICE_LABELS[lead.selectedService] ?? lead.selectedService) : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-charcoal/45">مسیر ورود</dt>
                      <dd className="mt-0.5 text-charcoal/80">{leadSourceLabel(lead.source)}</dd>
                    </div>
                    <div>
                      <dt className="text-charcoal/45">روش تماس</dt>
                      <dd className="mt-0.5 text-charcoal/80">{lead.preferredContactMethod ? CONTACT_METHOD_LABELS[lead.preferredContactMethod] : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-charcoal/45">تعداد سؤال‌ها</dt>
                      <dd className="mt-0.5 text-charcoal/80">{questionCount > 0 ? formatPersianDigits(questionCount) : "—"}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex items-center justify-between border-t border-charcoal/5 pt-3 text-xs">
                    <ConversationTranscript sessions={lead.assistantSessions} serviceLabels={SERVICE_LABELS} />
                    {latestBooking ? (
                      <a href={`/${locale}/internal/appointments#booking-${latestBooking.id}`} className="text-gold hover:text-gold-hover">
                        مشاهده نوبت
                      </a>
                    ) : (
                      <span className="text-charcoal/35">بدون درخواست نوبت</span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-charcoal/40">آخرین تعامل: {formatPersianDateTime(lastInteraction)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
