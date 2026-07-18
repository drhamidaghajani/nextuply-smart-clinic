import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isSupportedLocale } from "@/i18n/locales";
import { submitInternalLoginAction } from "@/modules/smart-clinic-assistant/server/admin-actions";
import { submitInternalUserLoginAction } from "@/modules/internal-ops/server/internal-user-actions";

/** Staff-only tooling — must never be indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The one entry URL every internal user needs to remember: `/{locale}/
 * internal/login`.
 *
 * Round 2026-07-15 (Clinic Operations Dashboard Lite) — originally a
 * single shared access-code form.
 *
 * Round 2026-07-24 (Internal Operations Lite, Part B, per Hamid: "Login UX:
 * ...should support username/password. Also keep a small 'ورود اضطراری
 * مدیرکل' option using INTERNAL_ADMIN_TOKEN if needed"): username/password
 * (`submitInternalUserLoginAction`) is now the PRIMARY, always-visible
 * form — the real per-person login once an OWNER account exists. The old
 * shared access-code form (`submitInternalLoginAction`) still works
 * exactly as before, now tucked behind a `<details>` disclosure labelled
 * "ورود اضطراری مدیرکل" — a plain HTML toggle, zero client JS, matching
 * this page's existing zero-JS convention. Neither path is ever removed
 * by the other: `src/middleware.ts`'s `guardInternalRoute` still accepts
 * both cookies it has always accepted, and an already-authenticated visit
 * here (either kind) still redirects forward to the dashboard before this
 * component even renders.
 */
export default async function InternalLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; passwordChanged?: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const { error, passwordChanged } = await searchParams;

  const userLoginAction = submitInternalUserLoginAction.bind(null, locale);
  const tokenLoginAction = submitInternalLoginAction.bind(null, locale);

  return (
    <main dir="rtl" className="flex min-h-dvh items-center justify-center bg-deep-navy px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-warm-white/10 bg-[#141d33] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">پنل داخلی کلینیک دکتر صدیقی</p>
        <h1 className="mt-3 text-xl font-bold text-warm-white">ورود به پنل داخلی</h1>
        <p className="mt-2 text-sm leading-6 text-warm-white/55">با نام کاربری و رمز عبور خود وارد شوید.</p>

        <form action={userLoginAction} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-xs text-warm-white/60">
            نام کاربری
            <input
              type="text"
              name="username"
              required
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              dir="ltr"
              className="rounded-lg border border-warm-white/15 bg-deep-navy px-3 py-2.5 text-sm text-warm-white outline-none transition-colors duration-200 focus:border-gold/50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-warm-white/60">
            رمز عبور
            <input
              type="password"
              name="password"
              required
              dir="ltr"
              className="rounded-lg border border-warm-white/15 bg-deep-navy px-3 py-2.5 text-sm text-warm-white outline-none transition-colors duration-200 focus:border-gold/50"
            />
          </label>

          {error && <p className="text-xs leading-5 text-red-300">نام کاربری یا رمز عبور نادرست است. لطفاً دوباره تلاش کنید.</p>}
          {passwordChanged && <p className="text-xs leading-5 text-emerald-300">رمز عبور شما تغییر کرد — لطفاً دوباره وارد شوید.</p>}

          <button
            type="submit"
            className="mt-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-deep-navy transition-colors duration-200 hover:bg-gold-hover"
          >
            ورود
          </button>
        </form>

        <details className="mt-6 border-t border-warm-white/10 pt-4">
          <summary className="cursor-pointer text-center text-[11px] text-warm-white/40 hover:text-warm-white/60">ورود اضطراری مدیرکل</summary>
          <form action={tokenLoginAction} className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-xs text-warm-white/60">
              کد دسترسی اضطراری
              <input
                type="password"
                name="accessCode"
                dir="ltr"
                className="rounded-lg border border-warm-white/15 bg-deep-navy px-3 py-2.5 text-sm text-warm-white outline-none transition-colors duration-200 focus:border-gold/50"
              />
            </label>
            <button
              type="submit"
              className="rounded-full border border-warm-white/20 px-5 py-2 text-xs font-semibold text-warm-white/80 transition-colors duration-200 hover:border-gold/50 hover:text-gold"
            >
              ورود اضطراری
            </button>
            <p className="text-[11px] leading-5 text-warm-white/35">
              فقط برای مدیرکل — برای اولین بار، یا اگر دسترسی حساب کاربری ممکن نیست.
            </p>
          </form>
        </details>

        <p className="mt-6 text-center text-[11px] text-warm-white/35">دسترسی داخلی محافظت‌شده</p>
      </div>
    </main>
  );
}
