import type { Metadata } from "next";
import { Inter, Vazirmatn } from "next/font/google";
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

// TODO(assets): body text should use IranSans, not Vazirmatn — pending font
// files from Hamid (CONTENT_INVENTORY.md §9, target path public/fonts/iransans/).
// Once they land, wire via next/font/local here and swap `font-persian` on
// <body> below to a body-specific token so headings keep Vazirmatn.

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
      <body className={`${vazirmatn.variable} ${inter.variable} font-persian antialiased`}>
        {children}
      </body>
    </html>
  );
}
