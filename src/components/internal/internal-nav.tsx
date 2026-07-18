import type { Locale } from "@/i18n/locales";
import { internalLogoutAction } from "@/modules/smart-clinic-assistant/server/admin-actions";
import { actorDisplayName, type InternalActor } from "@/modules/internal-ops/server/internal-auth";

/**
 * Shared top nav for every AUTHENTICATED `/internal/*` page (Clinic
 * Operations Dashboard Lite, round 2026-07-15) — one secretary now
 * navigates between dashboard/appointments/availability/leads/gallery
 * from a single persistent bar instead of needing to remember or
 * bookmark four separate URLs. Deliberately imported and rendered
 * per-page (dashboard/appointments/availability/assistant-leads/
 * gallery), not via a wrapping layout — `/internal/login` is under the
 * same route segment but must never show this (a logout button before
 * anyone's logged in is just confusing), and a shared `internal/
 * layout.tsx` has no clean way to know which child route it's wrapping
 * without extra route-group restructuring this "lite" pass doesn't need.
 *
 * Server Component — the only interactive piece is the logout `<form>`,
 * a Server Action, zero client JS. Never rendered on any public page —
 * grep for `InternalNav` finds it nowhere outside `src/app/[locale]/
 * internal/`.
 *
 * Round 2026-07-24 (Internal Operations Lite, Part B, per Hamid's exact
 * nav list — "کاربران داخلی only OWNER"): now takes the resolved `actor`
 * (see `internal-auth.ts`) so it can show the signed-in name/role and
 * hide "کاربران داخلی" from a SECRETARY entirely (not just block the
 * route — an unreachable link in the nav would be confusing). "تنظیمات"
 * is shown to every authenticated actor (own-password change).
 */
const NAV_LINKS = [
  { segment: "dashboard", label: "داشبورد" },
  { segment: "appointments", label: "نوبت‌ها" },
  { segment: "availability", label: "زمان‌بندی" },
  { segment: "assistant-leads", label: "لیدها" },
  { segment: "gallery", label: "گالری" },
] as const;

const ROLE_LABELS: Record<"OWNER" | "SECRETARY", string> = { OWNER: "مدیر", SECRETARY: "منشی" };

export function InternalNav({
  locale,
  active,
  actor,
}: {
  locale: Locale;
  active?: (typeof NAV_LINKS)[number]["segment"] | "users" | "settings";
  actor: InternalActor;
}) {
  const logoutAction = internalLogoutAction.bind(null, locale);
  const isOwner = actor.role === "OWNER";

  return (
    <nav dir="rtl" className="flex flex-wrap items-center justify-between gap-3 bg-deep-navy px-6 py-4 sm:px-8">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">پنل داخلی کلینیک</span>
      <div className="flex flex-wrap items-center gap-1">
        {NAV_LINKS.map((link) => (
          <a
            key={link.segment}
            href={`/${locale}/internal/${link.segment}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              active === link.segment ? "bg-gold/15 text-gold" : "text-warm-white/70 hover:bg-warm-white/10 hover:text-warm-white"
            }`}
          >
            {link.label}
          </a>
        ))}
        {isOwner && (
          <a
            href={`/${locale}/internal/users`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              active === "users" ? "bg-gold/15 text-gold" : "text-warm-white/70 hover:bg-warm-white/10 hover:text-warm-white"
            }`}
          >
            کاربران داخلی
          </a>
        )}
        <a
          href={`/${locale}/internal/settings`}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
            active === "settings" ? "bg-gold/15 text-gold" : "text-warm-white/70 hover:bg-warm-white/10 hover:text-warm-white"
          }`}
        >
          تنظیمات
        </a>
        <span className="mx-1 hidden text-[11px] text-warm-white/35 sm:inline">
          {actorDisplayName(actor)} · {actor.kind === "bootstrap" ? "مدیرکل" : ROLE_LABELS[actor.role]}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-warm-white/50 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300"
          >
            خروج
          </button>
        </form>
      </div>
    </nav>
  );
}
