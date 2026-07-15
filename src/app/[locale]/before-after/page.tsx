import { notFound } from "next/navigation";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { BeforeAfterGalleryPremium } from "@/components/page/before-after-gallery-premium";
import { DisclaimerBanner } from "@/components/page/disclaimer-banner";
import { PageHero } from "@/components/page/page-hero";
import { REAL_PHOTOS } from "@/components/sections/gallery-photos";
import { SERVICES } from "@/content/services";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";

/**
 * Round 2026-07-13 (design-quality pass): rebuilt as a dark, premium
 * results gallery (`BeforeAfterGalleryPremium` — client-side filter,
 * no full-page reload) instead of a plain light grid. Reuses the same
 * real photos (`REAL_PHOTOS`) and the same "no fake medical results"
 * rule as before — items without a real photo still never render.
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

  const dict = getDictionary(locale);
  const page = dict.beforeAfterPage;
  const withPhotos = SERVICES.filter((service) => REAL_PHOTOS[service.galleryCategory]);

  return (
    <main>
      <PageHero eyebrow={page.eyebrow} title={page.title} subtitle={page.subtitle} locale={locale} breadcrumb={[{ label: page.eyebrow }]} />
      <BeforeAfterGalleryPremium items={withPhotos} locale={locale} initialCategory={category ?? null} />
      <section className="bg-gradient-to-b from-[#141d33] to-deep-navy px-6 pb-16 sm:px-8 sm:pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <DisclaimerBanner text={page.disclaimer} tone="dark" />
        </div>
      </section>
      <AssistantCtaSection heading={page.ctaHeading} body={page.ctaBody} buttonLabel={page.ctaButton} intent="consultation_booking" />
    </main>
  );
}
