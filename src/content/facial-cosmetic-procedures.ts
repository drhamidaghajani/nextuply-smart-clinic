import type { Locale } from "@/i18n/locales";

/**
 * SINGLE SOURCE OF TRUTH for the 7 sub-procedures introduced on the
 * Facial Cosmetic Surgery page — per Dr. Sadighi's 2026-08-17 feedback
 * ("the page is too general; it should work like a parent/overview page:
 * the user first sees the types of facial cosmetic surgery, clicks one,
 * and jumps to that procedure's own section").
 *
 * These are deliberately NOT services in `content/services.ts`'s sense:
 *
 * - `id` is an **anchor id only** (`#face-lift`, …), never a route slug.
 *   Per Hamid's explicit instruction, no sub-procedure gets its own page;
 *   the whole experience is same-page anchor navigation. Nothing here is
 *   fed into `SERVICE_TAXONOMY_IDS`, `generateStaticParams`, the footer,
 *   or the Assistant's service list.
 * - Rhinoplasty is deliberately ABSENT even though it is a facial
 *   cosmetic procedure: it already has its own dedicated service page
 *   (`/services/rhinoplasty`) and duplicating it here would create two
 *   competing entry points for the same treatment. See the page's FAQ,
 *   which answers this for patients directly.
 *
 * Content is the doctor's own Persian, transcribed verbatim. `en`/`ar`
 * are faithful translations of that Persian kept only so all three
 * locales build and read consistently — the clinic markets in Persian
 * first (see CLAUDE.md), and the translated medical copy has NOT been
 * separately signed off.
 */
export const FACIAL_PROCEDURE_IDS = [
  "face-lift",
  "submental-liposuction",
  "buccal-fat",
  "cheek-implant",
  "jawline-contouring",
  "blepharoplasty",
  "chin-surgery",
] as const;

export type FacialProcedureId = (typeof FACIAL_PROCEDURE_IDS)[number];

export interface FacialProcedure {
  /** Same-page anchor target (`#<id>`) — NOT a route. See this file's doc-comment. */
  id: FacialProcedureId;
  title: Record<Locale, string>;
  /** One-line description shown on the overview card. */
  summary: Record<Locale, string>;
  /** Opening paragraph of the procedure's own section. */
  intro: Record<Locale, string>;
  suitableFor: Record<Locale, readonly string[]>;
  /**
   * Outcome-oriented points. Also the source of the overview card's 2–3
   * "key points" (the card takes the first three) — derived rather than
   * authored twice, so a card can never drift from the section it links
   * to, and so no card claim exists that the doctor didn't write.
   */
  goals: Record<Locale, readonly string[]>;
  process: Record<Locale, string>;
  care: Record<Locale, readonly string[]>;
  imagePath: string;
  /** `true` when `imagePath` is a stand-in until a dedicated photo is supplied — surfaced nowhere in the UI, kept as an explicit content-debt marker. */
  imageIsPlaceholder?: boolean;
}

