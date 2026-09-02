"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

import { getServiceById } from "@/content/services";
import {
  KNOWLEDGE_ARTICLES,
  type KnowledgeArticle,
  type KnowledgeArticleTranslation,
  type KnowledgeTopicCluster,
} from "@/content/knowledge-articles";
import type { KnowledgeCenterDictionary } from "@/i18n/dictionary-types";
import { formatDateForLocale } from "@/i18n/format-jalali-date";
import { localeHref } from "@/i18n/locale-href";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * "Knowledge Center" (مرکز دانش) — homepage section 08 per
 * HOMEPAGE_STORYBOARD.md, per Hamid's full editorial-magazine brief
 * (2026-07-06).
 *
 * Round 2026-07-07: scope narrowed to JUST the Editorial Highlight block
 * (1 feature article + 3 side articles). Editorial style, still flat (no
 * cards, no shadows, thin dividers only) per the original brief's "از
 * Gridهای تکراری وبلاگی دور باش".
 *
 * Round 2026-08-25 (pre-launch fix): was driven entirely by hardcoded
 * demo copy in the dictionary — fake `/blog/...` hrefs that don't exist
 * anywhere in this app, plus a `CoverMotif` icon-on-gradient placeholder
 * standing in for real photography. Now pulls the real, live Knowledge
 * Center content directly from `KNOWLEDGE_ARTICLES`: `FEATURED_SLUGS` is
 * Hamid's own priority-ordered list of high-traffic P0 articles (first =
 * feature, next 3 = side list); en/ar read that SAME article's own
 * translation and are simply skipped — never a Persian fallback — if one
 * doesn't exist yet, matching the "never show Persian body under /en or
 * /ar" rule already enforced on the article pages themselves. The
 * feature slot's image now renders the real migrated hero photo when one
 * exists, falling back to the exact same navy-gradient + masked-icon
 * treatment this section always used — same visual language, just now
 * backed by real content instead of demo text. The side list stays
 * text-only, matching this section's own established "no cards, no
 * clutter" design instead of introducing a new image treatment for it.
 */

const TOPIC_LABEL: Record<Locale, Record<KnowledgeTopicCluster, string>> = {
  fa: {
    "orthognathic-surgery": "جراحی فک و چانه",
    "advanced-dental-implant": "ایمپلنت دندانی پیشرفته",
    "impacted-tooth-surgery": "جراحی دندان نهفته",
    rhinoplasty: "جراحی زیبایی بینی",
    "facial-cosmetic-surgery": "جراحی‌های زیبایی صورت",
    blepharoplasty: "بلفاروپلاستی",
    "facial-trauma-surgery": "جراحی تروما و شکستگی‌های صورت",
    "care-instructions": "مراقبت‌های پس از درمان",
    "doctor-profile": "درباره دکتر",
    "clinic-info": "کلینیک",
    "general-dental": "دندانپزشکی عمومی",
    uncategorized: "دانشنامه",
  },
  en: {
    "orthognathic-surgery": "Jaw & Chin Surgery",
    "advanced-dental-implant": "Advanced Dental Implants",
    "impacted-tooth-surgery": "Impacted Tooth Surgery",
    rhinoplasty: "Rhinoplasty",
    "facial-cosmetic-surgery": "Facial Cosmetic Surgery",
    blepharoplasty: "Blepharoplasty",
    "facial-trauma-surgery": "Facial Trauma & Fracture Surgery",
    "care-instructions": "Post-Procedure Care",
    "doctor-profile": "About the Doctor",
    "clinic-info": "Clinic",
    "general-dental": "General Dentistry",
    uncategorized: "Knowledge Center",
  },
  ar: {
    "orthognathic-surgery": "جراحة الفك والذقن",
    "advanced-dental-implant": "زراعة الأسنان المتقدمة",
    "impacted-tooth-surgery": "جراحة الأسنان المطمورة",
    rhinoplasty: "تجميل الأنف",
    "facial-cosmetic-surgery": "جراحات تجميل الوجه",
    blepharoplasty: "جراحة الجفون",
    "facial-trauma-surgery": "جراحة إصابات وكسور الوجه",
    "care-instructions": "العناية بعد الإجراء",
    "doctor-profile": "عن الطبيب",
    "clinic-info": "العيادة",
    "general-dental": "طب الأسنان العام",
    uncategorized: "المكتبة المعرفية",
  },
};

