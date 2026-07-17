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
 *
 * Round 2026-07-18 (conversation-first UX pass, per Hamid — "هزینه
 * ایمپلنت چنده" was getting a generic, service-blind cost answer): the
 * old service match only checked the message against each service's FULL
 * formal label ("ایمپلنت دندان پیشرفته"), which a short, natural mention
 * ("ایمپلنت") never contains — so a cost question naming a service in
 * passing always lost that context. `SHORT_SERVICE_KEYWORDS` below adds
 * short, natural keywords per service, checked ALONGSIDE intent keywords
 * (not instead of them), so a message can now match BOTH a service and
 * an intent (e.g. "cost" + "implant") and return both — see
 * `ask-assistant-question.ts` for how that combination becomes a
 * service-tailored answer instead of a generic one.
 */
const COST_KEYWORDS: Record<Locale, string[]> = {
  fa: ["هزینه", "قیمت", "تعرفه", "چقدر می‌شود", "چند میشه", "چند جلسه", "چقدر طول می‌کشد", "چقدر طول میکشه"],
  en: ["cost", "price", "pricing", "how much", "fee", "fees", "how many sessions"],
  ar: ["تكلفة", "سعر", "كم يكلف", "رسوم", "كم جلسة"],
};

const BEFORE_AFTER_KEYWORDS: Record<Locale, string[]> = {
  fa: ["قبل و بعد", "نمونه کار", "نمونه‌کار", "نمونه کارها"],
  en: ["before and after", "before & after", "before/after", "results", "portfolio", "gallery"],
  ar: ["قبل وبعد", "قبل و بعد", "نتائج", "أعمال سابقة", "معرض"],
};

const CONSULTATION_KEYWORDS: Record<Locale, string[]> = {
  fa: ["مشاوره", "رزرو", "نوبت بگیرم", "وقت بگیرم", "می‌خواهم وقت بگیرم", "میخوام وقت بگیرم", "رزرو کنم"],
  en: ["consultation", "book", "appointment", "schedule", "booking", "want to book"],
  ar: ["استشارة", "حجز", "موعد", "أريد حجز"],
};

const ARTICLES_KEYWORDS: Record<Locale, string[]> = {
  fa: ["مقاله", "دانشنامه", "بخوانم درباره"],
  en: ["article", "blog", "read about", "learn about"],
  ar: ["مقال", "مقالة", "اقرأ عن"],
};

/** Pain/recovery/preparation questions ("چند روز درد دارد", "دوران نقاهت چطوره", "عکس لازم دارم؟") route to the real care-instructions content — never answered with invented medical specifics. */
const CARE_RECOVERY_KEYWORDS: Record<Locale, string[]> = {
  fa: ["درد", "دوران نقاهت", "ریکاوری", "بهبودی", "مراقبت", "چند روز", "عکس دارم", "عکس ندارم", "سی بی سی تی", "cbct"],
  en: ["pain", "recovery", "healing", "aftercare", "how many days", "do i need an x-ray", "cbct"],
  ar: ["ألم", "التعافي", "فترة النقاهة", "العناية", "كم يوم", "صورة أشعة", "cbct"],
};

/** "نمی‌دانم چه خدمتی مناسب است" / "کدام خدمت مناسب من است" — genuinely undecided, route to the service picker itself rather than guessing. */
const UNSURE_SERVICE_KEYWORDS: Record<Locale, string[]> = {
  fa: ["نمی‌دانم چه خدمتی", "نمیدونم چه خدمتی", "نمیدونم کدوم", "کدام خدمت مناسب", "کدوم خدمت مناسب"],
  en: ["don't know which service", "not sure which service", "which service is right for me"],
  ar: ["لا أعرف أي خدمة", "ما هي الخدمة المناسبة"],
};

/** Short, natural mentions of a service — deliberately distinct from `assistantFlow.services[].label` (the full formal names), which a short mention like "ایمپلنت" never contains. */
const SHORT_SERVICE_KEYWORDS: Record<Locale, Partial<Record<ServiceId, string[]>>> = {
  fa: {
    "advanced-dental-implant": ["ایمپلنت"],
    "impacted-tooth-surgery": ["دندان نهفته", "دندان عقل نهفته"],
    "facial-rejuvenation": ["جوان‌سازی", "جوانسازی", "لیفت صورت", "فیلر", "بوتاکس"],
    "facial-cosmetic-surgery": ["جراحی زیبایی صورت"],
    "orthognathic-surgery": ["جراحی فک", "فک"],
    rhinoplasty: ["بینی", "رینوپلاستی"],
  },
  en: {
    "advanced-dental-implant": ["implant"],
    "impacted-tooth-surgery": ["impacted tooth", "wisdom tooth"],
    "facial-rejuvenation": ["facial rejuvenation", "filler", "botox", "face lift"],
    "facial-cosmetic-surgery": ["facial cosmetic surgery"],
    "orthognathic-surgery": ["jaw surgery", "orthognathic"],
    rhinoplasty: ["nose job", "rhinoplasty", "nose surgery"],
  },
  ar: {
    "advanced-dental-implant": ["زراعة الأسنان", "الزرعات"],
    "impacted-tooth-surgery": ["ضرس مطمور", "سن مطمور"],
    "facial-rejuvenation": ["تجميل الوجه", "شد الوجه", "فيلر", "بوتوكس"],
    "facial-cosmetic-surgery": ["جراحة تجميل الوجه"],
    "orthognathic-surgery": ["جراحة الفك", "الفك"],
    rhinoplasty: ["الأنف", "تجميل الأنف"],
  },
};

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function matchServiceId(normalized: string, locale: Locale): ServiceId | null {
  const shortKeywords = SHORT_SERVICE_KEYWORDS[locale];
  for (const serviceId of Object.keys(shortKeywords) as ServiceId[]) {
    const keywords = shortKeywords[serviceId];
    if (keywords && includesAny(normalized, keywords)) return serviceId;
  }
  const dict = getDictionary(locale);
  const fullLabelMatch = dict.assistantFlow.services.find((service) => normalized.includes(service.label.toLowerCase()));
  return fullLabelMatch ? (fullLabelMatch.id as ServiceId) : null;
}

/**
 * Returns a confident local match, or `null` if nothing matched clearly
 * enough — callers treat `null` as "low confidence, try AI next." When
 * both a service and an intent are present in the same message (e.g.
 * "هزینه ایمپلنت چنده"), both come back together (`step: "cost_question"`,
 * `serviceId: "advanced-dental-implant"`) rather than the service being
 * silently dropped.
 */
export function matchLocally(message: string, locale: Locale): LocalMatch | null {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return null;

  const serviceId = matchServiceId(normalized, locale);

  if (includesAny(normalized, COST_KEYWORDS[locale])) {
    return { step: "cost_question", serviceId };
  }
  if (includesAny(normalized, CARE_RECOVERY_KEYWORDS[locale])) {
    return { step: "care_guidance", serviceId };
  }
  if (includesAny(normalized, UNSURE_SERVICE_KEYWORDS[locale])) {
    return { step: "service_selection", serviceId: null };
  }
  if (includesAny(normalized, CONSULTATION_KEYWORDS[locale])) {
    return serviceId ? { step: "triage", serviceId } : { step: "consultation_booking", serviceId: null };
  }
  if (serviceId) {
    return { step: serviceId === "general_consultation" ? "contact_capture" : "triage", serviceId };
  }
  if (includesAny(normalized, BEFORE_AFTER_KEYWORDS[locale])) {
    return { step: "before_after", serviceId: null };
  }
  if (includesAny(normalized, ARTICLES_KEYWORDS[locale])) {
    return { step: "articles", serviceId: null };
  }

  return null;
}
