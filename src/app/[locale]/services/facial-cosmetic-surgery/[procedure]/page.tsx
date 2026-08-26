import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { ContentSection } from "@/components/page/content-section";
import { DisclaimerBanner } from "@/components/page/disclaimer-banner";
import { PageFaq } from "@/components/page/page-faq";
import { ServiceHero } from "@/components/page/service-hero";
import { Reveal } from "@/components/motion/reveal";
import { SERVICE_SLUG_TO_CATEGORY } from "@/content/before-after-cases";
import { FACIAL_PROCEDURES, getFacialProcedureBySlug, type FacialProcedure } from "@/content/facial-cosmetic-procedures";
import { getBeforeAfterHref, getServiceById } from "@/content/services";
import { absoluteUrl } from "@/core/site-config";
import { buildBreadcrumbJsonLd } from "@/core/structured-data";
import { getDictionary } from "@/i18n/get-dictionary";
import { localeHref } from "@/i18n/locale-href";
import { isSupportedLocale, LOCALE_DIRECTION, SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";

const SERVICE_SLUG = "facial-cosmetic-surgery";

/**
 * Round 2026-08-26 (Facial Cosmetic Surgery restructuring, per Dr.
 * Sadighi): the ONE shared, data-driven template for all 7 procedures
 * previously shown as in-place expanding cards on the parent page
 * (`../page.tsx`) — no per-procedure page file, per his explicit "do not
 * duplicate page layout manually seven times" instruction.
 * `generateStaticParams` emits all 7 procedures × 3 locales = 21 pages;
 * every field rendered here (title/intro/suitableFor/goals/process/care)
 * comes straight from `content/facial-cosmetic-procedures.ts`, unchanged
 * from what used to render inside `ProcedureDetailPanel` — this is a
 * presentation change (dedicated page vs. in-place accordion), not a
 * content rewrite.
 *
 * Reuses the exact same building blocks as `services/[slug]/page.tsx`
 * (`ServiceHero`, `ContentSection`, `PageFaq`, `AssistantCtaSection`,
 * `DisclaimerBanner`) so a procedure page reads as part of the same
 * service-page family, not a one-off. `ServiceHero`'s primary CTA already
 * opens the Smart Clinic Assistant (`AssistantTriggerButton` baked into
 * that component) — the CTA sections below are additional, not the only
 * way to reach it.
 *
 * SEO (approved as a SCOPED improvement for these 7 new routes only —
 * neither the parent `facial-cosmetic-surgery/page.tsx` nor the generic
 * `services/[slug]/page.tsx` have `generateMetadata` today, so this is
 * new ground, not a retrofit): canonical + hreflang across fa/en/ar using
 * the SAME slug in every locale (this route's own convention — every
 * `FacialProcedure.slug` is one string shared across locales, matching
 * how `content/services.ts` itself works, unlike Knowledge articles which
 * get a distinct slug per translation), plus a `BreadcrumbList` JSON-LD
 * via the existing generic `buildBreadcrumbJsonLd` helper.
 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) => FACIAL_PROCEDURES.map((procedure) => ({ locale, procedure: procedure.slug })));
}

function proceduresHreflangAlternates(slug: string) {
  const languages: Record<string, string> = {
    fa: absoluteUrl(`/services/facial-cosmetic-surgery/${slug}`),
    "fa-IR": absoluteUrl(`/services/facial-cosmetic-surgery/${slug}`),
    en: absoluteUrl(`/en/services/facial-cosmetic-surgery/${slug}`),
    ar: absoluteUrl(`/ar/services/facial-cosmetic-surgery/${slug}`),
  };
  languages["x-default"] = languages.fa!;
  return languages;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; procedure: string }>;
}): Promise<Metadata> {
  const { locale, procedure: procedureSlug } = await params;
  if (!isSupportedLocale(locale)) return {};
  const procedure = getFacialProcedureBySlug(procedureSlug);
  if (!procedure) return {};

  const canonical = localeHref(locale, `/services/facial-cosmetic-surgery/${procedure.slug}`);
  return {
    title: procedure.title[locale],
    description: procedure.summary[locale],
    alternates: {
      canonical,
      languages: proceduresHreflangAlternates(procedure.slug),
    },
    openGraph: {
      title: procedure.title[locale],
      description: procedure.summary[locale],
      type: "article",
      url: absoluteUrl(canonical),
      images: procedure.imageIsPlaceholder ? undefined : [{ url: absoluteUrl(procedure.imagePath) }],
    },
  };
}

export default async function FacialCosmeticProcedurePage({
  params,
}: {
  params: Promise<{ locale: string; procedure: string }>;
}) {
  const { locale: localeParam, procedure: procedureSlug } = await params;
  if (!isSupportedLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  const procedure = getFacialProcedureBySlug(procedureSlug);
  if (!procedure) notFound();

  const dict = getDictionary(locale).servicesPage;
  const page = dict.facialCosmetic;
  const parentService = dict.items.find((item) => item.slug === SERVICE_SLUG);
  if (!parentService) notFound();

  const taxonomyItem = getServiceById(SERVICE_SLUG);
  const beforeAfterHref = getBeforeAfterHref(locale, (taxonomyItem && SERVICE_SLUG_TO_CATEGORY[taxonomyItem.slug]) ?? null);
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "→" : "←";
  const parentHref = localeHref(locale, "/services/facial-cosmetic-surgery");

  const relatedProcedures: readonly FacialProcedure[] = FACIAL_PROCEDURES.filter((item) => item.slug !== procedure.slug);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { label: dict.eyebrow, href: localeHref(locale, "/services") },
      { label: parentService.title, href: parentHref },
      { label: procedure.title[locale] },
    ],
    locale
  );

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <ServiceHero
        eyebrow={parentService.eyebrow}
        title={procedure.title[locale]}
        subtitle={procedure.summary[locale]}
        iconKey={taxonomyItem?.iconKey ?? SERVICE_SLUG}
        photoSrc={procedure.imagePath}
        locale={locale}
        breadcrumb={[
          { label: dict.eyebrow, href: localeHref(locale, "/services") },
          { label: parentService.title, href: parentHref },
          { label: procedure.title[locale] },
        ]}
        ctaPrimaryLabel={dict.heroCtaPrimary}
        ctaSecondaryLabel={page.backToParentCta}
        ctaSecondaryHref={parentHref}
      />

      <ContentSection tone="warm-white" headerBg="#faf7f1">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <p className="text-sm leading-7 text-charcoal/70 sm:text-base">{procedure.intro[locale]}</p>
          </div>
        </Reveal>
      </ContentSection>

      <ContentSection eyebrow={parentService.eyebrow} heading={page.suitableForLabel} tone="cream" headerBg="#fcfbf4">
        <div className="mx-auto grid max-w-3xl gap-3">
          {procedure.suitableFor[locale].map((item, index) => (
            <Reveal key={item} delay={index * 0.06}>
              <div className="flex items-start gap-3 rounded-xl border border-charcoal/10 bg-warm-white p-4">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <p className="text-sm leading-6 text-charcoal/75">{item}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </ContentSection>

      <ContentSection eyebrow={parentService.eyebrow} heading={page.processLabel} tone="warm-white" headerBg="#faf7f1">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <p className="text-sm leading-7 text-charcoal/70 sm:text-base">{procedure.process[locale]}</p>
          </div>
        </Reveal>
      </ContentSection>

      <ContentSection heading={page.careLabel} tone="cream" headerBg="#fcfbf4">
        <div className="mx-auto grid max-w-3xl gap-3">
          {procedure.care[locale].map((item, index) => (
            <Reveal key={item} delay={index * 0.06}>
              <div className="flex items-start gap-3 rounded-xl border border-charcoal/10 bg-warm-white p-4">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <p className="text-sm leading-6 text-charcoal/75">{item}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </ContentSection>

      {page.faq.length > 0 ? (
        <ContentSection heading={page.faqHeading} tone="warm-white" headerBg="#faf7f1">
          <PageFaq items={page.faq} />
        </ContentSection>
      ) : null}

      {/* Related procedures — same parent group, per Hamid's explicit
          requirement. Plain links (not full `ProcedureLinkCard`s) keep
          this section compact; the parent landing page is still where the
          full card grid lives. */}
      <ContentSection heading={page.relatedProceduresHeading} tone="cream" headerBg="#fcfbf4">
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
          {relatedProcedures.map((related, index) => (
            <Reveal key={related.slug} delay={Math.min(index, 3) * 0.06}>
              <Link
                href={localeHref(locale, `/services/facial-cosmetic-surgery/${related.slug}`)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-charcoal/10 bg-warm-white p-4 transition-colors duration-200 hover:border-gold/40"
              >
                <span className="text-sm font-medium text-charcoal transition-colors duration-200 group-hover:text-gold">{related.title[locale]}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-charcoal/30 transition-colors duration-200 group-hover:text-gold">
                  <path d={LOCALE_DIRECTION[locale] === "rtl" ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6"} />
                </svg>
              </Link>
            </Reveal>
          ))}
        </div>
      </ContentSection>

      <AssistantCtaSection heading={page.finalCtaHeading} body={page.finalCtaBody} buttonLabel={page.finalCtaButton} intent="consultation_booking" />

      <section data-header-bg="#faf7f1" className="bg-warm-white px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <DisclaimerBanner text={dict.disclaimer} />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href={parentHref} className="text-sm text-charcoal/40 transition-colors duration-200 hover:text-gold">
              {arrow} {page.backToParentCta}
            </Link>
            <Link href={beforeAfterHref} className="text-sm text-charcoal/40 transition-colors duration-200 hover:text-gold">
              {dict.beforeAfterCta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
