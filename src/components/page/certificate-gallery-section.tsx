"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import { CERTIFICATES, type CertificateItem } from "@/content/certificates";
import type { AboutPageDictionary } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * "Certificates & Scientific Credentials" — About page section, per
 * Hamid's 2026-07-14 brief. Replaces an earlier horizontal-scroll-rail
 * version he explicitly rejected ("do not create a plain gallery or
 * scroll row"). First view is a designed featured composition (one
 * large card + two smaller layered cards, chosen from `CERTIFICATES`'
 * `featured` flag — see that file's doc-comment for which three and
 * why); the full set of 14 is reachable through a lightbox-style modal
 * opened by the "View All Certificates" button or by clicking any of
 * the three featured cards directly.
 *
 * No external carousel/lightbox dependency — the modal is built the
 * same way `MobileMenu` (site-header/mobile-menu.tsx) already does it
 * in this codebase: Escape + backdrop-click to close, body scroll
 * locked while open, Framer Motion (already a project dependency) for
 * the fade, plain React state for navigation. `object-contain`
 * throughout (never `object-cover`) so no certificate — landscape or
 * portrait — is ever cropped.
 */
export function CertificateGallerySection({ dict, locale }: { dict: AboutPageDictionary; locale: Locale }) {
  const isRtl = LOCALE_DIRECTION[locale] === "rtl";
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const featured = CERTIFICATES.filter((item) => item.featured);
  const primary = featured[0];
  const wide = featured.find((item) => item.orientation === "landscape") ?? featured[2];
  const secondaryPortrait = featured.find((item) => item !== primary && item.orientation === "portrait");

  const openAt = (id: string) => {
    const index = CERTIFICATES.findIndex((item) => item.id === id);
    setActiveIndex(index === -1 ? 0 : index);
    setIsOpen(true);
  };

  const goPrev = () => setActiveIndex((i) => (i - 1 + CERTIFICATES.length) % CERTIFICATES.length);
  const goNext = () => setActiveIndex((i) => (i + 1) % CERTIFICATES.length);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key === "ArrowRight") (isRtl ? goPrev : goNext)();
      if (event.key === "ArrowLeft") (isRtl ? goNext : goPrev)();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isRtl]);

  const active = CERTIFICATES[activeIndex];

  return (
    <section data-header-bg="#0f172a" className="relative overflow-hidden bg-deep-navy px-6 py-20 sm:px-8 sm:py-24">
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]" preserveAspectRatio="none">
        <defs>
          <pattern id="certificates-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0H0V56" fill="none" stroke="#c9a15a" strokeWidth={0.5} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#certificates-grid)" />
      </svg>
      <div aria-hidden className="animate-ambient-light pointer-events-none absolute -bottom-24 end-[-8%] h-[420px] w-[420px] rounded-full bg-gold/15 blur-[110px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <Reveal className="text-center lg:text-start">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold sm:text-sm">{dict.credentialsEyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-warm-white sm:text-4xl">{dict.certificatesHeading}</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-warm-white/65 sm:text-base sm:leading-8 lg:mx-0">{dict.certificatesSubtitle}</p>

          <p className="mt-7 inline-flex items-center gap-2.5 text-sm font-medium text-warm-white/75 sm:text-base">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
            {dict.certificatesStat}
          </p>

          <div className="mt-8 flex justify-center lg:justify-start">
            <button
              type="button"
              onClick={() => openAt(primary?.id ?? CERTIFICATES[0].id)}
              className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-warm-white transition-colors duration-200 hover:bg-gold-hover"
            >
              {dict.certificatesButton}
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="relative mx-auto h-[300px] w-full max-w-[340px] sm:h-[380px] sm:max-w-sm lg:h-[440px] lg:max-w-none">
          {wide ? (
            <button
              type="button"
              onClick={() => openAt(wide.id)}
              aria-label={wide.label[locale]}
              className="absolute bottom-0 start-0 z-0 w-[54%] -rotate-6 transition-transform duration-300 ease-out hover:-translate-y-1 sm:w-[220px] lg:w-[260px]"
            >
              <CertificateFrame item={wide} locale={locale} />
            </button>
          ) : null}

          {secondaryPortrait ? (
            <button
              type="button"
              onClick={() => openAt(secondaryPortrait.id)}
              aria-label={secondaryPortrait.label[locale]}
              className="absolute end-0 top-0 z-10 w-[36%] rotate-6 transition-transform duration-300 ease-out hover:-translate-y-1 sm:w-[150px] lg:w-[175px]"
            >
              <CertificateFrame item={secondaryPortrait} locale={locale} />
            </button>
          ) : null}

          {primary ? (
            <button
              type="button"
              onClick={() => openAt(primary.id)}
              aria-label={primary.label[locale]}
              className="absolute bottom-2 start-1/2 z-20 w-[46%] -translate-x-1/2 transition-transform duration-300 ease-out hover:-translate-y-1.5 sm:w-[190px] lg:w-[220px]"
            >
              <CertificateFrame item={primary} locale={locale} />
            </button>
          ) : null}
        </Reveal>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={dict.certificatesHeading}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] flex flex-col bg-deep-navy/97 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
              <p className="text-xs font-medium tabular-nums tracking-wide text-warm-white/50 sm:text-sm">
                {activeIndex + 1} / {CERTIFICATES.length}
              </p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsOpen(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-warm-white/15 text-warm-white transition-colors duration-200 hover:border-gold/50 hover:text-gold"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-4 w-4">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 items-center gap-2 overflow-hidden px-2 sm:gap-4 sm:px-6" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={isRtl ? goNext : goPrev}
                aria-label="Previous"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-warm-white/15 text-warm-white transition-colors duration-200 hover:border-gold/50 hover:text-gold sm:h-11 sm:w-11"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 rtl:rotate-180">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>

              <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 overflow-y-auto py-4">
                <div
                  className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-warm-white p-4 shadow-[0_40px_100px_rgba(0,0,0,0.5)] sm:p-6 ${
                    active.orientation === "landscape" ? "aspect-[4/3]" : "aspect-[3/4]"
                  }`}
                >
                  <Image src={active.imagePath} alt={active.alt[locale]} fill sizes="(min-width: 1024px) 480px, 90vw" className="object-contain p-2" />
                </div>
                <a
                  href={active.imagePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-gold transition-colors duration-200 hover:text-gold-hover"
                >
                  {dict.certificatesOpenOriginal}
                  <span aria-hidden>{isRtl ? "←" : "→"}</span>
                </a>
              </div>

              <button
                type="button"
                onClick={isRtl ? goPrev : goNext}
                aria-label="Next"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-warm-white/15 text-warm-white transition-colors duration-200 hover:border-gold/50 hover:text-gold sm:h-11 sm:w-11"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 rtl:rotate-180">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto px-4 pb-5 pt-2 sm:gap-3 sm:px-6" onClick={(event) => event.stopPropagation()}>
              {CERTIFICATES.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={item.label[locale]}
                  className={`relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-warm-white ring-2 transition-all duration-200 sm:h-16 sm:w-12 ${
                    index === activeIndex ? "ring-gold" : "opacity-60 ring-transparent hover:opacity-100"
                  }`}
                >
                  <Image src={item.imagePath} alt="" fill sizes="48px" className="object-contain p-0.5" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function CertificateFrame({ item, locale }: { item: CertificateItem; locale: Locale }) {
  return (
    <div
      className={`overflow-hidden rounded-xl bg-warm-white p-2 shadow-[0_25px_60px_rgba(0,0,0,0.4)] ring-1 ring-warm-white/10 sm:rounded-2xl sm:p-3 ${
        item.orientation === "landscape" ? "aspect-[4/3]" : "aspect-[3/4]"
      }`}
    >
      <div className="relative h-full w-full overflow-hidden rounded-lg sm:rounded-xl">
        <Image src={item.imagePath} alt={item.alt[locale]} fill sizes="260px" className="object-contain" loading="lazy" />
      </div>
    </div>
  );
}
