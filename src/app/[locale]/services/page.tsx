import Link from "next/link";
import { notFound } from "next/navigation";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { DisclaimerBanner } from "@/components/page/disclaimer-banner";
import { EditorialIntro } from "@/components/page/editorial-intro";
import { PageHero } from "@/components/page/page-hero";
import { ServiceIndexList } from "@/components/page/service-index-list";
import { SERVICES } from "@/content/services";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale, LOCALE_DIRECTION } from "@/i18n/locales";

/**
 * Round 2026-07-13 (service-page premium redesign, per Hamid): the
 * generic `EditorialCardGrid` (shared with Knowledge, out of scope for
 * this task) is replaced here with a dedicated `ServiceIndexList` —
 * alternating icon/title rhythm, ghost numerals — built specifically for
 * this page so nothing shared with Knowledge is touched.
 */
export default async function ServicesIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).servicesPage;
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "←" : "→";

  return (
    <main>
      <PageHero eyebrow={dict.eyebrow} title={dict.heading} locale={locale} breadcrumb={[{ label: dict.eyebrow }]} />
      <EditorialIntro>{dict.subheading}</EditorialIntro>

      <section data-header-bg="#faf7f1" className="bg-warm-white px-6 pb-16 sm:px-8 sm:pb-24">
        <ServiceIndexList items={SERVICES} locale={locale} viewDetailsLabel={dict.viewDetailsCta} />

        <div className="mx-auto mt-16 flex max-w-4xl flex-col items-center gap-6 text-center">
          <DisclaimerBanner text={dict.disclaimer} />
          <Link href={`/${locale}/before-after`} className="text-sm text-gold hover:text-gold-hover">
            {dict.beforeAfterCta} {arrow}
          </Link>
        </div>
      </section>

      <AssistantCtaSection heading={dict.assistantCtaHeading} body={dict.assistantCtaBody} buttonLabel={dict.assistantCtaButton} intent="service_selection" />
    </main>
  );
}
