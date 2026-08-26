import Link from "next/link";
import { notFound } from "next/navigation";

import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { ContentSection } from "@/components/page/content-section";
import { DisclaimerBanner } from "@/components/page/disclaimer-banner";
import { ProcedureLinkCard } from "@/components/page/facial-cosmetic/procedure-link-card";
import { PageFaq } from "@/components/page/page-faq";
import { ServiceHero } from "@/components/page/service-hero";
import { Reveal } from "@/components/motion/reveal";
import { SERVICE_SLUG_TO_CATEGORY } from "@/content/before-after-cases";
import { FACIAL_PROCEDURES } from "@/content/facial-cosmetic-procedures";
import { getBeforeAfterHref, getServiceById } from "@/content/services";
import { getDictionary } from "@/i18n/get-dictionary";
import { localeHref } from "@/i18n/locale-href";
import { isSupportedLocale, LOCALE_DIRECTION, SUPPORTED_LOCALES } from "@/i18n/locales";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

const SERVICE_SLUG = "facial-cosmetic-surgery";
const HERO_IMAGE = "/media/services/facial-cosmetic-surgery/hero-facial-cosmetic.png";

/**
 * Round 2026-08-17 — Facial Cosmetic Surgery, rebuilt as a parent/
 * overview hub per Dr. Sadighi's direct feedback: "the page is too
 * general. The user should first see the types of facial cosmetic
 * surgery, be able to click each one and jump to that surgery's own
 * section on the same page, with care guidance written separately."
 *
 * Round 2026-08-18 (same page, second follow-up): the "click a card →
 * jump to a section further down" part of the above was itself replaced
 * — a card click expanded that procedure's detail IN PLACE
 * (`ProceduresExplorer`), no page jump at all.
 *
 * Round 2026-08-26 (Facial Cosmetic Surgery restructuring, per Dr.
 * Sadighi — reversing BOTH rounds above): the in-place expansion is gone
 * too. Each of the 7 procedures is now a real, clickable service entry
 * that opens its OWN dedicated page
 * (`/services/facial-cosmetic-surgery/[procedure]`, one shared
 * data-driven template — see that route's own doc-comment). This page is
 * now a premium LANDING page: hero, a grid of `ProcedureLinkCard`s (link,
 * not accordion), and the standalone care block, unchanged. This is a
 * flagged correction of two of Hamid's own earlier rounds on this exact
 * page, not a silent reversal — see `production-redirect-audit.csv`-style
 * change history in this repo's commit log for the full trail.
 * `ProceduresExplorer`/`ProcedureOverviewCard`/`ProcedureDetailPanel`
 * still exist (kept per his "do not delete files" instruction) but are no
 * longer imported by any page — safe to delete in a future pass once
 * confirmed unused elsewhere.
 *
 * WHY THIS IS STILL ITS OWN ROUTE, not another branch inside
 * `services/[slug]/page.tsx`:
 * this page is a genuinely different page type, not a content variant.
 * The shared template is one service → one linear story (overview →
 * approach → included items → suitable-for → journey → FAQ); this one is
 * one service → a grid linking to seven sub-procedure pages, plus a
 * standalone care block. A static segment also takes routing precedence
 * over `[slug]` in the App Router, so the public URL is unchanged and
 * every existing link, card, footer entry, and the Assistant's own
 * service list keep working untouched. `[slug]`'s `generateStaticParams`
 * filters this slug out so the build doesn't also emit a shadowed,
 * unreachable copy.
 *
 * Explicitly NOT done here, per Hamid's constraints: no
 * `SERVICE_TAXONOMY_IDS` entry and no Assistant service id for any
 * sub-procedure — each procedure page's own CTA books a general
 * `facial-cosmetic-surgery` consultation, same as this parent page,
 * rather than introducing a new taxonomy concept. Rhinoplasty is absent
 * by design (it has its own dedicated page); the FAQ answers that for
 * patients directly rather than leaving them to wonder.
 *
 * `#procedures` (the overview grid's own section id) is still the one
 * same-page anchor in real use — the hero's secondary CTA jumps there.
 * `main` keeps `.smooth-anchor-scroll` (globals.css) for exactly that one
 * jump.
 *
 * Reuses `ServiceHero`, `ContentSection`, `PageFaq`, `AssistantCtaSection`,
 * `DisclaimerBanner`, and `Reveal` unchanged so this page still reads as
 * part of the same site rather than a one-off.
 */
export default async function FacialCosmeticSurgeryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).servicesPage;
  const page = dict.facialCosmetic;
  const service = dict.items.find((item) => item.slug === SERVICE_SLUG);
  if (!service) notFound();

  const taxonomyItem = getServiceById(SERVICE_SLUG);
  // Round 2026-08-25 (before/after rebuild): no real case category
  // clearly matches facial-cosmetic-surgery among the 4 uploaded
  // categories (implant/facial-reconstruction/rhinoplasty/jaw-surgery) —
  // per Hamid's explicit "do not force it" instruction, this falls back
  // to the general /before-after index rather than an invented filter.
  const beforeAfterHref = getBeforeAfterHref(locale, (taxonomyItem && SERVICE_SLUG_TO_CATEGORY[taxonomyItem.slug]) ?? null);
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "→" : "←";

  return (
    // `.smooth-anchor-scroll` opts this page (and only this page) into
    // smooth anchor scrolling — see globals.css.
    <main className="smooth-anchor-scroll">
      <ServiceHero
        eyebrow={service.eyebrow}
        title={service.title}
        subtitle={page.heroSubtitle}
        iconKey={taxonomyItem?.iconKey ?? SERVICE_SLUG}
        photoSrc={HERO_IMAGE}
        // The hero art is authored at exactly the frame's 16:10, so
        // `cover` fills it edge-to-edge and still crops nothing.
        photoFit="cover"
        locale={locale}
        breadcrumb={[{ label: dict.eyebrow, href: localeHref(locale, "/services") }, { label: service.title }]}
        ctaPrimaryLabel={dict.heroCtaPrimary}
        ctaSecondaryLabel={page.heroCtaProcedures}
        ctaSecondaryHref="#procedures"
      />

      <section id="procedures" data-header-bg="#fcfbf4" className="scroll-mt-24 bg-cream px-6 py-16 sm:px-8 sm:py-24 lg:scroll-mt-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold sm:text-sm">{page.proceduresEyebrow}</p>
              <h2 className="mt-3 text-balance text-xl font-bold leading-tight text-charcoal sm:text-2xl lg:text-[30px]">{page.proceduresHeading}</h2>
              <p className="mt-3 text-sm leading-7 text-charcoal/70 sm:text-base">{page.proceduresLead}</p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {FACIAL_PROCEDURES.map((procedure, index) => (
              <Reveal key={procedure.id} delay={Math.min(index, 3) * 0.06}>
                <ProcedureLinkCard procedure={procedure} locale={locale} ctaLabel={page.procedureCardCta} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Care guidance kept as its own block, per the doctor's "care/
          preparation guidance should be written separately" — navy, which
          also breaks up the run of light procedure sections above it. */}
      <section data-header-bg="#0f172a" className="relative overflow-hidden bg-gradient-to-br from-deep-navy to-[#1a2540] px-6 py-16 sm:px-8 sm:py-24">
        <div
          aria-hidden
          className="animate-ambient-light pointer-events-none absolute -top-20 start-1/4 h-[320px] w-[320px] rounded-full bg-gold/15 blur-[110px]"
        />
        <div className="relative mx-auto max-w-5xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-xl font-bold leading-tight text-warm-white sm:text-2xl lg:text-[30px]">{page.careHeading}</h2>
              <p className="mt-3 text-sm leading-7 text-warm-white/65 sm:text-base">{page.careLead}</p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:gap-6 lg:grid-cols-2">
            {[
              { heading: page.carePreHeading, items: page.carePreItems },
              { heading: page.carePostHeading, items: page.carePostItems },
            ].map((column, index) => (
              <Reveal key={column.heading} delay={index * 0.08}>
                <div className="h-full rounded-2xl border border-warm-white/12 bg-warm-white/[0.04] p-6 sm:rounded-[22px] sm:p-8">
                  <h3 className="text-sm font-semibold text-gold sm:text-base">{column.heading}</h3>
                  <ul className="mt-5 space-y-3.5">
                    {column.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-[13px] leading-6 text-warm-white/70 sm:text-sm sm:leading-7">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold/70 sm:mt-2.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.16}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-6 text-warm-white/45 sm:text-[13px]">{page.careNote}</p>
          </Reveal>
        </div>
      </section>

      <ContentSection heading={page.faqHeading} tone="cream" headerBg="#fcfbf4">
        <PageFaq items={page.faq} />
      </ContentSection>

      <AssistantCtaSection
        heading={page.finalCtaHeading}
        body={page.finalCtaBody}
        buttonLabel={page.finalCtaButton}
        intent="consultation_booking"
      />

      {/* Same closing pattern as the shared service detail page: a light
          disclaimer section so the page doesn't end on a third
          consecutive dark block. */}
      <section data-header-bg="#faf7f1" className="bg-warm-white px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <DisclaimerBanner text={dict.disclaimer} />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href={localeHref(locale, "/services")} className="text-sm text-charcoal/40 transition-colors duration-200 hover:text-gold">
              {arrow} {dict.eyebrow}
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
