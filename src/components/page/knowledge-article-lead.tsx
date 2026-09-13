import type { ReactNode } from "react";

import { PremiumBreadcrumb, type BreadcrumbItem } from "@/components/page/premium-breadcrumb";
import type { Locale } from "@/i18n/locales";

/**
 * The Knowledge article's editorial lead (2026-09-13 editorial-shell
 * redesign): breadcrumb, topic eyebrow, H1, dek, reading-time/updated row and
 * the optional medical-review byline.
 *
 * It deliberately owns no hero and no page-top padding. Both moved to the
 * continuous article shell in `page.tsx`, and that is the actual fix for the
 * desktop dead-space problem: the retired masthead wrapped the text block AND
 * the hero figure in one two-column grid, so a tall portrait figure set the
 * row height and left a large empty region beside the dek. Here the lead is
 * only ever text — the article body starts immediately underneath it, and the
 * hero lives independently in the rail.
 *
 * The breadcrumb is passed in rather than composed here because it is also
 * the source of the JSON-LD `BreadcrumbList` on the page.
 */
export function KnowledgeArticleLead({
  locale,
  topic,
  breadcrumb,
  title,
  excerpt,
  meta,
  review,
  className,
}: {
  locale: Locale;
  topic: string;
  breadcrumb: readonly BreadcrumbItem[];
  title: string;
  excerpt: string;
  /** Reading time / last-updated row. */
  meta: ReactNode;
  /** Optional medical-review byline — only rendered when the article is actually doctor-approved. */
  review?: ReactNode;
  className?: string;
}) {
  return (
    <header className={className}>
      <PremiumBreadcrumb items={breadcrumb} locale={locale} tone="onLight" />

      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{topic}</p>
      <h1 className="mt-4 font-heading text-[1.7rem] font-bold leading-[1.3] text-charcoal sm:text-4xl sm:leading-tight lg:text-[2.5rem] lg:leading-[1.2]">
        {title}
      </h1>
      <p className="mt-6 text-base leading-8 text-charcoal/70 sm:text-[17px] sm:leading-9">{excerpt}</p>
      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-charcoal/55 sm:text-sm">{meta}</div>
      {review ? <div className="mt-5">{review}</div> : null}
    </header>
  );
}