/** Hamid's own priority order (2026-08-25) — first is the feature slot, next 3 are the side list. */
const FEATURED_SLUGS = [
  "ایمپلنت-اقساطی-در-تبریز-با-دکتر-علیرضا",
  "جراحی-فک-نی-نی-سایت",
  "جراحی-بینی-به-سبک-اروپایی-زیبایی-و-تقا",
  "جراحی-دندان-عقل-با-بیهوشی-در-تبریز",
] as const;

interface ResolvedHomepageArticle {
  article: KnowledgeArticle;
  content: Pick<KnowledgeArticleTranslation, "slug" | "title" | "excerpt">;
}

function resolveFeaturedArticles(locale: Locale): ResolvedHomepageArticle[] {
  const resolved: ResolvedHomepageArticle[] = [];
  for (const slug of FEATURED_SLUGS) {
    const article = KNOWLEDGE_ARTICLES.find((a) => a.slug === slug);
    if (!article) continue;
    if (locale === "fa") {
      resolved.push({ article, content: article });
      continue;
    }
    const content = article.translations?.[locale];
    if (content) resolved.push({ article, content });
  }
  return resolved;
}

function IconArrow({ className, pointLeft }: { className?: string; pointLeft: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {pointLeft ? <path d="M19 12H5M11 6l-6 6 6 6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
    </svg>
  );
}

/** Same navy-gradient + masked-icon treatment this section has always used for its feature slot — now the fallback when no migrated hero photo exists, instead of the section's only state. */
function FeatureVisual({ photoSrc, alt, iconId }: { photoSrc?: string; alt: string; iconId?: string }) {
  if (photoSrc) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl sm:aspect-[16/9] sm:rounded-2xl lg:aspect-[21/9]">
        <Image src={photoSrc} alt={alt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
        <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-warm-white/10" />
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-deep-navy to-[#1a2540] sm:aspect-[16/9] sm:rounded-2xl lg:aspect-[21/9]">
      <div className="absolute inset-0 flex items-center justify-center">
        {iconId ? (
          <span
            aria-hidden
            className="block h-16 w-16 bg-warm-white/15 transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:h-20 sm:w-20"
            style={{
              WebkitMaskImage: `url(/icons/services/${iconId}.png)`,
              maskImage: `url(/icons/services/${iconId}.png)`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function KnowledgeCenterSection({ dict, locale }: { dict: KnowledgeCenterDictionary; locale: Locale }) {
  const shouldReduceMotion = useReducedMotion();
  const isRtl = LOCALE_DIRECTION[locale] === "rtl";

  const fadeUp = (delay: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 18 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.6, delay: shouldReduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  const [feature, ...side] = resolveFeaturedArticles(locale);
  if (!feature) return null;
  const featureService = feature.article.serviceRelation ? getServiceById(feature.article.serviceRelation) : undefined;

  return (
    <section
      id="knowledge-center"
      data-header-bg="#fcfbf4"
      dir={LOCALE_DIRECTION[locale]}
      className="snap-section relative flex h-dvh flex-col justify-center overflow-hidden bg-cream px-4 py-5 sm:px-8 sm:py-7 lg:py-8"
    >
      <div className="mx-auto w-full max-w-6xl">
        <motion.span {...fadeUp(0)} className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/40 sm:text-xs">
          {dict.eyebrow}
        </motion.span>
        <motion.h2
          {...fadeUp(shouldReduceMotion ? 0 : 0.05)}
          className="mt-2 text-balance text-lg font-extrabold leading-tight tracking-wide text-charcoal sm:mt-3 sm:text-2xl lg:text-[30px]"
        >
          {dict.heading}
        </motion.h2>
        <motion.p {...fadeUp(shouldReduceMotion ? 0 : 0.1)} className="mt-2 max-w-2xl text-xs leading-5 text-charcoal/60 sm:mt-3 sm:text-base lg:text-[22px] lg:leading-8">
          {dict.subheading}
        </motion.p>

        {/* Editorial Highlight — feature (right, first in DOM) + side
            articles (left), separated by a thin divider, not cards. */}
        <div className="mt-4 grid gap-5 border-t border-charcoal/10 pt-4 sm:mt-6 sm:gap-8 sm:pt-6 lg:grid-cols-[1.3fr_1fr] lg:gap-14 lg:pt-8">
          <motion.article {...fadeUp(shouldReduceMotion ? 0 : 0.08)} className="group">
            {/* Round 2026-08-27 (P0 hotfix) — plain `<a>`, not `next/link`; see service-tile.tsx for the full root-cause writeup. */}
            <a href={localeHref(locale, `/knowledge/${feature.content.slug}`)} className="block">
              <FeatureVisual photoSrc={feature.article.heroImage?.src} alt={feature.article.heroImage?.alt ?? feature.content.title} iconId={featureService?.iconKey} />
              <div className="mt-2.5 flex items-center gap-3 sm:mt-4">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gold sm:text-xs">{TOPIC_LABEL[locale][feature.article.topicCluster]}</span>
                <span aria-hidden className="text-charcoal/20">
                  ·
                </span>
                <span className="text-[10px] text-charcoal/40 sm:text-xs">{formatDateForLocale(feature.article.updatedAt, locale)}</span>
              </div>
              <h3 className="mt-1 text-base font-extrabold leading-tight text-charcoal sm:mt-2 sm:text-xl lg:text-2xl">
                <span className="bg-gradient-to-l from-gold to-gold bg-[length:0%_2px] bg-right-bottom bg-no-repeat pb-1 transition-[background-size] duration-500 ease-out group-hover:bg-[length:100%_2px]">
                  {feature.content.title}
                </span>
              </h3>
              <p className="mt-1.5 line-clamp-2 max-w-xl text-xs leading-5 text-charcoal/65 sm:mt-3 sm:text-sm sm:leading-7">{feature.content.excerpt}</p>
              <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:mt-4 sm:text-sm">
                {dict.readMoreCta}
                <IconArrow
                  pointLeft={isRtl}
                  className={`h-3.5 w-3.5 transition-transform duration-300 ease-out sm:h-4 sm:w-4 ${isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
                />
              </span>
            </a>
          </motion.article>

          <motion.div {...fadeUp(shouldReduceMotion ? 0 : 0.16)} className="flex flex-col divide-y divide-charcoal/10">
            {side.map((item) => (
              // Round 2026-08-27 (P0 hotfix) — plain `<a>`, not `next/link`; see service-tile.tsx for the full root-cause writeup.
              <a key={item.content.slug} href={localeHref(locale, `/knowledge/${item.content.slug}`)} className="group py-2.5 first:pt-0 last:pb-0 sm:py-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gold sm:text-xs">{TOPIC_LABEL[locale][item.article.topicCluster]}</span>
                  <span aria-hidden className="text-charcoal/20">
                    ·
                  </span>
                  <span className="text-[10px] text-charcoal/40">{formatDateForLocale(item.article.updatedAt, locale)}</span>
                </div>
                <h4 className="mt-1 line-clamp-1 text-sm font-bold leading-snug text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:text-base">
                  {item.content.title}
                </h4>
                <p className="mt-1 line-clamp-1 text-xs leading-5 text-charcoal/60 sm:line-clamp-2 sm:leading-6">{item.content.excerpt}</p>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
