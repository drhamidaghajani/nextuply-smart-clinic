import Link from "next/link";
import { notFound } from "next/navigation";
import { AssistantCtaSection } from "@/components/page/assistant-cta-section";
import { EditorialCardGrid, type EditorialCardItem } from "@/components/page/editorial-card-grid";
import { PageHero } from "@/components/page/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale, LOCALE_DIRECTION } from "@/i18n/locales";

/**
 * Round 2026-07-13 (design-quality pass): rebuilt as an editorial
 * magazine index — a large featured-article panel for the first article,
 * the remaining two in the shared `EditorialCardGrid` list — instead of
 * three identically-sized bordered cards.
 */
export default async function KnowledgeIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).knowledge;
  const [featured, ...rest] = dict.articles;
  const arrow = LOCALE_DIRECTION[locale] === "rtl" ? "←" : "→";

  const items: EditorialCardItem[] = rest.map((article) => ({
    key: article.slug,
    href: `/${locale}/knowledge/${article.slug}`,
    eyebrow: article.category,
    title: article.title,
    subtitle: article.summary,
    meta: article.readTime,
  }));

  return (
    <main>
      <PageHero eyebrow={dict.eyebrow} title={dict.heading} subtitle={dict.subheading} locale={locale} breadcrumb={[{ label: dict.eyebrow }]} />

      {featured ? (
        <section className="bg-cream px-6 py-16 sm:px-8 sm:py-20">
          <Reveal className="mx-auto max-w-4xl">
            <Link
              href={`/${locale}/knowledge/${featured.slug}`}
              className="group block rounded-2xl border border-charcoal/10 bg-warm-white px-6 py-10 transition-colors duration-300 ease-out hover:border-gold/40 sm:px-12 sm:py-14"
            >
              <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-charcoal/50">
                <span className="font-semibold text-gold">{featured.category}</span>
                <span>·</span>
                <span>{featured.readTime}</span>
              </div>
              <h2 className="mt-4 max-w-2xl text-balance text-2xl font-bold leading-tight text-charcoal transition-colors duration-300 ease-out group-hover:text-gold sm:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal/65 sm:text-base">{featured.summary}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold">
                {dict.readMoreCta} {arrow}
              </span>
            </Link>
          </Reveal>
        </section>
      ) : null}

      {items.length > 0 ? (
        <section className="bg-warm-white px-6 pb-16 sm:px-8 sm:pb-20">
          <EditorialCardGrid items={items} locale={locale} />
        </section>
      ) : null}

      <AssistantCtaSection heading={dict.ctaHeading} body={dict.ctaBody} buttonLabel={dict.ctaButton} intent="articles" />
    </main>
  );
}
