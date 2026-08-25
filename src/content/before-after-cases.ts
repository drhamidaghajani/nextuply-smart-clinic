import type { ServiceTaxonomyId } from "./services";
import type { Locale } from "@/i18n/locales";

/**
 * SINGLE SOURCE OF TRUTH for the `/before-after` page's real patient
 * cases (2026-08-25 rebuild). Every image path here points at a file
 * Hamid uploaded directly under `public/media/before-after/<category>/`
 * — filenames (including the intentional `befor` spelling) are kept
 * EXACTLY as provided, never renamed.
 *
 * 24 cases total across 4 categories (implant 2, facial-reconstruction
 * 5, rhinoplasty 7, jaw-surgery 10) — one more than the "23" figure
 * quoted in the approval message's own category breakdown
 * (2+5+7+9=23): summing the literal case list gives jaw-surgery 10, not
 * 9 (9 numbered pairs — 020/021/022/023/024/025/027/028/029 — PLUS
 * befor026/after026, which the same approval explicitly says to
 * "include... as valid," not drop). Flagged to Hamid directly rather
 * than silently forcing the count to 9 by excluding 026, or silently
 * reporting "23" when the data actually holds 24 — see the final report
 * for this round.
 *
 * No per-case narrative exists (no patient story, procedure detail, or
 * outcome note was provided) — `description` is therefore a single
 * neutral, category-level paragraph (real service performed at this
 * clinic; results vary by individual anatomy/condition), not a
 * fabricated per-patient account. `privacyLabel` is a generic sequential
 * "Patient N" per category — no real name was ever provided or would be
 * appropriate to invent.
 *
 * Image existence/corruption validation happens in the page itself
 * (`before-after/page.tsx`, a Server Component — safe to use `fs`
 * there), not here: this module is imported by at least one Client
 * Component (the category showcase), so it must stay fs-free and
 * universally importable, matching every other file in `src/content/`.
 */

export type BeforeAfterCategory = "implant" | "facial-reconstruction" | "rhinoplasty" | "jaw-surgery";

export interface BeforeAfterCaseView {
  before: string;
  after: string;
}

export interface BeforeAfterCase {
  id: string;
  category: BeforeAfterCategory;
  serviceSlug: ServiceTaxonomyId;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  views: readonly BeforeAfterCaseView[];
  order: number;
  privacyLabel: Record<Locale, string>;
  /** True for the cases Hamid's brief flagged as needing a quick clinic-side identity/consistency check before this goes live — never a signal that the file itself is broken (it isn't; see the migration report). */
  needsHumanReview?: boolean;
}

export const BEFORE_AFTER_CATEGORIES: readonly BeforeAfterCategory[] = ["implant", "facial-reconstruction", "rhinoplasty", "jaw-surgery"];

export const CATEGORY_LABEL: Record<BeforeAfterCategory, Record<Locale, string>> = {
  implant: { fa: "ایمپلنت", en: "Dental Implant", ar: "زراعة الأسنان" },
  "facial-reconstruction": { fa: "بازسازی نواقص صورت", en: "Facial Reconstruction", ar: "إعادة بناء عيوب الوجه" },
  rhinoplasty: { fa: "جراحی بینی", en: "Rhinoplasty", ar: "تجميل الأنف" },
  "jaw-surgery": { fa: "جراحی فک", en: "Jaw Surgery", ar: "جراحة الفك" },
};

/** Which service detail page each category's cases relate to — drives `getServiceHref` on the case card, and the reverse mapping `SERVICE_SLUG_TO_CATEGORY` below for `ServiceBeforeAfterBand`. */
const CATEGORY_SERVICE_SLUG: Record<BeforeAfterCategory, ServiceTaxonomyId> = {
  implant: "advanced-dental-implant",
  "facial-reconstruction": "facial-reconstruction-surgery",
  rhinoplasty: "rhinoplasty",
  "jaw-surgery": "orthognathic-surgery",
};

/**
 * Reverse of `CATEGORY_SERVICE_SLUG`, for service detail pages to look
 * up their own before/after category — exactly Hamid's 4 required
 * mappings, no more. A service with no entry here (impacted-tooth-
 * surgery, facial-rejuvenation, facial-trauma-surgery,
 * facial-cosmetic-surgery) has no matching case category among the 60
 * real photos, so its `ServiceBeforeAfterBand` link falls back to the
 * general `/before-after` index rather than an invented/mismatched
 * filter — per Hamid's explicit "do not force it" instruction for
 * facial-cosmetic-surgery, applied consistently to every other
 * unmapped service too.
 */
export const SERVICE_SLUG_TO_CATEGORY: Partial<Record<ServiceTaxonomyId, BeforeAfterCategory>> = Object.fromEntries(
  (Object.entries(CATEGORY_SERVICE_SLUG) as [BeforeAfterCategory, ServiceTaxonomyId][]).map(([category, slug]) => [slug, category])
);

