import type { Metadata } from "next";

import { absoluteUrl } from "@/core/site-config";
import { localeHref } from "@/i18n/locale-href";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";

type OpenGraphType = "website" | "article";

export interface LocalizedPageMetadataOptions {
  locale: Locale;
  /** Locale-neutral route beginning with `/`; use `/` for the homepage. */
  path: string;
  title: string;
  description: string;
  openGraphType?: OpenGraphType;
  /** Local public paths only. They are converted to canonical production URLs. */
  imagePaths?: readonly string[];
}

/**
 * Server-only metadata foundation for public route families whose path is
 * shared across FA/EN/AR. Knowledge articles retain their specialized
 * helper because translated article slugs are different and optional.
 */
export function buildLocalizedPageMetadata({
  locale,
  path,
  title,
  description,
  openGraphType = "website",
  imagePaths = [],
}: LocalizedPageMetadataOptions): Metadata {
  const canonical = absoluteUrl(localeHref(locale, path));
  const languages: Record<string, string> = Object.fromEntries(
    SUPPORTED_LOCALES.map((supportedLocale) => [supportedLocale, absoluteUrl(localeHref(supportedLocale, path))])
  );
  languages["fa-IR"] = languages.fa!;
  languages["x-default"] = languages.fa!;

  const images = imagePaths.map(absoluteUrl);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      type: openGraphType,
      url: canonical,
      images: images.length > 0 ? images : undefined,
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title,
      description,
      images: images.length > 0 ? images : undefined,
    },
  };
}

/**
 * Batch SEO-01 (2026-09-13) — service and procedure pages were shipping
 * their hero strapline as the meta description. Those strings are written
 * for a hero, not for a search result: measured across all three locales
 * they run 32–122 characters, thin next to the ~155-character snippet
 * Google is willing to render, while the facial-cosmetic hub's
 * `heroSubtitle` went the other way at 202–299 characters and was
 * truncated mid-sentence on every search result.
 *
 * `overview` copy is the doctor-reviewed, procedure-naming summary already
 * published on the page, but in full it is far too long (189–313
 * characters). Its FIRST sentence, however, is a self-contained statement
 * that carries the treatment's own localized name — so it is used when it
 * lands in the 80–165 character window, and the existing fallback string
 * is kept untouched otherwise.
 *
 * This awards no new keywords and authors no new claims: it only selects
 * an existing approved sentence verbatim, so nothing here rewrites
 * doctor-supplied copy. The window's upper bound is Google's ~155–160
 * character snippet budget with a small allowance for the narrower
 * average glyph in Persian/Arabic; the lower bound rejects a stub
 * sentence that would leave the description thinner than the strapline it
 * replaced.
 */
const META_DESCRIPTION_MIN_LENGTH = 80;
const META_DESCRIPTION_MAX_LENGTH = 165;

export function preferredMetaDescription(overview: string, fallback: string): string {
  const firstSentence = overview.trim().match(/^.*?[.!؟]/)?.[0]?.trim() ?? "";
  return firstSentence.length >= META_DESCRIPTION_MIN_LENGTH && firstSentence.length <= META_DESCRIPTION_MAX_LENGTH
    ? firstSentence
    : fallback;
}
