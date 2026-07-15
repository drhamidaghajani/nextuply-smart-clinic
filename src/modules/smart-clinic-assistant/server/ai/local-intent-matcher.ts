import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/locales";

import type { AssistantStep, ServiceId } from "../../application/types";

export interface LocalMatch {
  step: AssistantStep;
  serviceId: ServiceId | null;
}

/**
 * Deterministic, zero-cost first pass over a free-text message — per the
 * cost-control brief: "First use local keyword/intent matching. Only
 * call OpenAI if local confidence is low." Runs entirely server-side,
 * no network call, no token cost. Keyword lists are intentionally small
 * and literal (not exhaustive NLP) — false negatives just fall through
 * to the AI step (or the "couldn't understand" fallback), which is the
 * safe direction to err in; false positives would misroute a patient,
 * which is worse.
 */
const COST_KEYWORDS: Record<Locale, string[]> = {
  fa: ["هزینه", "قیمت", "تعرفه", "چقدر می‌شود", "چند میشه"],
  en: ["cost", "price", "pricing", "how much", "fee", "fees"],
  ar: ["تكلفة", "سعر", "كم يكلف", "رسوم"],
};

const BEFORE_AFTER_KEYWORDS: Record<Locale, string[]> = {
  fa: ["قبل و بعد", "نمونه کار", "نمونه‌کار", "نمونه کارها"],
  en: ["before and after", "before & after", "before/after", "results", "portfolio", "gallery"],
  ar: ["قبل وبعد", "قبل و بعد", "نتائج", "أعمال سابقة", "معرض"],
};

const CONSULTATION_KEYWORDS: Record<Locale, string[]> = {
  fa: ["مشاوره", "رزرو", "نوبت بگیرم", "وقت بگیرم"],
  en: ["consultation", "book", "appointment", "schedule", "booking"],
  ar: ["استشارة", "حجز", "موعد"],
};

const ARTICLES_KEYWORDS: Record<Locale, string[]> = {
  fa: ["مقاله", "دانشنامه", "بخوانم درباره"],
  en: ["article", "blog", "read about", "learn about"],
  ar: ["مقال", "مقالة", "اقرأ عن"],
};

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/**
 * Returns a confident local match, or `null` if nothing matched clearly
 * enough — callers treat `null` as "low confidence, try AI next."
 */
export function matchLocally(message: string, locale: Locale): LocalMatch | null {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return null;

  // Service name match first — most specific, routes straight past the
  // service_selection menu into that service's own triage questions.
  const dict = getDictionary(locale);
  const serviceMatch = dict.assistantFlow.services.find((service) => normalized.includes(service.label.toLowerCase()));
  if (serviceMatch) {
    return { step: serviceMatch.id === "general_consultation" ? "contact_capture" : "triage", serviceId: serviceMatch.id as ServiceId };
  }

  if (includesAny(normalized, CONSULTATION_KEYWORDS[locale])) {
    return { step: "consultation_booking", serviceId: null };
  }
  if (includesAny(normalized, COST_KEYWORDS[locale])) {
    return { step: "cost_question", serviceId: null };
  }
  if (includesAny(normalized, BEFORE_AFTER_KEYWORDS[locale])) {
    return { step: "before_after", serviceId: null };
  }
  if (includesAny(normalized, ARTICLES_KEYWORDS[locale])) {
    return { step: "articles", serviceId: null };
  }

  return null;
}
