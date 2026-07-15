import Link from "next/link";
import { notFound } from "next/navigation";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { EditorialCardGrid, type EditorialCardItem } from "@/components/page/editorial-card-grid";
import { PageHero } from "@/components/page/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale, LOCALE_DIRECTION, SUPPORTED_LOCALES } from "@/i18n/locales";
import { fa } from "@/i18n/dictionaries/fa";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) => fa.knowledge.articles.map((article) => ({ locale, slug: article.slug })));
}

/**
 * Round 2026-07-13 (design-quality pass): premium editorial reading
 * layout — narrower measure, larger leading, breadcrumb — plus a
 * "related articles" list (the other 2 pieces) before the closing CTA. A
 * table of contents was considered and skipped: these are 3-paragraph
 * pieces, short enough that a TOC would add clutter, not orientation.
 */
export default async function KnowledgeArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).knowledge;
  const article = dict.articles.find((item) => item.slug === slug);
  if (!article) notFound();

  const related = dict.articles.filter((item) => item.slug !== slug);
  const isRtl = LOCALE_DIRECTION[locale] === "rtl";
  const backArrow = isRtl ? "→" : "←";

  const relatedItems: EditorialCardItem[] = related.map((item) => ({
    key: item.slug,
    href: `/${locale}/knowledge/${item.slug}`,
    eyebrow: item.category,
    title: item.title,
    subtitle: item.summary,
    meta: item.readTime,
  }));

  return (
    <main>
      <PageHero
        eyebrow={article.category}
        title={article.title}
        subtitle={article.summary}
        locale={locale}
        breadcrumb={[{ label: dict.eyebrow, href: `/${locale}/knowledge` }, { label: article.category }]}
      />

      <section className="bg-cream px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-xl space-y-5">
          {article.body.map((paragraph) => (
            <Reveal key={paragraph}>
              <p className="text-[15px] leading-8 text-charcoal/75 sm:text-base sm:leading-9">{paragraph}</p>
            </Reveal>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-xl">
          <Link href={`/${locale}/knowledge`} className="text-sm text-gold hover:text-gold-hover">
            {backArrow} {dict.backToIndexCta}
          </Link>
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
