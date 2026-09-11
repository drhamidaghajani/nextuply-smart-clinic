"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { CareInstructionsPageDictionary } from "@/i18n/dictionary-types";
import { localeHref } from "@/i18n/locale-href";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

function CareStageIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 sm:h-6 sm:w-6">
        <path d="M7 3v3M17 3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" strokeLinecap="round" />
        <path d="m9 14 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 sm:h-6 sm:w-6">
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path d="M12 7v10M7 12h10" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 sm:h-6 sm:w-6">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M12 8v5M12 16.5v.2" strokeLinecap="round" />
    </svg>
  );
}

export function HomepageCareSection({ dict, locale }: { dict: CareInstructionsPageDictionary; locale: Locale }) {
  const shouldReduceMotion = useReducedMotion();
  const stages = [dict.detail.beforeHeading, dict.detail.afterHeading, dict.detail.warningSignsHeading];

  const fadeUp = (delay: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 18 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.55, delay: shouldReduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      id="care"
      data-header-bg="#faf7f1"
      dir={LOCALE_DIRECTION[locale]}
      className="snap-section relative flex h-dvh items-center overflow-hidden bg-warm-white px-4 py-6 sm:px-8 sm:py-10"
    >
      <div aria-hidden className="pointer-events-none absolute -end-24 -top-24 h-80 w-80 rounded-full bg-gold/10 blur-3xl sm:h-[420px] sm:w-[420px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -start-24 h-80 w-80 rounded-full bg-deep-navy/[0.04] blur-3xl sm:h-[420px] sm:w-[420px]" />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="grid items-end gap-3 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <motion.p {...fadeUp(0)} className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {dict.eyebrow}
            </motion.p>
            <motion.h2 {...fadeUp(0.06)} className="mt-2 max-w-2xl text-2xl font-extrabold leading-tight text-deep-navy sm:mt-3 sm:text-4xl lg:text-[44px]">
              {dict.homepageHeading}
            </motion.h2>
          </div>
          <motion.p {...fadeUp(0.12)} className="max-w-xl text-sm leading-6 text-charcoal/65 sm:text-base sm:leading-8 lg:pb-1">
            {dict.subheading}
          </motion.p>
        </div>

        <motion.div
          {...fadeUp(0.18)}
          className="relative mt-6 overflow-hidden rounded-2xl border border-charcoal/10 bg-cream/70 px-4 py-5 shadow-[0_34px_90px_-58px_rgba(15,23,42,0.5)] sm:mt-10 sm:rounded-[32px] sm:px-8 sm:py-9 lg:px-12"
        >
          <div aria-hidden className="absolute inset-x-12 top-[3.65rem] hidden h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent sm:block" />
          <ol className="relative grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
            {stages.map((stage, index) => (
              <motion.li
                key={stage}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.45, delay: shouldReduceMotion ? 0 : 0.24 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex items-center gap-3 rounded-xl border border-charcoal/[0.07] bg-warm-white/80 p-3 sm:flex-col sm:items-start sm:border-0 sm:bg-transparent sm:p-0"
              >
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-warm-white text-gold shadow-[0_8px_24px_-12px_rgba(183,142,70,0.55)] sm:h-12 sm:w-12">
                  <CareStageIcon index={index} />
                </span>
                <div className="min-w-0 sm:mt-5">
                  <span className="text-[10px] font-semibold tracking-[0.2em] text-charcoal/35">0{index + 1}</span>
                  <h3 className="mt-0.5 text-sm font-bold leading-6 text-charcoal sm:mt-1 sm:text-base lg:text-lg">{stage}</h3>
                </div>
              </motion.li>
            ))}
          </ol>

          <div className="mt-5 flex flex-col gap-4 border-t border-charcoal/10 pt-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-7">
            <p className="max-w-2xl text-xs leading-5 text-charcoal/55 sm:text-sm sm:leading-7">{dict.trustNote}</p>
            <a
              href={localeHref(locale, "/care-instructions")}
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-deep-navy px-5 py-2.5 text-xs font-semibold text-warm-white transition-[background-color,color,transform] duration-300 hover:-translate-y-0.5 hover:bg-gold hover:text-deep-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:px-6 sm:py-3 sm:text-sm"
            >
              {dict.homepageCta}
              <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 rtl:rotate-180">
                <path d="m7 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
