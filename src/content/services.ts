import type { Locale } from "@/i18n/locales";

/**
 * SINGLE SOURCE OF TRUTH for the clinic's 6-specialty service taxonomy —
 * per Hamid's 2026-07-13 correction brief ("The real service taxonomy is
 * NOT the previous 8-procedure list. The correct services are exactly
 * the 6 specialties currently shown in the homepage 'حوزه‌های تخصصی
 * دکتر صدیقی / Specialized Services' section").
 *
 * Every surface that lists services — the homepage's Specialized
 * Services cards, the Case Gallery masonry, `/services` index +
 * `/services/[slug]` detail pages, the footer's services column, and the
 * Smart Clinic Assistant's service-selection options — reads `id`/`slug`
 * from here. `id` doubles as the Assistant's `ServiceId` (see
 * `application/types.ts`'s `SERVICE_IDS`, which is generated from this
 * file's ids) and as the `/services/[slug]` route slug — one taxonomy,
 * not a second id scheme that can drift out of sync.
 *
 * `iconKey`/`galleryCategory` stay deliberately distinct from `id`: the
 * real icon PNGs (`public/icons/services/*.png`) and real gallery photos
 * (`gallery-photos.ts`'s `REAL_PHOTOS`) were named under the OLD id
 * scheme (`dental-implant`, `jaw-surgery`, etc.) before this correction —
 * renaming those files was out of scope for a taxonomy/linking fix, so
 * this mapping is the seam between the new canonical ids and the
 * pre-existing asset filenames.
 */
export const SERVICE_TAXONOMY_IDS = [
  "advanced-dental-implant",
  "impacted-tooth-surgery",
  "facial-rejuvenation",
  "facial-cosmetic-surgery",
  "orthognathic-surgery",
  "rhinoplasty",
] as const;

export type ServiceTaxonomyId = (typeof SERVICE_TAXONOMY_IDS)[number];

export interface ServiceTaxonomyItem {
  id: ServiceTaxonomyId;
  slug: ServiceTaxonomyId;
  /** `public/icons/services/<iconKey>.png` — pre-existing asset filename, not renamed. */
  iconKey: string;
  /** Key into `gallery-photos.ts`'s `REAL_PHOTOS`/`PHOTO_POSITION` — pre-existing asset filename convention, not renamed. */
  galleryCategory: string;
  /** Small uppercase Latin caption shown under the title regardless of locale (matches the previous per-locale `titleEn` convention, now unified to one value). */
  englishLabel: string;
  title: Record<Locale, string>;
  subtitle: Record<Locale, string>;
  shortDescription: Record<Locale, string>;
  homepageDescription: Record<Locale, string>;
  footerLabel: Record<Locale, string>;
  assistantLabel: Record<Locale, string>;
}

