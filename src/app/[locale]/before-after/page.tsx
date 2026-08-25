import { existsSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { BeforeAfterShowcase } from "@/components/page/before-after-showcase";
import { DisclaimerBanner } from "@/components/page/disclaimer-banner";
import { PageHero } from "@/components/page/page-hero";
import { BEFORE_AFTER_CASES, isBeforeAfterCategory, type BeforeAfterCase } from "@/content/before-after-cases";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";

/**
 * Task 6 (image validation, 2026-08-25 rebuild): confirms both files of
 * every view actually exist on disk before a case is ever rendered —
 * "do not crash the page if a case has a missing image" from a server
 * error page, and "do not include broken image references" in the
 * markup. All 60 files were manually verified present (`find` + `sips`
 * dimension checks + direct visual inspection of the flagged ones) as
 * part of this same round, so this filter is expected to exclude
 * nothing today — it's defense-in-depth against a future upload gap,
 * not a workaround for a known-bad file. `fs` is safe to use here
 * because this file is a Server Component; the shared
 * `content/before-after-cases.ts` module stays fs-free since a Client
 * Component (`BeforeAfterShowcase`) also needs to import its types.
 */
function caseHasAllImages(caseItem: BeforeAfterCase): boolean {
  return caseItem.views.every((v) => {
    const beforePath = path.join(process.cwd(), "public", v.before);
    const afterPath = path.join(process.cwd(), "public", v.after);
    return existsSync(beforePath) && existsSync(afterPath);
  });
}

/**
 * Round 2026-08-25 (pre-launch rebuild): the previous version of this
 * page was `BeforeAfterGalleryPremium` showing ONE static marketing
 * photo per service (`REAL_PHOTOS`) — not an actual before/after
 * comparison, and not connected to the 60 real patient photos Hamid
 * uploaded under `public/media/before-after/`. Rebuilt on
 * `content/before-after-cases.ts`'s real 24-case data model, with a
 * genuine before/after slider per case (`BeforeAfterShowcase` /
 * `BeforeAfterSlider`) instead of a single photo. `BeforeAfterGalleryPremium`
 * and `REAL_PHOTOS` are left in place, unused by this page — per
 * Hamid's explicit "do not delete" instruction — since `REAL_PHOTOS` is
 * still actively used elsewhere (service hero photos, the homepage case
 * gallery, the internal admin gallery).
 */
export default async function BeforeAfterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const { category } = await searchParams;
  const activeCategory = isBeforeAfterCategory(category) ? category : null;

  const dict = getDictionary(locale);
  const page = dict.beforeAfterPage;

  const validCases = BEFORE_AFTER_CASES.filter((c) => {
    const ok = caseHasAllImages(c);
    if (!ok) console.warn(`[before-after] excluding case "${c.id}" — one or more image files missing on disk`);
    return ok;
  });

  return (
    <main>
      <PageHero eyebrow={page.eyebrow} title={page.title} subtitle={page.subtitle} locale={locale} breadcrumb={[{ label: page.eyebrow }]} />
      <BeforeAfterShowcase cases={validCases} locale={locale} initialCategory={activeCategory} />
      <section className="bg-gradient-to-b from-[#141d33] to-deep-navy px-6 pb-16 sm:px-8 sm:pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <DisclaimerBanner text={page.disclaimer} tone="dark" />
        </div>
      </section>
      <AssistantCtaSection heading={page.ctaHeading} body={page.ctaBody} buttonLabel={page.ctaButton} intent="consultation_booking" />
    </main>
  );
}
