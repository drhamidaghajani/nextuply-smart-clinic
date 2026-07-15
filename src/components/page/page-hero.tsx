import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";
import { PremiumBreadcrumb, type BreadcrumbItem } from "./premium-breadcrumb";

/**
 * Round 2026-07-13 (design-quality pass, per Hamid's premium/cinematic
 * brief): rebuilt against the homepage's own already-approved dark-hero
 * grammar (`hero.tsx`/`why-dr-sadighi-section.tsx`) — the same navy
 * gradient, the same two ambient-light glows (`.animate-ambient-light`,
 * reused, not reinvented), the same fadeUp/scale entrance timing — rather
 * than a new visual language. Previous version was a flat centered box
 * with no breadcrumb, no texture, no CTA slot; this version brings every
 * internal page's opening moment up to the same bar as the homepage
 * sections it sits beside in navigation.
 *
 * `eyebrow` still carries the section's identity (matches
 * `FeaturedServicesSection`'s uppercase-tracked eyebrow convention);
 * `breadcrumb` and `children` (a CTA row, an icon badge, etc.) are
 * optional so plain content pages (About, Contact) don't have to pass
 * unused props.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  locale,
  breadcrumb,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  locale: Locale;
  breadcrumb?: readonly BreadcrumbItem[];
  /** Small badge (e.g. a masked service-icon glyph) centered above the eyebrow — see `ServiceHero`. */
  icon?: ReactNode;
  /** CTA row or other content below the subtitle. */
  children?: ReactNode;
}) {
  return (
    <section
      dir={LOCALE_DIRECTION[locale]}
      data-header-bg="#0f172a"
      className="relative overflow-hidden bg-gradient-to-br from-deep-navy to-[#1a2540] px-6 py-24 sm:px-8 sm:py-32"
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

      <div className="relative mx-auto max-w-3xl text-center">
        {breadcrumb ? (
          <Reveal>
            <div className="mb-6">
              <PremiumBreadcrumb items={breadcrumb} locale={locale} />
            </div>
          </Reveal>
        ) : null}

        {icon ? (
          <Reveal delay={breadcrumb ? 0.08 : 0} className="mb-6 flex justify-center">
            {icon}
          </Reveal>
        ) : null}

        <Reveal delay={breadcrumb ? 0.08 : 0}>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold sm:text-sm">{eyebrow}</p>
          <h1 className="mt-4 text-balance text-3xl font-bold leading-tight text-warm-white sm:text-5xl lg:text-[52px]">{title}</h1>
          {subtitle ? (
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-warm-white/65 sm:text-base sm:leading-8">{subtitle}</p>
          ) : null}
        </Reveal>

        {children ? (
          <Reveal delay={breadcrumb ? 0.16 : 0.08} className="mt-8">
            {children}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
