import Link from "next/link";
import { localeHref } from "@/i18n/locale-href";
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

/**
 * `tone` (2026-09-13): the trail was written only for the dark navy heroes.
 * The Knowledge article masthead is a light cream surface, where
 * `text-warm-white/45` is unreadable — so the same trail can now render
 * against a light background. Defaults to `"onDark"`, which is what every
 * pre-existing caller already assumes.
 */
export function PremiumBreadcrumb({
  items,
  locale,
  tone = "onDark",
}: {
  items: readonly BreadcrumbItem[];
  locale: Locale;
  tone?: "onDark" | "onLight";
}) {
  const trail: BreadcrumbItem[] = [{ label: HOME_LABEL[locale], href: localeHref(locale) }, ...items];
  const mutedClass = tone === "onDark" ? "text-warm-white/45 hover:text-gold" : "text-charcoal/45 hover:text-gold";
  const currentClass = tone === "onDark" ? "text-gold" : "text-charcoal/70";
  const separatorClass = tone === "onDark" ? "text-warm-white/25" : "text-charcoal/25";

  return (
    <nav
      aria-label="breadcrumb"
      className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] sm:text-xs ${tone === "onDark" ? "justify-center" : "flex-wrap justify-start"}`}
    >
      {trail.map((item, index) => {
        const isLast = index === trail.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className={`transition-colors duration-200 ${mutedClass}`}>
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? currentClass : mutedClass}>{item.label}</span>
            )}
            {!isLast ? (
              <span aria-hidden className={separatorClass}>
                /
              </span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
