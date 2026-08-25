import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AparatEmbed } from "@/components/page/aparat-embed";
import { ArticleToc } from "@/components/page/article-toc";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { EditorialCardGrid, type EditorialCardItem } from "@/components/page/editorial-card-grid";
import { KnowledgeLatestArticles, type KnowledgeLatestArticleItem } from "@/components/page/knowledge-latest-articles";
import { KnowledgeArticleSidebar } from "@/components/page/knowledge-sidebar";
import { MedicalReviewBadge } from "@/components/page/medical-review-badge";
import { PageFaq } from "@/components/page/page-faq";
import { PageHero } from "@/components/page/page-hero";
import { ReadingProgressBar } from "@/components/page/reading-progress-bar";
import { ServiceVisualPanel } from "@/components/page/service-visual-panel";
import { Reveal } from "@/components/motion/reveal";
import { absoluteUrl } from "@/core/site-config";
import { buildKnowledgeArticleHreflangAlternates, buildKnowledgeArticleJsonLd, DOCTOR_NAME } from "@/core/structured-data";
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
 * many params as there are translated articles (never all 25 — a
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) return {};
  const resolved = resolveContent(locale, slug);
  if (!resolved) return {};
  const { article, content } = resolved;

  const canonical = localeHref(locale, `/knowledge/${content.slug}`);
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
      // heroImage is always a local downloaded file (never the old WordPress
      // URL — see knowledge-articles.ts's own field doc-comment), so it's
      // safe to reference directly here.
      images: article.heroImage ? [{ url: absoluteUrl(article.heroImage.src) }] : undefined,
    },
  };
}

