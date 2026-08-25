import type { KnowledgeArticle, KnowledgeArticleSection, KnowledgeArticleTranslation } from "./knowledge-articles";
import type { Locale } from "@/i18n/locales";

/**
 * `KnowledgeArticle.readingTime` is a hand-curated Persian-only string
 * (e.g. "5 دقیقه مطالعه") with no per-locale equivalent. Rendering it
 * directly on `/en`/`/ar` article pages leaked Persian body text onto
 * those pages — caught 2026-08-23 while live-verifying the first batch of
 * English/Arabic Knowledge Center translations. For `fa`, keep using the
 * curated string unchanged (zero risk to already-verified Persian pages).
 * For `en`/`ar`, estimate from the translated content's own word count
 * instead, so the label is always in the page's own language.
 */
const WORDS_PER_MINUTE = 200;

function estimateReadingTimeMinutes(sections: readonly KnowledgeArticleSection[]): number {
  const wordCount = sections.reduce((total, section) => {
    const headingWords = section.heading?.split(/\s+/).filter(Boolean).length ?? 0;
    const paragraphWords = section.paragraphs.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0);
    return total + headingWords + paragraphWords;
  }, 0);
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

function formatReadingTime(minutes: number, locale: Locale): string {
  if (locale === "en") return `${minutes} min read`;
  if (locale === "ar") return `${minutes} دقيقة قراءة`;
  return `${minutes} دقیقه مطالعه`;
}

export function getReadingTimeLabel(
  locale: Locale,
  article: KnowledgeArticle,
  content: Pick<KnowledgeArticleTranslation, "contentSections">
): string {
  if (locale === "fa") return article.readingTime;
  return formatReadingTime(estimateReadingTimeMinutes(content.contentSections), locale);
}
