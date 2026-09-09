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
