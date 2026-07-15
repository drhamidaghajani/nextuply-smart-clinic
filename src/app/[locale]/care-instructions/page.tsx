import Link from "next/link";
import { notFound } from "next/navigation";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { DisclaimerBanner } from "@/components/page/disclaimer-banner";
import { PageHero } from "@/components/page/page-hero";
import { ServiceVisualPanel } from "@/components/page/service-visual-panel";
import { Reveal } from "@/components/motion/reveal";
import { CARE_TOPICS, getCareInstructionHref } from "@/content/care-instructions";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";

/**
 * New patient-care hub (Hamid's "مراقبت‌های قبل و بعد عمل" brief,
 * 2026-07-13) — a dedicated section for pre/post-procedure care guidance,
 * separate from and not a redesign of the services/homepage system.
 *
 * Card grid, not the hairline-list treatment used on `/services` — the
 * brief's reference screenshot explicitly asked for "visual care-topic
 * cards," just executed premium (soft rounded corners, generous spacing,
 * calm hover) rather than busy. Reuses `ServiceVisualPanel` (real photo
 * or abstract gradient+glyph fallback).
 *
 * Round 2026-07-13, same day: real photography wired via `topic.imagePath`
 * (all 9 topics now have one, see `content/care-instructions.ts`). Title/
 * description sit BELOW the image, not overlaid on top of it, so no dark
 * scrim is applied — the brief's "subtle dark overlay only if title text
 * is over the image" condition doesn't apply to this layout.
 */
export default async function CareInstructionsHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).careInstructions;

  return (
    <main>
      <PageHero eyebrow={dict.eyebrow} title={dict.heading} subtitle={dict.subheading} locale={locale} breadcrumb={[{ label: dict.eyebrow }]}>
        <p className="mx-auto max-w-lg text-xs leading-6 text-warm-white/50 sm:text-sm">{dict.trustNote}</p>
      </PageHero>

      <section data-header-bg="#faf7f1" className="bg-warm-white px-6 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CARE_TOPICS.map((topic, index) => (
            <Reveal key={topic.id} delay={index * 0.05}>
              <Link
                href={getCareInstructionHref(locale, topic.slug)}
                className="group block overflow-hidden rounded-2xl border border-charcoal/10 bg-cream transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gold/30 hover:shadow-xl hover:shadow-charcoal/10 sm:rounded-[28px]"
              >
                <div className="overflow-hidden transition-transform duration-500 ease-out group-hover:scale-105 [&>div]:rounded-none">
                  <ServiceVisualPanel alt={topic.title[locale]} photoSrc={topic.imagePath} iconKey={topic.iconKey} />
                </div>
                <div className="px-5 py-5 sm:px-6 sm:py-6">
                  <h3 className="text-base font-bold leading-snug text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:text-lg">
                    {topic.title[locale]}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-charcoal/60">{topic.shortDescription[locale]}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold">{dict.viewGuideCta}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-2xl text-center">
          <DisclaimerBanner text={dict.safetyNote} />
        </div>
      </section>

      <AssistantCtaSection heading={dict.assistantCtaHeading} body={dict.assistantCtaBody} buttonLabel={dict.assistantCtaButton} intent="general" />
    </main>
  );
}
