import { notFound } from "next/navigation";
import { fa } from "@/i18n/dictionaries/fa";
import { AiExperience } from "@/components/sections/ai-experience";
import { BeforeAfterGallery } from "@/components/sections/before-after-gallery";
import { BrandIntro } from "@/components/sections/brand-intro";
import { DoctorStory } from "@/components/sections/doctor-story";
import { FinalCta } from "@/components/sections/final-cta";
import { Hero } from "@/components/sections/hero";
import { PatientJourney } from "@/components/sections/patient-journey";
import { Services } from "@/components/sections/services";
import { SiteFooter } from "@/components/sections/site-footer";
import { Statistics } from "@/components/sections/statistics";
import { Testimonials } from "@/components/sections/testimonials";

/**
 * Homepage — assembles the 11 sections in HOMEPAGE_STORYBOARD.md's exact
 * order. Only `fa` has a populated dictionary right now (docs/adr/0002).
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale !== "fa") {
    // en/ar routes exist structurally (locales.ts) but have no content yet.
    notFound();
  }

  return (
    <main>
      <Hero dict={fa.hero} />
      <BrandIntro dict={fa.brandIntro} />
      <DoctorStory dict={fa.doctorStory} />
      <BeforeAfterGallery dict={fa.beforeAfter} />
      <AiExperience dict={fa.aiExperience} />
      <Services dict={fa.services} />
      <PatientJourney dict={fa.patientJourney} />
      <Statistics dict={fa.statistics} />
      <Testimonials dict={fa.testimonials} />
      <FinalCta dict={fa.finalCta} />
      <SiteFooter dict={fa.footer} />
    </main>
  );
}
