import Link from "next/link";
import { notFound } from "next/navigation";

import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { ContentSection } from "@/components/page/content-section";
import { DisclaimerBanner } from "@/components/page/disclaimer-banner";
import { ProceduresExplorer } from "@/components/page/facial-cosmetic/procedures-explorer";
import { PageFaq } from "@/components/page/page-faq";
import { ServiceHero } from "@/components/page/service-hero";
import { Reveal } from "@/components/motion/reveal";
import { FACIAL_PROCEDURES } from "@/content/facial-cosmetic-procedures";
import { getBeforeAfterHref, getServiceById } from "@/content/services";
import { getDictionary } from "@/i18n/get-dictionary";
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
 * Round 2026-08-18 (same page, follow-up doctor feedback): the "click a
 * card → jump to a section further down" part of the above was itself
 * replaced — a card click now expands that procedure's detail IN PLACE
 * (`ProceduresExplorer`), no page jump at all. The 7 dedicated
 * `ProcedureSection` blocks this round 1 built are gone; their exact
 * same content (from `content/facial-cosmetic-procedures.ts`, unchanged)
 * now renders inside the shared `ProcedureDetailPanel` that
 * `ProceduresExplorer` opens. See that component's own doc-comment for
 * how the mobile-accordion-vs-desktop-shared-panel split works.
 *
 * WHY THIS IS ITS OWN ROUTE, not another branch inside
 * `services/[slug]/page.tsx`:
 * this page is a genuinely different page type, not a content variant.
 * The shared template is one service → one linear story (overview →
 * approach → included items → suitable-for → journey → FAQ); this one is
 * one service → seven sub-procedures, each expandable in place, plus a
 * standalone care block. Roughly three-quarters of it has no counterpart
 * in the shared template, so expressing it as a conditional there would
 * have meant a large branch that every OTHER service page still has to
 * load and reason about. A static segment also takes routing precedence
 * over `[slug]` in the App Router, so the public URL is unchanged and
 * every existing link, card, footer entry, and the Assistant's own
 * service list keep working untouched. `[slug]`'s `generateStaticParams`
 * filters this slug out so the build doesn't also emit a shadowed,
 * unreachable copy.
 *
 * Explicitly NOT done here, per Hamid's constraints: no route, no
 * `SERVICE_TAXONOMY_IDS` entry, and no Assistant service id for any
 * sub-procedure — they exist only inside this page's own explorer. And
 * rhinoplasty is absent by design (it has its own dedicated page); the
 * FAQ answers that for patients directly rather than leaving them to
 * wonder.
 *
 * `#procedures` (the overview grid's own section id) is the one
 * same-page anchor still in real use — the hero's secondary CTA jumps
 * there, which is a deliberate "take me to the list" navigation, not the
 * "card jumps to a lower section" behavior that was removed. `main`
 * keeps `.smooth-anchor-scroll` (globals.css) for exactly that one jump;
 * every individual procedure's own former anchor id (`#face-lift`, etc.)
 * is gone along with the sections they used to point to.
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
  const beforeAfterHref = getBeforeAfterHref(locale, taxonomyItem?.galleryCategory ?? null);
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
        breadcrumb={[{ label: dict.eyebrow, href: `/${locale}/services` }, { label: service.title }]}
        ctaPrimaryLabel={dict.heroCtaPrimary}
        ctaSecondaryLabel={page.heroCtaProcedures}
        ctaSecondaryHref="#procedures"
      />

      <ProceduresExplorer procedures={FACIAL_PROCEDURES} locale={locale} dict={page} />

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
            <Link href={`/${locale}/services`} className="text-sm text-charcoal/40 transition-colors duration-200 hover:text-gold">
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
