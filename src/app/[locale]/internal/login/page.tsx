import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isSupportedLocale } from "@/i18n/locales";
import { submitInternalLoginAction } from "@/modules/smart-clinic-assistant/server/admin-actions";

/** Staff-only tooling — must never be indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The one entry URL a secretary needs to remember (Clinic Operations
 * Dashboard Lite, round 2026-07-15, per Hamid's brief): `/{locale}/
 * internal/login`. A single access-code form, POSTed via a Server Action
 * (`submitInternalLoginAction`) — never a query-string token, which is
 * exactly the leak-prone pattern this round explicitly moves away from
 * as the primary UX (the old `?token=` flow still works underneath, see
 * `src/middleware.ts`, but isn't what a secretary is told to use).
 *
 * `src/middleware.ts`'s `guardInternalRoute` already redirects an
 * unauthenticated visit to ANY other `/internal/*` route here, and an
 * already-authenticated visit to THIS route forward to the dashboard —
 * this page itself doesn't need to re-check either direction.
 */
export default async function InternalLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const { error } = await searchParams;

  const loginAction = submitInternalLoginAction.bind(null, locale);

  return (
    <main dir="rtl" className="flex min-h-dvh items-center justify-center bg-deep-navy px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-warm-white/10 bg-[#141d33] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">پنل داخلی کلینیک دکتر صدیقی</p>
        <h1 className="mt-3 text-xl font-bold text-warm-white">ورود به پنل داخلی</h1>
        <p className="mt-2 text-sm leading-6 text-warm-white/55">برای مشاهده و مدیریت درخواست‌های نوبت، لطفاً کد دسترسی داخلی را وارد کنید.</p>

        <form action={loginAction} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-xs text-warm-white/60">
            کد دسترسی
            <input
              type="password"
              name="accessCode"
              required
              autoFocus
              className="rounded-lg border border-warm-white/15 bg-deep-navy px-3 py-2.5 text-sm text-warm-white outline-none transition-colors duration-200 focus:border-gold/50"
            />
          </label>

          {error && <p className="text-xs leading-5 text-red-300">کد دسترسی نامعتبر است. لطفاً دوباره تلاش کنید.</p>}

          <button
            type="submit"
            className="mt-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-deep-navy transition-colors duration-200 hover:bg-gold-hover"
          >
            ورود
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-warm-white/35">دسترسی داخلی محافظت‌شده</p>
      </div>
    </main>
  );
}
