import { localeHref } from "@/i18n/locale-href";
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
  // Round 2026-07-26 (doctor feedback, per Hamid): two new main services,
  // appended rather than reordered — every existing consumer that keys
  // off array position or the original six ids (Case Gallery's hand-tuned
  // `BOX_LAYOUT` masonry, About page grid, etc.) stays exactly as it was,
  // these two just flow in as additional entries. See `includedItems`
  // below for why that field exists.
  "facial-trauma-surgery",
  "facial-reconstruction-surgery",
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
  /**
   * Round 2026-07-26 (doctor feedback, per Hamid — "make the services
   * section clearer for normal users by showing what each main service
   * includes"). Short sub-service/procedure labels shown as a compact
   * preview on cards (homepage, `/services`) and as a full section on the
   * service detail page. Lives here (not in `servicesPage.items`,
   * fa.ts's per-locale detail-page dictionary) deliberately: the card
   * grids that need it (`ServiceTile`, `ServiceIndexList`) only ever
   * receive `ServiceTaxonomyItem`, never the detail-page dictionary — one
   * lookup, not two data sources kept in sync by slug. Per Hamid's
   * explicit instruction, these are NOT sub-service pages — no routing,
   * no separate slugs, purely descriptive.
   */
  includedItems: Record<Locale, readonly string[]>;
  /**
   * Round 2026-07-31 (doctor feedback, per Hamid — orthognathic-surgery
   * page pass): the detail page's "رویکرد درمانی" split section
   * (`[slug]/page.tsx`) previously hardcoded the same `/media/
   * doctor-surgery.jpg` OR photo for all 8 services. Optional so the
   * other 7 services keep that shared default unchanged — only a
   * service with a real, doctor-approved photo for this specific
   * section sets it.
   */
  approachPhotoSrc?: string;
  /** `object-position` for `approachPhotoSrc` — defaults to the shared block's own default ("75% 25%") when unset. */
  approachPhotoPosition?: string;
  /**
   * Round 2026-08-18 (doctor feedback, per Hamid — orthognathic-surgery
   * "دقت و مراقبت در هر مرحله" section needed service-specific copy about
   * digital planning and 3D simulation, not the generic shared note every
   * other service page still uses). Same optional-override shape and
   * fallback pattern as `approachPhotoSrc` above — omitted for every
   * other service, which keeps reading the shared `servicesPage.approachNote`.
   */
  approachNote?: Record<Locale, string>;
  /**
   * Round 2026-08-20 (doctor-provided image swap, per Hamid's PDF brief):
   * per-service hero photo override. Falls back to `REAL_PHOTOS[galleryCategory]`
   * (`gallery-photos.ts`) when unset — that map is ALSO read by
   * `ServiceBeforeAfterBand`/the `/before-after` gallery, and this round's
   * brief only asked to replace each page's own hero image, not its
   * before/after band photo, so a separate override field here (rather
   * than editing `REAL_PHOTOS` itself) keeps the two independent.
   */
  heroPhotoSrc?: string;
  /** `object-position` for `heroPhotoSrc` — defaults to center when unset. */
  heroPhotoPosition?: string;
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
    heroPhotoSrc: "/media/services/advanced-dental-implant.jpeg",
    approachPhotoSrc: "/media/services/advanced-dental-implant1.png.jpeg",
    // Round 2026-08-18 (doctor feedback, per Hamid): list now opens with
    // evaluation/planning before any surgical item, and gains "پیوند
    // لثه" — his exact given ordering.
    includedItems: {
      fa: [
        "ارزیابی پزشکی",
        "بررسی CBCT و طرح درمان",
        "ایمپلنت تک‌دندان",
        "ایمپلنت چند دندان",
        "ایمپلنت کامل فک",
        "بازسازی استخوان پیش از ایمپلنت",
        "پیوند لثه",
        "سینوس لیفت",
      ],
      en: [
        "Medical evaluation",
        "CBCT imaging and treatment planning",
        "Single-tooth implant",
        "Multiple-tooth implant",
        "Full-arch implant",
        "Bone grafting before implant placement",
        "Gum grafting",
        "Sinus lift",
      ],
      ar: [
        "تقييم طبي",
        "فحص CBCT وتخطيط العلاج",
        "زراعة سن واحد",
        "زراعة عدة أسنان",
        "زراعة الفك الكامل",
        "ترقيع العظم قبل الزراعة",
        "ترقيع اللثة",
        "رفع الجيب الفكي",
      ],
    },
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
    heroPhotoSrc: "/media/services/impacted-tooth-surgery.png.jpeg",
    approachPhotoSrc: "/media/services/impacted-tooth-surgery1.png.jpeg",
    includedItems: {
      fa: [
        "جراحی دندان عقل نهفته",
        "جراحی دندان نیمه‌نهفته",
        "جراحی دندان نیش نهفته",
        "خارج‌سازی دندان‌های نهفته نزدیک عصب",
        "بررسی موقعیت دندان با عکس و CBCT",
        "مدیریت درد، التهاب یا عفونت مرتبط با دندان نهفته",
      ],
      en: [
        "Impacted wisdom tooth surgery",
        "Partially impacted tooth surgery",
        "Impacted canine tooth surgery",
        "Removal of impacted teeth near the nerve",
        "Tooth position assessment with imaging and CBCT",
        "Managing pain, inflammation, or infection related to an impacted tooth",
      ],
      ar: [
        "جراحة ضرس العقل المطمور",
        "جراحة السن المطمور جزئياً",
        "جراحة الناب المطمور",
        "استخراج الأسنان المطمورة القريبة من العصب",
        "تقييم موقع السن بالأشعة وCBCT",
        "علاج الألم أو الالتهاب أو العدوى المرتبطة بالسن المطمور",
      ],
    },
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
    heroPhotoSrc: "/media/services/facial-rejuvenation.png.jpeg",
    approachPhotoSrc: "/media/services/facial-rejuvenation1.png.jpeg",
    includedItems: {
      fa: [
        "جوان‌سازی اطراف چشم و ابرو",
        "اصلاح افتادگی‌های خفیف تا متوسط صورت",
        "بهبود خطوط و فرم کلی صورت",
        "بررسی گزینه‌های جراحی یا غیرجراحی متناسب با فرد",
        "برنامه‌ریزی درمان بر اساس سن، پوست و انتظار بیمار",
      ],
      en: [
        "Rejuvenation around the eyes and brow",
        "Correcting mild-to-moderate facial sagging",
        "Improving facial lines and overall contour",
        "Reviewing surgical and non-surgical options suited to the individual",
        "Treatment planning based on age, skin, and patient expectations",
      ],
      ar: [
        "تجديد شباب محيط العينين والحاجب",
        "تصحيح ترهلات الوجه الخفيفة إلى المتوسطة",
        "تحسين خطوط الوجه وشكله العام",
        "مراجعة الخيارات الجراحية وغير الجراحية المناسبة للفرد",
        "تخطيط العلاج بناءً على العمر والبشرة وتوقعات المريض",
      ],
    },
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
    includedItems: {
      fa: ["پروتز چانه", "پروتز گونه", "پروتز زاویه فک", "لیفت صورت", "لیفت ابرو", "بلفاروپلاستی", "اصلاح فرم چانه", "اصلاح کانتور صورت", "جراحی‌های تکمیلی زیبایی صورت"],
      en: [
        "Chin implant",
        "Cheek implant",
        "Jaw angle implant",
        "Facelift",
        "Brow lift",
        "Blepharoplasty (eyelid surgery)",
        "Chin reshaping",
        "Facial contouring",
        "Complementary facial cosmetic procedures",
      ],
      ar: [
        "تطعيم الذقن",
        "تطعيم الوجنتين",
        "تطعيم زاوية الفك",
        "شد الوجه",
        "رفع الحاجب",
        "جراحة الجفون",
        "إعادة تشكيل الذقن",
        "نحت ملامح الوجه",
        "إجراءات تجميلية مكملة للوجه",
      ],
    },
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
    // heroPhotoSrc removed 2026-08-28 (wrong-gallery-image investigation):
    // `orthognathic-surgery.png.jpeg` is the same unrelated-person photo as
    // `gallery-photos.ts`'s old `jaw-surgery` entry (a volleyball athlete
    // holding a championship trophy — same source photo, different crop),
    // now confirmed live on this page's own hero, not just the homepage
    // gallery tile. No dedicated jaw-surgery hero photo exists, so this now
    // falls back to `servicePhoto` (`REAL_PHOTOS.jaw-surgery`, see that
    // file's own comment) — the same real, already-approved doctor/surgery
    // photo the site already uses as its general "no dedicated photo"
    // fallback elsewhere. The stale file and its .gitignore negation are
    // left in place, unreferenced, same precedent as the 2026-08-27
    // facial-cosmetic.png cleanup.
    // approachPhotoSrc unchanged, per doctor's explicit "عکس دوم تغییر نکند".
    approachPhotoSrc: "/media/services-orthognathic-surgery.jpeg",
    approachPhotoPosition: "center 25%",
    // Round 2026-08-18 (doctor feedback, per Hamid) — condensed from his
    // 3 given paragraphs into one polished paragraph (his exact meaning
    // and phrasing kept: precise analysis, digital design, per-patient
    // anatomy, first consultation through post-treatment follow-up, and
    // pre-surgical 3D jaw simulation for precision/predictability) —
    // per his own "keep it polished... do not make the section too long."
    approachNote: {
      fa: "دکتر صدیقی در جراحی فک، درمان را بر پایه آنالیز دقیق، طراحی دیجیتال و شرایط جسمانی و چهره هر بیمار برنامه‌ریزی می‌کند؛ از نخستین مشاوره و طراحی دیجیتال تا اجرای جراحی و پیگیری‌های پس از درمان، هر مرحله بر اساس آناتومی و نیازهای اختصاصی بیمار پیش می‌رود. با کمک تکنولوژی دیجیتال و شبیه‌سازی سه‌بعدی جراحی فک، موقعیت فک‌ها، تقارن صورت و نتیجه نهایی پیش از جراحی بررسی و طراحی می‌شود تا درمان با دقت و پیش‌بینی‌پذیری بیشتری انجام شود.",
      en: "For jaw surgery, Dr. Sadighi plans treatment around precise analysis, digital design, and each patient's own physical and facial condition — every stage, from the first consultation and digital design through surgery and post-treatment follow-up, follows that patient's specific anatomy and needs. Using digital technology and 3D jaw-surgery simulation, jaw position, facial symmetry, and the final result are reviewed and designed before surgery for greater precision and predictability.",
      ar: "في جراحة الفك، يخطط الدكتور صديقي العلاج بناءً على تحليل دقيق وتصميم رقمي والحالة الجسدية والوجهية لكل مريض؛ من الاستشارة الأولى والتصميم الرقمي إلى تنفيذ الجراحة والمتابعة بعد العلاج، تسير كل مرحلة وفق تشريح المريض واحتياجاته الخاصة. وباستخدام التكنولوجيا الرقمية والمحاكاة ثلاثية الأبعاد لجراحة الفك، تتم مراجعة وتصميم موضع الفكين وتناظر الوجه والنتيجة النهائية قبل الجراحة لتحقيق دقة وقابلية تنبؤ أكبر.",
    },
    includedItems: {
      fa: [
        "جراحی فک بالا",
        "جراحی فک پایین",
        "جراحی هم‌زمان دو فک",
        "جراحی چانه",
        "اصلاح جلو یا عقب بودن فک",
        "اصلاح انحراف فک",
        "اصلاح مشکلات جویدن و بستن دندان‌ها",
        "همکاری با ارتودنسی در طرح درمان فک",
      ],
      en: [
        "Upper jaw (maxilla) surgery",
        "Lower jaw (mandible) surgery",
        "Combined two-jaw surgery",
        "Chin surgery (genioplasty)",
        "Correcting a protruding or receded jaw",
        "Correcting jaw asymmetry",
        "Correcting chewing and bite problems",
        "Coordination with orthodontics on the jaw treatment plan",
      ],
      ar: [
        "جراحة الفك العلوي",
        "جراحة الفك السفلي",
        "جراحة الفكين معاً",
        "جراحة الذقن",
        "تصحيح تقدم أو تراجع الفك",
        "تصحيح انحراف الفك",
        "تصحيح مشاكل المضغ وإطباق الأسنان",
        "التنسيق مع التقويم في خطة علاج الفك",
      ],
    },
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
    heroPhotoSrc: "/media/services/rhinoplasty.png.jpeg",
    // No approachPhotoSrc — doctor's explicit "عکس دوم تغییر نکند" (keeps the shared default).
    includedItems: {
      fa: [
        "جراحی زیبایی بینی",
        "اصلاح انحراف بینی",
        "جراحی بینی پس از ضربه یا شکستگی",
        "اصلاح مشکلات تنفسی مرتبط با ساختار بینی",
        "ترمیم یا اصلاح نتایج جراحی قبلی",
        "بررسی تناسب بینی با فرم کلی صورت",
      ],
      en: [
        "Cosmetic rhinoplasty",
        "Correcting a deviated nasal septum",
        "Nasal surgery after trauma or fracture",
        "Correcting breathing problems related to nasal structure",
        "Revision of a previous rhinoplasty's results",
        "Assessing nose-to-face proportion and harmony",
      ],
      ar: [
        "تجميل الأنف",
        "تصحيح انحراف الحاجز الأنفي",
        "جراحة الأنف بعد الصدمة أو الكسر",
        "تصحيح مشاكل التنفس المرتبطة بتركيب الأنف",
        "تصحيح نتائج عملية تجميل أنف سابقة",
        "تقييم تناسق الأنف مع شكل الوجه العام",
      ],
    },
  },
  {
    id: "facial-trauma-surgery",
    slug: "facial-trauma-surgery",
    iconKey: "facial-trauma",
    // Round 2026-07-26 — no real clinic photo exists yet for this new
    // service; deliberately a `galleryCategory` with NO `REAL_PHOTOS`
    // entry (see `gallery-photos.ts`) so every surface that reads a photo
    // by this key (`ServiceVisualPanel`, `ServiceBeforeAfterBand`, the
    // `/before-after` gallery filter) already falls back to its existing
    // "no photo yet" treatment — an abstract navy-gradient placeholder
    // panel, or simply excluded from the before/after gallery — the same
    // safe path `facial-rejuvenation` used before its own photo existed.
    // TEMPORARY pending a doctor-approved real photo for this specialty.
    galleryCategory: "facial-trauma",
    englishLabel: "FACIAL TRAUMA & FRACTURE SURGERY",
    title: { fa: "جراحی تروما و شکستگی‌های صورت", en: "Facial Trauma & Fracture Surgery", ar: "جراحة إصابات وكسور الوجه" },
    subtitle: {
      fa: "درمان آسیب‌ها، شکستگی‌ها و زخم‌های صورت پس از ضربه، تصادف یا حوادث، با هدف حفظ عملکرد و بازگرداندن فرم طبیعی صورت.",
      en: "Treating facial injuries, fractures, and wounds after impact, accidents, or trauma — aimed at preserving function and restoring the face's natural form.",
      ar: "علاج إصابات الوجه والكسور والجروح الناتجة عن الصدمات أو الحوادث، بهدف الحفاظ على الوظيفة واستعادة الشكل الطبيعي للوجه.",
    },
    shortDescription: {
      fa: "درمان آسیب‌ها، شکستگی‌ها و زخم‌های صورت پس از ضربه، تصادف یا حوادث، با هدف حفظ عملکرد و بازگرداندن فرم طبیعی صورت.",
      en: "Treating facial injuries, fractures, and wounds after impact, accidents, or trauma — aimed at preserving function and restoring the face's natural form.",
      ar: "علاج إصابات الوجه والكسور والجروح الناتجة عن الصدمات أو الحوادث، بهدف الحفاظ على الوظيفة واستعادة الشكل الطبيعي للوجه.",
    },
    homepageDescription: {
      fa: "درمان آسیب‌ها، شکستگی‌ها و زخم‌های صورت پس از ضربه، تصادف یا حوادث، با هدف حفظ عملکرد و بازگرداندن فرم طبیعی صورت.",
      en: "Treating facial injuries, fractures, and wounds after impact, accidents, or trauma — aimed at preserving function and restoring the face's natural form.",
      ar: "علاج إصابات الوجه والكسور والجروح الناتجة عن الصدمات أو الحوادث، بهدف الحفاظ على الوظيفة واستعادة الشكل الطبيعي للوجه.",
    },
    footerLabel: { fa: "جراحی تروما و شکستگی‌های صورت", en: "Facial Trauma & Fracture Surgery", ar: "جراحة إصابات وكسور الوجه" },
    assistantLabel: { fa: "جراحی تروما و شکستگی‌های صورت", en: "Facial Trauma & Fracture Surgery", ar: "جراحة إصابات وكسور الوجه" },
    heroPhotoSrc: "/media/services/facial-trauma-surgery.png.jpeg",
    approachPhotoSrc: "/media/services/facial-trauma-surgery1.png.jpeg",
    // Round 2026-08-18 (doctor feedback, per Hamid) — added "شکستگی
    // پیشانی و ناحیه اربیتال" (frontal bone + orbital region), distinct
    // from the existing eye-socket item, ordered right after the nasal
    // fracture item per his given list.
    includedItems: {
      fa: [
        "شکستگی فک بالا",
        "شکستگی فک پایین",
        "شکستگی استخوان گونه",
        "شکستگی کاسه چشم",
        "شکستگی بینی در اثر ضربه",
        "شکستگی پیشانی و ناحیه اربیتال",
        "آسیب‌های دندانی ناشی از ضربه",
        "پارگی و زخم‌های صورت و دهان",
        "بررسی فوری آسیب‌های صورت پس از تصادف یا ضربه",
      ],
      en: [
        "Upper jaw fracture",
        "Lower jaw fracture",
        "Cheekbone (zygomatic) fracture",
        "Eye socket (orbital) fracture",
        "Nasal fracture from impact",
        "Frontal bone and orbital region fracture",
        "Dental injuries caused by trauma",
        "Facial and oral lacerations and wounds",
        "Urgent assessment of facial injuries after an accident or impact",
      ],
      ar: [
        "كسر الفك العلوي",
        "كسر الفك السفلي",
        "كسر عظم الوجنة",
        "كسر محجر العين",
        "كسر الأنف نتيجة صدمة",
        "كسر عظم الجبهة ومنطقة المحجر",
        "إصابات الأسنان الناتجة عن صدمة",
        "تمزقات وجروح الوجه والفم",
        "تقييم عاجل لإصابات الوجه بعد حادث أو صدمة",
      ],
    },
  },
  {
    id: "facial-reconstruction-surgery",
    slug: "facial-reconstruction-surgery",
    iconKey: "facial-reconstruction",
    // Same "no real photo yet" situation/rationale as facial-trauma-surgery above.
    galleryCategory: "facial-reconstruction",
    englishLabel: "FACIAL RECONSTRUCTION SURGERY",
    title: { fa: "جراحی بازسازی صورت", en: "Facial Reconstruction Surgery", ar: "جراحة إعادة بناء الوجه" },
    subtitle: {
      fa: "بازسازی فرم و عملکرد صورت پس از آسیب، بیماری، نقص استخوانی یا جراحی‌های قبلی، با برنامه‌ریزی دقیق و نگاه عملکردی و زیبایی.",
      en: "Reconstructing facial form and function after injury, illness, bone defects, or previous surgery — with careful planning and both a functional and aesthetic perspective.",
      ar: "إعادة بناء شكل ووظيفة الوجه بعد الإصابة أو المرض أو النقص العظمي أو الجراحات السابقة، من خلال تخطيط دقيق ونظرة وظيفية وجمالية معاً.",
    },
    shortDescription: {
      fa: "بازسازی فرم و عملکرد صورت پس از آسیب، بیماری، نقص استخوانی یا جراحی‌های قبلی، با برنامه‌ریزی دقیق و نگاه عملکردی و زیبایی.",
      en: "Reconstructing facial form and function after injury, illness, bone defects, or previous surgery — with careful planning and both a functional and aesthetic perspective.",
      ar: "إعادة بناء شكل ووظيفة الوجه بعد الإصابة أو المرض أو النقص العظمي أو الجراحات السابقة، من خلال تخطيط دقيق ونظرة وظيفية وجمالية معاً.",
    },
    homepageDescription: {
      fa: "بازسازی فرم و عملکرد صورت پس از آسیب، بیماری، نقص استخوانی یا جراحی‌های قبلی، با برنامه‌ریزی دقیق و نگاه عملکردی و زیبایی.",
      en: "Reconstructing facial form and function after injury, illness, bone defects, or previous surgery — with careful planning and both a functional and aesthetic perspective.",
      ar: "إعادة بناء شكل ووظيفة الوجه بعد الإصابة أو المرض أو النقص العظمي أو الجراحات السابقة، من خلال تخطيط دقيق ونظرة وظيفية وجمالية معاً.",
    },
    footerLabel: { fa: "جراحی بازسازی صورت", en: "Facial Reconstruction Surgery", ar: "جراحة إعادة بناء الوجه" },
    assistantLabel: { fa: "جراحی بازسازی صورت", en: "Facial Reconstruction Surgery", ar: "جراحة إعادة بناء الوجه" },
    heroPhotoSrc: "/media/services/facial-reconstruction-surgery.png.jpeg",
    approachPhotoSrc: "/media/services/facial-reconstruction-surgery2.png.jpeg",
    includedItems: {
      fa: [
        "بازسازی فک پس از آسیب یا نقص استخوانی",
        "بازسازی چانه و فرم پایین صورت",
        "بازسازی استخوان‌های صورت پس از تروما",
        "اصلاح بدشکلی‌های باقی‌مانده پس از شکستگی",
        "بازسازی بافت نرم صورت در موارد منتخب",
        "اصلاح اسکار یا تغییر شکل‌های پس از آسیب",
        "برنامه‌ریزی بازسازی با عکس، CBCT یا مدل سه‌بعدی در صورت نیاز",
      ],
      en: [
        "Jaw reconstruction after injury or a bone defect",
        "Chin and lower-face reconstruction",
        "Reconstruction of facial bones after trauma",
        "Correcting residual deformity after a fracture",
        "Facial soft-tissue reconstruction in selected cases",
        "Correcting scars or shape changes after injury",
        "Reconstruction planning with imaging, CBCT, or a 3D model when needed",
      ],
      ar: [
        "إعادة بناء الفك بعد إصابة أو نقص عظمي",
        "إعادة بناء الذقن وأسفل الوجه",
        "إعادة بناء عظام الوجه بعد الصدمة",
        "تصحيح التشوه المتبقي بعد الكسر",
        "إعادة بناء الأنسجة الرخوة للوجه في حالات مختارة",
        "تصحيح الندبات أو التغيرات الشكلية بعد الإصابة",
        "تخطيط إعادة البناء بالتصوير أو CBCT أو نموذج ثلاثي الأبعاد عند الحاجة",
      ],
    },
  },
] as const;

export function getServiceHref(locale: Locale, slug: string): string {
  return localeHref(locale, `/services/${slug}`);
}

export function getServiceById(id: string): ServiceTaxonomyItem | undefined {
  return SERVICES.find((service) => service.id === id);
}

/** `/[locale]/before-after?category=<galleryCategory>` — see that page's `searchParams` handling. */
export function getBeforeAfterHref(locale: Locale, galleryCategory: string | null): string {
  return galleryCategory ? `${localeHref(locale, "/before-after")}?category=${galleryCategory}` : localeHref(locale, "/before-after");
}
