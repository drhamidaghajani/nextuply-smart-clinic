import { SITE_URL } from "./site-config";
import type { Locale } from "@/i18n/locales";

export type AnalyticsPlacement = "assistant" | "header" | "homepage" | "floating";
export type ContactAnalyticsPlacement = "contact_page" | "site_footer" | "patient_stories";

export interface AnalyticsEventMap {
  assistant_open: { locale: Locale; placement: AnalyticsPlacement };
  consultation_started: { locale: Locale; placement: AnalyticsPlacement };
  booking_started: { locale: Locale; placement: AnalyticsPlacement };
  booking_submitted: { locale: Locale; placement: AnalyticsPlacement };
  phone_click: { locale: Locale; placement: Exclude<ContactAnalyticsPlacement, "patient_stories"> };
  instagram_click: { locale: Locale; placement: ContactAnalyticsPlacement };
  before_after_interaction: { locale: Locale; placement: "before_after_gallery"; interaction_type: "slider" };
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const INTERNAL_OR_NON_PAGE_PATH = /^\/(?:[a-z]{2}\/)?(?:internal|api)(?:\/|$)/;
const LOCALES = new Set<Locale>(["fa", "en", "ar"]);
const ASSISTANT_PLACEMENTS = new Set<AnalyticsPlacement>(["assistant", "header", "homepage", "floating"]);
const PHONE_PLACEMENTS = new Set<AnalyticsEventMap["phone_click"]["placement"]>(["contact_page", "site_footer"]);
const INSTAGRAM_PLACEMENTS = new Set<ContactAnalyticsPlacement>(["contact_page", "site_footer", "patient_stories"]);

export function isPublicAnalyticsPath(pathname: string): boolean {
  return !INTERNAL_OR_NON_PAGE_PATH.test(pathname.split(/[?#]/, 1)[0] || "/");
}

export function analyticsPageContext(pathname: string): { page_path: string; page_location: string } {
  const pagePath = pathname.split(/[?#]/, 1)[0] || "/";
  return { page_path: pagePath, page_location: `${SITE_URL}${pagePath}` };
}

function safeEventParams<EventName extends keyof AnalyticsEventMap>(eventName: EventName, params: AnalyticsEventMap[EventName]): Record<string, string> | null {
  if (!LOCALES.has(params.locale)) return null;

  switch (eventName) {
    case "assistant_open":
    case "consultation_started":
    case "booking_started":
    case "booking_submitted":
      return ASSISTANT_PLACEMENTS.has(params.placement as AnalyticsPlacement) ? { locale: params.locale, placement: params.placement } : null;
    case "phone_click":
      return PHONE_PLACEMENTS.has(params.placement as AnalyticsEventMap["phone_click"]["placement"])
        ? { locale: params.locale, placement: params.placement }
        : null;
    case "instagram_click":
      return INSTAGRAM_PLACEMENTS.has(params.placement as ContactAnalyticsPlacement) ? { locale: params.locale, placement: params.placement } : null;
    case "before_after_interaction":
      return params.placement === "before_after_gallery" && params.interaction_type === "slider"
        ? { locale: params.locale, placement: params.placement, interaction_type: params.interaction_type }
        : null;
  }
}

/**
 * The only public GA4 event entry point. Event-specific types intentionally
 * reject arbitrary parameters so patient/medical values cannot be added at
 * call sites accidentally. The current canonical path is supplied explicitly
 * without query/hash data, overriding GA's normal full-URL event context.
 */
export function trackEvent<EventName extends keyof AnalyticsEventMap>(eventName: EventName, params: AnalyticsEventMap[EventName]): void {
  if (process.env.NODE_ENV !== "production" || !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;

  const pathname = window.location.pathname || "/";
  if (!isPublicAnalyticsPath(pathname)) return;
  const safeParams = safeEventParams(eventName, params);
  if (!safeParams) return;

  window.gtag("event", eventName, {
    ...safeParams,
    ...analyticsPageContext(pathname),
  });
}
