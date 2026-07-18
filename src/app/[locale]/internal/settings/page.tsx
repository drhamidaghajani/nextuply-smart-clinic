import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InternalNav } from "@/components/internal/internal-nav";
import { isSupportedLocale } from "@/i18n/locales";
import { actorDisplayName, requireInternalActor } from "@/modules/internal-ops/server/internal-auth";
import { changeOwnPasswordAction } from "@/modules/internal-ops/server/internal-user-actions";

/** Staff-only tooling — must never be indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Same per-request rendering requirement as every other `/internal/*` page — see `assistant-leads/page.tsx`'s doc-comment for why. */
export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "اطلاعات وارد‌شده معتبر نیست.",
  password_too_short: "رمز عبور جدید باید حداقل ۸ کاراکتر باشد.",
  current_password_invalid: "رمز عبور فعلی نادرست است.",
  db_unavailable: "پایگاه داده در دسترس نیست.",
};

const ROLE_LABELS: Record<"OWNER" | "SECRETARY", string> = { OWNER: "مدیر", SECRETARY: "منشی" };

/**
 * Round 2026-07-24 (Internal Operations Lite, Part B) — reachable by
 * EVERY authenticated internal actor (OWNER or SECRETARY, bootstrap or a
 * real account): shows the current role and, for a real `InternalUser`
 * session only, an own-password-change form. The bootstrap "ورود اضطراری
 * مدیرکل" identity has no stored password of its own to change (it IS
 * `INTERNAL_ADMIN_TOKEN`, an env var, not a DB row) — that case shows an
 * explanatory note instead of a form that could never work.
 */
export default async function InternalSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const actor = await requireInternalActor(locale);
  const { error } = await searchParams;

  const changePasswordAction = changeOwnPasswordAction.bind(null, locale);

  return (
    <main dir="rtl" className="min-h-dvh bg-warm-white text-charcoal">
      <div className="pt-[68px] lg:pt-[88px]">
        <InternalNav locale={locale} active="settings" actor={actor} />
      </div>
      <div className="mx-auto max-w-xl px-6 py-10 sm:px-8">
        <h1 className="text-xl font-bold text-deep-navy">تنظیمات حساب (داخلی)</h1>

        <div className="mt-6 rounded-lg border border-charcoal/10 bg-cream p-5">
          <p className="text-xs text-charcoal/50">نام</p>
          <p className="mt-1 text-sm font-medium text-charcoal">{actorDisplayName(actor)}</p>
          <p className="mt-3 text-xs text-charcoal/50">نقش</p>
          <p className="mt-1 text-sm font-medium text-charcoal">{actor.kind === "bootstrap" ? "مدیرکل (ورود اضطراری)" : ROLE_LABELS[actor.role]}</p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "خطایی رخ داد. لطفاً دوباره تلاش کنید."}
          </div>
        )}

        {actor.kind === "user" ? (
          <form action={changePasswordAction} className="mt-6 rounded-lg border border-charcoal/10 bg-white p-5">
            <h2 className="text-sm font-semibold text-charcoal">تغییر رمز عبور</h2>
            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                رمز عبور فعلی
                <input
                  type="password"
                  name="currentPassword"
                  required
                  dir="ltr"
                  className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                رمز عبور جدید (حداقل ۸ کاراکتر)
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={8}
                  dir="ltr"
                  className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal"
                />
              </label>
            </div>
            <button
              type="submit"
              className="mt-4 rounded-full bg-deep-navy px-5 py-2 text-xs font-semibold text-warm-white transition-colors duration-200 hover:bg-deep-navy/85"
            >
              بروزرسانی رمز عبور
            </button>
            <p className="mt-3 text-[11px] leading-5 text-charcoal/45">پس از تغییر رمز عبور، باید دوباره وارد شوید.</p>
          </form>
        ) : (
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">
            ورود اضطراری مدیرکل رمز عبور جداگانه‌ای ندارد — این کد دسترسی از متغیر محیطی سرور تنظیم می‌شود. برای ورود روزمره با نام کاربری و
            رمز عبور، از «کاربران داخلی» یک حساب مدیر بسازید.
          </div>
        )}
      </div>
    </main>
  );
}
