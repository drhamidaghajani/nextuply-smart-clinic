import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { ContentSection } from "@/components/page/content-section";
import { DisclaimerBanner } from "@/components/page/disclaimer-banner";
import { PageFaq } from "@/components/page/page-faq";
import { ServiceHero } from "@/components/page/service-hero";
import { ServiceRelatedKnowledge } from "@/components/page/service-related-knowledge";
import { Reveal } from "@/components/motion/reveal";
import { FACIAL_PROCEDURE_TO_CATEGORY } from "@/content/before-after-cases";
import { FACIAL_PROCEDURES, getFacialProcedureBySlug, type FacialProcedure } from "@/content/facial-cosmetic-procedures";
import { getKnowledgeArticlesForProcedure } from "@/content/knowledge-articles";
import { getBeforeAfterHref, getServiceById } from "@/content/services";
import { buildLocalizedPageMetadata, preferredMetaDescription } from "@/core/seo-metadata.server";
import { buildMedicalProcedureJsonLd } from "@/core/structured-data";
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
 * SEO: originally hand-rolled here (2026-08-26, this route's own
 * canonical + hreflang + a standalone `BreadcrumbList`). Batch SEO-01
 * (2026-09-13) folded it onto the shared
 * `buildLocalizedPageMetadata`, which produces the byte-identical
 * canonical/hreflang set this file used to build by hand and adds the
 * OpenGraph/Twitter blocks it was missing. Slug stays the SAME in every
 * locale (this route's own convention — every `FacialProcedure.slug` is
 * one string shared across locales, matching how `content/services.ts`
 * itself works, unlike Knowledge articles which get a distinct slug per
 * translation). Structured data is now one
 * `MedicalProcedure`+`BreadcrumbList` graph from
 * `buildMedicalProcedureJsonLd`, which replaced the standalone breadcrumb
 * document.
 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) => FACIAL_PROCEDURES.map((procedure) => ({ locale, procedure: procedure.slug })));
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

  return buildLocalizedPageMetadata({
    locale,
    path: `/services/facial-cosmetic-surgery/${procedure.slug}`,
    title: procedure.title[locale],
    // Batch SEO-01 (2026-09-13) — the procedure's own `summary` strapline
    // (51-127 characters) stays the fallback, but the first sentence of its
    // approved `intro` copy is used when it fits a search snippet, since it
    // names the procedure and states what it does.
    description: preferredMetaDescription(procedure.intro[locale], procedure.summary[locale]),
    imagePaths: procedure.imageIsPlaceholder ? [] : [procedure.imagePath],
  });
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
  // Round 2026-09-25 (real before/after cases): resolved PER PROCEDURE, not
  // per parent service. This page's parent (`facial-cosmetic-surgery`) owns
  // seven procedures and only `temple-face-lift` has published cases, so a
  // service-level lookup would have sent every other procedure to a filter
  // that comes back empty. Procedures with no cases keep the general
  // `/before-after` index — `FACIAL_PROCEDURE_TO_CATEGORY` only ever lists
  // procedures with real pairs behind them.
  const beforeAfterHref = getBeforeAfterHref(locale, FACIAL_PROCEDURE_TO_CATEGORY[procedure.slug] ?? null);
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "→" : "←";
  const parentHref = localeHref(locale, "/services/facial-cosmetic-surgery");

  const relatedProcedures: readonly FacialProcedure[] = FACIAL_PROCEDURES.filter((item) => item.slug !== procedure.slug);

  // One source for both the visible trail and the JSON-LD trail.
  const breadcrumbItems = [
    { label: dict.eyebrow, href: localeHref(locale, "/services") },
    { label: parentService.title, href: parentHref },
    { label: procedure.title[locale] },
  ];
  const procedureJsonLd = buildMedicalProcedureJsonLd({
    name: procedure.title[locale],
    description: procedure.summary[locale],
    path: `/services/facial-cosmetic-surgery/${procedure.slug}`,
    locale,
    breadcrumbItems,
  });

  // Batch SEO-01 (2026-09-13) — commercial → informational direction for
  // this specific procedure, resolved from each article's typed
  // `procedureRelation`.
  const relatedKnowledge = getKnowledgeArticlesForProcedure(procedure.slug, locale);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(procedureJsonLd) }} />

      <ServiceHero
        eyebrow={parentService.eyebrow}
        title={procedure.title[locale]}
        subtitle={procedure.summary[locale]}
        iconKey={taxonomyItem?.iconKey ?? SERVICE_SLUG}
        photoSrc={procedure.imagePath}
        // Round 2026-08-27 (post-deploy regression fix, per Hamid — "the
        // hero image feels boxed with a thick white frame"): `ServiceHero`
        // defaults to `photoFit="contain"`, which `ServiceVisualPanel`
        // renders on a cream/white background with inner padding — built
        // for diagram-style images that must never be cropped, but it
        // reads as a heavy light box sitting inside this hero's dark
        // gradient. All 7 procedure photos (including the one flagged
        // `imageIsPlaceholder`) are verified to be exactly 1586x992 —
        // precisely this hero's own 16:10 frame — so `"cover"` fills the
        // frame edge-to-edge with zero cropping, the same treatment these
        // exact images already get on the parent page's `ProcedureLinkCard`
        // grid. Scoped to this ONE call site via the existing `photoFit`
        // prop — `ServiceHero`/`ServiceVisualPanel` themselves are
        // untouched, so every other service page's hero (which still wants
        // "contain" for its own gallery photos) is unaffected.
        photoFit="cover"
        locale={locale}
        breadcrumb={breadcrumbItems}
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

      {/* Batch SEO-01 (2026-09-13) — warm-white between the cream "other
          procedures" section and the navy assistant CTA, keeping this
          page's alternation intact. Renders nothing when this locale has
          no matching Knowledge article. */}
      <ServiceRelatedKnowledge
        locale={locale}
        heading={dict.relatedKnowledgeHeading}
        items={relatedKnowledge.map(({ content }) => ({ slug: content.slug, title: content.title }))}
        tone="warm-white"
        headerBg="#faf7f1"
      />

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
