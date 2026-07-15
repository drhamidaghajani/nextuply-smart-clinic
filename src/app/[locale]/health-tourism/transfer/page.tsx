import { notFound } from "next/navigation";
import { TourismSubpage } from "@/components/page/tourism-subpage";
import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale } from "@/i18n/locales";

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