export const SERVICES: readonly ServiceTaxonomyItem[] = [
  {
    id: "advanced-dental-implant",
    slug: "advanced-dental-implant",
    iconKey: "dental-implant",
    galleryCategory: "dental-implant",
    englishLabel: "ADVANCED DENTAL IMPLANT",
    title: { fa: "ایمپلنت دندانی پیشرفته", en: "Advanced Dental Implant", ar: "زراعة الأسنان المتقدمة" },
    subtitle: {
      fa: "جایگزینی دندان از دست‌رفته با تمرکز بر استخوان و پایداری طولانی‌مدت",
      en: "Replacing lost teeth with a focus on bone integration and long-term stability.",
      ar: "استعادة الأسنان المفقودة بتركيز على كثافة العظم والثبات طويل الأمد.",
    },
    shortDescription: {
      fa: "جایگزینی دندان از دست‌رفته با تمرکز بر استخوان و پایداری طولانی‌مدت",
      en: "Replacing lost teeth with a focus on bone integration and long-term stability.",
      ar: "استعادة الأسنان المفقودة بتركيز على كثافة العظم والثبات طويل الأمد.",
    },
    homepageDescription: {
      fa: "جایگزینی دندان از دست‌رفته با تمرکز بر استخوان و پایداری طولانی‌مدت",
      en: "Replacing lost teeth with a focus on bone integration and long-term stability.",
      ar: "استعادة الأسنان المفقودة بتركيز على كثافة العظم والثبات طويل الأمد.",
    },
    footerLabel: { fa: "ایمپلنت دندانی پیشرفته", en: "Advanced Dental Implant", ar: "زراعة الأسنان المتقدمة" },
    assistantLabel: { fa: "ایمپلنت دندانی پیشرفته", en: "Advanced Dental Implant", ar: "زراعة الأسنان المتقدمة" },
  },
  {
    id: "impacted-tooth-surgery",
    slug: "impacted-tooth-surgery",
    iconKey: "impacted-tooth",
    galleryCategory: "impacted-tooth",
    englishLabel: "IMPACTED TOOTH SURGERY",
    title: { fa: "جراحی دندان نهفته", en: "Impacted Tooth Surgery", ar: "جراحة الأسنان المطمورة" },
    subtitle: {
      fa: "خارج‌سازی دندان نهفته با حداقل آسیب به استخوان و بافت‌های اطراف",
      en: "Removing impacted teeth with minimal trauma to surrounding bone and tissue.",
      ar: "استخراج الأسنان المطمورة بأقل ضرر ممكن للعظم والأنسجة المحيطة.",
    },
    shortDescription: {
      fa: "خارج‌سازی دندان نهفته با حداقل آسیب به استخوان و بافت‌های اطراف",
      en: "Removing impacted teeth with minimal trauma to surrounding bone and tissue.",
      ar: "استخراج الأسنان المطمورة بأقل ضرر ممكن للعظم والأنسجة المحيطة.",
    },
    homepageDescription: {
      fa: "خارج‌سازی دندان نهفته با حداقل آسیب به استخوان و بافت‌های اطراف",
      en: "Removing impacted teeth with minimal trauma to surrounding bone and tissue.",
      ar: "استخراج الأسنان المطمورة بأقل ضرر ممكن للعظم والأنسجة المحيطة.",
    },
    footerLabel: { fa: "جراحی دندان نهفته", en: "Impacted Tooth Surgery", ar: "جراحة الأسنان المطمورة" },
    assistantLabel: { fa: "جراحی دندان نهفته", en: "Impacted Tooth Surgery", ar: "جراحة الأسنان المطمورة" },
  },
  {
    id: "facial-rejuvenation",
    slug: "facial-rejuvenation",
    iconKey: "facial-rejuvenation",
    galleryCategory: "facial-rejuvenation",
    englishLabel: "FACIAL REJUVENATION",
    title: { fa: "جوان‌سازی صورت", en: "Facial Rejuvenation", ar: "تجديد شباب الوجه" },
    subtitle: {
      fa: "ترکیب تکنیک‌های جراحی و غیرجراحی برای جوان‌سازی بدون اغراق در چهره",
      en: "Surgical and non-surgical techniques combined for natural, understated renewal.",
      ar: "مزيج من تقنيات جراحية وغير جراحية لتجديد طبيعي دون مبالغة.",
    },
    shortDescription: {
      fa: "ترکیب تکنیک‌های جراحی و غیرجراحی برای جوان‌سازی بدون اغراق در چهره",
      en: "Surgical and non-surgical techniques combined for natural, understated renewal.",
      ar: "مزيج من تقنيات جراحية وغير جراحية لتجديد طبيعي دون مبالغة.",
    },
    homepageDescription: {
      fa: "ترکیب تکنیک‌های جراحی و غیرجراحی برای جوان‌سازی بدون اغراق در چهره",
      en: "Surgical and non-surgical techniques combined for natural, understated renewal.",
      ar: "مزيج من تقنيات جراحية وغير جراحية لتجديد طبيعي دون مبالغة.",
    },
    footerLabel: { fa: "جوان‌سازی صورت", en: "Facial Rejuvenation", ar: "تجديد شباب الوجه" },
    assistantLabel: { fa: "جوان‌سازی صورت", en: "Facial Rejuvenation", ar: "تجديد شباب الوجه" },
  },
  {
    id: "facial-cosmetic-surgery",
    slug: "facial-cosmetic-surgery",
    iconKey: "facial-cosmetic",
    galleryCategory: "facial-cosmetic",
    englishLabel: "FACIAL COSMETIC SURGERY",
    title: { fa: "جراحی‌های زیبایی صورت", en: "Facial Cosmetic Surgery", ar: "جراحات تجميل الوجه" },
    subtitle: {
      fa: "اصلاح هدفمند اجزای صورت با حفظ هویت فردی و تناسب کلی چهره",
      en: "Precise refinement of facial features that preserves your identity and overall harmony.",
      ar: "تصحيح دقيق لملامح الوجه مع الحفاظ على الهوية الفردية وتناسق الوجه.",
    },
    shortDescription: {
      fa: "اصلاح هدفمند اجزای صورت با حفظ هویت فردی و تناسب کلی چهره",
      en: "Precise refinement of facial features that preserves your identity and overall harmony.",
      ar: "تصحيح دقيق لملامح الوجه مع الحفاظ على الهوية الفردية وتناسق الوجه.",
    },
    homepageDescription: {
      fa: "اصلاح هدفمند اجزای صورت با حفظ هویت فردی و تناسب کلی چهره",
      en: "Precise refinement of facial features that preserves your identity and overall harmony.",
      ar: "تصحيح دقيق لملامح الوجه مع الحفاظ على الهوية الفردية وتناسق الوجه.",
    },
    footerLabel: { fa: "جراحی‌های زیبایی صورت", en: "Facial Cosmetic Surgery", ar: "جراحات تجميل الوجه" },
    assistantLabel: { fa: "جراحی‌های زیبایی صورت", en: "Facial Cosmetic Surgery", ar: "جراحات تجميل الوجه" },
  },
  {
    id: "orthognathic-surgery",
    slug: "orthognathic-surgery",
    iconKey: "jaw-surgery",
    galleryCategory: "jaw-surgery",
    englishLabel: "ORTHOGNATHIC SURGERY",
    title: { fa: "جراحی فک و چانه", en: "Orthognathic Surgery", ar: "جراحة الفك والذقن" },
    subtitle: {
      fa: "اصلاح ناهنجاری‌های فک و جلو یا عقب‌بودن چانه برای بهبود نیمرخ و عملکرد",
      en: "Correcting jaw irregularities and chin position to improve profile and function.",
      ar: "تصحيح تشوهات الفك وتقدم أو تراجع الذقن لتحسين الملامح الجانبية والوظيفة.",
    },
    shortDescription: {
      fa: "اصلاح ناهنجاری‌های فک و جلو یا عقب‌بودن چانه برای بهبود نیمرخ و عملکرد",
      en: "Correcting jaw irregularities and chin position to improve profile and function.",
      ar: "تصحيح تشوهات الفك وتقدم أو تراجع الذقن لتحسين الملامح الجانبية والوظيفة.",
    },
    homepageDescription: {
      fa: "اصلاح ناهنجاری‌های فک و جلو یا عقب‌بودن چانه برای بهبود نیمرخ و عملکرد",
      en: "Correcting jaw irregularities and chin position to improve profile and function.",
      ar: "تصحيح تشوهات الفك وتقدم أو تراجع الذقن لتحسين الملامح الجانبية والوظيفة.",
    },
    footerLabel: { fa: "جراحی فک و چانه", en: "Orthognathic Surgery", ar: "جراحة الفك والذقن" },
    assistantLabel: { fa: "جراحی فک و چانه", en: "Orthognathic Surgery", ar: "جراحة الفك والذقن" },
  },
  {
    id: "rhinoplasty",
    slug: "rhinoplasty",
    iconKey: "rhinoplasty",
    galleryCategory: "rhinoplasty",
    englishLabel: "RHINOPLASTY",
    title: { fa: "جراحی زیبایی بینی", en: "Rhinoplasty", ar: "تجميل الأنف" },
    subtitle: {
      fa: "طراحی بینی با اولویت تنفس سالم، تناسب با صورت و ماندگاری نتیجه",
      en: "Nasal design that prioritizes healthy breathing, facial harmony, and a lasting result.",
      ar: "تصميم للأنف يراعي التنفس السليم وتناسق الوجه وثبات النتيجة.",
    },
    shortDescription: {
      fa: "طراحی بینی با اولویت تنفس سالم، تناسب با صورت و ماندگاری نتیجه",
      en: "Nasal design that prioritizes healthy breathing, facial harmony, and a lasting result.",
      ar: "تصميم للأنف يراعي التنفس السليم وتناسق الوجه وثبات النتيجة.",
    },
    homepageDescription: {
      fa: "طراحی بینی با اولویت تنفس سالم، تناسب با صورت و ماندگاری نتیجه",
      en: "Nasal design that prioritizes healthy breathing, facial harmony, and a lasting result.",
      ar: "تصميم للأنف يراعي التنفس السليم وتناسق الوجه وثبات النتيجة.",
    },
    footerLabel: { fa: "جراحی زیبایی بینی", en: "Rhinoplasty", ar: "تجميل الأنف" },
    assistantLabel: { fa: "جراحی زیبایی بینی", en: "Rhinoplasty", ar: "تجميل الأنف" },
  },
] as const;

export function getServiceHref(locale: Locale, slug: string): string {
  return `/${locale}/services/${slug}`;
}

export function getServiceById(id: string): ServiceTaxonomyItem | undefined {
  return SERVICES.find((service) => service.id === id);
}

/** `/[locale]/before-after?category=<galleryCategory>` — see that page's `searchParams` handling. */
export function getBeforeAfterHref(locale: Locale, galleryCategory: string | null): string {
  return galleryCategory ? `/${locale}/before-after?category=${galleryCategory}` : `/${locale}/before-after`;
}
