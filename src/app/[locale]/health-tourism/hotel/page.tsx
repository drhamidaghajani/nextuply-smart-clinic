import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TourismSubpage } from "@/components/page/tourism-subpage";
import { buildLocalizedPageMetadata } from "@/core/seo-metadata.server";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};

  const hotel = getDictionary(locale).healthTourism.hotel;
  return buildLocalizedPageMetadata({
    locale,
    path: "/health-tourism/hotel",
    title: hotel.title,
    description: hotel.subtitle,
  });
}

export default async function HealthTourismHotelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dict = getDictionary(locale).healthTourism;

  return (
    <TourismSubpage
      section={dict.hotel}
      nav={dict.nav}
      active="hotel"
      locale={locale}
      ctaHeading={dict.ctaHeading}
      ctaBody={dict.ctaBody}
      ctaButton={dict.ctaButton}
    />
  );
}
