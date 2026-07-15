import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateGallerySection } from "@/components/page/certificate-gallery-section";
import { ContentSection } from "@/components/page/content-section";
import { PremiumBreadcrumb } from "@/components/page/premium-breadcrumb";
import { Reveal } from "@/components/motion/reveal";
import { ServiceTile } from "@/components/sections/service-tile";
import { AssistantTriggerButton } from "@/modules/smart-clinic-assistant/ui/assistant-trigger-button";
import { SERVICES } from "@/content/services";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale, LOCALE_DIRECTION } from "@/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const dict = getDictionary(locale).about;
  return { title: dict.metaTitle, description: dict.positioning };
}

/** First run of digits (Latin, Persian, or Arabic-Indic) in a string, or null — used to pull each credential's real rank number instead of a fake sequential index. */
function extractLeadingDigits(value: string): string | null {
  const match = value.match(/[0-9۰-۹٠-٩]+/);
  return match ? match[0] : null;
}

/**
 * Round 2026-07-14 (About page rejected TWICE, per Hamid — "still looks
 * like scattered text and weak cards," full mandatory-fix list supplied).
 * This is a genuine visual rebuild, not a spacing pass:
 *
 * - Hero: photo now bleeds to a real 50/50 column split (was capped at
 *   `max-w-md`, reading small regardless of column width), ring+heavy
 *   shadow removed in favor of a bottom gradient fade so it blends into
 *   the navy surface instead of floating as a "profile card."
 * - Credentials: rebuilt as one undivided editorial strip with large
 *   ghost numerals (01–04) and much larger type — was 4 small centered
 *   lines.
 * - Specialty Focus: now renders the extracted `ServiceTile` — the
 *   EXACT component `FeaturedServicesSection` uses on the homepage
 *   (same file, same classes, same icon sizes, same hover), not a
 *   rebuilt imitation. See `service-tile.tsx`.
 * - Biography: bespoke asymmetric layout with real typographic
 *   hierarchy (larger lead sentence, regular body, small gold-rule
 *   caption) instead of uniform paragraphs.
 * - Philosophy: a genuine large pull-quote statement on navy, no more
 *   "lonely circle" quote-mark visual.
 * - Technology: a more elaborate scan-ring + grid-line SVG composition.
 * - Patient Relationship: CTA now lives inside the text column, aligned
 *   with the copy, not centered alone beneath the section.
 * - Work Experience: real two-column timeline (date column + content
 *   column) with a continuous connector line and filled gold markers.
 * - Explore Next: 3 large visual tiles (icon + label + arrow), not small
 *   text rows.
 * - Final CTA: bespoke, built for this page (not the shared
 *   `AssistantCtaSection`, which several other pages this task must not
 *   touch also depend on) — larger heading, gold primary + outline
 *   secondary, ambient glow.
 *
 * Real imagery: `doctor-headshot.png` (hero) and `doctor-surgery.jpg`
 * (biography) — the same two real photos used site-wide. No fake
 * portraits. TODO: replace hero photo with a dedicated About-page
 * portrait once one is approved (code-only note, not shown to users).
 *
 * Tone sequence (gap-free `data-header-bg`): navy (hero) → warm-white
 * (credentials) → cream (biography) → navy (philosophy) → warm-white
 * (specialty) → cream (technology) → warm-white (patient relationship)
 * → cream (timeline) → warm-white (scientific activity) → cream
 * (explore) → navy (final CTA) → navy (footer).
 */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).about;
  const isRtl = LOCALE_DIRECTION[locale] === "rtl";
  const arrow = isRtl ? "←" : "→";

  return (
    <main>
      {/* 1. HERO ------------------------------------------------------ */}
      {/*
       * Round 2026-07-14, hero/header collision fix (kept from the earlier
       * round — see `use-header-theme.ts`'s doc-comment for why the fixed
       * header shows immediately on this page): top padding here still
       * clears the header (`pt-28` mobile ≥68px header, `lg:pt-32`=128px
       * ≥88px desktop header). Do not remove.
       *
       * Round 2026-07-14, editorial-portrait rebuild (per Hamid — the
       * full-bleed version from the previous round is REJECTED: the wide
       * seam gradient (up to 60% of the image width) plus a top fade over
       * the face crop made the doctor's face look darkened/half-hidden,
       * unacceptable for a medical trust page). Reverted to a framed
       * portrait: the photo sits in its own soft-radius panel with NOTHING
       * drawn over the photo itself except a light edge-only vignette
       * (`inset box-shadow`, darkens only the outer rim, never the center
       * where the face sits) and a hairline gold ring. All depth/premium
       * feel now comes from OUTSIDE the photo — an ambient gold glow blob
       * behind the frame and a soft drop shadow — never from a gradient
       * drawn across the face. Image column narrowed to ~44% (was 50%) per
       * his split-ratio spec; the gold seam line from the full-bleed
       * version is gone (no seam exists once the image is a contained
       * frame, not edge-to-edge).
       */}
      <section dir={LOCALE_DIRECTION[locale]} data-header-bg="#0f172a" className="relative overflow-hidden bg-deep-navy">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(120% 90% at 15% 10%, rgba(201,161,90,0.16) 0%, rgba(15,23,42,0) 45%), radial-gradient(90% 70% at 85% 100%, rgba(201,161,90,0.10) 0%, rgba(15,23,42,0) 55%)" }}
        />
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]" preserveAspectRatio="none">
          <defs>
            <pattern id="about-hero-grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M56 0H0V56" fill="none" stroke="#c9a15a" strokeWidth={0.5} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#about-hero-grid)" />
        </svg>
        <div
          aria-hidden
          className="animate-ambient-light pointer-events-none absolute -top-20 start-[-8%] h-[400px] w-[400px] rounded-full bg-gold/15 blur-[110px]"
        />

        <div className="relative grid gap-10 pb-20 pt-28 sm:pb-24 sm:pt-32 lg:min-h-[85vh] lg:grid-cols-[56%_44%] lg:items-center lg:gap-0 lg:pb-16 lg:pt-32">
          <div className="relative z-10 flex flex-col justify-center px-6 text-center sm:px-8 lg:px-14 lg:text-start xl:px-20">
            <div className="mx-auto max-w-xl lg:mx-0">
              <Reveal>
                <div className="mb-6 flex justify-center lg:justify-start">
                  <PremiumBreadcrumb items={[{ label: dict.eyebrow }]} locale={locale} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold sm:text-sm">{dict.eyebrow}</p>
                <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.05] text-warm-white sm:text-6xl lg:text-[62px] xl:text-[68px]">{dict.title}</h1>
                <p className="mt-4 text-sm font-medium uppercase tracking-wide text-warm-white/55 sm:text-base">{dict.subtitle}</p>
                <p className="mt-7 text-sm leading-7 text-warm-white/70 sm:text-base sm:leading-8">{dict.positioning}</p>
              </Reveal>

              <Reveal
                delay={0.12}
                className="mt-9 flex flex-wrap items-center justify-center divide-x divide-warm-white/15 rtl:divide-x-reverse lg:justify-start"
              >
                {dict.heroTrustMarkers.map((marker) => (
                  <span
                    key={marker}
                    className="px-4 text-xs font-medium text-warm-white/80 first:ps-0 sm:px-5 sm:text-sm"
                  >
                    {marker}
                  </span>
                ))}
              </Reveal>

              <Reveal delay={0.2} className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <AssistantTriggerButton
                  intent="consultation_booking"
                  source="assistant"
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-10 py-4 text-sm font-semibold text-warm-white shadow-[0_20px_50px_rgba(201,161,90,0.25)] transition-colors duration-200 hover:bg-gold-hover"
                >
                  {dict.heroCtaPrimary}
                </AssistantTriggerButton>
                <Link
                  href={`/${locale}/services`}
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-warm-white/25 px-9 py-4 text-sm font-semibold text-warm-white transition-colors duration-200 hover:border-warm-white/50"
                >
                  {dict.heroCtaSecondary}
                </Link>
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.15} className="relative flex w-full items-center justify-center px-6 sm:px-8 lg:px-10 xl:px-14">
            {/* ambient depth glow behind the frame — never over the photo itself */}
            <div
              aria-hidden
              className="pointer-events-none absolute h-[85%] w-[85%] rounded-full"
              style={{ background: "radial-gradient(60% 60% at 50% 42%, rgba(201,161,90,0.22) 0%, rgba(15,23,42,0) 70%)" }}
            />
            <div className="relative aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[28px] shadow-[0_40px_100px_rgba(0,0,0,0.4)] ring-1 ring-warm-white/10 sm:rounded-[36px]">
              <Image src="/media/doctor-headshot.png" alt={dict.title} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover object-top" priority />
              {/* gentle vignette on the outer rim only — center (the face) stays untouched */}
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 70px 24px rgba(15,23,42,0.28)" }} />
              <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/20" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. CREDENTIALS STRIP ------------------------------------------ */}
      {/*
       * Round 2026-07-14 (per Hamid — "for non-numeric credentials, use a
       * strong typographic label instead of forcing a number"): the
       * previous version gave every item a fake sequential 01–04 ghost
       * numeral regardless of content. Now each item's real leading
       * number is extracted from its own dictionary string (works across
       * fa/en/ar without touching any dictionary — see
       * `extractLeadingDigits` below, matches Latin/Persian/Arabic-Indic
       * digits generically) and shown at large scale as the anchor
       * figure; the two credentials with no inherent number (the
       * doctorate and the specialist title) get a gold seal/laurel glyph
       * at the same visual weight instead of an invented ordinal. The
       * full credential sentence is unchanged and still shown in full
       * beneath it, restyled as a smaller, refined supporting line.
       */}
      <section data-header-bg="#faf7f1" className="relative overflow-hidden bg-warm-white px-6 py-20 sm:px-8 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute -top-32 start-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <Reveal className="mb-12 text-center sm:mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">{dict.credentialsEyebrow}</p>
            <span aria-hidden className="mx-auto mt-4 block h-px w-16 bg-gold/40" />
          </Reveal>
          <div className="grid grid-cols-1 border-t border-gold/20 sm:grid-cols-2 lg:grid-cols-4">
            {dict.credentials.map((item, index) => {
              const bigValue = extractLeadingDigits(item);
              return (
                <Reveal key={item} delay={index * 0.08}>
                  <div className="flex h-full flex-col border-b border-gold/20 px-3 py-10 sm:px-7 sm:py-14 lg:border-b-0 lg:border-e lg:last:border-e-0">
                    {bigValue ? (
                      <span className="font-heading text-6xl font-bold leading-none tracking-tight text-gold sm:text-7xl">{bigValue}</span>
                    ) : (
                      <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="h-12 w-12 text-gold sm:h-14 sm:w-14">
                        <circle cx={12} cy={9} r={5} />
                        <path d="M8.3 13.6 5.5 21l6.5-3 6.5 3-2.8-7.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <p className="mt-6 text-sm font-medium leading-6 text-charcoal/80 sm:text-base sm:leading-7">{item}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2b. CERTIFICATES & SCIENTIFIC CREDENTIALS ----------------------- */}
      {/*
       * Round 2026-07-14 (per Hamid — the horizontal-scroll rail this
       * section previously used is REJECTED: "do not create a plain
       * gallery or scroll row"). Replaced with `CertificateGallerySection`
       * — a featured composition (one large certificate + two smaller
       * layered cards) with the full 14-item set reachable through a
       * modal. Extracted into its own client component (not inlined
       * here) since it owns real interactive state (modal open/close,
       * active index, keyboard nav) — keeping that out of this otherwise
       * server-rendered page. See that file's doc-comment for the
       * composition/data details.
       */}
      <CertificateGallerySection dict={dict} locale={locale} />

      {/* 3. EDITORIAL BIOGRAPHY ----------------------------------------- */}
      {/*
       * Round 2026-07-14 (per Hamid — "should read as scientific path and
       * professional identity, not image + biography text"): the single
       * "credentialsEyebrow — credentials[1]" line is replaced with a real
       * three-step visual path (education → specialty → fellowship),
       * reusing `dict.credentials[1..3]` verbatim (no new copy) as the
       * step labels with a connecting hairline and gold nodes. The photo
       * gets a permanent low-opacity navy wash (not just the bottom
       * gradient) so it reads as toned/graded rather than a raw snapshot,
       * and its caption strip is now a frosted (backdrop-blur) band
       * instead of a flat gradient edge, closer to an editorial photo
       * credit than a plain overlay.
       */}
      <section data-header-bg="#fcfbf4" className="bg-cream px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 sm:gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
          <Reveal>
            <span aria-hidden className="mb-4 block h-px w-10 bg-gold/60" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold sm:text-sm">{dict.bioEyebrow}</p>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-charcoal sm:text-4xl lg:text-[38px]">{dict.bioHeading}</h2>
            <p className="mt-6 text-lg font-medium leading-8 text-charcoal sm:text-xl sm:leading-9">{dict.bioBody[0]}</p>
            {dict.bioBody[1] ? <p className="mt-4 text-sm leading-7 text-charcoal/65 sm:text-base sm:leading-8">{dict.bioBody[1]}</p> : null}

            {/* education → specialty → fellowship visual path */}
            <div className="mt-9 flex items-start gap-0">
              {[dict.credentials[1], dict.credentials[2], dict.credentials[3]].map((label, i, arr) => (
                <div key={label} className="flex flex-1 flex-col items-start last:flex-none">
                  <div className="flex w-full items-center">
                    <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-gold ring-4 ring-gold/15" />
                    {i < arr.length - 1 ? <span aria-hidden className="mx-2.5 h-px flex-1 bg-gold/30" /> : null}
                  </div>
                  <p className="mt-3 line-clamp-2 max-w-[9.5rem] text-xs leading-5 text-charcoal/60 sm:max-w-[11rem]">{label}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl ring-1 ring-charcoal/5 sm:rounded-[28px]">
              <Image src="/media/doctor-surgery.jpg" alt={dict.bioHeading} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" style={{ objectPosition: "75% 25%" }} />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-deep-navy/15" />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep-navy/75 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-deep-navy/25 px-5 py-4 backdrop-blur-sm sm:px-7 sm:py-5">
                <span aria-hidden className="h-px w-8 bg-gold/70" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-warm-white/90 sm:text-xs">{dict.bioEyebrow}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. PHILOSOPHY — LARGE STATEMENT --------------------------------- */}
      <section data-header-bg="#0f172a" className="relative overflow-hidden bg-gradient-to-br from-deep-navy to-[#1a2540] px-6 py-20 sm:px-8 sm:py-28">
        <div aria-hidden className="animate-ambient-light pointer-events-none absolute -bottom-24 end-[-8%] h-[420px] w-[420px] rounded-full bg-gold/15 blur-[110px]" />
        <Reveal className="relative mx-auto max-w-3xl text-center">
          <span aria-hidden className="mx-auto block h-px w-14 bg-gold/50" />
          <h2 className="mt-6 text-balance font-heading text-2xl font-bold leading-[1.3] text-warm-white sm:text-4xl lg:text-[42px]">{dict.philosophyHeading}</h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-warm-white/70 sm:text-lg sm:leading-9">{dict.philosophy[0]}</p>
          {dict.philosophy[1] ? <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-warm-white/55 sm:text-base">{dict.philosophy[1]}</p> : null}
        </Reveal>
      </section>

      {/* 5. SPECIALTY FOCUS — homepage-scale tiles ----------------------- */}
      <section data-header-bg="#faf7f1" className="relative overflow-hidden bg-warm-white px-6 py-20 sm:px-8 sm:py-28">
        <div aria-hidden className="pointer-events-none absolute -top-24 start-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold sm:text-sm">{dict.eyebrow}</p>
            <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-charcoal sm:text-4xl lg:text-[40px]">{dict.specialtyHeading}</h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
            {SERVICES.map((service, index) => (
              <Reveal key={service.id} delay={index * 0.06}>
                <ServiceTile item={service} locale={locale} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TECHNOLOGY & PLANNING ---------------------------------------- */}
      <section data-header-bg="#fcfbf4" className="bg-cream px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <ScanVisual />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-balance text-3xl font-bold leading-tight text-charcoal sm:text-4xl lg:text-[38px]">{dict.technologyHeading}</h2>
            <p className="mt-5 text-sm leading-7 text-charcoal/70 sm:text-base sm:leading-8">{dict.technologyBody}</p>
          </Reveal>
        </div>
      </section>

      {/* 7. PATIENT RELATIONSHIP ------------------------------------------ */}
      <section data-header-bg="#faf7f1" className="bg-warm-white px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal className="order-2 lg:order-1">
            <PatientJourneyVisual />
          </Reveal>
          <Reveal delay={0.1} className="order-1 text-center lg:order-2 lg:text-start">
            <h2 className="text-balance text-3xl font-bold leading-tight text-charcoal sm:text-4xl lg:text-[38px]">{dict.patientRelationshipHeading}</h2>
            <div className="mx-auto mt-5 max-w-lg space-y-3 text-sm leading-7 text-charcoal/70 sm:text-base sm:leading-8 lg:mx-0">
              {dict.patientRelationshipBody.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <AssistantTriggerButton
              intent="general"
              source="assistant"
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-8 py-3 text-sm font-medium text-warm-white transition-colors duration-200 hover:bg-gold-hover"
            >
              {dict.patientRelationshipCta}
            </AssistantTriggerButton>
          </Reveal>
        </div>
      </section>

      {/* 8. WORK EXPERIENCE — real timeline, alternating on desktop -------- */}
      <ContentSection eyebrow={dict.eyebrow} heading={dict.experienceHeading} tone="cream" headerBg="#fcfbf4">
        {/* mobile / tablet: stacked left-line timeline, institution as a real card */}
        <div className="mx-auto max-w-2xl lg:hidden">
          {dict.experience.map((entry, index) => (
            <Reveal key={`${entry.period}-${entry.place}`} delay={index * 0.06}>
              <div className="grid grid-cols-[auto_1fr] gap-x-5 sm:grid-cols-[120px_auto_1fr] sm:gap-x-6">
                <p className="hidden self-start pt-3 text-sm font-bold uppercase tracking-wide text-gold sm:block">{entry.period}</p>
                <div className="flex flex-col items-center">
                  <span aria-hidden className="mt-3 h-4 w-4 shrink-0 rounded-full bg-gold ring-[6px] ring-gold/15" />
                  {index < dict.experience.length - 1 ? (
                    <span aria-hidden className="mt-2 w-0.5 flex-1 bg-gradient-to-b from-gold/45 to-charcoal/10" />
                  ) : null}
                </div>
                <div className={index < dict.experience.length - 1 ? "pb-6 sm:pb-8" : ""}>
                  <div className="rounded-2xl bg-warm-white px-5 py-4 shadow-[0_15px_35px_rgba(15,23,42,0.06)] ring-1 ring-charcoal/5 sm:px-6 sm:py-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-gold sm:hidden">{entry.period}</p>
                    <p className="mt-1 text-lg font-semibold text-charcoal sm:mt-0 sm:text-xl">{entry.place}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* desktop: alternating center-line timeline */}
        <div className="relative mx-auto hidden max-w-4xl lg:block">
          <span aria-hidden className="pointer-events-none absolute inset-y-0 start-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-gold/60 via-gold/30 to-transparent" />
          {dict.experience.map((entry, index) => {
            const isLeft = index % 2 === 0;
            const card = (
              <div className="inline-block rounded-2xl bg-warm-white px-8 py-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)] ring-1 ring-charcoal/5">
                <p className="text-sm font-bold uppercase tracking-wide text-gold">{entry.period}</p>
                <p className="mt-2 text-2xl font-semibold text-charcoal">{entry.place}</p>
              </div>
            );
            return (
              <Reveal key={`${entry.period}-${entry.place}`} delay={index * 0.06}>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-10 py-6">
                  <div className="text-end">{isLeft ? card : null}</div>
                  <span aria-hidden className="relative z-10 h-5 w-5 shrink-0 rounded-full bg-gold shadow-[0_0_0_6px_rgba(201,161,90,0.15),0_0_24px_rgba(201,161,90,0.5)]" />
                  <div className="text-start">{!isLeft ? card : null}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </ContentSection>

      {/* 9. SCIENTIFIC ACTIVITY --------------------------------------------- */}
      <ContentSection heading={dict.scientificHeading} tone="warm-white" headerBg="#faf7f1">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-sm leading-7 text-charcoal/75 sm:text-base sm:leading-8">{dict.scientificBody}</p>
          <p className="text-sm leading-7 text-charcoal/60 sm:text-base">{dict.scientificNote}</p>
        </div>
      </ContentSection>

      {/* 10. EXPLORE NEXT — large visual tiles ------------------------------ */}
      <section data-header-bg="#fcfbf4" className="bg-cream px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-8 text-center sm:mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold sm:text-sm">{dict.exploreEyebrow}</p>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
            {[
              { label: dict.exploreServicesLabel, sub: dict.exploreServicesSub, href: `/${locale}/services`, icon: "M4 6h16M4 12h16M4 18h10" },
              { label: dict.exploreCareLabel, sub: dict.exploreCareSub, href: `/${locale}/care-instructions`, icon: "M12 4v16M4 12h16" },
              { label: dict.exploreBeforeAfterLabel, sub: dict.exploreBeforeAfterSub, href: `/${locale}/before-after`, icon: "M4 4h7v16H4zM13 4h7v16h-7z" },
            ].map((tile, index) => (
              <Reveal key={tile.href} delay={index * 0.08}>
                <Link
                  href={tile.href}
                  className="group relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-[24px] border border-charcoal/10 bg-warm-white p-7 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-2xl hover:shadow-charcoal/10 sm:min-h-[260px] sm:p-9"
                >
                  <span aria-hidden className="pointer-events-none absolute -top-10 end-[-15%] h-40 w-40 rounded-full bg-gold/[0.06] blur-2xl transition-opacity duration-300 ease-out group-hover:opacity-100 sm:opacity-0" />
                  <div className="relative">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full ring-1 ring-charcoal/10 transition-colors duration-300 ease-out group-hover:ring-gold/40 sm:h-16 sm:w-16">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="h-6 w-6 text-charcoal/70 transition-colors duration-300 ease-out group-hover:text-gold sm:h-7 sm:w-7">
                        <path d={tile.icon} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <h3 className="mt-6 text-xl font-bold text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:text-2xl">{tile.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-charcoal/55 sm:text-base">{tile.sub}</p>
                  </div>
                  <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold/70 transition-all duration-300 ease-out group-hover:gap-3 group-hover:text-gold">
                    {arrow}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FINAL CTA — bespoke, stronger ------------------------------------ */}
      <section data-header-bg="#0f172a" className="relative overflow-hidden bg-gradient-to-br from-deep-navy to-[#1a2540] px-6 py-24 sm:px-8 sm:py-32">
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" preserveAspectRatio="none">
          <defs>
            <pattern id="about-cta-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="#c9a15a" strokeWidth={0.5} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#about-cta-grid)" />
        </svg>
        <div aria-hidden className="animate-ambient-light pointer-events-none absolute -top-16 start-1/3 h-[380px] w-[380px] rounded-full bg-gold/15 blur-[120px]" />
        <Reveal className="relative mx-auto max-w-2xl text-center">
          <span aria-hidden className="mx-auto mb-6 block h-px w-14 bg-gold/50" />
          <h2 className="text-balance text-3xl font-bold leading-tight text-warm-white sm:text-5xl lg:text-[46px]">{dict.ctaHeading}</h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-warm-white/70 sm:text-base sm:leading-8">{dict.ctaBody}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <AssistantTriggerButton
              intent="consultation_booking"
              source="assistant"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-10 py-4 text-base font-semibold text-warm-white shadow-[0_20px_50px_rgba(201,161,90,0.25)] transition-colors duration-200 hover:bg-gold-hover"
            >
              {dict.ctaButton}
            </AssistantTriggerButton>
            <Link
              href={`/${locale}/services`}
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-warm-white/25 px-9 py-4 text-sm font-semibold text-warm-white transition-colors duration-200 hover:border-warm-white/50"
            >
              {dict.ctaSecondaryLabel}
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

/** More elaborate CBCT/planning-inspired visual — concentric scan rings + grid lines + a gold-accented center glyph, replacing the earlier plain gradient panel. */
function ScanVisual() {
  return (
    <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-deep-navy to-[#1a2540] sm:rounded-[28px]">
      <svg viewBox="0 0 200 250" className="absolute inset-0 h-full w-full opacity-30" aria-hidden>
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h-${i}`} x1={0} y1={i * 28} x2={200} y2={i * 28} stroke="#c9a15a" strokeWidth={0.5} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`v-${i}`} x1={i * 26} y1={0} x2={i * 26} y2={250} stroke="#c9a15a" strokeWidth={0.5} />
        ))}
      </svg>
      <svg viewBox="0 0 200 250" className="absolute inset-0 h-full w-full opacity-50" aria-hidden>
        <circle cx={100} cy={125} r={40} fill="none" stroke="#c9a15a" strokeWidth={0.6} />
        <circle cx={100} cy={125} r={62} fill="none" stroke="#c9a15a" strokeWidth={0.6} />
        <circle cx={100} cy={125} r={84} fill="none" stroke="#c9a15a" strokeWidth={0.4} strokeDasharray="2 4" />
      </svg>
      <span aria-hidden className="animate-ambient-light absolute -top-8 start-1/4 h-[200px] w-[200px] rounded-full bg-gold/20 blur-[90px]" />
      <span className="relative flex h-20 w-20 items-center justify-center rounded-full ring-1 ring-gold/40 sm:h-24 sm:w-24">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="h-10 w-10 text-gold sm:h-11 sm:w-11">
          <rect x={4} y={4} width={16} height={16} rx={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 9h16M9 4v16" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  );
}

/**
 * Abstract consultation/intake panel for the Patient Relationship section —
 * a wireframe-style card (avatar + placeholder bars, no real copy, so this
 * is never mistaken for actual chat/medical content) plus a 3-step care-path
 * strip beneath it. Replaces the earlier single lone icon.
 */
function PatientJourneyVisual() {
  return (
    <div className="relative flex aspect-[4/5] w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-deep-navy to-[#1a2540] px-6 py-8 sm:rounded-[28px] sm:px-10">
      <svg viewBox="0 0 200 250" className="absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden preserveAspectRatio="none">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h-${i}`} x1={0} y1={i * 28} x2={200} y2={i * 28} stroke="#c9a15a" strokeWidth={0.4} />
        ))}
      </svg>
      <span aria-hidden className="animate-ambient-light pointer-events-none absolute -bottom-10 end-[-10%] h-[220px] w-[220px] rounded-full bg-gold/15 blur-[100px]" />

      {/* abstract intake card, styled as a live product surface tied to the assistant */}
      <div className="relative w-full max-w-[300px] rounded-2xl bg-warm-white p-5 shadow-[0_30px_70px_rgba(0,0,0,0.35)] sm:p-6">
        <div className="mb-4 flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-charcoal/15" />
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-charcoal/15" />
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-charcoal/15" />
        </div>
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-gold/50 to-gold/20 ring-1 ring-gold/30" />
          <div className="flex-1 space-y-1.5">
            <span aria-hidden className="block h-2 w-2/3 rounded-full bg-charcoal/15" />
            <span aria-hidden className="block h-2 w-2/5 rounded-full bg-charcoal/10" />
          </div>
        </div>
        <div className="mt-5 space-y-2.5">
          <span aria-hidden className="block h-7 w-4/5 rounded-2xl rounded-ss-sm bg-cream" />
          <span aria-hidden className="ms-auto block h-7 w-3/5 rounded-2xl rounded-ee-sm bg-gold/20" />
          <span aria-hidden className="block h-7 w-2/3 rounded-2xl rounded-ss-sm bg-cream" />
        </div>
        <span aria-hidden className="mt-5 flex h-9 w-full items-center justify-center rounded-full bg-gold/90">
          <span className="h-2 w-16 rounded-full bg-warm-white/70" />
        </span>

        {/* miniature echo of the real floating assistant launcher — visual tie-in */}
        <span
          aria-hidden
          className="absolute -bottom-4 -end-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold shadow-[0_15px_35px_rgba(201,161,90,0.45)] ring-[5px] ring-deep-navy"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5 text-deep-navy">
            <path d="M4 4h16v12H8l-4 4V4Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={9} cy={10} r={0.6} fill="currentColor" stroke="none" />
            <circle cx={12} cy={10} r={0.6} fill="currentColor" stroke="none" />
            <circle cx={15} cy={10} r={0.6} fill="currentColor" stroke="none" />
          </svg>
        </span>
      </div>

      {/* care-path strip */}
      <div className="relative mt-8 flex w-full max-w-[260px] items-center justify-between sm:mt-10">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gold/25" />
        {[
          <path key="chat" d="M4 4h16v12H8l-4 4V4Z" strokeLinecap="round" strokeLinejoin="round" />,
          <path key="calendar" d="M4 6h16M7 3v4M17 3v4M4 6v14h16V6" strokeLinecap="round" strokeLinejoin="round" />,
          <path key="check" d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />,
        ].map((icon, i) => (
          <span key={i} className="relative flex h-9 w-9 items-center justify-center rounded-full bg-deep-navy ring-1 ring-gold/40 sm:h-10 sm:w-10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="h-4 w-4 text-gold sm:h-[18px] sm:w-[18px]">
              {icon}
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
