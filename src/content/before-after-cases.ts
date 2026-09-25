import type { FacialProcedureSlug } from "./facial-cosmetic-procedures";
import type { ServiceTaxonomyId } from "./services";
import type { Locale } from "@/i18n/locales";

/**
 * SINGLE SOURCE OF TRUTH for the `/before-after` page's real patient
 * cases. Two asset batches feed it, both from Dr. Sadighi:
 *
 * 1. The 2026-08-25 legacy upload — 24 cases across 4 categories, served
 *    from `public/media/before-after/<category>/befor<nn>.png`+
 *    `after<nn>.png`. Filenames (including the intentional `befor`
 *    spelling) are kept EXACTLY as provided, never renamed. Its own
 *    earlier note stands: 24 cases total (implant 2, facial-reconstruction
 *    5, rhinoplasty 7, jaw-surgery 10) — one more than the "23" quoted in
 *    that round's approval message, because summing the literal case list
 *    gives jaw-surgery 10 (which includes `026`, explicitly approved).
 *
 * 2. The 2026-09-25 import — 16 cases across 5 categories (implant 3,
 *    facial-reconstruction 1, rhinoplasty 2, jaw-surgery 7,
 *    temporal-face-lift 3), served from
 *    `public/images/before-after/<treatment>/case-<nn>/before.webp`+
 *    `after.webp`. Pairs were derived ONLY by matching the numeric suffix
 *    in the clinic's own `before <nnn>` / `after <nnn>` filenames — never
 *    by file order — and each pair was verified complete before being
 *    listed. Nothing was inferred, merged, or guessed: a half-pair would
 *    have been excluded rather than paired with a neighbour (none were).
 *    This batch introduced the `temporal-face-lift` category, which the
 *    legacy batch has no cases for.
 *
 * No per-case narrative exists in either batch (no patient story,
 * procedure detail, or outcome note was provided) — `description` is
 * therefore a single neutral, category-level paragraph (real service
 * performed at this clinic; results vary by individual anatomy/condition),
 * not a fabricated per-patient account. `privacyLabel` is a generic
 * sequential "Patient N" per category — no real name was ever provided or
 * would be appropriate to invent.
 *
 * The imported batch's originals are untracked uploads kept OUTSIDE the
 * repo tree; only their web derivatives are published, and each derivative
 * is a straight re-encode of the original at its native 1254×1254 — no
 * crop, no resize, no rotation, no retouching, no AI enhancement, and no
 * metadata carried over, so the clinical result shown is exactly the
 * clinician's image.
 *
 * Image existence/corruption validation happens in the page itself
 * (`before-after/page.tsx`, a Server Component — safe to use `fs`
 * there), not here: this module is imported by at least one Client
 * Component (the category showcase), so it must stay fs-free and
 * universally importable, matching every other file in `src/content/`.
 */

export type BeforeAfterCategory =
  | "implant"
  | "facial-reconstruction"
  | "rhinoplasty"
  | "jaw-surgery"
  | "temporal-face-lift";

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
  /**
   * Placement-only flag: when true, the homepage's Real Patient Stories
   * preview prefers this case for its category (otherwise the first case
   * in the category is used — see `getPreviewCase`). It is deliberately
   * NOT a quality, severity, or outcome signal, and it never reorders the
   * `/before-after` gallery itself. Left unset on every imported case:
   * selecting which real result leads the homepage is a clinic curatorial
   * decision, not something to infer from file order.
   */
  featured?: boolean;
  /** True for the cases Hamid's brief flagged as needing a quick clinic-side identity/consistency check before this goes live — never a signal that the file itself is broken (it isn't; see the migration report). */
  needsHumanReview?: boolean;
}

export const BEFORE_AFTER_CATEGORIES: readonly BeforeAfterCategory[] = [
  "implant",
  "facial-reconstruction",
  "rhinoplasty",
  "jaw-surgery",
  "temporal-face-lift",
];

export const CATEGORY_LABEL: Record<BeforeAfterCategory, Record<Locale, string>> = {
  implant: { fa: "ایمپلنت", en: "Dental Implant", ar: "زراعة الأسنان" },
  "facial-reconstruction": { fa: "بازسازی نواقص صورت", en: "Facial Reconstruction", ar: "إعادة بناء عيوب الوجه" },
  rhinoplasty: { fa: "جراحی بینی", en: "Rhinoplasty", ar: "تجميل الأنف" },
  "jaw-surgery": { fa: "جراحی فک", en: "Jaw Surgery", ar: "جراحة الفك" },
  // Not new copy: reused verbatim from the existing `temple-face-lift`
  // procedure's own `title` in `content/facial-cosmetic-procedures.ts`
  // (لیفت شقیقه و صورت / Temporal & Face Lift / شد الصدغ والوجه), so the
  // gallery category and the procedure page name the same treatment the
  // same way in all three locales.
  "temporal-face-lift": { fa: "لیفت شقیقه و صورت", en: "Temporal & Face Lift", ar: "شد الصدغ والوجه" },
};

