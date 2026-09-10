import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TourismSubpage } from "@/components/page/tourism-subpage";
import { buildLocalizedPageMetadata } from "@/core/seo-metadata.server";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};

  const transfer = getDictionary(locale).healthTourism.transfer;
  return buildLocalizedPageMetadata({
    locale,
    path: "/health-tourism/transfer",
    title: transfer.title,
    description: transfer.subtitle,
  });
}

export default async function HealthTourismTransferPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).healthTourism;

  return (
    <TourismSubpage
      section={dict.transfer}
      nav={dict.nav}
      active="transfer"
      locale={locale}
      ctaHeading={dict.ctaHeading}
      ctaBody={dict.ctaBody}
      ctaButton={dict.ctaButton}
    />
  );
}
