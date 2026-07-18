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
  CONTACT_METHOD_LABELS,
  LEAD_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
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
 * Internal-only prototype view of Smart Clinic Assistant leads — per
 * Hamid's 2026-07-13 persistence-pass brief, protection tightened
 * 2026-07-13 (round 2, per his "protect the internal assistant leads
 * view" instruction).
 *
 * Access is gated by `src/middleware.ts`'s `guardInternalRoute` (a shared
 * `INTERNAL_ADMIN_TOKEN` bearer token + short-lived httpOnly cookie) —
 * see that file's doc-comment for the exact mechanism and its limits.
 * This is still NOT production-grade auth: one shared token, no
 * accounts, no audit log. It is acceptable only as long as
 * `INTERNAL_ADMIN_TOKEN` is actually set wherever this is deployed
 * (unset ⇒ the route 404s in production, per the middleware) and until
 * real staff auth exists (`PROJECT_UNDERSTANDING.md` §13's open
 * question). Do not remove this comment when adding real auth — replace
 * it with a note pointing at the ADR that introduced it.
 *
 * Staff-facing UI text on this page stays Persian-only by design (not
 * locale-switched) — this is an internal ops tool for clinic reception,
 * not public content; only the record *values* that are inherently
 * locale-shaped (dates) follow the `locale` route param, per Task 3/6 of
 * the 2026-07-13 brief.
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
      loadError = "اتصال به پایگاه داده برقرار نشد. تنظیمات DATABASE_URL را بررسی کنید.";
    }
  }

  return (
    <main dir="rtl" className="min-h-dvh bg-warm-white text-charcoal">
      <div className="pt-[68px] lg:pt-[88px]">
        <InternalNav locale={locale} active="assistant-leads" actor={actor} />
      </div>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <h1 className="text-xl font-bold text-deep-navy">سرنخ‌های دستیار هوشمند کلینیک (داخلی)</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/70">
          این صفحه با یک توکن مشترک (<code className="font-mono">INTERNAL_ADMIN_TOKEN</code>) محافظت می‌شود، نه یک سامانهٔ احراز
          هویت واقعی — فقط برای بررسی داده‌های واقعی در محیط توسعه/استیجینگ. پیش از هرگونه انتشار عمومی گسترده‌تر، باید لایهٔ
          احراز هویت واقعی جایگزین شود.
        </p>

        {!dbConfigured && (
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">
            متغیر محیطی <code className="font-mono">DATABASE_URL</code> تنظیم نشده — هیچ سرنخی ذخیره‌سازی نمی‌شود و این صفحه چیزی
            برای نمایش ندارد.
          </div>
        )}

        {loadError && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
        )}

        {dbConfigured && !loadError && leads.length === 0 && (
          <div className="mt-6 rounded-lg border border-charcoal/10 bg-charcoal/[0.03] px-4 py-3 text-sm text-charcoal/60">
            هنوز هیچ سرنخی ثبت نشده است.
          </div>
        )}

        {leads.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-lg border border-charcoal/10">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 bg-charcoal/[0.03] text-right text-xs text-charcoal/60">
                  <th className="px-3 py-2 font-medium">نام</th>
                  <th className="px-3 py-2 font-medium">موبایل</th>
                  <th className="px-3 py-2 font-medium">خدمت</th>
                  <th className="px-3 py-2 font-medium">وضعیت سرنخ</th>
                  <th className="px-3 py-2 font-medium">زمان ترجیحی</th>
                  <th className="px-3 py-2 font-medium">وضعیت نوبت</th>
                  <th className="px-3 py-2 font-medium">وضعیت پرداخت</th>
                  <th className="px-3 py-2 font-medium">روش تماس</th>
                  <th className="px-3 py-2 font-medium">گفتگو با دستیار</th>
                  <th className="px-3 py-2 font-medium">تاریخ ثبت</th>
                  <th className="px-3 py-2 font-medium">نوبت</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const latestBooking = lead.bookingRequests[0] ?? null;
                  const latestPayment = lead.paymentDrafts[0] ?? null;
                  return (
                    <tr id={`lead-${lead.id}`} key={lead.id} className="border-b border-charcoal/5 last:border-0">
                      <td className="px-3 py-2">{lead.fullName}</td>
                      <td className="px-3 py-2 font-mono" dir="ltr">
                        {lead.mobile}
                      </td>
                      <td className="px-3 py-2">{lead.selectedService ? (SERVICE_LABELS[lead.selectedService] ?? lead.selectedService) : "—"}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded-full bg-deep-navy/10 px-2.5 py-0.5 text-xs text-deep-navy">
                          {LEAD_STATUS_LABELS[lead.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-charcoal/70">
                        {latestBooking?.preferredDate ?? "—"}
                        {latestBooking?.preferredTimeRange ? ` (${latestBooking.preferredTimeRange})` : ""}
                      </td>
                      <td className="px-3 py-2">{latestBooking ? APPOINTMENT_STATUS_LABELS[latestBooking.appointmentStatus] : "—"}</td>
                      <td className="px-3 py-2">{latestPayment ? PAYMENT_STATUS_LABELS[latestPayment.paymentStatus] : "—"}</td>
                      <td className="px-3 py-2">
                        {lead.preferredContactMethod ? CONTACT_METHOD_LABELS[lead.preferredContactMethod] : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <ConversationTranscript sessions={lead.assistantSessions} locale={locale} serviceLabels={SERVICE_LABELS} />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-charcoal/60">{formatDateTimeForLocale(lead.createdAt, locale)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {latestBooking ? (
                          <a href={`/${locale}/internal/appointments#booking-${latestBooking.id}`} className="text-xs text-gold hover:text-gold-hover">
                            مشاهده نوبت
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