const CATEGORY_DESCRIPTION: Record<BeforeAfterCategory, Record<Locale, string>> = {
  implant: {
    fa: "نتیجه واقعی درمان ایمپلنت دندانی در کلینیک دکتر علیرضا صدیقی. نتیجه هر بیمار بر اساس تراکم استخوان، سلامت دهان و طرح درمان اختصاصی او متفاوت است.",
    en: "A real result from dental implant treatment at Dr. Alireza Sadighi's clinic. Individual results vary by bone density, oral health, and treatment plan.",
    ar: "نتيجة حقيقية لعلاج زراعة الأسنان في عيادة الدكتور علیرضا صدیقی. تختلف نتيجة كل مريض حسب كثافة العظم وصحة الفم وخطة العلاج الخاصة به.",
  },
  "facial-reconstruction": {
    fa: "نتیجه واقعی بازسازی نواقص صورت در کلینیک دکتر علیرضا صدیقی. نتیجه هر بیمار بر اساس شدت آسیب اولیه و روند بهبودی متفاوت است.",
    en: "A real result from facial reconstruction treatment at Dr. Alireza Sadighi's clinic. Individual results vary by the extent of the original condition and the healing process.",
    ar: "نتيجة حقيقية لعلاج إعادة بناء عيوب الوجه في عيادة الدكتور علیرضا صدیقی. تختلف نتيجة كل مريض حسب شدة الحالة الأصلية ومسار الشفاء.",
  },
  rhinoplasty: {
    fa: "نتیجه واقعی جراحی بینی در کلینیک دکتر علیرضا صدیقی. نتیجه هر بیمار بر اساس ساختار صورت و جنس پوست متفاوت است.",
    en: "A real result from rhinoplasty performed at Dr. Alireza Sadighi's clinic. Individual results vary by facial structure and skin type.",
    ar: "نتيجة حقيقية لجراحة تجميل الأنف في عيادة الدكتور علیرضا صدیقی. تختلف نتيجة كل مريض حسب بنية الوجه ونوع الجلد.",
  },
  "jaw-surgery": {
    fa: "نتیجه واقعی جراحی فک (ارتوگناتیک) در کلینیک دکتر علیرضا صدیقی. نتیجه هر بیمار بر اساس ساختار اسکلتی و طرح درمان اختصاصی او متفاوت است.",
    en: "A real result from orthognathic (jaw) surgery at Dr. Alireza Sadighi's clinic. Individual results vary by skeletal structure and treatment plan.",
    ar: "نتيجة حقيقية لجراحة الفك (تقويم الفكين) في عيادة الدكتور علیرضا صدیقی. تختلف نتيجة كل مريض حسب البنية الهيكلية وخطة العلاج الخاصة به.",
  },
};

function buildTitle(category: BeforeAfterCategory, displayIndex: number): Record<Locale, string> {
  const label = CATEGORY_LABEL[category];
  return {
    fa: `${label.fa} — مورد ${displayIndex}`,
    en: `${label.en} — Case ${displayIndex}`,
    ar: `${label.ar} — حالة ${displayIndex}`,
  };
}

function buildPrivacyLabel(displayIndex: number): Record<Locale, string> {
  return { fa: `بیمار ${displayIndex}`, en: `Patient ${displayIndex}`, ar: `المريض ${displayIndex}` };
}

function view(category: BeforeAfterCategory, fileNumber: string): BeforeAfterCaseView {
  return {
    before: `/media/before-after/${category}/befor${fileNumber}.png`,
    after: `/media/before-after/${category}/after${fileNumber}.png`,
  };
}

/** One entry per case: a single file-number string for a one-view case, or an array of file-number strings for a multi-angle case (same order as the views should display). */
interface RawCase {
  fileNumbers: string | readonly string[];
  needsHumanReview?: boolean;
}

const RAW_CASES: Record<BeforeAfterCategory, readonly RawCase[]> = {
  implant: [{ fileNumbers: "01" }, { fileNumbers: "02" }],
  "facial-reconstruction": [
    { fileNumbers: "03" },
    { fileNumbers: ["04-1", "04-2"] },
    { fileNumbers: "05" },
    { fileNumbers: "06" },
    { fileNumbers: "07", needsHumanReview: true },
  ],
  rhinoplasty: [
    { fileNumbers: "08" },
    { fileNumbers: ["09-1", "09-2", "09-3"] },
    { fileNumbers: "012" },
    { fileNumbers: "013", needsHumanReview: true },
    { fileNumbers: "014", needsHumanReview: true },
    { fileNumbers: "015" },
    { fileNumbers: "016" },
  ],
  "jaw-surgery": [
    { fileNumbers: "020" },
    { fileNumbers: "021" },
    { fileNumbers: "022" },
    { fileNumbers: ["023-1", "023-2"] },
    { fileNumbers: "024" },
    { fileNumbers: "025" },
    { fileNumbers: "026", needsHumanReview: true },
    { fileNumbers: "027" },
    { fileNumbers: ["028-1", "028-2"] },
    { fileNumbers: ["029-1", "029-2"] },
  ],
};

function buildCases(): BeforeAfterCase[] {
  const cases: BeforeAfterCase[] = [];
  let globalOrder = 0;
  for (const category of BEFORE_AFTER_CATEGORIES) {
    RAW_CASES[category].forEach((raw, indexInCategory) => {
      const displayIndex = indexInCategory + 1;
      const numbers = typeof raw.fileNumbers === "string" ? [raw.fileNumbers] : raw.fileNumbers;
      globalOrder += 1;
      cases.push({
        id: `${category}-${numbers[0]}`,
        category,
        serviceSlug: CATEGORY_SERVICE_SLUG[category],
        title: buildTitle(category, displayIndex),
        description: CATEGORY_DESCRIPTION[category],
        views: numbers.map((n) => view(category, n)),
        order: globalOrder,
        privacyLabel: buildPrivacyLabel(displayIndex),
        needsHumanReview: raw.needsHumanReview,
      });
    });
  }
  return cases;
}

export const BEFORE_AFTER_CASES: readonly BeforeAfterCase[] = buildCases();

export function getBeforeAfterCasesByCategory(category: BeforeAfterCategory | null): readonly BeforeAfterCase[] {
  return category ? BEFORE_AFTER_CASES.filter((c) => c.category === category) : BEFORE_AFTER_CASES;
}

export function isBeforeAfterCategory(value: string | undefined): value is BeforeAfterCategory {
  return !!value && (BEFORE_AFTER_CATEGORIES as readonly string[]).includes(value);
}
