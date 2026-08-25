import Link from "next/link";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

export interface KnowledgeLatestArticleItem {
  key: string;
  href: string;
  title: string;
  meta: string;
}

const LABEL: Record<Locale, string> = { fa: "جدیدترین مقالات", en: "Latest articles", ar: "أحدث المقالات" };

/**
 * Compact "Latest articles" list for the article detail page's sidebar
 * (2026-08-25 redesign) — same hairline-divided, gold-accented editorial
 * grammar as `EditorialCardGrid`, but a narrow single-column variant:
 * `EditorialCardGrid`'s `sm:w-64` label column and large ghost index
 * numbers are tuned for the full content-width "related articles"
 * section, not an ~300px sidebar rail, so this is its own component
 * rather than a forced reuse — same visual language (hairlines, gold on
 * hover, no boxed cards), different proportions.
 */
export function KnowledgeLatestArticles({ items, locale }: { items: readonly KnowledgeLatestArticleItem[]; locale: Locale }) {
  if (items.length === 0) return null;
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "←" : "→";
  return (
    <div dir={LOCALE_DIRECTION[locale]}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{LABEL[locale]}</p>
      <ol className="mt-4 border-t border-charcoal/10">
        {items.map((item) => (
          <li key={item.key} className="border-b border-charcoal/10">
            <Link
              href={item.href}
              className="group flex items-center justify-between gap-3 py-4 transition-colors duration-300 ease-out hover:text-gold"
            >
              <span className="flex-1">
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-charcoal transition-colors duration-300 ease-out group-hover:text-gold">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs text-charcoal/45">{item.meta}</span>
              </span>
              <span aria-hidden className="shrink-0 text-charcoal/25 transition-colors duration-300 ease-out group-hover:text-gold">
                {arrow}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
