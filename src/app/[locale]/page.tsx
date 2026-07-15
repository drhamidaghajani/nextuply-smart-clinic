import { notFound } from "next/navigation";
import { SERVICES } from "@/content/services";
import { CaseGallerySection } from "@/components/sections/case-gallery-section";
import { FaqSection } from "@/components/sections/faq-section";
import { FeaturedServicesSection } from "@/components/sections/featured-services-section";
import { Hero } from "@/components/sections/hero";
import { KnowledgeCenterSection } from "@/components/sections/knowledge-center-section";
import { PatientJourneySection } from "@/components/sections/patient-journey-section";
import { PatientStoriesSection } from "@/components/sections/patient-stories-section";
import { SmartClinicAssistantSection } from "@/components/sections/smart-clinic-assistant-section";
import { VideoHubSection } from "@/components/sections/video-hub-section";
import { WhyDrSadighiSection } from "@/components/sections/why-dr-sadighi-section";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";

/**
 * Homepage. Emptied 2026-07-08, rebuilt section-by-section through
 * 2026-07-07 — see git history for the placement rationale of each
 * section below (Hero → Smart Clinic Assistant → Featured Services → Why
 * Dr. Sadighi → Case Gallery/Before-After → Patient Journey → Patient
 * Stories → Knowledge Center → Video Hub → FAQ), none of that changed in
 * this round.
 *
 * Round 2026-07-13 (docs/adr/0005): `en`/`ar` were first given a minimal
 * "coming soon" holding page instead of the real homepage body, since
 * full section translation hadn't happened yet.
 *
 * Round 2026-07-13, same day, follow-up (docs/adr/0006 — "not acceptable
 * for the current product direction," per Hamid): the holding page is
 * gone. All three locales now render this SAME component tree, fed by
 * `getDictionary(locale)` — one page, three dictionaries, no duplicated
 * markup. Every section component's `dict` prop was retyped away from
 * `Dictionary["section"]` (fa.ts's own `as const`-literal type, which no
 * `en`/`ar` object could ever satisfy) to a plain-`string` interface in
 * `src/i18n/dictionary-types.ts` — see that file's doc-comment. Section
 * components that hardcoded `dir="rtl"` now take a `locale` prop and
 * derive it from `LOCALE_DIRECTION` instead.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return (
    // `homepage-scroll-snap` is a marker only, no visual styles — it's
    // what scopes `html { scroll-snap-type: y mandatory }` (globals.css)
    // to this page alone via `:has()`, so internal pages get ordinary
    // scrolling instead of inheriting the homepage's cinematic snap
    // behavior. See globals.css's doc-comment on that rule for the full
    // story (a real, previously-shipped bug this fixes).
    <main className="homepage-scroll-snap">
      <Hero dict={dict.hero} />
      <SmartClinicAssistantSection dict={dict.aiConcierge} locale={locale} />
      <FeaturedServicesSection dict={dict.services} items={SERVICES} locale={locale} />
      <WhyDrSadighiSection dict={dict.doctorStory} locale={locale} />
      <CaseGallerySection dict={dict.caseGallery} items={SERVICES} locale={locale} />
      <PatientJourneySection dict={dict.patientJourney} locale={locale} />
      <PatientStoriesSection dict={dict.patientStories} locale={locale} />
      <KnowledgeCenterSection dict={dict.knowledgeCenter} locale={locale} />
      <VideoHubSection dict={dict.videoHub} locale={locale} />
      <FaqSection dict={dict.faqSection} locale={locale} />
    </main>
  );
}
