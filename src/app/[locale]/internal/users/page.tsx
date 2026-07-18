import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InternalNav } from "@/components/internal/internal-nav";
import { isDatabaseConfigured } from "@/infrastructure/db/client";
import { formatPersianDateTime } from "@/i18n/persian-format";
import { isSupportedLocale } from "@/i18n/locales";
import { requireOwnerActor } from "@/modules/internal-ops/server/internal-auth";
import { hasAnyOwner, listInternalUsers } from "@/modules/internal-ops/server/internal-user-repository";
import {
  createFirstOwnerAction,
  createSecretaryAction,
  resetInternalUserPasswordAction,
  toggleInternalUserActiveAction,
} from "@/modules/internal-ops/server/internal-user-actions";

/** Staff-only tooling — must never be indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Same per-request rendering requirement as every other `/internal/*` page — see `assistant-leads/page.tsx`'s doc-comment for why. */
export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "اطلاعات وارد‌شده معتبر نیست.",
  password_too_short: "رمز عبور باید حداقل ۸ کاراکتر باشد.",
  username_taken: "این نام کاربری قبلاً استفاده شده است.",
  owner_exists: "حساب مدیر قبلاً ایجاد شده است.",
  db_unavailable: "پایگاه داده در دسترس نیست.",
};

/**
 * Round 2026-07-24 (Internal Operations Lite, Part B) — OWNER-only.
 * Two sections: (1) if no OWNER account exists yet (still on the
 * emergency-token bootstrap path), a one-time "create the first OWNER"
 * form — disappears forever once that account exists, per
 * `createFirstOwnerAction`'s own doc-comment; (2) the ongoing SECRETARY
 * roster — create, activate/deactivate, reset password. No technical IDs
 * ever rendered — every row identifies people by name/username only, the
 * real `id` only ever travels inside a bound Server Action.
 */
