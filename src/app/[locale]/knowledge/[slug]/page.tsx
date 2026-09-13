import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { AparatEmbed } from "@/components/page/aparat-embed";
import { ArticleToc, ArticleTocDisclosure } from "@/components/page/article-toc";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { KnowledgeArticleFaq } from "@/components/page/knowledge-article-faq";
import { KnowledgeArticleHero } from "@/components/page/knowledge-article-hero";
import { KnowledgeArticleLead } from "@/components/page/knowledge-article-lead";
import { KNOWLEDGE_REFERENCES_HEADING, KnowledgeArticleReferences } from "@/components/page/knowledge-article-references";
import { KnowledgeLatestArticles, type KnowledgeLatestArticleItem } from "@/components/page/knowledge-latest-articles";
import { KnowledgeArticleSectionContent } from "@/components/page/knowledge-article-content";
import { KnowledgeArticleSidebar } from "@/components/page/knowledge-sidebar";
import { KnowledgeRelatedArticles, type KnowledgeRelatedArticleItem } from "@/components/page/knowledge-related-articles";
import { MedicalReviewBadge } from "@/components/page/medical-review-badge";
import { ReadingProgressBar } from "@/components/page/reading-progress-bar";
import { Reveal } from "@/components/motion/reveal";
import { absoluteUrl } from "@/core/site-config";
import {
  buildKnowledgeArticleHreflangAlternates,
  buildKnowledgeArticleJsonLd,
  DOCTOR_NAME,
  isKnowledgeContentMedicallyReviewed,
} from "@/core/structured-data";
import { getServiceById, getServiceHref } from "@/content/services";
import {
  getKnowledgeArticleBySlug,
  getKnowledgeArticleByLocalizedSlug,
  getLatestKnowledgeArticles,
  getRelatedKnowledgeArticles,
  getRelatedKnowledgeArticlesForLocale,
  KNOWLEDGE_ARTICLES,
  type KnowledgeArticle,
  type KnowledgeArticleTranslation,
  type KnowledgeTopicCluster,
} from "@/content/knowledge-articles";
import { AssistantTriggerButton } from "@/modules/smart-clinic-assistant";
import { getReadingTimeLabel } from "@/content/reading-time";
import { formatDateForLocale } from "@/i18n/format-jalali-date";
import { getDictionary } from "@/i18n/get-dictionary";
import { localeHref } from "@/i18n/locale-href";
import { isSupportedLocale, LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

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

const UPDATED_LABEL: Record<Locale, string> = { fa: "آخرین به‌روزرسانی", en: "Last updated", ar: "آخر تحديث" };
const RELATED_SERVICE_LABEL: Record<Locale, string> = { fa: "روش درمانی مرتبط", en: "Related treatment", ar: "العلاج ذو الصلة" };
const RELATED_SERVICE_CTA: Record<Locale, string> = { fa: "مشاهده صفحه درمان", en: "View the treatment page", ar: "عرض صفحة العلاج" };

/**
 * Round 2026-08-23 (final production URL restructuring, Task 2): emits
 * params for all three locales now, not just `fa` — but ONLY for the
 * locale/slug combinations that actually exist. `en`/`ar` get exactly as
 * many params as there are translated articles (never all 41 — a
 * translation that doesn't exist gets no static path and 404s, which is
 * the correct "unavailable, don't fall back to Persian" behavior per
 * Hamid's explicit instruction, not an oversight).
 */
export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const article of KNOWLEDGE_ARTICLES) {
    params.push({ locale: "fa", slug: article.slug });
    if (article.translations?.en) params.push({ locale: "en", slug: article.translations.en.slug });
    if (article.translations?.ar) params.push({ locale: "ar", slug: article.translations.ar.slug });
  }
  return params;
}

interface Resolved {
  article: KnowledgeArticle;
  /** slug/title/seoTitle/seoDescription/excerpt/contentSections/faq — Persian's own top-level fields for `fa`, `article.translations[locale]` otherwise. Never a Persian fallback. */
  content: KnowledgeArticleTranslation;
}

function resolveContent(locale: Locale, slug: string): Resolved | null {
  if (locale === "fa") {
    const article = getKnowledgeArticleBySlug(slug);
    if (!article) return null;
    return { article, content: { ...article, translationStatus: article.translationStatus } };
  }
  const found = getKnowledgeArticleByLocalizedSlug(locale, slug);
  if (!found) return null;
  return { article: found.article, content: found.content };
}

