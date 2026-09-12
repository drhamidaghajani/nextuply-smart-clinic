"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { analyticsPageContext, isPublicAnalyticsPath } from "@/core/analytics";
import { localeHref, pathWithoutLocalePrefix } from "@/i18n/locale-href";
import type { Locale } from "@/i18n/locales";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const isEnabled = process.env.NODE_ENV === "production" && Boolean(measurementId && /^G-[A-Z0-9]+$/.test(measurementId));

function canonicalPath(pathname: string, locale: Locale): string {
  return localeHref(locale, pathWithoutLocalePrefix(pathname));
}

/** Production-only Google tag mounted by the public site shell. */
export function GoogleAnalytics({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [bootstrapReady, setBootstrapReady] = useState(false);
  const configuredRef = useRef(false);
  const lastPageViewRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isEnabled || !measurementId || !bootstrapReady || configuredRef.current || !window.gtag || !isPublicAnalyticsPath(pathname)) return;

    const pageContext = analyticsPageContext(canonicalPath(pathname, locale));
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ...pageContext,
    });
    configuredRef.current = true;
  }, [bootstrapReady, locale, pathname]);

  useEffect(() => {
    if (!isEnabled || !bootstrapReady || !configuredRef.current || !window.gtag || !isPublicAnalyticsPath(pathname)) return;

    const pagePath = canonicalPath(pathname, locale);
    if (lastPageViewRef.current === pagePath) return;

    window.gtag("event", "page_view", analyticsPageContext(pagePath));
    lastPageViewRef.current = pagePath;
  }, [bootstrapReady, locale, pathname]);

  if (!isEnabled || !measurementId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="afterInteractive" />
      <Script id="ga4-bootstrap" strategy="afterInteractive" onReady={() => setBootstrapReady(true)}>
        {"window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};"}
      </Script>
    </>
  );
}

