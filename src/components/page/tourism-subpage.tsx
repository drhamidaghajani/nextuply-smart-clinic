import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { ContentSection } from "@/components/page/content-section";
import { DisclaimerBanner } from "@/components/page/disclaimer-banner";
import { PageHero } from "@/components/page/page-hero";
import { TourismNav } from "@/components/page/tourism-nav";
import type { HealthTourismPageDictionary, HealthTourismSubpage } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";

/**
 * Shared body for the 3 health-tourism subpages (visa/hotel/transfer) —
 * identical shape, different content. Round 2026-07-13 (design-quality
 * pass): breadcrumb added, points list moved to the same hairline-divider
 * treatment as service pages' "who this may help" list (one shared visual
 * language for "a short list of plain facts" across the site).
 */
export function TourismSubpage({
  section,
  nav,
  active,
  locale,
  ctaHeading,
  ctaBody,
  ctaButton,
}: {
  section: HealthTourismSubpage;
  nav: HealthTourismPageDictionary["nav"];
  active: "visa" | "hotel" | "transfer";
  locale: Locale;
  ctaHeading: string;
  ctaBody: string;
  ctaButton: string;
}) {
  return (
    <main>
      <PageHero
        eyebrow={section.eyebrow}
        title={section.title}
        subtitle={section.subtitle}
        locale={locale}
        breadcrumb={[{ label: nav.overview, href: `/${locale}/health-tourism` }, { label: section.eyebrow }]}
      />
      <TourismNav nav={nav} locale={locale} active={active} />
      <ContentSection lead={section.intro} tone="cream">
        <ul className="divide-y divide-charcoal/10 border-y border-charcoal/10">
          {section.points.map((point) => (
            <li key={point} className="flex items-start gap-4 py-4 text-sm leading-7 text-charcoal/75 sm:text-base">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <DisclaimerBanner text={section.cautionNote} />
        </div>
      </ContentSection>
      <AssistantCtaSection heading={ctaHeading} body={ctaBody} buttonLabel={ctaButton} intent="general" />
    </main>
  );
}
