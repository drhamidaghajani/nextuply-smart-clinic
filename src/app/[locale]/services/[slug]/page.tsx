import Link from "next/link";
import { notFound } from "next/navigation";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { ContentSection } from "@/components/page/content-section";
import { DisclaimerBanner } from "@/components/page/disclaimer-banner";
import { PageFaq } from "@/components/page/page-faq";
import { ServiceBeforeAfterBand } from "@/components/page/service-before-after-band";
import { ServiceHero } from "@/components/page/service-hero";
import { ServiceJourney } from "@/components/page/service-journey";
import { ServiceSplitStory } from "@/components/page/service-split-story";
import { ServiceVisualPanel } from "@/components/page/service-visual-panel";
import { Reveal } from "@/components/motion/reveal";
import { PHOTO_POSITION, REAL_PHOTOS } from "@/components/sections/gallery-photos";
import { getCareInstructionHref, getCareTopicsForService } from "@/content/care-instructions";
import { getBeforeAfterHref, getServiceById, SERVICE_TAXONOMY_IDS } from "@/content/services";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale, LOCALE_DIRECTION, SUPPORTED_LOCALES } from "@/i18n/locales";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) => SERVICE_TAXONOMY_IDS.map((slug) => ({ locale, slug })));
}

/**
 * Round 2026-07-13 (Dr. William Miami-inspired premium redesign, per
 * Hamid — structural inspiration only, not a copy: cinematic hero,
 * alternating dark/cream image-led editorial blocks, integrated before/
 * after band, strong closing CTA). Rebuilt from the previous "mostly
 * centered text sections" version, which the brief flagged as too
 * text-based, too empty, too repetitive.
 *
 * Visual rhythm: navy hero (real service photo) → cream intro split
 * (overview + doctor headshot) → navy approach split (approach note +
 * doctor OR photo, mirrored) → warm-white "who this may help" (numbered
 * hairline rows) → cream consultation path (framed card, shared 4-step
 * timeline — visually distinct from the plain treatment-journey list
 * below it) → warm-white treatment journey (service-specific process) →
 * cream FAQ (editorial accordion) → navy before/after band (same real
 * service photo, dark scrim, CTA) → navy final assistant CTA → footer.
 * No two consecutive sections share the same background tone or the same
 * block shape.
 *
 * Real imagery only: the service's own real gallery photo
 * (`gallery-photos.ts`) in the hero and the before/after band, and Dr.
 * Sadighi's own real portrait/OR photography (already used site-wide on
 * `WhyDrSadighiSection`) in the two editorial split blocks — no stock or
 * fabricated medical imagery anywhere.
 */
