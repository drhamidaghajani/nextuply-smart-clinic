import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TourismSubpage } from "@/components/page/tourism-subpage";
import { buildLocalizedPageMetadata } from "@/core/seo-metadata.server";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};

  const visa = getDictionary(locale).healthTourism.visa;
  return buildLocalizedPageMetadata({
    locale,
    path: "/health-tourism/visa",
    title: visa.title,
    description: visa.subtitle,
  });
}

export default async function HealthTourismVisaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).healthTourism;

  return (
    <TourismSubpage
      section={dict.visa}
      nav={dict.nav}
      active="visa"
      locale={locale}
      ctaHeading={dict.ctaHeading}
      ctaBody={dict.ctaBody}
      ctaButton={dict.ctaButton}
    />
  );
}
