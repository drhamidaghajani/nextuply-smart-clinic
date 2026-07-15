import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { ContentSection } from "@/components/page/content-section";
import { DisclaimerBanner } from "@/components/page/disclaimer-banner";
import { PageFaq } from "@/components/page/page-faq";
import { PageHero } from "@/components/page/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { CARE_TOPIC_IDS, getCareTopicBySlug } from "@/content/care-instructions";
import { getServiceById } from "@/content/services";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/i18n/locales";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) => CARE_TOPIC_IDS.map((slug) => ({ locale, slug })));
}

/** cream/warm-white pair, in that order, matching the hex values `ContentSection`'s `headerBg` already uses elsewhere on this page. */
const TONE_SEQUENCE = [
  { tone: "cream", headerBg: "#fcfbf4" },
  { tone: "warm-white", headerBg: "#faf7f1" },
] as const;

function CareList({ items }: { items: readonly string[] }) {
  return (
    <ul className="divide-y divide-charcoal/10 border-y border-charcoal/10">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-4 py-4 text-sm leading-7 text-charcoal/75 sm:text-base">
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * Care topic detail page — real content integrated (per Hamid, 2026-07-13
 * content round: real Persian copy extracted and rewritten from
 * Dr. Sadighi's previous website, Persian is the source of truth,
 * professional English/Arabic translated from it, not literal). Rich
 * per-topic content (before/after/warning signs/FAQ) now comes from
 * `dictionary.careInstructions.topics`, matched to this page's `slug` —
 * same role as `servicesPage.items` for service detail pages.
 *
 * Sections are built into a list and alternate cream/warm-white via
 * `TONE_SEQUENCE` in render order, rather than hand-computing each
 * section's tone from which optional sections exist above it — a topic
 * with no `beforeCare` (e.g. `jaw-physiotherapy`) or no
 * `additionalCare` (every topic except `implant-care`) still gets a
 * clean, gap-free alternation.
 *
 * `dict.detail.pendingReviewNotice` stays defined as a safety-net
 * fallback (used only if a future topic is ever added without content
 * yet) but is not reached for any of today's 9 real topics.
 *
 * `assistantPromptHints` intentionally never render here — see
 * `dictionary-types.ts`'s doc-comment on `CareTopicDetail`.
 */
export default async function CareInstructionDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const topic = getCareTopicBySlug(slug);
  if (!topic) notFound();

  const dict = getDictionary(locale).careInstructions;
  const content = dict.topics.find((item) => item.slug === slug);
  const relatedServices = topic.relatedServiceIds.map((id) => getServiceById(id)).filter((service) => service !== undefined);

  const sections: { key: string; heading?: string; lead?: string; body: ReactNode }[] = [];

  if (content) {
    if (content.intro) {
      sections.push({ key: "intro", lead: content.intro, body: null });
    }
    if (content.beforeCare.length > 0) {
      sections.push({ key: "before", heading: dict.detail.beforeHeading, body: <CareList items={content.beforeCare} /> });
    }
    sections.push({ key: "after", heading: dict.detail.afterHeading, body: <CareList items={content.afterCare} /> });
    if (content.additionalCare && content.additionalCareHeading) {
      sections.push({ key: "additional", heading: content.additionalCareHeading, body: <CareList items={content.additionalCare} /> });
    }
    sections.push({
      key: "warnings",
      heading: dict.detail.warningSignsHeading,
      lead: dict.detail.warningSignsBody,
      body: <CareList items={content.warningSigns} />,
    });
    sections.push({ key: "faq", heading: dict.detail.faqHeading, body: <PageFaq items={content.faq} /> });
  } else {
    sections.push({
      key: "pending",
      heading: dict.detail.beforeHeading,
      body: <p className="text-sm leading-7 text-charcoal/60 sm:text-base">{dict.detail.pendingReviewNotice}</p>,
    });
  }

  return (
    <main>
      <PageHero
        eyebrow={dict.eyebrow}
        title={topic.title[locale]}
        subtitle={topic.shortDescription[locale]}
        locale={locale}
        breadcrumb={[{ label: dict.heading, href: `/${locale}/care-instructions` }, { label: topic.title[locale] }]}
      />

      {topic.imagePath ? (
        <section data-header-bg="#faf7f1" className="bg-warm-white px-6 py-10 sm:px-8 sm:py-14">
          <Reveal className="mx-auto max-w-3xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-[0_30px_80px_rgba(15,23,42,0.15)] sm:rounded-[28px]">
              <Image src={topic.imagePath} alt={topic.title[locale]} fill sizes="(min-width: 1024px) 60vw, 90vw" className="object-cover" />
            </div>
          </Reveal>
        </section>
      ) : null}

      {sections.map((section, index) => {
        const { tone, headerBg } = TONE_SEQUENCE[index % 2]!;
        return (
          <ContentSection key={section.key} heading={section.heading} lead={section.lead} tone={tone} headerBg={headerBg}>
            {section.body}
          </ContentSection>
        );
      })}

      <section data-header-bg="#fcfbf4" className="bg-cream px-6 pb-14 sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <DisclaimerBanner text={dict.disclaimer} />
          {relatedServices.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {relatedServices.map((service) => (
                <Link
                  key={service.id}
                  href={`/${locale}/services/${service.slug}`}
                  className="whitespace-nowrap rounded-full border border-charcoal/15 px-4 py-1.5 text-xs text-charcoal/60 transition-colors duration-200 hover:border-gold/40 hover:text-gold"
                >
                  {service.title[locale]}
                </Link>
              ))}
            </div>
          ) : null}
          <Link href={`/${locale}/care-instructions`} className="text-sm text-gold hover:text-gold-hover">
            ← {dict.backToHubCta}
          </Link>
        </div>
      </section>

      <AssistantCtaSection heading={dict.assistantCtaHeading} body={dict.assistantCtaBody} buttonLabel={dict.assistantCtaButton} intent="general" />
    </main>
  );
}
