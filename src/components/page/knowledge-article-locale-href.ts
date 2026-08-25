import { getKnowledgeArticleByLocalizedSlug, getKnowledgeArticleBySlug, type KnowledgeArticle } from "@/content/knowledge-articles";
import { localeFromPathname, localeHref, pathWithoutLocalePrefix } from "@/i18n/locale-href";
import type { Locale } from "@/i18n/locales";

/**
 * Fixes the language-switcher 404 bug on Knowledge Center articles
 * (2026-08-25 staging QA): `LanguageSwitcher`'s normal path-based swap
 * (strip the current locale prefix, add the target one, keep the rest of
 * the path unchanged) assumes a page's slug is IDENTICAL across all
 * three locales — true everywhere except Knowledge Center articles,
 * where English/Arabic translations have their OWN slug (see
 * `content/knowledge-articles.ts`). Swapping fa→en on `/knowledge/
 * لیفت-ابرو-و-شقیقه` naively produced `/en/knowledge/لیفت-ابرو-و-شقیقه`
 * — a URL matching no translation, i.e. a 404 — instead of
 * `/en/knowledge/brow-and-temple-lift`.
 *
 * A first attempt at this fix used a React Context the article page
 * populated via a client-side `useEffect` — rejected after live-testing
 * showed the SERVER-RENDERED HTML (and any native link click before that
 * effect runs, milliseconds after hydration but not zero) still carried
 * the broken path-based href. This version is a PURE function of the
 * pathname alone, backed by the same static `KNOWLEDGE_ARTICLES` data
 * already used everywhere else — it produces the identical result during
 * SSR and client hydration, so there's no window where a click could hit
 * the wrong URL.
 *
 * Returns `null` for every page that ISN'T a Knowledge Center article
 * (`LanguageSwitcher` falls back to its normal path-based swap, which is
 * correct there); returns the target locale's Knowledge Center INDEX
 * href — never a 404, never Persian body text — when the article has no
 * translation for that locale yet, per Hamid's explicit "fallback to the
 * localized index, not 404" instruction.
 *
 * Deliberately reuses `localeFromPathname`/`pathWithoutLocalePrefix`
 * (`i18n/locale-href.ts`) rather than matching `/knowledge/`, `/en/
 * knowledge/`, `/ar/knowledge/` as three separate raw patterns — a first
 * version of this file did exactly that and stayed broken on Persian
 * article pages, because `usePathname()` on a bare Persian route reports
 * the middleware-REWRITTEN `/fa/knowledge/<slug>` path (see `middleware.ts`
 * / `locale-href.ts`'s own doc-comment), not the `/knowledge/<slug>` the
 * address bar shows — a raw `/^\/knowledge\//` pattern never matched it.
 * The two shared helpers already handle that rewrite correctly (that's
 * exactly the bug they were written to fix, for this same component,
 * one round earlier), so reusing them here can't reintroduce it.
 */
const KNOWLEDGE_ARTICLE_PATTERN = /^\/knowledge\/([^/]+)\/?$/;

export function resolveKnowledgeArticleLocaleHref(pathname: string, targetLocale: Locale): string | null {
  const currentLocale = localeFromPathname(pathname);
  const bare = pathWithoutLocalePrefix(pathname);
  const match = bare.match(KNOWLEDGE_ARTICLE_PATTERN);
  if (!match) return null;
  const slug = match[1];

  const article: KnowledgeArticle | undefined =
    currentLocale === "fa" ? getKnowledgeArticleBySlug(slug) : getKnowledgeArticleByLocalizedSlug(currentLocale, slug)?.article;
  if (!article) return null;

  if (targetLocale === "fa") return localeHref("fa", `/knowledge/${article.slug}`);
  const translation = article.translations?.[targetLocale];
  return translation ? localeHref(targetLocale, `/knowledge/${translation.slug}`) : localeHref(targetLocale, "/knowledge");
}
