import type { Dictionary } from "@/i18n/dictionaries/fa";

/**
 * HOMEPAGE_STORYBOARD.md §2 "11 — Footer (Premium)". Two locations per
 * DATABASE_GUIDE.md's `Location` entity (Tehran + Tabriz).
 */
export function SiteFooter({ dict }: { dict: Dictionary["footer"] }) {
  return (
    <footer className="bg-charcoal px-6 py-16 text-warm-white/80 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
        <div>
          <h3 className="text-sm font-medium text-gold">{dict.locations.tabriz.label}</h3>
          <p className="mt-3 text-sm leading-7">{dict.locations.tabriz.address}</p>
          <p className="mt-1 text-sm">{dict.locations.tabriz.phone}</p>
          <p className="text-sm">{dict.locations.tabriz.mobile}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gold">{dict.locations.tehran.label}</h3>
          <p className="mt-3 text-sm leading-7">{dict.locations.tehran.address}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gold">ساعات کاری</h3>
          <p className="mt-3 text-sm leading-7">{dict.hours}</p>
          <p className="mt-3 text-sm">اینستاگرام: {dict.instagram}</p>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-5xl border-t border-warm-white/10 pt-6 text-xs text-warm-white/40">
        © {new Date().getFullYear()} دکتر علیرضا صدیقی — معماری دیجیتال توسط Nextuply
      </p>
    </footer>
  );
}