export const FACIAL_PROCEDURES: readonly FacialProcedure[] = [
  {
    id: "face-lift",
    title: { fa: "لیفت شقیقه و صورت", en: "Temporal & Face Lift", ar: "شد الصدغ والوجه" },
    summary: {
      fa: "برای بهبود افتادگی‌های ناحیه شقیقه، ابرو، گونه و بخش‌های میانی یا پایینی صورت با هدف جوان‌سازی طبیعی چهره.",
      en: "For improving laxity around the temples, brow, cheeks, and the mid or lower face, with natural facial rejuvenation as the goal.",
      ar: "لتحسين الترهل في منطقة الصدغ والحاجب والخد والأجزاء الوسطى أو السفلى من الوجه، بهدف تجديد شباب طبيعي للوجه.",
    },
    intro: {
      fa: "لیفت شقیقه و صورت برای بهبود افتادگی‌های ناحیه ابرو، شقیقه، گونه و بخش‌های پایینی صورت انجام می‌شود. هدف این روش، جوان‌سازی چهره بدون تغییر افراطی در هویت طبیعی فرد است.",
      en: "A temporal and face lift addresses laxity around the brow, temples, cheeks, and lower face. The goal is facial rejuvenation without any extreme change to a person's natural identity.",
      ar: "يُجرى شد الصدغ والوجه لتحسين الترهل في منطقة الحاجب والصدغ والخد والأجزاء السفلى من الوجه. الهدف هو تجديد شباب الوجه دون تغيير مبالغ فيه في الهوية الطبيعية للشخص.",
    },
    suitableFor: {
      fa: [
        "افرادی که افتادگی خفیف تا متوسط در ناحیه شقیقه یا ابرو دارند",
        "افرادی که در بخش میانی صورت یا گونه‌ها کاهش شادابی احساس می‌کنند",
        "افرادی که به دنبال جوان‌سازی طبیعی و متناسب هستند",
        "افرادی که می‌خواهند فرم کلی چهره شاداب‌تر و بازتر دیده شود",
      ],
      en: [
        "People with mild to moderate laxity around the temples or brow",
        "People who feel a loss of freshness in the mid-face or cheeks",
        "People looking for natural, proportionate rejuvenation",
        "People who want the overall face to look fresher and more open",
      ],
      ar: [
        "من لديهم ترهل خفيف إلى متوسط في منطقة الصدغ أو الحاجب",
        "من يشعرون بفقدان النضارة في وسط الوجه أو الخدين",
        "من يبحثون عن تجديد شباب طبيعي ومتناسب",
        "من يرغبون في أن يبدو شكل الوجه العام أكثر نضارة وانفتاحاً",
      ],
    },
    goals: {
      fa: [
        "بهبود افتادگی ناحیه شقیقه و ابرو",
        "کمک به شاداب‌تر شدن اطراف چشم و گونه",
        "حفظ حالت طبیعی چهره",
        "ایجاد هماهنگی بیشتر در فرم صورت",
      ],
      en: [
        "Improving laxity around the temples and brow",
        "Helping the eye area and cheeks look fresher",
        "Preserving the face's natural expression",
        "Creating greater harmony in facial form",
      ],
      ar: [
        "تحسين الترهل في منطقة الصدغ والحاجب",
        "المساعدة على أن تبدو منطقة العين والخد أكثر نضارة",
        "الحفاظ على المظهر الطبيعي للوجه",
        "خلق مزيد من الانسجام في شكل الوجه",
      ],
    },
    process: {
      fa: "پس از معاینه و بررسی آناتومی صورت، میزان افتادگی، کیفیت پوست و انتظار بیمار ارزیابی می‌شود. سپس روش مناسب و محدوده اصلاح با توجه به شرایط هر فرد انتخاب می‌شود.",
      en: "After examination and a review of facial anatomy, the degree of laxity, skin quality, and the patient's expectations are assessed. The appropriate technique and extent of correction are then chosen according to each person's own circumstances.",
      ar: "بعد الفحص ومراجعة تشريح الوجه، يتم تقييم درجة الترهل وجودة الجلد وتوقعات المريض. ثم تُختار الطريقة المناسبة ونطاق التصحيح وفقاً لظروف كل شخص.",
    },
    care: {
      fa: [
        "پرهیز از فشار مستقیم روی ناحیه جراحی‌شده",
        "رعایت توصیه‌های پزشک درباره استراحت و فعالیت",
        "مصرف داروها طبق دستور پزشک",
        "مراجعه برای بررسی روند ترمیم در زمان‌های تعیین‌شده",
      ],
      en: [
        "Avoiding direct pressure on the operated area",
        "Following the doctor's guidance on rest and activity",
        "Taking medication exactly as prescribed",
        "Attending follow-up visits at the scheduled times",
      ],
      ar: [
        "تجنب الضغط المباشر على المنطقة التي أُجريت فيها الجراحة",
        "اتباع توصيات الطبيب بشأن الراحة والنشاط",
        "تناول الأدوية حسب وصف الطبيب",
        "الحضور لمتابعة مسار التعافي في المواعيد المحددة",
      ],
    },
    imagePath: "/media/services/facial-cosmetic-surgery/procedure-face-lift.png",
  },
  {
    id: "submental-liposuction",
    title: { fa: "ساکشن غبغب", en: "Submental Liposuction", ar: "شفط دهون الذقن المزدوجة" },
    summary: {
      fa: "برای کاهش چربی تجمع‌یافته زیر چانه و کمک به واضح‌تر شدن خط فک و زاویه پایین صورت.",
      en: "For reducing accumulated fat beneath the chin and helping to define the jawline and the angle of the lower face.",
      ar: "لتقليل الدهون المتراكمة تحت الذقن والمساعدة على إبراز خط الفك وزاوية أسفل الوجه.",
    },
    intro: {
      fa: "ساکشن غبغب برای کاهش چربی تجمع‌یافته زیر چانه و کمک به مشخص‌تر شدن مرز چانه، گردن و خط فک انجام می‌شود.",
      en: "Submental liposuction reduces accumulated fat beneath the chin and helps define the border between the chin, neck, and jawline.",
      ar: "يُجرى شفط دهون الذقن المزدوجة لتقليل الدهون المتراكمة تحت الذقن والمساعدة على إبراز الحد الفاصل بين الذقن والرقبة وخط الفك.",
    },
    suitableFor: {
      fa: [
        "افرادی که تجمع چربی زیر چانه دارند",
        "افرادی که با وجود وزن نسبتاً مناسب، غبغب واضح دارند",
        "افرادی که می‌خواهند خط فک و پایین صورت مشخص‌تر دیده شود",
        "افرادی که کیفیت پوست آن‌ها برای جمع‌شدن پس از درمان مناسب است",
      ],
      en: [
        "People with fat accumulation beneath the chin",
        "People with a visible double chin despite a relatively suitable weight",
        "People who want a more defined jawline and lower face",
        "People whose skin quality is suitable for retraction after treatment",
      ],
      ar: [
        "من لديهم تراكم دهني تحت الذقن",
        "من لديهم ذقن مزدوجة واضحة رغم وزن مناسب نسبياً",
        "من يرغبون في أن يبدو خط الفك وأسفل الوجه أكثر وضوحاً",
        "من تكون جودة جلدهم مناسبة للانكماش بعد العلاج",
      ],
    },
    goals: {
      fa: [
        "کاهش حجم چربی زیر چانه",
        "بهبود زاویه میان چانه و گردن",
        "واضح‌تر شدن خط فک",
        "کمک به ظریف‌تر شدن نمای پایین صورت",
      ],
      en: [
        "Reducing the volume of fat beneath the chin",
        "Improving the angle between chin and neck",
        "A more clearly defined jawline",
        "Helping refine the appearance of the lower face",
      ],
      ar: [
        "تقليل حجم الدهون تحت الذقن",
        "تحسين الزاوية بين الذقن والرقبة",
        "إبراز خط الفك بوضوح أكبر",
        "المساعدة على أن يبدو أسفل الوجه أكثر رشاقة",
      ],
    },
    process: {
      fa: "در جلسه مشاوره، ضخامت بافت چربی، کیفیت پوست و فرم فک و چانه بررسی می‌شود. سپس مشخص می‌شود که ساکشن غبغب به‌تنهایی کافی است یا باید همراه با روش‌های تکمیلی در نظر گرفته شود.",
      en: "During consultation, the thickness of the fat tissue, skin quality, and the form of the jaw and chin are reviewed. It is then determined whether submental liposuction alone is sufficient, or whether it should be considered alongside complementary procedures.",
      ar: "في جلسة الاستشارة، تُراجَع سماكة النسيج الدهني وجودة الجلد وشكل الفك والذقن. ثم يُحدَّد ما إذا كان شفط دهون الذقن وحده كافياً أم ينبغي النظر فيه إلى جانب إجراءات تكميلية.",
    },
    care: {
      fa: [
        "استفاده از گن یا بانداژ طبق دستور پزشک",
        "پرهیز از فعالیت سنگین در روزهای اولیه",
        "کنترل تورم طبق توصیه پزشک",
        "مراجعه برای پیگیری روند ترمیم",
      ],
      en: [
        "Wearing a compression garment or bandage as directed",
        "Avoiding strenuous activity in the first days",
        "Managing swelling as advised by the doctor",
        "Attending follow-up visits to review healing",
      ],
      ar: [
        "استخدام المشد أو الضماد حسب تعليمات الطبيب",
        "تجنب النشاط الشاق في الأيام الأولى",
        "التحكم في التورم حسب توصية الطبيب",
        "الحضور لمتابعة مسار التعافي",
      ],
    },
    imagePath: "/media/services/facial-cosmetic-surgery/procedure-submental-liposuction.png",
  },
  {
    id: "buccal-fat",
    title: { fa: "بوکال فت", en: "Buccal Fat Removal", ar: "إزالة الدهون الشدقية" },
    summary: {
      fa: "برای کاهش حجم گونه‌های پایینی و ایجاد فرم ظریف‌تر در بخش میانی و پایینی صورت.",
      en: "For reducing lower-cheek volume and creating a more refined form in the mid and lower face.",
      ar: "لتقليل حجم الخدين السفليين وخلق شكل أكثر رشاقة في وسط الوجه وأسفله.",
    },
    intro: {
      fa: "بوکال فت برای کاهش حجم چربی عمقی گونه در بخش پایینی صورت انجام می‌شود و می‌تواند به مشخص‌تر شدن فرم گونه و ظریف‌تر دیده‌شدن صورت کمک کند.",
      en: "Buccal fat removal reduces deep cheek fat in the lower face and can help define the cheek's form and give the face a more refined appearance.",
      ar: "تُجرى إزالة الدهون الشدقية لتقليل الدهون العميقة في الخد بأسفل الوجه، ويمكن أن تساعد على إبراز شكل الخد وجعل الوجه يبدو أكثر رشاقة.",
    },
    suitableFor: {
      fa: [
        "افرادی که صورت گرد یا پر در ناحیه گونه‌های پایینی دارند",
        "افرادی که به دنبال ظریف‌تر شدن کانتور صورت هستند",
        "افرادی که حجم گونه پایینی با فرم کلی صورتشان تناسب ندارد",
        "افرادی که انتظارات واقع‌بینانه از نتیجه دارند",
      ],
      en: [
        "People with a round or full face in the lower-cheek area",
        "People seeking a more refined facial contour",
        "People whose lower-cheek volume is out of proportion with their overall facial form",
        "People with realistic expectations of the outcome",
      ],
      ar: [
        "من لديهم وجه مستدير أو ممتلئ في منطقة الخدين السفليين",
        "من يبحثون عن كفاف وجه أكثر رشاقة",
        "من لا يتناسب حجم خدهم السفلي مع الشكل العام لوجههم",
        "من لديهم توقعات واقعية بشأن النتيجة",
      ],
    },
    goals: {
      fa: [
        "کاهش حجم گونه‌های پایینی",
        "مشخص‌تر شدن کانتور میانی صورت",
        "کمک به ظریف‌تر شدن فرم چهره",
        "حفظ تعادل و طبیعی‌بودن صورت",
      ],
      en: [
        "Reducing lower-cheek volume",
        "A more defined mid-face contour",
        "Helping refine the shape of the face",
        "Preserving the face's balance and natural look",
      ],
      ar: [
        "تقليل حجم الخدين السفليين",
        "إبراز كفاف وسط الوجه بوضوح أكبر",
        "المساعدة على جعل شكل الوجه أكثر رشاقة",
        "الحفاظ على توازن الوجه ومظهره الطبيعي",
      ],
    },
    process: {
      fa: "در مشاوره، فرم صورت، حجم گونه‌ها، سن، کیفیت پوست و احتمال تغییرات آینده صورت بررسی می‌شود. تصمیم‌گیری باید محافظه‌کارانه و متناسب با آناتومی فرد انجام شود.",
      en: "During consultation, facial form, cheek volume, age, skin quality, and the likelihood of future facial changes are all reviewed. The decision should be conservative and matched to the individual's anatomy.",
      ar: "في الاستشارة، تُراجَع بنية الوجه وحجم الخدين والعمر وجودة الجلد واحتمال التغيرات المستقبلية في الوجه. ينبغي أن يكون القرار متحفظاً ومتناسباً مع تشريح الشخص.",
    },
    care: {
      fa: [
        "رعایت بهداشت دهان طبق دستور پزشک",
        "پرهیز از غذاهای محرک در روزهای اولیه در صورت توصیه پزشک",
        "مصرف داروهای تجویزشده",
        "پیگیری روند ترمیم",
      ],
      en: [
        "Maintaining oral hygiene as directed by the doctor",
        "Avoiding irritating foods in the first days if the doctor advises it",
        "Taking prescribed medication",
        "Following up on the healing process",
      ],
      ar: [
        "الحفاظ على نظافة الفم حسب تعليمات الطبيب",
        "تجنب الأطعمة المهيجة في الأيام الأولى إذا أوصى الطبيب بذلك",
        "تناول الأدوية الموصوفة",
        "متابعة مسار التعافي",
      ],
    },
    imagePath: "/media/services/facial-cosmetic-surgery/procedure-buccal-fat.png",
  },
  {
    id: "cheek-implant",
    title: { fa: "پروتز گونه", en: "Cheek Implant", ar: "زراعة الخد" },
    summary: {
      fa: "برای افزایش برجستگی و تقارن گونه‌ها و بهبود کانتور میانی صورت.",
      en: "For increasing cheek projection and symmetry and improving the mid-face contour.",
      ar: "لزيادة بروز الخدين وتناظرهما وتحسين كفاف وسط الوجه.",
    },
    intro: {
      fa: "پروتز گونه برای افزایش برجستگی، تقارن و فرم‌دهی به ناحیه میانی صورت انجام می‌شود. هدف این روش، ایجاد کانتور طبیعی و هماهنگ با سایر اجزای چهره است.",
      en: "A cheek implant increases projection and symmetry and shapes the mid-face. The goal is a natural contour, in harmony with the rest of the features.",
      ar: "تُجرى زراعة الخد لزيادة البروز والتناظر وتشكيل منطقة وسط الوجه. الهدف هو خلق كفاف طبيعي ومنسجم مع بقية ملامح الوجه.",
    },
    suitableFor: {
      fa: [
        "افرادی که برجستگی گونه کمی دارند",
        "افرادی که می‌خواهند میانه صورت متعادل‌تر دیده شود",
        "افرادی که به دنبال فرم‌دهی ماندگارتر نسبت به روش‌های موقت هستند",
        "افرادی که عدم تقارن یا کاهش حجم در ناحیه گونه دارند",
      ],
      en: [
        "People with limited cheek projection",
        "People who want the mid-face to look more balanced",
        "People seeking longer-lasting shaping than temporary options provide",
        "People with asymmetry or volume loss in the cheek area",
      ],
      ar: [
        "من لديهم بروز محدود في الخد",
        "من يرغبون في أن يبدو وسط الوجه أكثر توازناً",
        "من يبحثون عن تشكيل أطول أمداً مقارنة بالطرق المؤقتة",
        "من لديهم عدم تناظر أو فقدان حجم في منطقة الخد",
      ],
    },
    goals: {
      fa: [
        "افزایش برجستگی گونه",
        "بهبود کانتور میانی صورت",
        "کمک به تقارن بیشتر چهره",
        "ایجاد تناسب بهتر میان گونه، فک و چانه",
      ],
      en: [
        "Increasing cheek projection",
        "Improving the mid-face contour",
        "Helping the face look more symmetrical",
        "Creating better proportion between cheek, jaw, and chin",
      ],
      ar: [
        "زيادة بروز الخد",
        "تحسين كفاف وسط الوجه",
        "المساعدة على زيادة تناظر الوجه",
        "خلق تناسب أفضل بين الخد والفك والذقن",
      ],
    },
    process: {
      fa: "پس از بررسی فرم استخوانی صورت، ضخامت بافت نرم و انتظار بیمار، اندازه و محل مناسب پروتز یا روش جایگزین فرم‌دهی تعیین می‌شود.",
      en: "After reviewing the facial bone structure, soft-tissue thickness, and the patient's expectations, the appropriate size and position of the implant — or an alternative shaping method — is determined.",
      ar: "بعد مراجعة البنية العظمية للوجه وسماكة النسيج الرخو وتوقعات المريض، يُحدَّد الحجم والموضع المناسبان للزرعة أو طريقة تشكيل بديلة.",
    },
    care: {
      fa: [
        "پرهیز از ضربه یا فشار به صورت",
        "رعایت رژیم و مراقبت‌های توصیه‌شده در روزهای اولیه",
        "مصرف داروها طبق دستور پزشک",
        "پیگیری منظم روند ترمیم",
      ],
      en: [
        "Avoiding impact or pressure on the face",
        "Following the recommended diet and care in the first days",
        "Taking medication exactly as prescribed",
        "Attending regular follow-ups on healing",
      ],
      ar: [
        "تجنب الصدمات أو الضغط على الوجه",
        "اتباع النظام الغذائي والعناية الموصى بهما في الأيام الأولى",
        "تناول الأدوية حسب وصف الطبيب",
        "المتابعة المنتظمة لمسار التعافي",
      ],
    },
    // Round 2026-08-17: no dedicated cheek-implant photo was supplied —
    // the overview section's own image stands in for now. Flagged to
    // Hamid in this round's report; replace once the real one arrives.
    imagePath: "/media/services/facial-cosmetic-surgery/section-facial-procedures.png",
    imageIsPlaceholder: true,
  },
  {
    id: "jawline-contouring",
    title: { fa: "زاویه فک", en: "Jawline Contouring", ar: "نحت زاوية الفك" },
    summary: {
      fa: "برای مشخص‌تر شدن خط فک، بهبود فرم پایین صورت و ایجاد تناسب بهتر میان فک، چانه و گردن.",
      en: "For a more defined jawline, an improved lower-face form, and better proportion between jaw, chin, and neck.",
      ar: "لإبراز خط الفك وتحسين شكل أسفل الوجه وخلق تناسب أفضل بين الفك والذقن والرقبة.",
    },
    intro: {
      fa: "زاویه فک برای بهبود فرم پایین صورت و مشخص‌تر شدن مرز فک انجام می‌شود. این بخش می‌تواند شامل بررسی فرم استخوانی، چانه، خط فک و تناسب گردن با صورت باشد.",
      en: "Jawline contouring improves the form of the lower face and defines the jaw's border. It can include reviewing the bone structure, the chin, the jawline, and how the neck relates to the face.",
      ar: "يُجرى نحت زاوية الفك لتحسين شكل أسفل الوجه وإبراز حدود الفك. وقد يشمل ذلك مراجعة البنية العظمية والذقن وخط الفك وتناسب الرقبة مع الوجه.",
    },
    suitableFor: {
      fa: [
        "افرادی که خط فک نامشخص دارند",
        "افرادی که پایین صورت آن‌ها تعادل کافی با سایر اجزای چهره ندارد",
        "افرادی که به دنبال فرم مشخص‌تر و ماندگارتر هستند",
        "افرادی که نیاز به بررسی هم‌زمان چانه و فک دارند",
      ],
      en: [
        "People with an ill-defined jawline",
        "People whose lower face is not sufficiently balanced with their other features",
        "People seeking a more defined, longer-lasting form",
        "People who need the chin and jaw assessed together",
      ],
      ar: [
        "من لديهم خط فك غير واضح",
        "من لا يتوازن أسفل وجههم بما يكفي مع بقية ملامحهم",
        "من يبحثون عن شكل أوضح وأطول أمداً",
        "من يحتاجون إلى تقييم الذقن والفك معاً",
      ],
    },
    goals: {
      fa: [
        "مشخص‌تر شدن خط فک",
        "بهبود تناسب پایین صورت",
        "افزایش هماهنگی فک، چانه و گردن",
        "ایجاد فرم طبیعی و متناسب، نه اغراق‌شده",
      ],
      en: [
        "A more clearly defined jawline",
        "Improved proportion in the lower face",
        "Greater harmony between jaw, chin, and neck",
        "A natural, proportionate form rather than an exaggerated one",
      ],
      ar: [
        "إبراز خط الفك بوضوح أكبر",
        "تحسين تناسب أسفل الوجه",
        "زيادة الانسجام بين الفك والذقن والرقبة",
        "خلق شكل طبيعي ومتناسب، لا مبالغ فيه",
      ],
    },
    process: {
      fa: "در جلسه مشاوره، فرم فک، وضعیت چانه، بافت نرم و تناسب کلی صورت بررسی می‌شود. سپس مشخص می‌شود که اصلاح زاویه فک به‌تنهایی کافی است یا نیاز به ترکیب با روش‌های دیگر دارد.",
      en: "During consultation, the jaw's form, the state of the chin, the soft tissue, and overall facial proportion are reviewed. It is then determined whether contouring the jaw angle alone is sufficient, or whether it needs to be combined with other procedures.",
      ar: "في جلسة الاستشارة، تُراجَع بنية الفك وحالة الذقن والنسيج الرخو والتناسب العام للوجه. ثم يُحدَّد ما إذا كان تصحيح زاوية الفك وحده كافياً أم يحتاج إلى الدمج مع إجراءات أخرى.",
    },
    care: {
      fa: [
        "رعایت محدودیت فعالیت طبق دستور پزشک",
        "پرهیز از فشار به ناحیه فک",
        "توجه به تغذیه و مراقبت‌های پس از عمل",
        "مراجعه برای بررسی روند ترمیم",
      ],
      en: [
        "Observing activity limits as directed by the doctor",
        "Avoiding pressure on the jaw area",
        "Paying attention to nutrition and post-operative care",
        "Attending visits to review the healing process",
      ],
      ar: [
        "الالتزام بقيود النشاط حسب تعليمات الطبيب",
        "تجنب الضغط على منطقة الفك",
        "الاهتمام بالتغذية والعناية بعد الجراحة",
        "الحضور لمراجعة مسار التعافي",
      ],
    },
    imagePath: "/media/services/facial-cosmetic-surgery/procedure-jawline-contouring.png",
  },
  {
    id: "blepharoplasty",
    title: { fa: "بلفاروپلاستی", en: "Blepharoplasty", ar: "جراحة تجميل الجفون" },
    summary: {
      fa: "برای اصلاح افتادگی یا پوست اضافه پلک‌ها و کمک به جوان‌تر و شاداب‌تر دیده‌شدن اطراف چشم.",
      en: "For correcting drooping or excess eyelid skin and helping the eye area look younger and fresher.",
      ar: "لتصحيح ترهل الجفون أو الجلد الزائد فيها والمساعدة على أن تبدو منطقة العين أصغر سناً وأكثر نضارة.",
    },
    intro: {
      fa: "بلفاروپلاستی برای اصلاح پوست اضافه، افتادگی یا پف پلک‌ها انجام می‌شود و می‌تواند به شاداب‌تر شدن نگاه و جوان‌تر دیده‌شدن اطراف چشم کمک کند.",
      en: "Blepharoplasty corrects excess skin, drooping, or puffiness of the eyelids, and can help the gaze look fresher and the eye area younger.",
      ar: "تُجرى جراحة تجميل الجفون لتصحيح الجلد الزائد أو الترهل أو الانتفاخ في الجفون، ويمكن أن تساعد على أن تبدو النظرة أكثر نضارة ومنطقة العين أصغر سناً.",
    },
    suitableFor: {
      fa: [
        "افرادی که افتادگی پلک بالا دارند",
        "افرادی که پوست اضافه اطراف چشم باعث خسته‌تر دیده‌شدن چهره شده است",
        "افرادی که پف یا سنگینی پلک دارند",
        "افرادی که به دنبال اصلاح طبیعی اطراف چشم هستند",
      ],
      en: [
        "People with drooping of the upper eyelid",
        "People whose excess skin around the eye makes the face look more tired",
        "People with puffiness or heaviness of the eyelid",
        "People seeking a natural correction around the eyes",
      ],
      ar: [
        "من لديهم ترهل في الجفن العلوي",
        "من يجعل الجلد الزائد حول عينهم الوجه يبدو أكثر إرهاقاً",
        "من لديهم انتفاخ أو ثقل في الجفن",
        "من يبحثون عن تصحيح طبيعي حول العينين",
      ],
    },
    goals: {
      fa: [
        "اصلاح پوست اضافه پلک",
        "شاداب‌تر شدن نگاه",
        "کاهش حالت خستگی چهره",
        "حفظ فرم طبیعی چشم",
      ],
      en: [
        "Correcting excess eyelid skin",
        "A fresher-looking gaze",
        "Reducing a tired appearance",
        "Preserving the eye's natural shape",
      ],
      ar: [
        "تصحيح الجلد الزائد في الجفن",
        "نظرة أكثر نضارة",
        "تقليل مظهر الإرهاق في الوجه",
        "الحفاظ على الشكل الطبيعي للعين",
      ],
    },
    process: {
      fa: "در مشاوره، وضعیت پلک بالا و پایین، تقارن چشم‌ها، کیفیت پوست و انتظار بیمار بررسی می‌شود. سپس محدوده اصلاح با هدف طبیعی‌بودن نتیجه مشخص می‌شود.",
      en: "During consultation, the state of the upper and lower eyelids, eye symmetry, skin quality, and the patient's expectations are reviewed. The extent of correction is then set with a natural result as the goal.",
      ar: "في الاستشارة، تُراجَع حالة الجفن العلوي والسفلي وتناظر العينين وجودة الجلد وتوقعات المريض. ثم يُحدَّد نطاق التصحيح بهدف الحصول على نتيجة طبيعية.",
    },
    care: {
      fa: [
        "پرهیز از مالش چشم",
        "رعایت مراقبت‌های مربوط به شست‌وشو و داروها",
        "کنترل تورم و کبودی طبق توصیه پزشک",
        "مراجعه برای بررسی روند بهبود",
      ],
      en: [
        "Avoiding rubbing the eyes",
        "Following the care guidance on cleansing and medication",
        "Managing swelling and bruising as advised by the doctor",
        "Attending visits to review recovery",
      ],
      ar: [
        "تجنب فرك العينين",
        "اتباع تعليمات العناية الخاصة بالغسل والأدوية",
        "التحكم في التورم والكدمات حسب توصية الطبيب",
        "الحضور لمراجعة مسار التحسن",
      ],
    },
    imagePath: "/media/services/facial-cosmetic-surgery/procedure-blepharoplasty.png",
  },
  {
    id: "chin-surgery",
    title: { fa: "جراحی چانه / پروتز چانه", en: "Chin Surgery / Chin Implant", ar: "جراحة الذقن / زراعة الذقن" },
    summary: {
      fa: "برای اصلاح فرم، اندازه یا عقب‌ماندگی چانه و ایجاد تعادل بهتر در نمای نیم‌رخ و پایین صورت.",
      en: "For correcting the form, size, or recession of the chin and creating better balance in the profile and lower face.",
      ar: "لتصحيح شكل الذقن أو حجمه أو تراجعه وخلق توازن أفضل في الملامح الجانبية وأسفل الوجه.",
    },
    intro: {
      fa: "جراحی چانه یا پروتز چانه برای اصلاح فرم، اندازه یا عقب‌ماندگی چانه انجام می‌شود و نقش مهمی در تعادل نمای نیم‌رخ و تناسب پایین صورت دارد.",
      en: "Chin surgery or a chin implant corrects the form, size, or recession of the chin, and plays an important role in the balance of the profile and the proportion of the lower face.",
      ar: "تُجرى جراحة الذقن أو زراعة الذقن لتصحيح شكل الذقن أو حجمه أو تراجعه، ولها دور مهم في توازن الملامح الجانبية وتناسب أسفل الوجه.",
    },
    suitableFor: {
      fa: [
        "افرادی که چانه عقب یا کوچک دارند",
        "افرادی که نمای نیم‌رخ آن‌ها تعادل کافی ندارد",
        "افرادی که پایین صورتشان نیاز به فرم‌دهی بیشتر دارد",
        "افرادی که به دنبال هماهنگی بهتر میان بینی، لب، فک و چانه هستند",
      ],
      en: [
        "People with a recessed or small chin",
        "People whose profile lacks sufficient balance",
        "People whose lower face needs more shaping",
        "People seeking better harmony between nose, lips, jaw, and chin",
      ],
      ar: [
        "من لديهم ذقن متراجعة أو صغيرة",
        "من تفتقر ملامحهم الجانبية إلى التوازن الكافي",
        "من يحتاج أسفل وجههم إلى مزيد من التشكيل",
        "من يبحثون عن انسجام أفضل بين الأنف والشفة والفك والذقن",
      ],
    },
    goals: {
      fa: [
        "بهبود فرم و اندازه چانه",
        "ایجاد تعادل بهتر در نمای نیم‌رخ",
        "هماهنگی بیشتر چانه با فک و صورت",
        "کمک به طبیعی‌تر دیده‌شدن پایین صورت",
      ],
      en: [
        "Improving the form and size of the chin",
        "Creating better balance in the profile",
        "Greater harmony between the chin, jaw, and face",
        "Helping the lower face look more natural",
      ],
      ar: [
        "تحسين شكل الذقن وحجمه",
        "خلق توازن أفضل في الملامح الجانبية",
        "زيادة انسجام الذقن مع الفك والوجه",
        "المساعدة على أن يبدو أسفل الوجه أكثر طبيعية",
      ],
    },
    process: {
      fa: "پس از بررسی نمای روبه‌رو و نیم‌رخ، رابطه چانه با فک، لب و بینی ارزیابی می‌شود. سپس روش مناسب برای فرم‌دهی یا تقویت چانه انتخاب می‌شود.",
      en: "After reviewing both the frontal view and the profile, the chin's relationship to the jaw, lips, and nose is assessed. The appropriate method for shaping or augmenting the chin is then chosen.",
      ar: "بعد مراجعة المنظر الأمامي والجانبي، تُقيَّم علاقة الذقن بالفك والشفة والأنف. ثم تُختار الطريقة المناسبة لتشكيل الذقن أو تعزيزها.",
    },
    care: {
      fa: [
        "پرهیز از ضربه یا فشار به چانه",
        "رعایت توصیه‌های مربوط به تغذیه و فعالیت",
        "مصرف داروها طبق دستور پزشک",
        "مراجعه برای پیگیری روند ترمیم",
      ],
      en: [
        "Avoiding impact or pressure on the chin",
        "Following the guidance on nutrition and activity",
        "Taking medication exactly as prescribed",
        "Attending follow-up visits on healing",
      ],
      ar: [
        "تجنب الصدمات أو الضغط على الذقن",
        "اتباع التوصيات المتعلقة بالتغذية والنشاط",
        "تناول الأدوية حسب وصف الطبيب",
        "الحضور لمتابعة مسار التعافي",
      ],
    },
    imagePath: "/media/services/facial-cosmetic-surgery/procedure-chin-surgery.png",
  },
];

/** Overview-card key points are the first three `goals` — see `FacialProcedure.goals`. */
export const CARD_POINT_COUNT = 3;
