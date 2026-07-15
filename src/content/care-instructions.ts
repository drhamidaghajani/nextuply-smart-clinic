import type { Locale } from "@/i18n/locales";
import type { ServiceTaxonomyId } from "./services";

/**
 * SINGLE SOURCE OF TRUTH for the clinic's 9 pre/post-procedure care
 * topics — per Hamid's 2026-07-13 "مراقبت‌های قبل و بعد عمل" brief.
 * Every surface that lists or links a care topic (the `/care-instructions`
 * hub, its `/[slug]` detail pages, service detail pages' "related care"
 * section, the footer, and the Smart Clinic Assistant's quick action)
 * reads from here — same pattern as `content/services.ts`.
 *
 * Round 2026-07-13, same day (real photography delivered): all 9 real
 * images now live in `public/media/care-instructions/` and are wired via
 * `imagePath` below — verified individually (filename against actual
 * thumbnail content, not assumed) before wiring. `iconKey` stays as a
 * fallback for `ServiceVisualPanel` on the off chance `imagePath` is ever
 * unset for a topic again (matches the same real-photo-or-abstract-
 * fallback pattern `content/services.ts` already established).
 */
export const CARE_TOPIC_IDS = [
  "implant-care",
  "rhinoplasty-care",
  "blepharoplasty-care",
  "wisdom-tooth-care",
  "facelift-browlift-care",
  "jaw-surgery-care",
  "jaw-physiotherapy",
  "sinus-lift-care",
  "genioplasty-care",
] as const;

export type CareTopicId = (typeof CARE_TOPIC_IDS)[number];

export interface CareTopicItem {
  id: CareTopicId;
  slug: CareTopicId;
  title: Record<Locale, string>;
  shortDescription: Record<Locale, string>;
  /** Which of the 6 canonical services this care topic follows on from — see `content/services.ts`. */
  relatedServiceIds: readonly ServiceTaxonomyId[];
  /** Real photo, supplied 2026-07-13 — `/media/care-instructions/<slug>.png` (or `<slug>-care.png` for `jaw-physiotherapy`, see below). Every topic has one now. */
  imagePath?: string;
  /** Closest existing `/icons/services/<iconKey>.png` — kept as a fallback for `ServiceVisualPanel` if `imagePath` is ever unset again. */
  iconKey: string;
}

