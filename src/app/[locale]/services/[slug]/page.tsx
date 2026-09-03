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
import { SERVICE_SLUG_TO_CATEGORY } from "@/content/before-after-cases";
import { getCareInstructionHref, getCareTopicsForService } from "@/content/care-instructions";
import { getBeforeAfterHref, getServiceById, SERVICE_TAXONOMY_IDS } from "@/content/services";
import { localeHref } from "@/i18n/locale-href";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale, LOCALE_DIRECTION, SUPPORTED_LOCALES } from "@/i18n/locales";

/**
 * Round 2026-08-17: `facial-cosmetic-surgery` is excluded — it now has
 * its own static route (`services/facial-cosmetic-surgery/page.tsx`,
 * see that file for why). A static segment already wins over `[slug]`
 * in the App Router, so leaving it here wouldn't break routing, but it
 * would make the build emit a second, permanently unreachable copy of
 * the page for every locale. It stays in `SERVICE_TAXONOMY_IDS` — every
 * card, footer link, and Assistant entry still points at the same URL.
 */
const OWN_ROUTE_SLUGS = new Set<string>(["facial-cosmetic-surgery"]);

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    SERVICE_TAXONOMY_IDS.filter((slug) => !OWN_ROUTE_SLUGS.has(slug)).map((slug) => ({ locale, slug })),
  );
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
  // Round 2026-08-25 (before/after rebuild): points at the NEW 4-category
  // real-case taxonomy (`content/before-after-cases.ts`), not the older
  // 8-value `galleryCategory` used for this page's own hero/gallery
  // photos — those are a different, unrelated system. A service with no
  // entry in `SERVICE_SLUG_TO_CATEGORY` (no matching real case category)
  // falls back to the general `/before-after` index, never an
  // invented/mismatched filter.
  const beforeAfterHref = getBeforeAfterHref(locale, (taxonomyItem && SERVICE_SLUG_TO_CATEGORY[taxonomyItem.slug]) ?? null);
  // Round 2026-08-20 (doctor-provided image swap): the hero photo is now
  // per-service via `taxonomyItem.heroPhotoSrc`, falling back to the
  // gallery-category photo used everywhere else (before/after band
  // included) when unset — see that field's doc-comment in
  // `content/services.ts`. The new photos are all authored at the hero
  // frame's own 16:10, so they use `cover` (edge-to-edge, no letterboxed
  // frame) instead of the shared `contain` default.
  const heroPhotoSrc = taxonomyItem?.heroPhotoSrc ?? servicePhoto;
  const heroPhotoPosition = taxonomyItem?.heroPhotoSrc ? (taxonomyItem.heroPhotoPosition ?? "center") : servicePhotoPosition;
  const heroPhotoFit = taxonomyItem?.heroPhotoSrc ? "cover" : "contain";
  const careTopics = taxonomyItem ? getCareTopicsForService(taxonomyItem.id) : [];
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "←" : "→";

  return (
    <main>
      <ServiceHero
        eyebrow={service.eyebrow}
        title={service.title}
        subtitle={service.subtitle}
        iconKey={iconKey}
        photoSrc={heroPhotoSrc}
        photoPosition={heroPhotoPosition}
        photoFit={heroPhotoFit}
        locale={locale}
        breadcrumb={[{ label: dict.eyebrow, href: localeHref(locale, "/services") }, { label: service.title }]}
        ctaPrimaryLabel={dict.heroCtaPrimary}
        ctaSecondaryLabel={dict.heroCtaSecondary}
        ctaSecondaryHref={beforeAfterHref}
      />

      <ServiceSplitStory
        eyebrow={service.eyebrow}
        title={dict.overviewHeading}
        body={service.overview}
        tone="cream"
        // .jpg since 2026-09-03 — see about/page.tsx's own comment on this same asset
        visual={<ServiceVisualPanel photoSrc="/media/doctor-headshot.jpg" alt={service.title} photoPosition="top" />}
      />

      {/* Round 2026-07-31 (doctor feedback, per Hamid): the approach photo
          is now per-service via `taxonomyItem.approachPhotoSrc`, falling
          back to the shared `/media/doctor-surgery.jpg` for every service
          that hasn't been given its own approved photo yet — see that
          field's doc-comment in `content/services.ts`.
          Round 2026-08-18 (doctor feedback): the approach NOTE is now
          the same per-service-override-with-fallback shape, so
          orthognathic-surgery's more specific "دقت و مراقبت در هر
          مرحله" copy doesn't leak onto the other 7 service pages. */}
      <ServiceSplitStory
        eyebrow={dict.approachEyebrow}
        title={dict.approachHeading}
        body={taxonomyItem?.approachNote?.[locale] ?? dict.approachNote}
        tone="navy"
        reverse
        visual={
          <ServiceVisualPanel
            photoSrc={taxonomyItem?.approachPhotoSrc ?? "/media/doctor-surgery.jpg"}
            alt={dict.approachHeading}
            photoPosition={taxonomyItem?.approachPhotoPosition ?? "75% 25%"}
          />
        }
      />

      {/* Round 2026-07-26 (doctor feedback, per Hamid — "make the services
          section clearer for normal users by showing what each main
          service includes"): `includedItems` lives on the taxonomy item
          (`content/services.ts`), not this page's own dictionary — see
          that field's doc-comment for why. Purely descriptive, per
          Hamid's explicit "sub-services should NOT have separate pages"
          — no links, no routing. */}
      {taxonomyItem ? (
        <ContentSection eyebrow={service.eyebrow} heading={dict.includedItemsHeading} tone="cream" headerBg="#fcfbf4">
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-x-10 sm:grid-cols-2">
            {taxonomyItem.includedItems[locale].map((item, index) => (
              <Reveal key={item} delay={index * 0.04}>
                <div className="flex items-start gap-3 border-b border-charcoal/10 py-3.5">
                  <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  <p className="text-sm leading-7 text-charcoal/75 sm:text-base">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </ContentSection>
      ) : null}

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
          <Link href={localeHref(locale, "/services")} className="mt-4 inline-block text-sm text-charcoal/40 transition-colors duration-200 hover:text-gold">
            {arrow === "←" ? "→" : "←"} {dict.eyebrow}
          </Link>
        </div>
      </section>

      <AssistantCtaSection heading={dict.assistantCtaHeading} body={dict.assistantCtaBody} buttonLabel={dict.assistantCtaButton} intent="consultation_booking" />
    </main>
  );
}