/** Which service detail page each category's cases relate to — drives `getServiceHref` on the case card, and (for the four one-to-one categories) the reverse mapping `SERVICE_SLUG_TO_CATEGORY` below for `ServiceBeforeAfterBand`. */
const CATEGORY_SERVICE_SLUG: Record<BeforeAfterCategory, ServiceTaxonomyId> = {
  implant: "advanced-dental-implant",
  "facial-reconstruction": "facial-reconstruction-surgery",
  rhinoplasty: "rhinoplasty",
  "jaw-surgery": "orthognathic-surgery",
  // لیفت شقیقه و صورت is one of `facial-cosmetic-surgery`'s seven child
  // procedures (`temple-face-lift`) rather than a top-level service of its
  // own, so a case card links to that hub. The band on the hub itself is
  // NOT pointed at this category — see `SERVICE_SLUG_TO_CATEGORY`.
  "temporal-face-lift": "facial-cosmetic-surgery",
};

/**
 * Reverse of `CATEGORY_SERVICE_SLUG`, for service detail pages to look
 * up their own before/after category — exactly Hamid's 4 required
 * mappings, no more. A service with no entry here (impacted-tooth-
 * surgery, facial-rejuvenation, facial-cosmetic-surgery, facial-trauma-
 * surgery) has no single matching case category, so its
 * `ServiceBeforeAfterBand` link falls back to the general `/before-after`
 * index rather than an invented/mismatched filter — per Hamid's explicit
 * "do not force it" instruction for facial-cosmetic-surgery, applied
 * consistently to every other unmapped service too.
 *
 * `facial-cosmetic-surgery` is deliberately still absent even though it
 * now owns a case category: that category (temporal-face-lift) belongs to
 * exactly ONE of the hub's seven procedures, so pointing the hub's band at
 * it would misrepresent the other six. The procedure-level deep link lives
 * in `FACIAL_PROCEDURE_TO_CATEGORY` instead.
 */
export const SERVICE_SLUG_TO_CATEGORY: Partial<Record<ServiceTaxonomyId, BeforeAfterCategory>> = {
  "advanced-dental-implant": "implant",
  "facial-reconstruction-surgery": "facial-reconstruction",
  rhinoplasty: "rhinoplasty",
  "orthognathic-surgery": "jaw-surgery",
};

/**
 * Procedure-level counterpart of `SERVICE_SLUG_TO_CATEGORY`, for the
 * `/services/facial-cosmetic-surgery/[procedure]` pages — only procedures
 * with real published cases appear here, so the other six keep the honest
 * fallback to the general index rather than a filter that would come back
 * empty.
 */