export default async function ServiceDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).servicesPage;
  const service = dict.items.find((item) => item.slug === slug);
  if (!service) notFound();

  const taxonomyItem = getServiceById(slug);
  const iconKey = taxonomyItem?.iconKey ?? slug;
  const galleryCategory = taxonomyItem?.galleryCategory ?? null;
  const servicePhoto = galleryCategory ? REAL_PHOTOS[galleryCategory] : undefined;
  const servicePhotoPosition = galleryCategory ? PHOTO_POSITION[galleryCategory] : undefined;
  const beforeAfterHref = getBeforeAfterHref(locale, galleryCategory);
  const careTopics = taxonomyItem ? getCareTopicsForService(taxonomyItem.id) : [];
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "←" : "→";

  return (
    <main>
      <ServiceHero
        eyebrow={service.eyebrow}
        title={service.title}
        subtitle={service.subtitle}
        iconKey={iconKey}
        photoSrc={servicePhoto}
        photoPosition={servicePhotoPosition}
        locale={locale}
        breadcrumb={[{ label: dict.eyebrow, href: `/${locale}/services` }, { label: service.title }]}
        ctaPrimaryLabel={dict.heroCtaPrimary}
        ctaSecondaryLabel={dict.heroCtaSecondary}
        ctaSecondaryHref={beforeAfterHref}
      />

      <ServiceSplitStory
        eyebrow={service.eyebrow}
        title={dict.overviewHeading}
        body={service.overview}
        tone="cream"
        visual={<ServiceVisualPanel photoSrc="/media/doctor-headshot.png" alt={service.title} photoPosition="top" />}
      />

      <ServiceSplitStory
        eyebrow={dict.approachEyebrow}
        title={dict.approachHeading}
        body={dict.approachNote}
        tone="navy"
        reverse
        visual={<ServiceVisualPanel photoSrc="/media/doctor-surgery.jpg" alt={dict.approachHeading} photoPosition="75% 25%" />}
      />

      <ContentSection eyebrow={service.eyebrow} heading={service.suitableForHeading} tone="warm-white" headerBg="#faf7f1">
        <div className="mx-auto max-w-2xl border-t border-charcoal/10">
          {service.suitableFor.map((item, index) => (
            <Reveal key={item} delay={index * 0.06}>
              <div className="flex items-center gap-5 border-b border-charcoal/10 py-5">
                <span className="font-heading text-lg font-bold text-gold/40 sm:text-xl">{String(index + 1).padStart(2, "0")}</span>
                <p className="text-sm leading-7 text-charcoal/75 sm:text-base">{item}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </ContentSection>

      {/* Consultation Path — framed card treatment, deliberately distinct
          from the plain Treatment Journey list below it (same brief
          requirement: "should not look identical to Consultation Path"). */}
      <ContentSection tone="cream" headerBg="#fcfbf4">
        <div className="mx-auto max-w-2xl rounded-3xl border border-gold/20 bg-warm-white px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{service.consultationPathHeading}</p>
          <p className="mt-3 text-sm leading-7 text-charcoal/70 sm:text-base">{service.consultationPath}</p>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal/40">{dict.consultationStepsHeading}</p>
          <div className="mt-6">
            <ServiceJourney steps={dict.consultationSteps} />
          </div>
        </div>
      </ContentSection>

      <ContentSection eyebrow={service.eyebrow} heading={service.processHeading} tone="warm-white" headerBg="#faf7f1">
        <ServiceJourney steps={service.process} />
      </ContentSection>

      <ContentSection heading={service.faqHeading} tone="cream" headerBg="#fcfbf4">
        <PageFaq items={service.faq} />
      </ContentSection>

      {/* Round 2026-07-13 (patient-care hub) — links to relevant pre/post
          procedure care guide(s) for this service. Warm-white, restoring
          the cream→warm-white→navy alternation between FAQ and the
          before/after band below. */}
      {careTopics.length > 0 ? (
        <section data-header-bg="#faf7f1" className="bg-warm-white px-6 py-10 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{dict.careGuideHeading}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {careTopics.map((topic) => (
                <Link
                  key={topic.id}
                  href={getCareInstructionHref(locale, topic.slug)}
                  className="whitespace-nowrap rounded-full border border-charcoal/15 px-4 py-1.5 text-xs text-charcoal/60 transition-colors duration-200 hover:border-gold/40 hover:text-gold sm:text-sm"
                >
                  {topic.title[locale]}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ServiceBeforeAfterBand
        photoSrc={servicePhoto}
        photoAlt={service.title}
        heading={dict.beforeAfterBandHeading}
        note={dict.beforeAfterBandNote}
        ctaLabel={dict.beforeAfterCta}
        href={beforeAfterHref}
      />

      {/* Deliberately a light section (not navy) — the surrounding
          before/after band and final CTA are both already navy; keeping
          the disclaimer light restores alternation instead of stacking a
          third consecutive dark block before the footer. */}
      <section data-header-bg="#faf7f1" className="bg-warm-white px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <DisclaimerBanner text={dict.disclaimer} />
          <Link href={`/${locale}/services`} className="mt-4 inline-block text-sm text-charcoal/40 transition-colors duration-200 hover:text-gold">
            {arrow === "←" ? "→" : "←"} {dict.eyebrow}
          </Link>
        </div>
      </section>

      <AssistantCtaSection heading={dict.assistantCtaHeading} body={dict.assistantCtaBody} buttonLabel={dict.assistantCtaButton} intent="consultation_booking" />
    </main>
  );
}