/** `altByLocale` (2026-09-13) lets one article-level hero carry per-locale alt text; `alt` stays the fallback for every pre-existing article. */
function heroAltFor(article: KnowledgeArticle, locale: Locale, fallbackTitle: string): string {
  return article.heroImage?.altByLocale?.[locale] ?? article.heroImage?.alt ?? fallbackTitle;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) return {};
  const resolved = resolveContent(locale, slug);
  if (!resolved) return {};
  const { article, content } = resolved;

  const canonical = localeHref(locale, `/knowledge/${content.slug}`);
  /**
   * `socialImage` (2026-09-13) is an explicit content-level decision, never
   * a slug check:
   * - `undefined` — unchanged: fall back to the hero image.
   * - `null`      — emit NO OG/Twitter image at all. Used by S Lift, whose
   *                 hero is a patient's post-operative photograph that must
   *                 not become external social-preview media.
   * - object      — use this explicit image instead of the hero.
   */
  const socialSrc = article.socialImage === null ? undefined : (article.socialImage?.src ?? article.heroImage?.src);
  const socialImages = socialSrc ? [absoluteUrl(socialSrc)] : undefined;
  return {
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: {
      canonical,
      languages: buildKnowledgeArticleHreflangAlternates(article.slug, article.translations),
    },
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      type: "article",
      url: absoluteUrl(canonical),
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      // heroImage/socialImage are always local files (never the old WordPress
      // URL — see knowledge-articles.ts's own field doc-comments), so they're
      // safe to reference directly here.
      images: socialImages,
    },
    twitter: {
      card: socialImages ? "summary_large_image" : "summary",
      title: content.seoTitle,
      description: content.seoDescription,
      images: socialImages,
    },
  };
}

/**
 * Round 2026-09-13 (editorial-shell pass — supersedes the masthead layout):
 * the page renders ONE continuous 12-column editorial shell instead of a
 * masthead section followed by a separate article section.
 *
 * Why that matters: in the previous layout the hero figure lived inside the
 * SAME two-column grid as the title/dek, so a tall portrait hero (S Lift's
 * `after.jpg` is 1051×1497) set the height of that grid row. Everything
 * beside it — and the whole article body underneath it — was pushed down to
 * match, which produced a large dead region beside the portrait and delayed
 * the start of the actual article. The shell below makes the hero and the
 * article text INDEPENDENT columns: the body starts immediately after the
 * lead, and the hero sits in the rail, where its height only affects the
 * rail.
 *
 * Layout contract:
 * - One `<section data-header-bg>` (see the note on it below).
 * - `grid-cols-1` mobile → `lg:grid-cols-[minmax(0,1fr)_352px]`, so the
 *   article column is 720px and the rail 352px inside the `max-w-6xl`
 *   container. Reading column and rail are capped independently.
 * - The rail grid item is deliberately NOT `lg:items-start`: it is left to
 *   stretch to the article's height so the sticky nav group inside it has a
 *   tall containing block to travel along. `KnowledgeArticleSidebar` owns
 *   the `lg:sticky lg:top-28` (28 = 7rem clears the 88px desktop header).
 * - The hero renders ONCE visually but is mounted twice — in the mobile flow
 *   between the lead and the compact TOC, and in the desktop rail. The two
 *   instances are mutually exclusive per breakpoint (`lg:hidden` vs
 *   `hidden lg:block`) and only the mobile one is `priority`, so exactly one
 *   eager image is emitted.
 *
 * Round 2026-09-13 (premium medical-editorial redesign of the SHARED
 * Knowledge article detail template): the page no longer opens with
 * `PageHero` + an unconditional `ServiceVisualPanel`. It renders a real hero
 * only when the article actually has one and no media block at all otherwise
 * (16 of the 41 articles), and it declares `data-header-bg` so the fixed
 * site header's colour/text tracking stays correct over a light surface.
 * Body typography is long-form (justified in fa/ar only), the sidebar is a
 * hairline editorial rail instead of a stack of rounded cards, scientific
 * references render structurally between the last content section and the
 * FAQ, and the end-of-article block is `KnowledgeRelatedArticles` rather
 * than the shared `EditorialCardGrid` (which the Services and Knowledge
 * indexes still use, unchanged).
 *
 * Round 2026-08-25 (staging QA): two-column grid, sidebar as the grid's
 * second item, so on mobile it flows below the article body with zero extra
 * markup.
 *
 * Round 2026-08-23 (WordPress → Knowledge Center phase-1 migration,
 * Tracks 2/3/4): real migrated content, reading-time/updated-date row, TOC
 * (≥4 headed sections), anchored headings, Aparat slot, related-service CTA.
 *
 * Round 2026-08-23, same day (final production URL restructuring, Task 2):
 * locale-aware across all three languages via `resolveContent` — Persian
 * reads its own top-level fields, en/ar read `article.translations[locale]`,
 * which carries its OWN slug (never the Persian one reused under a prefix).
 * No English/Arabic page EVER falls back to Persian body text:
 * `resolveContent` returns `null` for a missing translation, `notFound()`
 * fires, done — per Hamid's explicit instruction. `generateStaticParams`
 * above only emits paths for translations that actually exist, so this is
 * the expected behavior for an unwritten translation, not an edge case.
 */