export const FACIAL_PROCEDURE_TO_CATEGORY: Partial<Record<FacialProcedureSlug, BeforeAfterCategory>> = {
  "temple-face-lift": "temporal-face-lift",
};

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
  // Same neutral, category-level template as the four above — states the
  // treatment performed and that results vary, nothing more. The varying
  // factor named here (degree of laxity) is the one the existing
  // `temple-face-lift` procedure content already uses in its own
  // suitability copy, not a new clinical claim.
  "temporal-face-lift": {
    fa: "نتیجه واقعی لیفت شقیقه و صورت در کلینیک دکتر علیرضا صدیقی. نتیجه هر بیمار بر اساس میزان افتادگی و روند بهبودی متفاوت است.",
    en: "A real result from a temporal and face lift at Dr. Alireza Sadighi's clinic. Individual results vary by the degree of laxity and the healing process.",
    ar: "نتيجة حقيقية لشد الصدغ والوجه في عيادة الدكتور علیرضا صدیقی. تختلف نتيجة كل مريض حسب درجة الترهل ومسار الشفاء.",
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

/**
 * Directory for the 2026-09-25 imported batch under
 * `public/images/before-after/`. Named after the real treatment (not the
 * internal category id) so the public URL is self-describing, and kept
 * separate from the legacy `public/media/before-after/<category>/` tree
 * used by `view()` below, whose flat `befor<nn>.png` naming cannot express
 * "this pair is case 003 of the maxillofacial set".
 */
const IMPORTED_ASSET_DIR: Record<BeforeAfterCategory, string> = {
  implant: "dental-implant",
  "facial-reconstruction": "facial-reconstruction",
  rhinoplasty: "rhinoplasty",
  "jaw-surgery": "maxillofacial-surgery",
  "temporal-face-lift": "temporal-face-lift",
};

/**
 * The 2026-09-25 batch's `_incoming/before-after/` suffixes that form a
 * COMPLETE before+after pair, per category. Derived strictly by matching
 * the numeric suffix across the clinic's own `before <nnn>` / `after <nnn>`
 * filenames — never by file order, never guessed. Every suffix listed here
 * was confirmed to have exactly one before file AND exactly one after
 * file; a suffix missing either half is excluded rather than paired with a
 * neighbour. This batch had none: all 16 suffixes were complete.
 *
 * Those originals live outside the repo tree (they are untracked uploads,
 * deliberately not committed and never served), and each one was converted
 * to `before.webp`/`after.webp` at its native 1254×1254 with no crop, no
 * resize, no retouch, and no metadata carried over — see the import report.
 */
const IMPORTED_CASE_SUFFIXES: Partial<Record<BeforeAfterCategory, readonly string[]>> = {
  implant: ["001", "002", "003"],
  "facial-reconstruction": ["001"],
  rhinoplasty: ["001", "002"],
  "jaw-surgery": ["001", "002", "003", "004", "005", "006", "007"],
  "temporal-face-lift": ["001", "002", "003"],
};

function importedView(category: BeforeAfterCategory, suffix: string): BeforeAfterCaseView {
  const caseDir = `case-${String(Number(suffix)).padStart(2, "0")}`;
  const base = `/images/before-after/${IMPORTED_ASSET_DIR[category]}/${caseDir}`;
  return { before: `${base}/before.webp`, after: `${base}/after.webp` };
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
  // The legacy upload batch has no temporal/face-lift cases at all —
  // that category is carried entirely by the imported set above.
  "temporal-face-lift": [],
};

/**
 * Builds the published list. Both asset batches feed the SAME per-category
 * sequence so titles and the generic "Patient N" labels stay continuous
 * across them (they are display positions within a category, not file
 * numbers, which is why the two batches' independent numbering schemes can
 * coexist without two cases ever sharing a label).
 *
 * The imported batch is placed FIRST within each category: it is the most
 * recent delivery, and it is what makes the homepage's Real Patient
 * Stories preview show the newly published results. Reversing the two
 * arrays is all that is needed to prefer the legacy cases instead.
 */
/** One published case before titles/labels/order are derived — the two asset batches produce these in the same shape. */
interface CaseEntry {
  id: string;
  views: readonly BeforeAfterCaseView[];
  needsHumanReview?: boolean;
}

function buildCases(): BeforeAfterCase[] {
  const cases: BeforeAfterCase[] = [];
  let globalOrder = 0;

  for (const category of BEFORE_AFTER_CATEGORIES) {
    const imported: CaseEntry[] = (IMPORTED_CASE_SUFFIXES[category] ?? []).map((suffix) => ({
      id: `${category}-${suffix}`,
      views: [importedView(category, suffix)],
    }));

    const legacy: CaseEntry[] = RAW_CASES[category].map((raw) => {
      const numbers = typeof raw.fileNumbers === "string" ? [raw.fileNumbers] : raw.fileNumbers;
      return {
        id: `${category}-${numbers[0]}`,
        views: numbers.map((n) => view(category, n)),
        needsHumanReview: raw.needsHumanReview,
      };
    });

    [...imported, ...legacy].forEach((entry, index) => {
      const displayIndex = index + 1;
      globalOrder += 1;
      cases.push({
        id: entry.id,
        category,
        serviceSlug: CATEGORY_SERVICE_SLUG[category],
        title: buildTitle(category, displayIndex),
        description: CATEGORY_DESCRIPTION[category],
        views: entry.views,
        order: globalOrder,
        privacyLabel: buildPrivacyLabel(displayIndex),
        needsHumanReview: entry.needsHumanReview,
      });
    });
  }

  return cases;
}

export const BEFORE_AFTER_CASES: readonly BeforeAfterCase[] = buildCases();

export function getBeforeAfterCasesByCategory(category: BeforeAfterCategory | null): readonly BeforeAfterCase[] {
  return category ? BEFORE_AFTER_CASES.filter((c) => c.category === category) : BEFORE_AFTER_CASES;
}

/**
 * The one case a short preview should show for a category: a `featured`
 * case if the clinic has flagged one, otherwise the first published case
 * in that category (which, per `buildCases`, is the most recent delivery).
 * The homepage's Real Patient Stories preview reads this instead of
 * indexing the array itself, so `featured` has exactly one meaning and one
 * consumer rather than being a flag nothing honours.
 */
export function getPreviewCase(category: BeforeAfterCategory): BeforeAfterCase | undefined {
  const inCategory = getBeforeAfterCasesByCategory(category);
  return inCategory.find((c) => c.featured) ?? inCategory[0];
}

export function isBeforeAfterCategory(value: string | undefined): value is BeforeAfterCategory {
  return !!value && (BEFORE_AFTER_CATEGORIES as readonly string[]).includes(value);
}
