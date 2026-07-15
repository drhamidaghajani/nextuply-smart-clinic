import Link from "next/link";
import type { Locale } from "@/i18n/locales";

/**
 * Minimal wayfinding trail shown above every internal page's hero —
 * pure navigational chrome (not page content), so the "Home" label lives
 * here as a small locale map rather than in the dictionaries, same tier
 * as e.g. `PageFaq`'s hardcoded "+"/"−" glyphs.
 */
const HOME_LABEL: Record<Locale, string> = { fa: "خانه", en: "Home", ar: "الرئيسية" };

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function PremiumBreadcrumb({ items, locale }: { items: readonly BreadcrumbItem[]; locale: Locale }) {
  const trail: BreadcrumbItem[] = [{ label: HOME_LABEL[locale], href: `/${locale}` }, ...items];

  return (
    <nav aria-label="breadcrumb" className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] sm:text-xs">
      {trail.map((item, index) => {
        const isLast = index === trail.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="text-warm-white/45 transition-colors duration-200 hover:text-gold">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-gold" : "text-warm-white/45"}>{item.label}</span>
            )}
            {!isLast ? (
              <span aria-hidden className="text-warm-white/25">
                /
              </span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
