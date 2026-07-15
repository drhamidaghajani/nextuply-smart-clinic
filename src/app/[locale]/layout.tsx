import type { Metadata } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/sections/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  LOCALE_DIRECTION,
  SUPPORTED_LOCALES,
  isSupportedLocale,
} from "@/i18n/locales";
import { AssistantDrawer, AssistantProvider, FloatingAssistantTrigger } from "@/modules/smart-clinic-assistant";
import "../globals.css";

// Headings only, per DESIGN_SYSTEM.md §3 (2026-07-02 font pairing decision).
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

// Body text, per the same decision. Files supplied by Hamid — see
// CONTENT_INVENTORY.md §9 (one filename had a typo, "RANSansX-Medium" →
// renamed to "IRANSansX-Medium" to match the other two weights).
const iransans = localFont({
  src: [
    { path: "../../../public/fonts/iransans/IRANSansX-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../../public/fonts/iransans/IRANSansX-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../../public/fonts/iransans/IRANSansX-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-iransans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "دکتر علیرضا صدیقی | جراحی زیبایی و فک و صورت",
  description:
    "کلینیک دکتر علیرضا صدیقی — متخصص جراحی فک و صورت و زیبایی، تهران و تبریز.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return (
    <html lang={locale} dir={LOCALE_DIRECTION[locale]}>
      <body
        className={`${vazirmatn.variable} ${iransans.variable} ${inter.variable} font-body antialiased`}
      >
        {/* Round 2026-07-09 (per Hamid): global chrome + the Smart Clinic
            Assistant's shared state, mounted here (not per-page) so both
            survive client-side route changes — see
            src/modules/smart-clinic-assistant/ui/assistant-provider.tsx for why.

            Round 2026-07-12: `AssistantDrawer` added — the real panel the
            provider's `open()` now opens (previously just scrolled to the
            homepage section, since no drawer existed yet).

            Round 2026-07-13 (locale rollout, docs/adr/0005): `SiteHeader`/
            `SiteFooter` receive `getDictionary(locale)`'s output instead
            of `fa` unconditionally.

            Round 2026-07-13, same day (docs/adr/0006): `AssistantProvider`
            now takes `locale` too — `AssistantDrawer` (mounted below,
            inside the provider) reads it via `useAssistant()` to select
            its own dictionary, so the whole assistant flow is
            locale-aware, not just the homepage body. */}
        <AssistantProvider locale={locale}>
          <SiteHeader dict={dict.header} locale={locale} />
          {children}
          <SiteFooter dict={dict.footer} locale={locale} />
          <FloatingAssistantTrigger />
          <AssistantDrawer />
        </AssistantProvider>
      </body>
    </html>
  );
}
