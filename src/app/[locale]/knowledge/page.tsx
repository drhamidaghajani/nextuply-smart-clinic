import Link from "next/link";
import { notFound } from "next/navigation";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { EditorialCardGrid, type EditorialCardItem } from "@/components/page/editorial-card-grid";
import { PageHero } from "@/components/page/page-hero";
import { ServiceVisualPanel } from "@/components/page/service-visual-panel";
import { Reveal } from "@/components/motion/reveal";
import { getReadingTimeLabel } from "@/content/reading-time";
import { getServiceById } from "@/content/services";
import { KNOWLEDGE_ARTICLES, type KnowledgeArticle, type KnowledgeArticleTranslation, type KnowledgeTopicCluster } from "@/content/knowledge-articles";
import { formatDateForLocale } from "@/i18n/format-jalali-date";
import { getDictionary } from "@/i18n/get-dictionary";
import { localeHref } from "@/i18n/locale-href";
import { isSupportedLocale, LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

/**
 * Round 2026-07-13 (design-quality pass): rebuilt as an editorial
 * magazine index — a large featured-article panel, the rest in the
 * shared `EditorialCardGrid` list — instead of identically-sized cards.
 *
 * Round 2026-08-23 (WordPress → Knowledge Center phase-1 migration,
 * Track 2): organizes the article set by topic cluster — a static
 * "browse by topic" anchor-link row plus a grouped section per cluster.
 * Deliberately NOT a client-side filter/search — per Hamid's "do not
 * overbuild search/filter" instruction, this is plain anchor navigation.
 *
 * Round 2026-08-23, same day (final production URL restructuring, Task 2):
 * now renders for all three locales. `en`/`ar` list ONLY articles that
 * have an actual translation for that locale — never the Persian body
 * under a translated eyebrow, per Hamid's explicit "do not fallback to
 * Persian; omit from that language's index" instruction. If a locale
 * currently has zero translated articles, a calm empty state shows
 * instead of a blank page.
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

const TOPIC_ORDER: readonly KnowledgeTopicCluster[] = [
  "orthognathic-surgery",
  "advanced-dental-implant",
  "impacted-tooth-surgery",
  "rhinoplasty",
  "facial-cosmetic-surgery",
  "blepharoplasty",
  "facial-trauma-surgery",
  "care-instructions",
  "doctor-profile",
  "clinic-info",
  "general-dental",
  "uncategorized",
];

const BROWSE_BY_TOPIC_LABEL: Record<Locale, string> = { fa: "مرور بر اساس موضوع", en: "Browse by topic", ar: "تصفح حسب الموضوع" };
const EMPTY_STATE: Record<Locale, string> = {
  fa: "",
  en: "English translations of our Knowledge Center articles are being added — please check back soon, or read the Persian originals.",
  ar: "تتم إضافة الترجمات العربية لمقالات المكتبة المعرفية — يرجى المراجعة قريبًا، أو قراءة النسخة الأصلية بالفارسية.",
};

interface ResolvedListItem {
  article: KnowledgeArticle;
  content: Pick<KnowledgeArticleTranslation, "slug" | "title" | "excerpt" | "contentSections">;
}

function resolveArticlesForLocale(locale: Locale): ResolvedListItem[] {
  if (locale === "fa") {
    return KNOWLEDGE_ARTICLES.map((article) => ({ article, content: article }));
  }
  const items: ResolvedListItem[] = [];
  for (const article of KNOWLEDGE_ARTICLES) {
    const content = article.translations?.[locale];
    if (content) items.push({ article, content });
  }
  return items;
}

function toCardItem(item: ResolvedListItem, locale: Locale): EditorialCardItem {
  return {
    key: item.content.slug,
    href: localeHref(locale, `/knowledge/${item.content.slug}`),
    eyebrow: TOPIC_LABEL[locale][item.article.topicCluster],
    title: item.content.title,
    subtitle: item.content.excerpt,
    meta: `${getReadingTimeLabel(locale, item.article, item.content)} · ${formatDateForLocale(item.article.updatedAt, locale)}`,
  };
}

export default async function KnowledgeIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).knowledge;
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "←" : "→";

  const resolved = resolveArticlesForLocale(locale);
  const featured = resolved.find((item) => item.article.heroImage) ?? resolved[0];
  const rest = resolved.filter((item) => item.content.slug !== featured?.content.slug);

  const clustersPresent = TOPIC_ORDER.filter((cluster) => rest.some((item) => item.article.topicCluster === cluster));
  const groups = clustersPresent.map((cluster) => ({
    cluster,
    items: rest.filter((item) => item.article.topicCluster === cluster),
  }));

  const featuredService = featured?.article.serviceRelation ? getServiceById(featured.article.serviceRelation) : undefined;

  return (
    <main>
      <PageHero eyebrow={dict.eyebrow} title={dict.heading} subtitle={dict.subheading} locale={locale} breadcrumb={[{ label: dict.eyebrow }]} />

      {featured ? (
        <section className="bg-cream px-6 py-16 sm:px-8 sm:py-20">
          <Reveal className="mx-auto max-w-4xl">
            <Link
              href={localeHref(locale, `/knowledge/${featured.content.slug}`)}
              className="group grid gap-6 overflow-hidden rounded-2xl border border-charcoal/10 bg-warm-white transition-colors duration-300 ease-out hover:border-gold/40 sm:grid-cols-2 sm:rounded-[28px]"
            >
              <div className="p-6 sm:order-2 sm:p-10">
                <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-charcoal/50">
                  <span className="font-semibold text-gold">{TOPIC_LABEL[locale][featured.article.topicCluster]}</span>
                  <span>·</span>
                  <span>{getReadingTimeLabel(locale, featured.article, featured.content)}</span>
                </div>
                <h2 className="mt-4 text-balance text-xl font-bold leading-tight text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:text-2xl lg:text-[28px]">
                  {featured.content.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-charcoal/65 sm:text-base">{featured.content.excerpt}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold">
                  {dict.readMoreCta} {arrow}
                </span>
              </div>
              <div className="p-6 pb-0 sm:order-1 sm:p-0">
                <ServiceVisualPanel
                  photoSrc={featured.article.heroImage?.src}
                  alt={featured.article.heroImage?.alt ?? featured.content.title}
                  iconKey={featuredService?.iconKey}
                  aspectRatio="aspect-[4/3]"
                  tone="cream"
                />
              </div>
            </Link>
          </Reveal>
        </section>
      ) : (
        <section className="bg-cream px-6 py-20 text-center sm:px-8 sm:py-24">
          <p className="mx-auto max-w-md text-sm leading-7 text-charcoal/60 sm:text-base">{EMPTY_STATE[locale]}</p>
        </section>
      )}

      {groups.length > 1 ? (
        <nav aria-label={BROWSE_BY_TOPIC_LABEL[locale]} className="border-y border-charcoal/10 bg-warm-white px-6 py-5 sm:px-8">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{BROWSE_BY_TOPIC_LABEL[locale]}</p>
            {groups.map(({ cluster, items }) => (
              <a key={cluster} href={`#topic-${cluster}`} className="text-xs text-charcoal/60 transition-colors duration-200 hover:text-gold sm:text-sm">
                {TOPIC_LABEL[locale][cluster]} ({items.length})
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      {groups.map(({ cluster, items }, groupIndex) => (
        <section
          key={cluster}
          id={`topic-${cluster}`}
          className={`scroll-mt-24 bg-warm-white px-6 pt-10 sm:px-8 sm:pt-14 ${groupIndex === groups.length - 1 ? "pb-16 sm:pb-20" : "pb-4"}`}
        >
          <p className="mx-auto mb-4 max-w-4xl text-xs font-semibold uppercase tracking-[0.2em] text-gold">{TOPIC_LABEL[locale][cluster]}</p>
          <EditorialCardGrid items={items.map((item) => toCardItem(item, locale))} locale={locale} />
        </section>
      ))}

      <AssistantCtaSection heading={dict.ctaHeading} body={dict.ctaBody} buttonLabel={dict.ctaButton} intent="articles" />
    </main>
  );
}