export default async function InternalUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; created?: string; reset?: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const actor = await requireOwnerActor(locale);
  const { error, created, reset } = await searchParams;

  const dbConfigured = isDatabaseConfigured();
  let users: Awaited<ReturnType<typeof listInternalUsers>> = [];
  let ownerExists = true;
  let loadError: string | null = null;

  if (dbConfigured) {
    try {
      [users, ownerExists] = await Promise.all([listInternalUsers(), hasAnyOwner()]);
    } catch (err) {
      console.error("[internal-users:load-failed]", err);
      loadError = "در حال حاضر امکان اتصال به پایگاه داده وجود ندارد. لطفاً لحظاتی دیگر دوباره تلاش کنید.";
    }
  }

  const createOwnerAction = createFirstOwnerAction.bind(null, locale);
  const createSecretary = createSecretaryAction.bind(null, locale);

  return (
    <main dir="rtl" className="min-h-dvh bg-warm-white text-charcoal">
      <InternalNav locale={locale} active="users" actor={actor} />
      <div className="mx-auto max-w-7xl px-6 py-6 sm:px-8">
        <h1 className="text-xl font-bold text-deep-navy">کاربران داخلی</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/70">این بخش برای مدیریت حساب‌های ورود کارکنان کلینیک استفاده می‌شود.</p>

        {!dbConfigured && (
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">مدیریت کاربران داخلی موقتاً در دسترس نیست.</div>
        )}
        {loadError && <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}
        {error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "خطایی رخ داد. لطفاً دوباره تلاش کنید."}
          </div>
        )}
        {created && <div className="mt-6 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">حساب کاربری ایجاد شد.</div>}
        {reset && <div className="mt-6 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">رمز عبور بروزرسانی شد.</div>}

        {dbConfigured && !loadError && !ownerExists && (
          <form action={createOwnerAction} className="mt-8 rounded-lg border border-gold/40 bg-gold/10 p-5">
            <h2 className="text-sm font-semibold text-charcoal">ایجاد حساب مدیر اول</h2>
            <p className="mt-1 text-xs leading-5 text-charcoal/60">
              هنوز هیچ حساب «مدیر» ایجاد نشده — شما اکنون از طریق ورود اضطراری وارد شده‌اید. برای اینکه ورود روزمره با نام کاربری/رمز عبور
              انجام شود، یک حساب مدیر برای خودتان بسازید.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                نام و نام خانوادگی
                <input type="text" name="fullName" required className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                نام کاربری
                <input type="text" name="username" required dir="ltr" className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                رمز عبور (حداقل ۸ کاراکتر)
                <input type="password" name="password" required minLength={8} dir="ltr" className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal" />
              </label>
            </div>
            <button type="submit" className="mt-4 rounded-full bg-deep-navy px-5 py-2 text-xs font-semibold text-warm-white transition-colors duration-200 hover:bg-deep-navy/85">
              ایجاد حساب مدیر
            </button>
          </form>
        )}

        {dbConfigured && !loadError && (
          <form action={createSecretary} className="mt-8 rounded-lg border border-charcoal/10 bg-cream p-5">
            <h2 className="text-sm font-semibold text-charcoal">افزودن منشی جدید</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                نام و نام خانوادگی
                <input type="text" name="fullName" required className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                نام کاربری
                <input type="text" name="username" required dir="ltr" className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-charcoal/60">
                رمز عبور موقت (حداقل ۸ کاراکتر)
                <input type="password" name="password" required minLength={8} dir="ltr" className="rounded-md border border-charcoal/15 bg-warm-white px-2 py-1.5 text-sm text-charcoal" />
              </label>
            </div>
            <button type="submit" className="mt-4 rounded-full bg-deep-navy px-5 py-2 text-xs font-semibold text-warm-white transition-colors duration-200 hover:bg-deep-navy/85">
              افزودن منشی
            </button>
          </form>
        )}

        {dbConfigured && !loadError && (
          <>
            {users.length === 0 ? (
              <div className="mt-6 rounded-lg border border-charcoal/10 bg-charcoal/[0.03] px-4 py-3 text-sm text-charcoal/60">هنوز هیچ کاربری ثبت نشده است.</div>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-lg border border-charcoal/10">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-charcoal/10 bg-charcoal/[0.03] text-right text-xs text-charcoal/60">
                      <th className="px-3 py-2 font-medium">نام</th>
                      <th className="px-3 py-2 font-medium">نام کاربری</th>
                      <th className="px-3 py-2 font-medium">نقش</th>
                      <th className="px-3 py-2 font-medium">وضعیت</th>
                      <th className="px-3 py-2 font-medium">آخرین ورود</th>
                      <th className="px-3 py-2 font-medium">تغییر رمز عبور</th>
                      <th className="px-3 py-2 font-medium">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const toggleAction = toggleInternalUserActiveAction.bind(null, locale, user.id, !user.isActive);
                      const resetAction = resetInternalUserPasswordAction.bind(null, locale, user.id);
                      const isSelf = actor.kind === "user" && actor.user.id === user.id;
                      return (
                        <tr key={user.id} className="border-b border-charcoal/5 align-top last:border-0">
                          <td className="px-3 py-3 font-medium">{user.fullName}</td>
                          <td className="px-3 py-3 font-mono" dir="ltr">
                            {user.username}
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center rounded-full bg-deep-navy/10 px-2.5 py-0.5 text-xs text-deep-navy">
                              {user.role === "OWNER" ? "مدیرکل" : "منشی"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${
                                user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-charcoal/10 text-charcoal/50"
                              }`}
                            >
                              {user.isActive ? "فعال" : "غیرفعال"}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-charcoal/60">
                            {user.lastLoginAt ? formatPersianDateTime(user.lastLoginAt) : "هنوز وارد نشده"}
                          </td>
                          <td className="px-3 py-3">
                            <form action={resetAction} className="flex items-center gap-1.5">
                              <input
                                type="password"
                                name="password"
                                required
                                minLength={8}
                                placeholder="رمز جدید"
                                dir="ltr"
                                className="w-28 rounded-md border border-charcoal/15 px-2 py-1 text-xs"
                              />
                              <button type="submit" className="rounded-full border border-charcoal/20 px-3 py-1 text-xs text-charcoal/70 transition-colors duration-200 hover:border-gold hover:text-gold">
                                تنظیم
                              </button>
                            </form>
                          </td>
                          <td className="px-3 py-3">
                            {user.role === "OWNER" ? (
                              <span className="text-xs text-charcoal/35">{isSelf ? "حساب شما" : "—"}</span>
                            ) : (
                              <form action={toggleAction}>
                                <button type="submit" className="rounded-full border border-charcoal/20 px-3 py-1 text-xs text-charcoal/70 transition-colors duration-200 hover:border-gold hover:text-gold">
                                  {user.isActive ? "غیرفعال کردن" : "فعال کردن"}
                                </button>
                              </form>
                            )}
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
