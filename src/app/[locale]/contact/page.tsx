import { notFound } from "next/navigation";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { EditorialIntro } from "@/components/page/editorial-intro";
import { PageHero } from "@/components/page/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";

function toTelHref(value: string): string {
  return `tel:${value.replace(/[^0-9+]/g, "")}`;
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M12 21s-7-6.1-7-11.4A7 7 0 0 1 12 3a7 7 0 0 1 7 6.6C19 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}
function IconPhone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M4 4.5 8 4l2 4.5-2.2 1.6a12 12 0 0 0 6.1 6.1l1.6-2.2 4.5 2v4A2 2 0 0 1 18 21.5 16 16 0 0 1 4 7.5 2 2 0 0 1 4 4.5Z" />
    </svg>
  );
}
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

/**
 * Round 2026-07-13 (design-quality pass): rebuilt from three stacked
 * bordered-card sections to a single editorial contact panel (icon rows,
 * no boxed cards) alongside a quiet map-ready placeholder — no fake
 * embedded map, since no map provider/API key exists yet (documented
 * inline, not silently faked). Data unchanged, still sourced from
 * `footer.locations`/`footer.hours`/`footer.instagram` — single source
 * of truth, same real address/phone/hours the footer shows.
 */
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const { contact, footer } = dict;
  const instagramHref = `https://instagram.com/${footer.instagram.replace("@", "")}`;

  return (
    <main>
      <PageHero eyebrow={contact.eyebrow} title={contact.title} subtitle={contact.subtitle} locale={locale} breadcrumb={[{ label: contact.eyebrow }]} />
      <EditorialIntro>{contact.formNotice}</EditorialIntro>

      <section className="bg-warm-white px-6 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{contact.locationsHeading}</p>
            <div className="mt-5 space-y-5">
              <div className="flex items-start gap-4">
                <IconPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="text-sm font-semibold text-charcoal sm:text-base">{footer.locations.tabriz.label}</p>
                  {footer.locations.tabriz.addressLines.map((line) => (
                    <p key={line} className="mt-1 text-sm leading-6 text-charcoal/65">
                      {line}
                    </p>
                  ))}
                  <p className="mt-2 text-sm leading-6 text-charcoal/50">{footer.locations.tehran.label} — {footer.locations.tehran.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <IconPhone className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div className="flex flex-col gap-1" dir="ltr">
                  <a href={toTelHref(footer.locations.tabriz.phone)} className="text-sm text-charcoal/80 transition-colors duration-200 hover:text-gold sm:text-base">
                    {footer.locations.tabriz.phone}
                  </a>
                  <a href={toTelHref(footer.locations.tabriz.mobile)} className="text-sm text-charcoal/80 transition-colors duration-200 hover:text-gold sm:text-base">
                    {footer.locations.tabriz.mobile}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <IconInstagram className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <a href={instagramHref} target="_blank" rel="noopener noreferrer" className="text-sm text-charcoal/80 transition-colors duration-200 hover:text-gold sm:text-base">
                  {footer.instagram}
                </a>
              </div>

              <div className="flex items-start gap-4">
                <IconClock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div className="space-y-0.5">
                  {footer.hours.map((line) => (
                    <p key={line} className="text-sm leading-6 text-charcoal/65 sm:text-base">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Map-ready placeholder — no map provider/API key exists yet; a
              real embed is a separate, explicitly-scoped integration, not
              faked here. */}
          <Reveal delay={0.1}>
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-charcoal/10 bg-cream text-center">
              <IconPin className="h-8 w-8 text-charcoal/25" />
              <p className="mt-3 max-w-[220px] text-xs leading-5 text-charcoal/40">{footer.locations.tabriz.label}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <AssistantCtaSection heading={contact.title} body={contact.subtitle} buttonLabel={contact.ctaButton} intent="general" />
    </main>
  );
}
