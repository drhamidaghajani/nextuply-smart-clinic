import type { Metadata, Viewport } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/site-chrome";
import { SITE_URL } from "@/core/site-config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  LOCALE_DIRECTION,
  SUPPORTED_LOCALES,
  isSupportedLocale,
} from "@/i18n/locales";
import { AssistantProvider } from "@/modules/smart-clinic-assistant";
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
  // Canonical production origin for relative URL-valued metadata in this
  // route tree. Deliberately no layout-level canonical: a canonical here
  // would be inherited by child pages and incorrectly point them all at
  // the same URL. Route-level canonicals remain the page's responsibility.
  metadataBase: new URL(SITE_URL),
  title: "دکتر علیرضا صدیقی | جراحی زیبایی و فک و صورت",
  description:
    "کلینیک دکتر علیرضا صدیقی — متخصص جراحی فک و صورت و زیبایی، تهران و تبریز.",
  // Round 2026-09-08 (minimal PWA support, per Hamid): `manifest` here is
  // Next's own metadata field — it renders the `<link rel="manifest">`
  // tag itself, no manual `<head>` edit needed. `appleWebApp` is the
  // iOS-specific equivalent of `display: "standalone"` (Safari doesn't
  // read the web manifest's `display` field for "Add to Home Screen";
  // it needs these meta tags instead) — `capable: true` + `default`
  // status bar is the safe, un-opinionated choice (a `black`/`black-
  // translucent` bar can visually clash with content on some pages this
  // project doesn't control, e.g. the assistant drawer).
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dr. Sadighi",
  },
};

/**
 * Round 2026-09-08 (minimal PWA support) — `themeColor` moved out of
 * `metadata` into this separate `viewport` export: Next.js 14+ requires
 * it here, a `metadata.themeColor` is silently ignored (a real, easy-to-
 * miss framework change, not a stylistic choice). Same deep-navy token
 * used site-wide (`--color-deep-navy`, `#0f172a`) — matches the manifest's
 * own `theme_color` and the maskable icon's backdrop, so the browser
 * chrome/OS task-switcher color is consistent with every other navy
 * surface on the site, not a new color introduced for this.
 */
export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
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
            locale-aware, not just the homepage body.

            Round 2026-07-24 (Internal Operations Lite, Part A — crash fix):
            `SiteHeader`/`SiteFooter`/`FloatingAssistantTrigger`/
            `AssistantDrawer` moved into `SiteChrome`, which renders NONE of
            them on `/{locale}/internal/*` — see that component's own
            doc-comment for why. `AssistantProvider` itself still wraps
            everything (cheap — just a context provider, no DOM), so
            nothing on the public side changes. */}
        <AssistantProvider locale={locale}>
          <SiteChrome headerDict={dict.header} footerDict={dict.footer} locale={locale}>
            {children}
          </SiteChrome>
        </AssistantProvider>
      </body>
    </html>
  );
}
