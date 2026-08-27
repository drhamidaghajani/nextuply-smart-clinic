import Image from "next/image";
import Link from "next/link";

import { getBeforeAfterCasesByCategory, type BeforeAfterCategory } from "@/content/before-after-cases";
import { getBeforeAfterHref } from "@/content/services";
import type { PatientStoriesDictionary } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";
import { AssistantTriggerButton } from "@/modules/smart-clinic-assistant/ui/assistant-trigger-button";
import { Reveal } from "@/components/motion/reveal";

/**
 * "روایت‌های واقعی بیماران" (Real Patient Stories) — the homepage's final
 * section. Round 2026-08-26 (Patient Stories redesign, per Dr. Sadighi:
 * "the section looks unfinished / placeholder-like"): rebuilt entirely.
 *
 * The PREVIOUS version (see git history) showed a fabricated 5-star
 * Google review with an invented patient name/quote, a "googleReviewCount"
 * that was literally the placeholder string "X", decorative video/
 * Instagram cards with no real media behind them, and 5 rotating
 * first-person quotes — its own code comments flagged 4 of those 5 as
 * unapproved draft copy, never signed off as real. All of that directly
 * contradicts the explicit "no fake testimonials, no invented ratings,
 * no invented quotes" instruction this redesign is built against, so it
 * was removed rather than carried forward or translated.
 *
 * This version shows ONLY real, verifiable content:
 * - 3 real before/after cases, one each from 3 categories, pulled
 *   directly from `content/before-after-cases.ts` (the same file the
 *   `/before-after` page itself uses — real uploaded photos, a neutral
 *   category-level description with its own "results vary" note already
 *   built in, a generic sequential "Patient N" label, never a fabricated
 *   name or narrative).
 * - Three real CTAs: the full before/after gallery, the clinic's actual
 *   Instagram profile (same handle already used in `site-footer.tsx`/
 *   `contact/page.tsx` — no new handle invented, and no Instagram API
 *   connection, just an outbound link), and the Smart Clinic Assistant.
 *
 * No hover-spotlight/dimming interaction and no rotating-quote timer this
 * round — per the explicit "no heavy animation" instruction for this
 * section, entrance is a plain `Reveal` fade/rise (this project's
 * standard, already used everywhere else), nothing bespoke.
 *
 * Round 2026-08-27 (post-deploy regression fix, per Hamid — "the section
 * is skipped/passed over while scrolling on desktop"): the rebuild above
 * dropped this section's `snap-section` class along with the fake content
 * it used to wrap. That class isn't cosmetic — `html:has(.homepage-scroll-
 * snap)` in globals.css puts the whole homepage into `scroll-snap-type: y
 * mandatory` on desktop, and every OTHER homepage section still carries
 * `snap-section` (a defined stop point); without it here, mandatory snap
 * has nowhere valid to land inside this section's vertical span and jumps
 * straight through it to the next stop — the exact same bug class already
 * fixed once before in `case-gallery-section.tsx` (see that file's own
 * comment: "without it, scrolling past WhyDrSadighiSection had nowhere
 * snap-valid to land"). Restored here, WITHOUT `h-dvh` — this section's
 * content is legitimately shorter now (3 cards, not the old 5-item
 * mosaic), and `case-gallery-section.tsx`/`patient-journey-section.tsx`/
 * `site-footer.tsx` already prove `snap-section` at a natural, non-full-
 * viewport height is a normal, safe combination on this page, not a new
 * pattern invented here. Mobile is unaffected either way — the same
 * `@media (max-width: 767px)` rule in globals.css already turns mandatory
 * snap off below the desktop breakpoint.
 */

const PREVIEW_CATEGORIES: readonly BeforeAfterCategory[] = ["rhinoplasty", "jaw-surgery", "facial-reconstruction"];

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconGallery({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="15" rx="2" />
      <path d="M3 15l5-5 4 4 3-3 6 6" />
      <circle cx="8" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PatientStoriesSection({
  dict,
  locale,
  instagramHandle,
}: {
  dict: PatientStoriesDictionary;
  locale: Locale;
  instagramHandle: string;
}) {
  const cases = PREVIEW_CATEGORIES.map((category) => getBeforeAfterCasesByCategory(category)[0]).filter((item) => item !== undefined);
  const instagramHref = `https://instagram.com/${instagramHandle.replace("@", "")}`;

  return (
    <section
      data-header-bg="#0f172a"
      dir={LOCALE_DIRECTION[locale]}
      className="snap-section relative overflow-hidden bg-deep-navy px-4 py-16 sm:px-8 sm:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 end-[-8%] h-[420px] w-[420px] rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance bg-gradient-to-l from-gold to-warm-white bg-clip-text text-xl font-extrabold leading-tight text-transparent sm:text-2xl lg:text-[30px]">
              {dict.heading}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-warm-white/65 sm:text-base">{dict.subheading}</p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-3 sm:gap-6">
          {cases.map((item, index) => {
            const view = item.views[0];
            if (!view) return null;
            return (
              <Reveal key={item.id} delay={index * 0.08}>
                <Link
                  href={getBeforeAfterHref(locale, item.category)}
                  className="group block overflow-hidden rounded-2xl border border-warm-white/10 bg-warm-white/[0.04] transition-colors duration-300 ease-out hover:border-gold/40"
                >
                  <div className="grid grid-cols-2">
                    <div className="relative aspect-[3/4]">
                      <Image src={view.before} alt={`${item.title[locale]} — ${dict.beforeLabel}`} fill sizes="(min-width: 640px) 16vw, 45vw" className="object-cover" />
                      <span className="absolute start-2 top-2 rounded-full bg-deep-navy/70 px-2 py-0.5 text-[10px] font-medium text-warm-white/80 backdrop-blur-sm">
                        {dict.beforeLabel}
                      </span>
                    </div>
                    <div className="relative aspect-[3/4]">
                      <Image src={view.after} alt={`${item.title[locale]} — ${dict.afterLabel}`} fill sizes="(min-width: 640px) 16vw, 45vw" className="object-cover" />
                      <span className="absolute start-2 top-2 rounded-full bg-gold/80 px-2 py-0.5 text-[10px] font-medium text-deep-navy backdrop-blur-sm">
                        {dict.afterLabel}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-warm-white transition-colors duration-200 group-hover:text-gold">{item.title[locale]}</p>
                    <p className="mt-1 text-xs text-warm-white/45">{item.privacyLabel[locale]}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gold">{dict.viewCaseCta}</span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:mt-12">
            <Link
              href={getBeforeAfterHref(locale, null)}
              className="inline-flex items-center gap-2 rounded-full border border-warm-white/15 bg-warm-white/5 px-5 py-3 text-sm font-medium text-warm-white transition-colors duration-200 hover:border-gold/40 hover:text-gold"
            >
              <IconGallery className="h-4 w-4" />
              {dict.beforeAfterCta}
            </Link>
            <a
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-warm-white/15 bg-warm-white/5 px-5 py-3 text-sm font-medium text-warm-white transition-colors duration-200 hover:border-gold/40 hover:text-gold"
            >
              <IconInstagram className="h-4 w-4" />
              {dict.instagramCta}
            </a>
            <AssistantTriggerButton
              intent="general"
              source="homepage"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold to-gold-hover px-5 py-3 text-sm font-semibold text-deep-navy transition-[filter] duration-200 hover:brightness-105"
            >
              {dict.assistantCta}
            </AssistantTriggerButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
