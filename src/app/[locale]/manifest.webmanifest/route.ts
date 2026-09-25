import { NextResponse } from "next/server";
import { notFound } from "next/navigation";

import { buildPwaManifest, GENERATED_MANIFEST_LOCALES } from "@/core/pwa-manifest";
import { isSupportedLocale } from "@/i18n/locales";

/**
 * Round 2026-09-25 (locale-aware PWA launch, per Hamid's brief). Serves
 * `/[locale]/manifest.webmanifest` — the manifest English and Arabic pages
 * link, each carrying its own `start_url` (`/en`, `/ar`) and
 * locale-appropriate `name`/`short_name`/`description`/`lang`/`dir`. See
 * `core/pwa-manifest.ts` for the data and the full reasoning.
 *
 * WHY A ROUTE HANDLER AND NOT NEXT'S `manifest.ts` CONVENTION: Next's
 * `manifest` metadata file is only recognized at the app root — its matcher
 * is anchored (`^[\\/]manifest`, see `lib/metadata/is-metadata-route.js`),
 * so a `manifest.ts` inside the `[locale]` segment is not treated as a
 * metadata route at all and just 404s. A route handler at this exact path is
 * the supported way to produce a locale-scoped manifest, using the same
 * server-side mechanism the rest of this repo's generated assets use — no
 * client-side or `document.head` manipulation anywhere.
 *
 * Persian is NOT generated here (`GENERATED_MANIFEST_LOCALES` excludes it):
 * its manifest is the pre-existing static `public/manifest.webmanifest`,
 * served at the bare `/manifest.webmanifest`. `dynamicParams = false` makes
 * Next reject every param outside that list, so `/fa/manifest.webmanifest`
 * (and any unknown locale) 404s exactly as it did before this change — no new
 * public `/fa/` URL, and no runtime rendering. The middleware is untouched.
 *
 * `force-static`: the manifest is pure build-time data with no per-request
 * dependency, so both locales are prerendered rather than running a function
 * on every fetch.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return GENERATED_MANIFEST_LOCALES.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // Type-narrowing guard (route params arrive as `string`), also covering a
  // future locale added to `PWA_MANIFEST_PATH` without a matching entry in
  // `GENERATED_MANIFEST_LOCALES`.
  if (!isSupportedLocale(locale)) notFound();

  return NextResponse.json(buildPwaManifest(locale), {
    headers: {
      "Content-Type": "application/manifest+json",
      // Manifests are not in the service worker's static allowlist
      // (`public/sw.js`), so this header is the only cache instruction that
      // applies to this response. `must-revalidate` keeps a stale
      // `start_url` from being pinned on a device after a future change.
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
