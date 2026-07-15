import { notFound } from "next/navigation";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { ContentSection } from "@/components/page/content-section";
import { EditorialIntro } from "@/components/page/editorial-intro";
import { PageHero } from "@/components/page/page-hero";
import { ServiceJourney } from "@/components/page/service-journey";
import { TourismNav } from "@/components/page/tourism-nav";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";

/**
 * Round 2026-07-13 (design-quality pass): the 3-card bordered grid
 * (pre-travel consultation → treatment plan coordination → in-stay
 * support) was actually a sequence, not a set of unrelated features —
 * reused `ServiceJourney`'s numbered-timeline treatment instead of
 * inventing a new "concierge steps" component.
 */
export default async function HealthTourismOverviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).healthTourism;
  const { overview } = dict;

  return (
    <main>
      <PageHero eyebrow={overview.eyebrow} title={overview.title} subtitle={overview.subtitle} locale={locale} breadcrumb={[{ label: overview.eyebrow }]} />
      <TourismNav nav={dict.nav} locale={locale} active="overview" />
      <EditorialIntro>{overview.intro}</EditorialIntro>
      <ContentSection tone="warm-white">
        <ServiceJourney steps={overview.sections} />
      </ContentSection>
      <AssistantCtaSection heading={dict.ctaHeading} body={dict.ctaBody} buttonLabel={dict.ctaButton} intent="general" />
    </main>
  );
}