/**
 * Round 2026-08-25 (staging QA — premium editorial redesign): rebuilt
 * around a two-column grid (`grid-cols-1` mobile → `lg:grid-cols-
 * [1fr_320px]` desktop) instead of one narrow centered column. The
 * sidebar (TOC, latest articles, related service, assistant CTA) is the
 * grid's second item, so on mobile — where it's `grid-cols-1` — it
 * simply flows below the article body with zero extra markup; on
 * desktop it becomes a sticky rail (`KnowledgeArticleSidebar`). Explicit
 * design instruction (Hamid, same round): reuse the site's EXISTING
 * visual language throughout (gold/charcoal/cream palette, the same
 * hairline-divided editorial list grammar as `EditorialCardGrid`, the
 * same `Reveal` fade-in) — no new visual direction, no new animation
 * dependency. `ReadingProgressBar` and the desktop TOC are the only
 * genuinely new pieces; everything else recomposes components that
 * already existed on this page or elsewhere on the site.
 *
 * Round 2026-08-23 (WordPress → Knowledge Center phase-1 migration,
 * Tracks 2/3/4): real migrated content, hero image band (`ServiceVisualPanel`
 * reused as-is — already handles real-photo-or-premium-fallback, no new
 * component needed), reading-time/updated-date row, TOC (≥4 headed
 * sections), anchored headings, Aparat slot, related-service CTA.
 *
 * Round 2026-08-23, same day (final production URL restructuring, Task 2):
 * now locale-aware across all three languages via `resolveContent` —
 * Persian reads its own top-level fields, en/ar read
 * `article.translations[locale]`, which carries its OWN slug (never the
 * Persian one reused under a prefix). No English/Arabic page EVER falls
 * back to Persian body text: `resolveContent` returns `null` for a
 * missing translation, `notFound()` fires, done — per Hamid's explicit
 * instruction. `generateStaticParams` above only emits paths for
 * translations that actually exist, so this is the expected behavior for
 * an unwritten translation, not an edge case.
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
  const relatedItems: EditorialCardItem[] = related;

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
    },
    locale,
    breadcrumbItems
  );

  const headedSections = content.contentSections
    .map((section, index) => ({ ...section, anchorId: `section-${index}` }))
    .filter((section): section is typeof section & { heading: string } => Boolean(section.heading));
  const showToc = headedSections.length >= 4;
  const tocHeadings = headedSections.map((s) => ({ id: s.anchorId, text: s.heading }));

  const relatedService = article.serviceRelation ? getServiceById(article.serviceRelation) : undefined;

  return (
    <main>
      <ReadingProgressBar />

      {/* Article/MedicalWebPage + FAQPage + BreadcrumbList JSON-LD — see src/core/structured-data.ts. Our own generated data, not user input. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        eyebrow={TOPIC_LABEL[locale][article.topicCluster]}
        title={content.title}
        subtitle={content.excerpt}
        locale={locale}
        breadcrumb={breadcrumbItems}
      />

      <section className="bg-cream px-6 py-16 sm:px-8 sm:py-20">
        <Reveal className="mx-auto max-w-3xl">
          <ServiceVisualPanel
            photoSrc={article.heroImage?.src}
            alt={article.heroImage?.alt ?? content.title}
            iconKey={relatedService?.iconKey}
            aspectRatio="aspect-[16/9]"
            tone="cream"
          />
        </Reveal>

        <div
          dir={LOCALE_DIRECTION[locale]}
          className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-16"
        >
          <article className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-charcoal/50 sm:text-sm">
              <span>{getReadingTimeLabel(locale, article, content)}</span>
              <span aria-hidden>·</span>
              <span>
                {UPDATED_LABEL[locale]} {formatDateForLocale(article.updatedAt, locale)}
              </span>
            </div>

            <div className="mt-4">
              <MedicalReviewBadge reviewerName={locale === "fa" ? article.medicalReview.reviewerName : DOCTOR_NAME[locale]} locale={locale} />
            </div>

            {showToc ? (
              <div className="mt-8 lg:hidden">
                <ArticleToc headings={tocHeadings} locale={locale} />
              </div>
            ) : null}

            <div className="mt-8 space-y-8">
              {content.contentSections.map((section, index) => (
                <Reveal key={section.heading ?? `section-${index}`}>
                  <div className="space-y-4" id={section.heading ? `section-${index}` : undefined}>
                    {section.heading ? <h2 className="text-lg font-bold leading-snug text-charcoal sm:text-xl">{section.heading}</h2> : null}
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex} className="text-[15px] leading-8 text-charcoal/75 sm:text-base sm:leading-9">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>

            {content.faq && content.faq.length > 0 ? (
              <div className="mt-14">
                <PageFaq items={content.faq} />
              </div>
            ) : null}

            {article.aparatEmbeds && article.aparatEmbeds.length > 0 ? (
              <div className="mt-14 space-y-6">
                {article.aparatEmbeds.map((video) => (
                  <AparatEmbed key={video.videoHash} videoHash={video.videoHash} title={video.title} />
                ))}
              </div>
            ) : null}

            <div className="mt-10">
              <Link href={localeHref(locale, "/knowledge")} className="text-sm text-gold hover:text-gold-hover">
                {backArrow} {dict.backToIndexCta}
              </Link>
            </div>
          </article>

          <KnowledgeArticleSidebar>
            {showToc ? (
              <div className="hidden lg:block">
                <ArticleToc headings={tocHeadings} locale={locale} />
              </div>
            ) : null}

            <KnowledgeLatestArticles items={latestArticles} locale={locale} />

            {relatedService ? (
              <Link
                href={getServiceHref(locale, relatedService.slug)}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-gold/25 bg-warm-white px-6 py-6 transition-colors duration-300 ease-out hover:border-gold/50"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{RELATED_SERVICE_LABEL[locale]}</p>
                  <p className="mt-1 text-base font-bold text-charcoal">{relatedService.title[locale]}</p>
                </div>
                <span className="shrink-0 text-sm font-medium text-gold">{RELATED_SERVICE_CTA[locale]}</span>
              </Link>
            ) : null}

            <div className="rounded-2xl border border-gold/25 bg-warm-white px-6 py-6">
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
      </section>

      {relatedItems.length > 0 ? (
        <section className="bg-warm-white px-6 pb-16 sm:px-8 sm:pb-20">
          <p className="mx-auto mb-2 max-w-4xl text-xs font-semibold uppercase tracking-[0.2em] text-gold">{dict.eyebrow}</p>
          <EditorialCardGrid items={relatedItems} locale={locale} />
        </section>
      ) : null}

      <AssistantCtaSection heading={dict.ctaHeading} body={dict.ctaBody} buttonLabel={dict.ctaButton} intent="articles" />
    </main>
  );
}
