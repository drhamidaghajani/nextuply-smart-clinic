import type { MetadataRoute } from "next";

/**
 * Sitewide `robots.txt` (Next.js metadata route — generates `/robots.txt`
 * automatically). Added as part of the pre-staging DB persistence pass:
 * `/{locale}/internal/*` is staff-only tooling (leads, appointments,
 * availability, gallery admin) gated by `INTERNAL_ADMIN_TOKEN` in
 * `src/middleware.ts`, but a token gate alone doesn't stop the URL from
 * being crawled/indexed if it's ever linked from anywhere. `Disallow`
 * here is the crawl-time signal; each internal page's own
 * `export const metadata = { robots: { index: false, ... } }` is the
 * authoritative no-index signal for pages a crawler reaches anyway
 * (e.g. via an external link) — the two are complementary, not
 * redundant.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/*/internal/",
    },
  };
}
