import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type {
  KnowledgeArticleBodyBlock,
  KnowledgeArticleClinicalImage,
  KnowledgeArticleClinicalMedia,
  KnowledgeArticleSection,
  KnowledgeArticleTextLink,
} from "@/content/knowledge-articles";
import { localeHref } from "@/i18n/locale-href";
import type { Locale } from "@/i18n/locales";

/**
 * Long-form body typography (2026-09-13 Knowledge detail redesign, tightened
 * again in the editorial-shell pass). One shared set of classes so the legacy
 * `paragraphs` path and the rich `blocks` path render identically — the
 * redesign must not fork the two architectures.
 *
 * The `/85` (was `/80`) and the explicit unitless line height are the second
 * pass: brief §6 asked for body copy that reads darker and more generously
 * leaded than the previous `/80` on `leading-9`/`leading-10`, because the old
 * combination measured as pale grey at large measure. The size stays inside
 * the requested 16.5–17.5px envelope so nothing reflows into a "giant blog
 * type" look.
 */
const PARAGRAPH_CLASS =
  "text-[16.5px] leading-[1.95] text-charcoal/85 sm:text-[17px]";
const LIST_CLASS =
  "space-y-3 text-[16.5px] leading-[1.95] text-charcoal/85 sm:text-[17px]";

/**
 * Editorial lead (2026-09-13). The first section of an article frequently has
 * no heading — it is the standfirst paragraph that carries the reader from
 * the dek into the body. It gets a marginally larger, darker setting so the
 * article opens with a deliberate typographic step rather than a flat wall of
 * identically-sized copy.
 *
 * This is presentation only: the string rendered is the SAME source paragraph
 * (no summary is generated, no paragraph is duplicated), and the class is
 * applied only when the shell says the section is the un-headed first one.
 */
const LEAD_PARAGRAPH_CLASS =
  "text-[17px] leading-[1.9] text-charcoal/90 sm:text-[18px]";
const SUBHEADING_CLASS =
  "pt-3 font-heading text-lg font-semibold leading-snug text-charcoal sm:text-xl";
const INLINE_LINK_CLASS =
  "font-medium text-gold underline decoration-gold/30 underline-offset-4 transition-colors duration-200 hover:text-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

/**
 * Persian and Arabic body paragraphs are justified (brief: "Persian and
 * Arabic article paragraphs MUST be justified"), with `text-align-last:
 * start` so the final line of each paragraph is not stretched — `start`
 * is logical, so it resolves to the right edge in RTL and the left edge
 * in LTR without a per-direction branch. Applied to PARAGRAPHS ONLY:
 * headings, captions, labels and lists stay start-aligned, and English
 * body copy is never justified.
 */
const RTL_JUSTIFY_CLASS = "[text-align:justify] [text-align-last:start]";

function paragraphClass(locale: Locale, lead = false): string {
  const base = lead ? LEAD_PARAGRAPH_CLASS : PARAGRAPH_CLASS;
  return locale === "en" ? base : `${base} ${RTL_JUSTIFY_CLASS}`;
}

/**
 * Inline link renderer. The `kind` discriminant is OPTIONAL on the content
 * type and every legacy link omits it, so the branch below deliberately
 * tests for `"external"` first and treats everything else as internal —
 * the inverse test would silently turn all 40 legacy articles' links into
 * external `<a>` tags. External hrefs are absolute URLs and must never
 * pass through `localeHref`.
 */
function LinkAnchor({ link, locale }: { link: KnowledgeArticleTextLink; locale: Locale }) {
  if (link.kind === "external") {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={INLINE_LINK_CLASS}>
        {link.text}
      </a>
    );
  }
  return (
    <Link href={localeHref(locale, link.href)} className={INLINE_LINK_CLASS}>
      {link.text}
    </Link>
  );
}

function renderLinkedText(text: string, links: readonly KnowledgeArticleTextLink[] | undefined, locale: Locale): ReactNode {
  if (!links || links.length === 0) return text;

  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const link of links) {
    const start = text.indexOf(link.text, cursor);
    if (start < 0) continue;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(<LinkAnchor key={`${link.href}-${start}`} link={link} locale={locale} />);
    cursor = start + link.text.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length > 0 ? nodes : text;
}

/**
 * One clinical photograph — 2026-09-13 redesign.
 *
 * Previously these rendered at the full width of the article column, which
 * made portrait material (e.g. S Lift's 1200×1600 incision/suture detail
 * shots) enormous. They are now a controlled clinical figure: centred,
 * capped at 480px, shown at their intrinsic ratio inside a soft warm
 * frame. Intrinsic `width`/`height` are always supplied, so there is no
 * layout shift.
 */
function ClinicalImage({ image }: { image: KnowledgeArticleClinicalImage }) {
  return (
    <figure className="mx-auto w-full max-w-[480px]">
      <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-warm-white/70 p-2 sm:p-3">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 1024px) 480px, calc(100vw - 80px)"
          className="h-auto w-full rounded-xl"
        />
      </div>
      {image.caption ? (
        <figcaption className="mt-3 text-center text-xs leading-6 text-charcoal/55">{image.caption}</figcaption>
      ) : null}
    </figure>
  );
}

function LabeledImage({ image, label }: { image: KnowledgeArticleClinicalImage; label: string }) {
  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-warm-white/70 p-2">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 640px) 260px, calc(100vw - 80px)"
          className="h-auto w-full rounded-xl"
        />
      </div>
      <figcaption className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-gold/70 sm:text-start">
        {label}
      </figcaption>
    </figure>
  );
}

function ClinicalMedia({ media }: { media: KnowledgeArticleClinicalMedia }) {
  if (media.type === "image") return <ClinicalImage image={media.image} />;

  return (
    <div className="mx-auto grid max-w-[560px] items-start gap-5 sm:grid-cols-2 sm:gap-6">
      <LabeledImage image={media.before} label={media.beforeLabel} />
      <LabeledImage image={media.after} label={media.afterLabel} />
    </div>
  );
}

function BodyBlock({ block, locale, lead = false }: { block: KnowledgeArticleBodyBlock; locale: Locale; lead?: boolean }) {
  if (block.type === "paragraph") {
    return <p className={paragraphClass(locale, lead)}>{renderLinkedText(block.text, block.links, locale)}</p>;
  }
  if (block.type === "subheading") {
    return <h3 className={SUBHEADING_CLASS}>{block.text}</h3>;
  }
  if (block.type === "list") {
    return (
      <ul className={LIST_CLASS}>
        {block.items.map((item) => (
          <li key={item} className="relative ps-6">
            <span aria-hidden className="absolute start-0 top-[1.1em] h-px w-3 bg-gold/60" />
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return <ClinicalMedia media={block.media} />;
}

/**
 * Renders one article section's body.
 *
 * `lead` is set by the article shell for the first section of an article that
 * has no heading. It promotes only that section's opening paragraph — never a
 * subheading, list or clinical figure — so the editorial step reads as a
 * deliberate opening line rather than as a styling accident on whatever block
 * happens to be first.
 */
export function KnowledgeArticleSectionContent({
  section,
  locale,
  lead = false,
}: {
  section: KnowledgeArticleSection;
  locale: Locale;
  lead?: boolean;
}) {
  if (section.blocks) {
    return (
      <>
        {section.blocks.map((block, index) => (
          <BodyBlock key={`${block.type}-${index}`} block={block} locale={locale} lead={lead && index === 0} />
        ))}
      </>
    );
  }

  return (
    <>
      {section.paragraphs.map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex} className={paragraphClass(locale, lead && paragraphIndex === 0)}>
          {paragraph}
        </p>
      ))}
    </>
  );
}
