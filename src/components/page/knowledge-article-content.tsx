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

function renderLinkedText(text: string, links: readonly KnowledgeArticleTextLink[] | undefined, locale: Locale): ReactNode {
  if (!links || links.length === 0) return text;

  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const link of links) {
    const start = text.indexOf(link.text, cursor);
    if (start < 0) continue;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <Link key={`${link.href}-${start}`} href={localeHref(locale, link.href)} className="font-medium text-gold underline decoration-gold/30 underline-offset-4 transition-colors hover:text-gold-hover">
        {link.text}
      </Link>
    );
    cursor = start + link.text.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length > 0 ? nodes : text;
}

function ClinicalImage({ image }: { image: KnowledgeArticleClinicalImage }) {
  return (
    <figure className="overflow-hidden rounded-2xl bg-charcoal/[0.03]">
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes="(min-width: 1024px) 672px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 48px)"
        className="h-auto w-full"
      />
    </figure>
  );
}

function LabeledImage({ image, label }: { image: KnowledgeArticleClinicalImage; label: string }) {
  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-2xl bg-charcoal/[0.03]">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 640px) 324px, calc(100vw - 48px)"
          className="h-auto w-full"
        />
      </div>
      <figcaption className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/55">{label}</figcaption>
    </figure>
  );
}

function ClinicalMedia({ media }: { media: KnowledgeArticleClinicalMedia }) {
  if (media.type === "image") return <ClinicalImage image={media.image} />;

  return (
    <div className="grid items-start gap-5 sm:grid-cols-2 sm:gap-6">
      <LabeledImage image={media.before} label={media.beforeLabel} />
      <LabeledImage image={media.after} label={media.afterLabel} />
    </div>
  );
}

function BodyBlock({ block, locale }: { block: KnowledgeArticleBodyBlock; locale: Locale }) {
  if (block.type === "paragraph") {
    return <p className="text-[15px] leading-8 text-charcoal/75 sm:text-base sm:leading-9">{renderLinkedText(block.text, block.links, locale)}</p>;
  }
  if (block.type === "subheading") {
    return <h3 className="pt-2 text-base font-bold leading-snug text-charcoal sm:text-lg">{block.text}</h3>;
  }
  if (block.type === "list") {
    return (
      <ul className="space-y-3 ps-5 text-[15px] leading-8 text-charcoal/75 marker:text-gold sm:text-base sm:leading-9">
        {block.items.map((item) => (
          <li key={item} className="list-disc ps-1">
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return <ClinicalMedia media={block.media} />;
}

export function KnowledgeArticleSectionContent({ section, locale }: { section: KnowledgeArticleSection; locale: Locale }) {
  if (section.blocks) {
    return (
      <>
        {section.blocks.map((block, index) => (
          <BodyBlock key={`${block.type}-${index}`} block={block} locale={locale} />
        ))}
      </>
    );
  }

  return (
    <>
      {section.paragraphs.map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex} className="text-[15px] leading-8 text-charcoal/75 sm:text-base sm:leading-9">
          {paragraph}
        </p>
      ))}
    </>
  );
}
