import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { SERVICES } from "@/content/services";
import { resolveFeaturedHomepageArticles } from "@/content/knowledge-center-homepage";
import { Hero } from "@/components/sections/hero";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";

/**
 * Every section below `Hero` is loaded via `next/dynamic` instead of a
 * static import — P1 mobile TBT audit, 2026-09-03. `Hero` stays a plain
 * static import: it's the only section in the actual first viewport (see
 * this file's own render-time comment on why every OTHER section here is
 * guaranteed below the fold) and holds the LCP element, so it must stay
 * on the critical path, not be code-split.
 *
 * `ssr: true` (the default — left implicit, not passed) on every one of
 * these: this is a code-splitting change ONLY, not a rendering-behavior
 * change. Each section still gets fully server-rendered into the initial
 * HTML exactly as before (confirmed directly: SSR output is byte-for-byte
 * unchanged), so there is no flash-of-missing-content, no layout shift,
 * and no interaction with `scroll-snap-type: y mandatory` (every section
 * is present at its full height from first paint, snap points intact).
 * The only thing that moves is which JS chunk each section's client-side
 * logic (framer-motion reveals, GSAP/ScrollTrigger, event handlers) ships
 * in and hydrates from — split into its own chunk instead of bundled into
 * one large chunk the browser must parse and execute as a single
 * continuous block before the page is interactive. That single block was
 * the direct cause of this page's 1,230ms TBT; splitting it lets the
 * browser schedule the work in smaller pieces instead of one long task.
 */
const SmartClinicAssistantSection = dynamic(() => import("@/components/sections/smart-clinic-assistant-section").then((m) => m.SmartClinicAssistantSection));
const FeaturedServicesSection = dynamic(() => import("@/components/sections/featured-services-section").then((m) => m.FeaturedServicesSection));
const WhyDrSadighiSection = dynamic(() => import("@/components/sections/why-dr-sadighi-section").then((m) => m.WhyDrSadighiSection));
const CaseGallerySection = dynamic(() => import("@/components/sections/case-gallery-section").then((m) => m.CaseGallerySection));
const PatientJourneySection = dynamic(() => import("@/components/sections/patient-journey-section").then((m) => m.PatientJourneySection));
const PatientStoriesSection = dynamic(() => import("@/components/sections/patient-stories-section").then((m) => m.PatientStoriesSection));
const KnowledgeCenterSection = dynamic(() => import("@/components/sections/knowledge-center-section").then((m) => m.KnowledgeCenterSection));
const VideoHubSection = dynamic(() => import("@/components/sections/video-hub-section").then((m) => m.VideoHubSection));
const FaqSection = dynamic(() => import("@/components/sections/faq-section").then((m) => m.FaqSection));

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
  // Resolved here (Server Component), not inside KnowledgeCenterSection
  // itself — see that component's own comment and
  // knowledge-center-homepage.ts's for why (P1 mobile TBT audit,
  // 2026-09-03): keeps the 961KB knowledge-articles.ts content module
  // out of the client bundle entirely.
  const knowledgeCenterArticles = resolveFeaturedHomepageArticles(locale);

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
      <FeaturedServicesSection dict={dict.services} items={SERVICES} locale={locale} includedItemsLabel={dict.servicesPage.includedItemsLabel} />
      <WhyDrSadighiSection dict={dict.doctorStory} locale={locale} />
      <CaseGallerySection dict={dict.caseGallery} items={SERVICES} locale={locale} />
      <PatientJourneySection dict={dict.patientJourney} locale={locale} />
      <PatientStoriesSection dict={dict.patientStories} locale={locale} instagramHandle={dict.footer.instagram} />
      <KnowledgeCenterSection dict={dict.knowledgeCenter} locale={locale} articles={knowledgeCenterArticles} />
      <VideoHubSection dict={dict.videoHub} locale={locale} />
      <FaqSection dict={dict.faqSection} locale={locale} />
    </main>
  );
}