export default async function KnowledgeArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const resolved = resolveContent(locale, slug);
  if (!resolved) notFound();
  const { article, content } = resolved;

  const dict = getDictionary(locale).knowledge;
  const related =
    locale === "fa"
      ? getRelatedKnowledgeArticles(article).map((item) => ({
          key: item.slug,
          href: localeHref(locale, `/knowledge/${item.slug}`),
          eyebrow: TOPIC_LABEL[locale][item.topicCluster],
          title: item.title,
          subtitle: item.excerpt,
          meta: item.readingTime,
        }))
      : getRelatedKnowledgeArticlesForLocale(article, locale).map(({ article: relatedArticle, content: relatedContent }) => ({
          key: relatedContent.slug,
          href: localeHref(locale, `/knowledge/${relatedContent.slug}`),
          eyebrow: TOPIC_LABEL[locale][relatedArticle.topicCluster],
          title: relatedContent.title,
          subtitle: relatedContent.excerpt,
          meta: getReadingTimeLabel(locale, relatedArticle, relatedContent),
        }));
  const relatedItems: KnowledgeRelatedArticleItem[] = related;

  const latestArticles: KnowledgeLatestArticleItem[] = getLatestKnowledgeArticles(locale, 4, content.slug).map(
    ({ article: latestArticle, content: latestContent }) => ({
      key: latestContent.slug,
      href: localeHref(locale, `/knowledge/${latestContent.slug}`),
      title: latestContent.title,
      meta: formatDateForLocale(latestArticle.updatedAt, locale),
    })
  );

  const isRtl = LOCALE_DIRECTION[locale] === "rtl";
  const backArrow = isRtl ? "→" : "←";

  const breadcrumbItems = [{ label: dict.eyebrow, href: localeHref(locale, "/knowledge") }, { label: content.title }];
  const isMedicallyReviewed = isKnowledgeContentMedicallyReviewed(
    { reviewStatus: article.reviewStatus, translationStatus: content.translationStatus },
    locale
  );
  const jsonLd = buildKnowledgeArticleJsonLd(
    {
      slug: content.slug,
      title: content.title,
      seoDescription: content.seoDescription,
      faq: content.faq,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      structuredDataType: article.structuredDataType,
      medicalReview: article.medicalReview,
      reviewStatus: article.reviewStatus,
      translationStatus: content.translationStatus,
    },
    locale,
    breadcrumbItems
  );

  /**
   * References are shared content: a translation may override with its own
   * list, but the article-level set is the fallback. That matters
   * structurally — `resolveContent` returns the TRANSLATION object for
   * en/ar, which has no `references` of its own, so without this fallback
   * the shared sources would silently disappear on /en and /ar (or have to
   * be triplicated into three content blocks).
   */
  const references = content.references ?? article.references ?? [];
  const hasReferences = references.length > 0;
  const hasFaq = Boolean(content.faq && content.faq.length > 0);

  /**
   * Reusable references contract (2026-09-13 hardening): a reference-bearing
   * article renders `contentSections → references → FAQ`, so its FAQ is
   * appended after the references rather than at `faqAfterSectionIndex`.
   *
   * Articles WITHOUT references are untouched: the in-loop
   * `faqAfterSectionIndex` placement, the after-all-sections fallback and the
   * TOC insertion all behave exactly as before. `showToc`'s threshold is
   * unchanged in both cases.
   */
  const tocHeadings = content.contentSections.flatMap((section, index) => {
    const headings = section.heading ? [{ id: `section-${index}`, text: section.heading }] : [];
    if (!hasReferences && content.faqHeading && content.faqAfterSectionIndex === index) {
      headings.push({ id: "article-faq", text: content.faqHeading });
    }
    return headings;
  });
  if (hasReferences) tocHeadings.push({ id: "article-references", text: KNOWLEDGE_REFERENCES_HEADING[locale] });
  if (content.faqHeading && (hasReferences || content.faqAfterSectionIndex === undefined)) {
    tocHeadings.push({ id: "article-faq", text: content.faqHeading });
  }
  const showToc = tocHeadings.length >= 4;

  const relatedService = article.serviceRelation ? getServiceById(article.serviceRelation) : undefined;

  /**
   * Resolved once and shared by the two hero placements (mobile flow + desktop
   * rail) so both instances are guaranteed to render identical media and alt
   * text. `width`/`height` stay `undefined` for the 40 pre-2026-09-13
   * articles, which is what preserves their existing 16:9 cover treatment.
   */
  const hero = article.heroImage
    ? {
        src: article.heroImage.src,
        alt: heroAltFor(article, locale, content.title),
        width: article.heroImage.width,
        height: article.heroImage.height,
      }
    : undefined;

  return (
    <main>
      <ReadingProgressBar />

      {/* Article/MedicalWebPage + FAQPage + BreadcrumbList JSON-LD — see src/core/structured-data.ts. Our own generated data, not user input. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/*
        ONE continuous editorial shell (2026-09-13). `data-header-bg` matches
        THIS section's own background exactly: the fixed header takes its
        colour from whichever `[data-header-bg]` element is behind it (see
        site-header/use-header-theme.ts), so declaring it here keeps the
        header deterministic across the entire article — lead, hero, rail and
        body — instead of switching when a second section scrolled past.

        Column order comes from `dir` + normal grid flow: the article is the
        first grid item, so it lands in the RIGHT column in RTL (fa/ar) and
        the LEFT column in LTR (en), and the rail mirrors naturally. No
        absolute coordinates and no direction-specific markup.
      */}
      <section
        dir={LOCALE_DIRECTION[locale]}
        data-header-bg="#fcfbf4"
        className="bg-cream px-6 pb-24 pt-28 sm:px-8 sm:pt-32 lg:pb-20 lg:pt-36"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_352px] lg:gap-x-20">
          {/*
            Assistant safe zone — mobile/tablet only (`max-[872px]`).

            The floating Smart Clinic Assistant trigger is `fixed right-5` and
            56px across, so it paints a circle in the viewport's trailing
            76×76px. Text whose box ends past `100vw - 76px` is therefore
            covered *while scrolling*, not only at the bottom of the page:
            measured on the production build, all 26 swept scroll positions
            below 872px had glyph-level hits, worst case the references list
            where the number "05" sat fully under the bubble at 390px. The
            earlier `pb-24` safe area only protected each section's trailing
            space, so it could never address that.

            `pr` (physical) rather than `pe`: the trigger is anchored to the
            physical right edge in both directions, and Persian/Arabic text —
            being right-aligned — is exactly the case where the bubble lands on
            the line's first characters. 56px is the smallest step that clears
            the 76px footprint (the page's own 24/32px gutter covers the rest)
            and still leaves 4px of true clearance around the circle.

            872px is derived, not decorative: the article's right edge is
            `100vw - 24px` (32px from 640px) until the 720px cap binds, then
            `50vw + 360px`, which stops clearing `100vw - 76px` at exactly
            872px. Above it the approved desktop/tablet shell is untouched
            (the rail does not exist below `lg` either, so nothing else moves).

            Image-only blocks may opt out again with a `-mr-14` wrapper; the
            hero below does, because a smaller hero is the opposite of what the
            brief asked for and because it renders no text. Everything that is
            actually read — title, lead, TOC, body, references, FAQ — stays
            inside the corridor.

            Known and deliberately not changed here: in RTL at `lg` and up the
            article is the *right* column, so the bubble overlaps its edge by
            up to 44px for 1024px ≤ width < 1306px. That is a property of the
            approved desktop geometry, so it is reported rather than patched.
            The sibling sections after `</article>` are outside this corridor
            and carry their own, narrower ones (see below).
          */}
          <article className="mx-auto min-w-0 max-w-[720px] max-[872px]:pr-14">
            <KnowledgeArticleLead
              locale={locale}
              topic={TOPIC_LABEL[locale][article.topicCluster]}
              breadcrumb={breadcrumbItems}
              title={content.title}
              excerpt={content.excerpt}
              meta={
                <>
                  <span>{getReadingTimeLabel(locale, article, content)}</span>
                  <span aria-hidden>·</span>
                  <span>
                    {UPDATED_LABEL[locale]} {formatDateForLocale(article.updatedAt, locale)}
                  </span>
                </>
              }
              review={
                isMedicallyReviewed ? (
                  <MedicalReviewBadge reviewerName={locale === "fa" ? article.medicalReview.reviewerName : DOCTOR_NAME[locale]} locale={locale} />
                ) : undefined
              }
            />

            {/*
              Mobile/tablet hero, in the flow order the brief specifies
              (… > metadata > hero > compact TOC > body). The desktop rail
              below renders its own instance; the two are mutually exclusive
              per breakpoint, so only one is ever painted and only this
              above-the-fold copy loads eagerly.

              The wrapper opts the hero back out of the 56px assistant safe
              zone on `<article>` above: a negative trailing margin re-widens
              the containing block by exactly what the safe zone took away, so
              the figure inside it is centered against the page again (no
              optical nudge needed) and the hero keeps the size it has always
              had — 320px, or the 272px small-mobile portrait cap. Without it
              the safe zone would shrink every hero by 56px on phones, which is
              the opposite of the brief, and legacy covers would visibly
              regress. Safe because the figure renders no text: only the image
              can pass under the bubble, never a readable line, and the block
              cannot exceed the article's own padding box, so there is no
              overflow.
            */}
            {hero ? (
              <div className="mt-9 max-[872px]:-mr-14 lg:hidden">
                <KnowledgeArticleHero hero={hero} locale={locale} priority />
              </div>
            ) : null}

            {showToc ? (
              <div className="mt-9 lg:hidden">
                <ArticleTocDisclosure headings={tocHeadings} locale={locale} />
              </div>
            ) : null}

            {/*
              Body starts right here — immediately after the lead (and the
              mobile hero/TOC on small screens). Nothing above it reserves
              height for media, which is the whole point of the shell.
            */}
            <div className="mt-12 space-y-12">
              {content.contentSections.map((section, index) => (
                <Fragment key={section.heading ?? `section-${index}`}>
                  <Reveal>
                    <div className="space-y-5 scroll-mt-28" id={section.heading ? `section-${index}` : undefined}>
                      {section.heading ? (
                        <header>
                          <h2 className="font-heading text-xl font-bold leading-snug text-charcoal sm:text-2xl">{section.heading}</h2>
                          <span aria-hidden className="mt-3 block h-px w-12 bg-gold/45" />
                        </header>
                      ) : null}
                      <KnowledgeArticleSectionContent
                        section={section}
                        locale={locale}
                        lead={index === 0 && !section.heading}
                      />
                    </div>
                  </Reveal>
                  {hasFaq && !hasReferences && content.faqAfterSectionIndex === index ? (
                    <Reveal>
                      <KnowledgeArticleFaq items={content.faq ?? []} heading={content.faqHeading} locale={locale} />
                    </Reveal>
                  ) : null}
                </Fragment>
              ))}
            </div>

            {hasReferences ? (
              <div className="mt-14">
                <Reveal>
                  <KnowledgeArticleReferences references={references} locale={locale} />
                </Reveal>
              </div>
            ) : null}

            {hasFaq && (hasReferences || content.faqAfterSectionIndex === undefined) ? (
              <div className="mt-14">
                <Reveal>
                  <KnowledgeArticleFaq items={content.faq ?? []} heading={content.faqHeading} locale={locale} />
                </Reveal>
              </div>
            ) : null}

            {article.aparatEmbeds && article.aparatEmbeds.length > 0 ? (
              <div className="mt-14 space-y-6">
                {article.aparatEmbeds.map((video) => (
                  <AparatEmbed key={video.videoHash} videoHash={video.videoHash} title={video.title} />
                ))}
              </div>
            ) : null}

            <div className="mt-12 border-t border-charcoal/10 pt-6">
              <Link
                href={localeHref(locale, "/knowledge")}
                className="text-sm text-gold transition-colors duration-200 hover:text-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {backArrow} {dict.backToIndexCta}
              </Link>
            </div>
          </article>

          {/*
            Rail. The grid deliberately does NOT use `lg:items-start`: this
            item is left to stretch to the article's full height, which is
            what gives the sticky nav group inside it a tall containing block
            to travel along. The hero is a normal flow child here, so it
            scrolls away with the page and only the nav group pins — `lg:top-28`
            (7rem) clears the 88px desktop header.
          */}
          <div className="hidden lg:block">
            {hero ? <KnowledgeArticleHero hero={hero} locale={locale} priority className="mb-12" /> : null}

            <KnowledgeArticleSidebar>
              {showToc ? <ArticleToc headings={tocHeadings} locale={locale} /> : null}

              <KnowledgeLatestArticles items={latestArticles} locale={locale} />

              {relatedService ? (
                <div className="border-t border-charcoal/15 pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{RELATED_SERVICE_LABEL[locale]}</p>
                  <Link href={getServiceHref(locale, relatedService.slug)} className="group mt-3 block">
                    <span className="block text-base font-bold leading-snug text-charcoal transition-colors duration-200 group-hover:text-gold">
                      {relatedService.title[locale]}
                    </span>
                    <span className="mt-1.5 block text-xs text-charcoal/50 transition-colors duration-200 group-hover:text-gold">
                      {RELATED_SERVICE_CTA[locale]}
                    </span>
                  </Link>
                </div>
              ) : null}

              <div className="border-t border-charcoal/15 pt-5">
                <p className="text-base font-bold leading-snug text-charcoal">{dict.ctaHeading}</p>
                <p className="mt-2 text-xs leading-6 text-charcoal/60">{dict.ctaBody}</p>
                <AssistantTriggerButton
                  intent="articles"
                  source="assistant"
                  className="mt-4 inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-warm-white transition-colors duration-200 hover:bg-gold-hover"
                >
                  {dict.ctaButton}
                </AssistantTriggerButton>
              </div>
            </KnowledgeArticleSidebar>
          </div>
        </div>
      </section>

      {/*
        Related content stays its own section rather than folding into the
        shell: it is a different editorial unit (different container width,
        different rhythm) and the tonal step between the two surfaces marks
        the end of the article. The backgrounds are swapped relative to the
        pre-2026-09-13 layout — the shell is now cream and this section is
        warm-white — so the step is preserved even though the shell absorbed
        what used to be two sections.

        `pb-24` on mobile is the assistant content safe area, not decoration:
        the floating assistant trigger is `fixed right-5`, 56px across, with
        its bottom edge `max(1.25rem, safe-area + 1rem)` off the viewport, so
        it occupies roughly the last 76×76px of the bottom-end corner while
        scrolling. `pb-24` only buys trailing space — it cannot protect text
        the reader scrolls past, which is what the physical `pr-14` safe zones
        are for: the article shell above carries one on `<article>`, and this
        block carries its own on `KnowledgeRelatedArticles`' container, because
        it is centred at 896px and therefore starts clipping the corner again
        below 1060px even though it sits *outside* the article. The closing
        `AssistantCtaSection` below takes the same treatment via its
        `contentClassName` (necessary below 832px for its `max-w-2xl` box).
      */}
      {relatedItems.length > 0 ? (
        <section data-header-bg="#faf7f1" className="bg-warm-white px-6 pb-24 pt-16 sm:px-8 sm:pt-20 lg:pb-20">
          <KnowledgeRelatedArticles items={relatedItems} locale={locale} />
        </section>
      ) : null}

      <AssistantCtaSection heading={dict.ctaHeading} body={dict.ctaBody} buttonLabel={dict.ctaButton} intent="articles" contentClassName="max-[832px]:pr-14" />
    </main>
  );
}
