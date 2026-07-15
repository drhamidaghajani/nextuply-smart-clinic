import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { AssistantTriggerButton } from "@/modules/smart-clinic-assistant/ui/assistant-trigger-button";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";
import { PremiumBreadcrumb, type BreadcrumbItem } from "./premium-breadcrumb";
import { ServiceVisualPanel } from "./service-visual-panel";

/**
 * Round 2026-07-13 (Dr. William Miami-inspired premium redesign, per
 * Hamid — structural inspiration only, not a copy, per his explicit
 * instruction). Previously `ServiceHero` composed the generic `PageHero`
 * (centered text, small icon badge) — that's still right for content
 * pages like About/Contact, but the brief specifically asked for service
 * pages to feel like "the beginning of a premium treatment story," which
 * a centered title block can't do. Rebuilt as its own split hero: text
 * column (breadcrumb, icon, eyebrow, title, subtitle, 2 CTAs) beside a
 * real photo of that specialty (`ServiceVisualPanel`, same real gallery
 * asset used on `/before-after`) — image-led, not just type on a gradient.
 * Only consumed by service detail pages, so this doesn't touch
 * `PageHero` or any other page.
 */
export function ServiceHero({
  eyebrow,
  title,
  subtitle,
  iconKey,
  photoSrc,
  photoPosition,
  locale,
  breadcrumb,
  ctaPrimaryLabel,
  ctaSecondaryLabel,
  ctaSecondaryHref,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  iconKey: string;
  photoSrc?: string;
  photoPosition?: string;
  locale: Locale;
  breadcrumb: readonly BreadcrumbItem[];
  ctaPrimaryLabel: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
}) {
  return (
    <section
      dir={LOCALE_DIRECTION[locale]}
      data-header-bg="#0f172a"
      className="relative overflow-hidden bg-gradient-to-br from-deep-navy to-[#1a2540] px-6 py-20 sm:px-8 sm:py-28"
    >
      <div
        aria-hidden
        className="animate-ambient-light pointer-events-none absolute -top-20 start-[-8%] h-[360px] w-[360px] rounded-full bg-gold/15 blur-[100px]"
      />
      <div
        aria-hidden
        className="animate-ambient-light pointer-events-none absolute -bottom-24 end-[-8%] h-[400px] w-[400px] rounded-full bg-warm-white/10 blur-[110px]"
        style={{ animationDelay: "3s" }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-start">
          <Reveal>
            <div className="mb-6 flex justify-center lg:justify-start">
              <PremiumBreadcrumb items={breadcrumb} locale={locale} />
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mb-6 flex justify-center lg:justify-start">
              <span className="flex h-14 w-14 items-center justify-center rounded-full ring-1 ring-gold/25 sm:h-16 sm:w-16">
                <span
                  aria-hidden
                  className="block h-7 w-7 shrink-0 bg-gold sm:h-8 sm:w-8"
                  style={{
                    WebkitMaskImage: `url(/icons/services/${iconKey}.png)`,
                    maskImage: `url(/icons/services/${iconKey}.png)`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold sm:text-sm">{eyebrow}</p>
            <h1 className="mt-4 text-balance text-3xl font-bold leading-tight text-warm-white sm:text-5xl lg:text-[46px]">{title}</h1>
            {subtitle ? (
              <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-warm-white/65 sm:text-base sm:leading-8 lg:mx-0">{subtitle}</p>
            ) : null}
          </Reveal>

          <Reveal delay={0.16} className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <AssistantTriggerButton
              intent="consultation_booking"
              source="assistant"
              className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-gold px-8 py-3 text-sm font-medium text-warm-white transition-colors duration-200 hover:bg-gold-hover"
            >
              {ctaPrimaryLabel}
            </AssistantTriggerButton>
            <Link
              href={ctaSecondaryHref}
              className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-warm-white/25 px-8 py-3 text-sm font-medium text-warm-white transition-colors duration-200 hover:border-warm-white/50"
            >
              {ctaSecondaryLabel}
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <ServiceVisualPanel photoSrc={photoSrc} alt={title} iconKey={iconKey} photoPosition={photoPosition} tone="navy" />
        </Reveal>
      </div>
    </section>
  );
}
