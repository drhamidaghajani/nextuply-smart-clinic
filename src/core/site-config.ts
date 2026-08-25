/**
 * Canonical production site URL — needed by `generateMetadata`'s
 * `alternates.canonical`, `sitemap.ts`, and JSON-LD `@id`/`url` fields
 * alike. Did not exist anywhere in the repo before the phase-1 WordPress
 * migration (see docs/migration/sadighi-wordpress-seo-audit/
 * implementation-spec/implementation-plan.md's SEO metadata strategy) —
 * added once, here, instead of three separate hardcoded strings.
 */
export const SITE_URL = "https://dralirezasadighi.com";

export function absoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
