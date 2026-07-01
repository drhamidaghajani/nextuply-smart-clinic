import type { Metadata } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import {
  LOCALE_DIRECTION,
  SUPPORTED_LOCALES,
  isSupportedLocale,
} from "@/i18n/locales";
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

  return (
    <html lang={locale} dir={LOCALE_DIRECTION[locale]}>
      <body
        className={`${vazirmatn.variable} ${iransans.variable} ${inter.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