export const CARE_TOPICS: readonly CareTopicItem[] = [
  {
    id: "implant-care",
    slug: "implant-care",
    title: { fa: "مراقبت‌های جراحی ایمپلنت", en: "Dental Implant Surgery Care", ar: "تعليمات العناية بعد جراحة زراعة الأسنان" },
    shortDescription: {
      fa: "راهنمای مراقبت عمومی پیش و پس از کاشت ایمپلنت دندانی.",
      en: "General care guidance before and after dental implant placement.",
      ar: "إرشادات عامة للعناية قبل وبعد زراعة الأسنان.",
    },
    relatedServiceIds: ["advanced-dental-implant"],
    iconKey: "dental-implant",
    imagePath: "/media/care-instructions/implant-care.png",
  },
  {
    id: "rhinoplasty-care",
    slug: "rhinoplasty-care",
    title: { fa: "مراقبت‌های عمل رینوپلاستی", en: "Rhinoplasty Care", ar: "تعليمات العناية بعد تجميل الأنف" },
    shortDescription: {
      fa: "راهنمای مراقبت عمومی پیش و پس از جراحی زیبایی بینی.",
      en: "General care guidance before and after rhinoplasty.",
      ar: "إرشادات عامة للعناية قبل وبعد جراحة تجميل الأنف.",
    },
    relatedServiceIds: ["rhinoplasty"],
    iconKey: "rhinoplasty",
    imagePath: "/media/care-instructions/rhinoplasty-care.png",
  },
  {
    id: "blepharoplasty-care",
    slug: "blepharoplasty-care",
    title: { fa: "مراقبت جراحی بلفاروپلاستی", en: "Blepharoplasty Care", ar: "تعليمات العناية بعد رأب الجفن" },
    shortDescription: {
      fa: "راهنمای مراقبت عمومی پیش و پس از جراحی زیبایی پلک.",
      en: "General care guidance before and after eyelid surgery.",
      ar: "إرشادات عامة للعناية قبل وبعد جراحة تجميل الجفون.",
    },
    relatedServiceIds: ["facial-cosmetic-surgery"],
    iconKey: "facial-cosmetic",
    imagePath: "/media/care-instructions/blepharoplasty-care.png",
  },
  {
    id: "wisdom-tooth-care",
    slug: "wisdom-tooth-care",
    title: { fa: "مراقبت‌های بعد از جراحی دندان عقل", en: "Wisdom Tooth Surgery Care", ar: "تعليمات العناية بعد جراحة ضرس العقل" },
    shortDescription: {
      fa: "راهنمای مراقبت عمومی پس از جراحی دندان عقل.",
      en: "General care guidance after wisdom tooth surgery.",
      ar: "إرشادات عامة للعناية بعد جراحة ضرس العقل.",
    },
    relatedServiceIds: ["impacted-tooth-surgery"],
    iconKey: "impacted-tooth",
    imagePath: "/media/care-instructions/wisdom-tooth-care.png",
  },
  {
    id: "facelift-browlift-care",
    slug: "facelift-browlift-care",
    title: { fa: "مراقبت‌های عمل لیفت صورت و ابرو", en: "Facelift & Brow Lift Care", ar: "تعليمات العناية بعد شد الوجه والحاجب" },
    shortDescription: {
      fa: "راهنمای مراقبت عمومی پیش و پس از لیفت صورت و ابرو.",
      en: "General care guidance before and after facelift and brow lift.",
      ar: "إرشادات عامة للعناية قبل وبعد شد الوجه والحاجب.",
    },
    relatedServiceIds: ["facial-rejuvenation", "facial-cosmetic-surgery"],
    iconKey: "facial-rejuvenation",
    imagePath: "/media/care-instructions/facelift-browlift-care.png",
  },
  {
    id: "jaw-surgery-care",
    slug: "jaw-surgery-care",
    title: { fa: "مراقبت جراحی فک", en: "Jaw Surgery Care", ar: "تعليمات العناية بعد جراحة الفك" },
    shortDescription: {
      fa: "راهنمای مراقبت عمومی پیش و پس از جراحی فک.",
      en: "General care guidance before and after jaw surgery.",
      ar: "إرشادات عامة للعناية قبل وبعد جراحة الفك.",
    },
    relatedServiceIds: ["orthognathic-surgery"],
    iconKey: "jaw-surgery",
    imagePath: "/media/care-instructions/jaw-surgery-care.png",
  },
  {
    id: "jaw-physiotherapy",
    slug: "jaw-physiotherapy",
    title: { fa: "فیزیوتراپی فک", en: "Jaw Physiotherapy", ar: "العلاج الطبيعي للفك" },
    shortDescription: {
      fa: "راهنمای عمومی فیزیوتراپی فک در دوره پس از جراحی.",
      en: "General guidance on jaw physiotherapy during recovery.",
      ar: "إرشادات عامة حول العلاج الطبيعي للفك خلال فترة التعافي.",
    },
    relatedServiceIds: ["orthognathic-surgery"],
    iconKey: "jaw-surgery",
    // Filename carries "-care" even though this topic's id/slug don't —
    // matches the exact filename Hamid supplied, not renamed to fit.
    imagePath: "/media/care-instructions/jaw-physiotherapy-care.png",
  },
  {
    id: "sinus-lift-care",
    slug: "sinus-lift-care",
    title: { fa: "مراقبت‌های جراحی سینوس لیفت", en: "Sinus Lift Surgery Care", ar: "تعليمات العناية بعد جراحة رفع الجيب الفكي" },
    shortDescription: {
      fa: "راهنمای مراقبت عمومی پیش و پس از جراحی سینوس لیفت.",
      en: "General care guidance before and after sinus lift surgery.",
      ar: "إرشادات عامة للعناية قبل وبعد جراحة رفع الجيب الفكي.",
    },
    relatedServiceIds: ["advanced-dental-implant"],
    iconKey: "dental-implant",
    imagePath: "/media/care-instructions/sinus-lift-care.png",
  },
  {
    id: "genioplasty-care",
    slug: "genioplasty-care",
    title: { fa: "مراقبت‌های بعد جراحی چانه / جنیوپلاستی", en: "Genioplasty Care", ar: "تعليمات العناية بعد جراحة الذقن" },
    shortDescription: {
      fa: "راهنمای مراقبت عمومی پیش و پس از جراحی چانه.",
      en: "General care guidance before and after chin surgery.",
      ar: "إرشادات عامة للعناية قبل وبعد جراحة الذقن.",
    },
    relatedServiceIds: ["orthognathic-surgery"],
    iconKey: "jaw-surgery",
    imagePath: "/media/care-instructions/genioplasty-care.png",
  },
] as const;

export function getCareInstructionHref(locale: Locale, slug: string): string {
  return `/${locale}/care-instructions/${slug}`;
}

export function getCareTopicBySlug(slug: string): CareTopicItem | undefined {
  return CARE_TOPICS.find((topic) => topic.slug === slug);
}

/** Care topics relevant to a given service — used by service detail pages' "related care" section. */
export function getCareTopicsForService(serviceId: string): readonly CareTopicItem[] {
  return CARE_TOPICS.filter((topic) => topic.relatedServiceIds.includes(serviceId as ServiceTaxonomyId));
}
