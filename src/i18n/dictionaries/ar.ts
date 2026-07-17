import type {
  AboutPageDictionary,
  AiConciergeDictionary,
  AssistantFlowDictionary,
  BeforeAfterPageDictionary,
  CareInstructionsPageDictionary,
  CaseGalleryDictionary,
  ContactPageDictionary,
  DoctorStoryDictionary,
  FaqSectionDictionary,
  FooterDictionary,
  HeaderDictionary,
  HealthTourismPageDictionary,
  HeroDictionary,
  KnowledgeCenterDictionary,
  KnowledgePageDictionary,
  PatientJourneyDictionary,
  PatientStoriesDictionary,
  ServicesDictionary,
  ServicesPageDictionary,
  VideoHubDictionary,
} from "../dictionary-types";
import { getServiceHref, SERVICES } from "@/content/services";

/**
 * Arabic (Modern Standard Arabic) — full homepage + Smart Clinic
 * Assistant coverage, mirrors `en.ts`'s scope exactly; see that file's
 * doc-comment and docs/adr/0006-full-homepage-and-assistant-locale-
 * rollout.md. Formal, polished MSA suitable for a premium international
 * aesthetic/maxillofacial clinic — not a literal or machine translation.
 *
 * Digits: kept as Western numerals (0-9), matching how most contemporary
 * Gulf/regional clinic and business sites render Arabic content today,
 * rather than Eastern Arabic-Indic digits (٠-٩) — a real, revisitable
 * judgment call (no regional Arabic-speaking audience was specified),
 * flagged here rather than silently picked deep in the data.
 *
 * `titleEn` in `services.items` keeps the fa.ts convention of pairing
 * the Arabic name with its English clinical term — a genuine, common
 * device in Arabic medical marketing, not a translation gap (see
 * `en.ts`'s own doc-comment on why English handles this field
 * differently, since there both fields would otherwise be English).
 */

export const header = {
  logoSubtitle: "أخصائي جراحة الفك والوجه",
  navItems: [
    { href: "/ar/about", label: "د. صديقي" },
    { href: "#services", label: "الخدمات" },
    { href: "#before-after", label: "قبل وبعد" },
    { href: "#faq", label: "الأسئلة الشائعة" },
    { href: "#videos", label: "الفيديوهات" },
    { href: "#knowledge-center", label: "مركز المعرفة" },
    { href: "#contact", label: "تواصل معنا" },
  ],
  ctaLabel: "احجز استشارة",
  openMenuLabel: "فتح القائمة",
  closeMenuLabel: "إغلاق القائمة",
} satisfies HeaderDictionary;

export const footer = {
  tagline: "عيادة الدكتور عليرضا صديقي للتجميل",
  description: "تجربة هادئة ودقيقة وذكية لتجميل الوجه وإعادة بنائه، تحت إشراف الدكتور عليرضا صديقي مباشرة.",
  // Round 2026-07-13 (taxonomy correction): real links now, derived from
  // `src/content/services.ts` (single source of truth).
  // Round 2026-07-13 (patient-care hub, per Hamid): 7th entry appended
  // after the 6 real service links, not replacing any of them.
  services: [
    ...SERVICES.map((service) => ({ label: service.footerLabel.ar, href: getServiceHref("ar", service.slug) })),
    { label: "تعليمات ما قبل وبعد الإجراء", href: "/ar/care-instructions" },
  ],
  guide: [
    { label: "د. صديقي", href: "#why-dr-sadighi" },
    { label: "قبل وبعد", href: "#before-after" },
    { label: "الأسئلة الشائعة", href: "#faq" },
    { label: "الفيديوهات", href: "#videos" },
    { label: "مركز المعرفة", href: "#knowledge-center" },
    { label: "تواصل معنا", href: "#contact" },
    { label: "عن الطبيب", href: "/ar/about" },
    { label: "الخدمات العلاجية", href: "/ar/services" },
    { label: "السياحة العلاجية", href: "/ar/health-tourism" },
    { label: "سياسة الخصوصية", href: null },
    { label: "شروط الاستخدام", href: null },
  ],
  locations: {
    tabriz: {
      label: "تبريز، إيران",
      addressLines: ["شارع وليعصر، ساحة روداكي، مبنى فريد", "الطابق الرابع (بجانب صيدلية الدكتور زارعي)"],
      phone: "041-33334539",
      mobile: "09120149500",
    },
    tehran: {
      label: "طهران",
      address: "قريبًا",
    },
  },
  hours: ["السبت إلى الأربعاء: 10:00 صباحًا – 7:00 مساءً", "الخميس: 10:00 صباحًا – 2:00 مساءً", "الجمعة: عطلة"],
  instagram: "@dr.sadighi.alireza",
  siteName: "الدكتور عليرضا صديقي",
  columnHeadings: { services: "الخدمات", contact: "تواصل معنا", guide: "استكشف" },
  instagramLabel: "إنستغرام: ",
  copyrightSuffix: "الهندسة الرقمية بواسطة",
  linkedInAriaLabel: "Nextuply على لينكدإن",
} satisfies FooterDictionary;

export const hero = {
  title: "هندسة الجمال، بدقة جرّاح ونظرة فنان",
  doctorName: "الدكتور عليرضا صديقي",
  doctorSpecialty: "أخصائي جراحة الفك والوجه وتجميل الأنف",
  ctaPrimary: "ابدأ الاستشارة",
  ctaSecondary: "عرض الخدمات",
} satisfies HeroDictionary;

export const aiConcierge = {
  eyebrow: "المساعد الذكي لعيادة الدكتور علي رضا صديقي",
  onlineStatus: "متاح على مدار الساعة",
  sampleQuestions: [
    "كم تبلغ تكلفة جراحة تجميل الأنف عادة؟",
    "أرني نتائج شد الوجه.",
    "ما الشروط اللازمة لزراعة الأسنان؟",
    "ما الذي تتضمنه العناية بعد الجراحة؟",
  ],
  chips: ["تقدير أولي للتكلفة", "أعمالنا", "المقالات", "العناية قبل وبعد الجراحة", "إرسال صورة"],
  ctaPrimary: "ابدأ المحادثة",
  ctaSecondary: "احجز استشارة",
  headline: "كل سؤال عن علاجكم يبدأ من هنا.",
  description: "يساعدكم المساعد الذكي للعيادة على إيجاد العلاج المناسب، ومشاهدة نتائج حقيقية، والحصول على تقدير أولي للتكلفة، وعند الاستعداد، ترتيب استشارة حضورية أو عبر الإنترنت.",
  inputPlaceholder: "اكتبوا سؤالكم...",
} satisfies AiConciergeDictionary;

export const services = {
  eyebrow: "خدمات متخصصة",
  heading: "مجالات تخصص الدكتور صديقي",
  subheading: "ستة مجالات متخصصة في جراحة الفك والوجه والأنف؛ من زراعة الأسنان إلى تجميل الأنف.",
  // Round 2026-07-13 (taxonomy correction): the item list itself moved
  // to `src/content/services.ts` (`SERVICES`) — see `ServicesDictionary`'s
  // doc-comment in `dictionary-types.ts`.
} satisfies ServicesDictionary;

export const doctorStory = {
  headline: "لماذا الدكتور عليرضا صديقي؟",
  body: "لا يتعامل الدكتور عليرضا صديقي مع أي حالة كإجراء منفصل، بل كجزء من تصميم طويل الأمد للوجه. تجمع هذه النظرة بين الدقة العلمية لجراحة الفك والوجه والفهم الحقيقي لعلم الجمال، وقبل اتخاذ أي قرار، تُشرح المخاطر والتوقعات الواقعية بوضوح تام.",
  metrics: [
    { value: "2", label: "مدينتان بمعيار جودة واحد — طهران وتبريز" },
    { value: "المرتبة الأولى", label: "في امتحان زمالة جراحة التجميل والترميم للوجه، جامعة طهران" },
  ],
  principles: [
    "الشفافية الكاملة في شرح المخاطر",
    "تصميم طويل الأمد للوجه، لا مجرد إجراء قصير",
    "معيار جودة واحد في طهران وتبريز",
  ],
  cta: "تعرّف على الدكتور صديقي",
  portraitAlt: "صورة شخصية للدكتور عليرضا صديقي",
  surgeryAlt: "الدكتور عليرضا صديقي أثناء إجراء جراحة",
} satisfies DoctorStoryDictionary;

export const caseGallery = {
  heading: "النتائج السريرية والسجلات العلاجية",
  subheading: "انعكاس للدقة والفن والخبرة السريرية؛ استعراض حالات جراحات الوجه والفك والأنف في عيادة الدكتور صديقي.",
} satisfies CaseGalleryDictionary;

export const patientJourney = {
  heading: "رحلتكم نحو النتيجة التي تطمحون إليها",
  steps: [
    {
      id: "consultation",
      title: "استشارة تخصصية وتقييم أولي",
      body: "في الخطوة الأولى، تتم مراجعة سجلكم الطبي وصوركم واحتياجاتكم بعناية. في هذه الجلسة، يتم الاستماع إلى مخاوفكم وتوقعاتكم وتاريخكم العلاجي، وبناءً على فحص سريري دقيق وصور تخصصية، تحصلون على رؤية واضحة لوضعكم الحالي وإمكانية العلاج.",
    },
    {
      id: "treatment-design",
      title: "تصميم علاج مخصص لكم",
      body: "بعد التقييم الأولي، يُصمَّم خطة علاج خاصة بكم بناءً على تشريح الوجه والفك، وطبيعة الأنسجة، وتناسق ملامح الوجه. قد يشمل هذا التصميم نمذجة ثلاثية الأبعاد ومحاكاة للنتائج المحتملة واختيارًا دقيقًا لتقنية الجراحة، ليتشكل مسار علاجي يناسبكم تمامًا.",
    },
    {
      id: "surgery",
      title: "إجراء الجراحة وفق أحدث المعايير العالمية",
      body: "تُجرى الجراحة في بيئة خاضعة للسيطرة الكاملة ووفقًا لأحدث المعايير العلمية. في هذه المرحلة، ينفذ الفريق الجراحي خطة العلاج المصممة بتركيز على الدقة والسلامة والجمال؛ للحفاظ على الوظائف الأساسية (التنفس والمضغ والنطق) وتحقيق أفضل انسجام ممكن لملامح الوجه.",
    },
    {
      id: "recovery",
      title: "الرعاية والتعافي بعد الجراحة",
      body: "بعد الجراحة، تبدأ مرحلة التعافي تحت إشراف فريق العلاج. ستحصلون على إرشادات دقيقة للعناية، وجدول زمني للمراجعات، ومتابعة لإدارة التورم والكدمات، بالإضافة إلى متابعة مسار الشفاء؛ ليمر هذا الوقت بمزيد من الطمأنينة والثقة وتستقر النتيجة النهائية بالشكل المطلوب.",
    },
    {
      id: "follow-up",
      title: "متابعة منتظمة وتقييم النتيجة النهائية",
      body: "في جلسات المتابعة، يتم تقييم النتيجة النهائية للعلاج؛ تتم مقارنة الصور قبل وبعد، وعند الحاجة تُطرح تعديلات طفيفة أو توصيات تكميلية. هدف هذه المرحلة هو التأكد من الوصول إلى نتيجة ثابتة ومتناسقة ومرضية لكم تمامًا.",
    },
  ],
  cta: "ابدأ رحلتي",
} satisfies PatientJourneyDictionary;

export const patientStories = {
  heading: "قصص حقيقية لمرضانا",
  subheading:
    "في عيادة الدكتور عليرضا صديقي، لا تُعدّ أي جراحة مجرد «عملية»؛ بل بداية فصل جديد في حياة إنسان. في هذا القسم ستشاهدون مقاطع وثائقية قصيرة وفيديوهات حقيقية وتقييمات موثقة على Google ولحظات موثقة على Instagram؛ دون ممثلين، ودون مبالغة، بقصص حقيقية لمرضانا.",
  videoLabel: "توثيق حقيقي — دون ممثلين",
  moreThanLabel: "أكثر من",
  googleReviewCount: "X",
  googleBadge: "تقييم بخمس نجوم على Google",
  instagramBadge: "عشرات القصص قبل وبعد على Instagram",
  evidence: [
    { id: "video-1", type: "video", caption: "القلق قبل عملية الأنف" },
    {
      id: "review-1",
      type: "review",
      name: "مريم، 32 عامًا",
      quote: "«شعرت بالطمأنينة منذ جلسة الاستشارة الأولى؛ وكانت النتيجة بالضبط كما تمنيت.»",
    },
    { id: "instagram-1", type: "instagram", caption: "Before / After – Nose Surgery" },
    { id: "video-2", type: "video", caption: "أول نظرة على الملامح الجديدة" },
    { id: "photo-1", type: "photo" },
  ],
  photoStories: [
    { quote: "بعد سنوات، أقف من جديد أمام الكاميرا بكل ثقة وهدوء.", meta: "سجل علاجي — استعادة الثقة بالنفس" },
    { quote: "لأول مرة، أشعر بالسعادة عند رؤية صوري.", meta: "سجل علاجي — جراحة تجميل الأنف" },
    { quote: "أشعر أن ملامح وجهي أصبحت أخيرًا منسجمة مع روحي.", meta: "سجل علاجي — جراحة الفك والذقن" },
    { quote: "وجدت الثقة بالنفس التي كنت أبحث عنها منذ سنوات.", meta: "سجل علاجي — تجديد شباب الوجه" },
    { quote: "لم أعد أتجنب النظر إلى صوري القديمة.", meta: "سجل علاجي — جراحات تجميل الوجه" },
  ],
  playAriaLabel: "تشغيل الفيلم الوثائقي",
  verifiedOnGoogleLabel: "موثّق على Google",
} satisfies PatientStoriesDictionary;

export const knowledgeCenter = {
  eyebrow: "مركز المعرفة",
  heading: "المجلة العلمية ودليل مرضى الدكتور صديقي",
  subheading: "مقالات علمية، فيديوهات تثقيفية، وإجابات عن أكثر أسئلة المرضى شيوعًا.",
  articles: {
    feature: {
      iconId: "rhinoplasty",
      label: "جراحة تجميل الأنف",
      title: "كيف نستعد لجراحة أنف علمية وآمنة؟",
      lead: "الاستعداد الصحيح قبل جراحة الأنف، من اختيار الجراح إلى العناية في الأيام التي تسبق العملية، له دور مباشر في السلامة وجودة النتيجة النهائية. في هذا المقال نستعرض الخطوات العلمية لهذا الاستعداد.",
      href: "/blog/rhinoplasty-preparation",
    },
    side: [
      {
        iconId: "dental-implant",
        label: "زراعة الأسنان المتقدمة",
        title: "الدليل الكامل لزراعة الأسنان للمرضى ذوي كثافة العظم المنخفضة",
        summary: "مراجعة علمية لتحديات زراعة الأسنان لدى المرضى ذوي الكثافة العظمية المنخفضة، وأحدث الطرق للوصول إلى نتيجة ثابتة.",
        href: "/blog/dental-implant-low-bone-density",
      },
      {
        iconId: "jaw-surgery",
        label: "جراحة الفك (ارتوگناتيك)",
        title: "ما هي علامات الحاجة لجراحة الفك والذقن؟",
        summary: "من مشاكل المضغ والتنفس إلى عدم تناسق الوجه؛ ما هي العلامات التي تستدعي تقييمًا تخصصيًا لجراحة الفك؟",
        href: "/blog/orthognathic-signs",
      },
      {
        iconId: "facial-rejuvenation",
        label: "تجديد شباب الوجه",
        title: "متى يجب التفكير في تجديد شباب الوجه؟",
        summary: "علامات الفقدان الطبيعي لحجم ومرونة جلد الوجه، والطرق العلمية المتوازنة المتاحة اليوم لتجديد الشباب.",
        href: "/blog/facial-rejuvenation-signs",
      },
    ],
  },
  readMoreCta: "متابعة القراءة",
} satisfies KnowledgeCenterDictionary;

export const videoHub = {
  heading: "فيديوهات وثائقية وتثقيفية",
  subheading: "مزيج من الأفلام الوثائقية الحقيقية للمرضى، وشروحات علمية من الدكتور صديقي، وأدلة لما قبل وبعد جراحات الأنف والزراعة والفك والوجه.",
  categories: [
    { id: "patient-stories", label: "أفلام وثائقية للمرضى" },
    { id: "educational", label: "فيديوهات تثقيفية" },
    { id: "before-after", label: "قبل وبعد" },
  ],
  videos: [
    {
      id: "v1",
      category: "patient-stories",
      iconId: "rhinoplasty",
      title: "رحلة مريضة من الخوف إلى نتيجة جراحة الأنف",
      summary: "فيلم وثائقي قصير يتتبع الرحلة الحقيقية لإحدى المريضات؛ من قلق جلسة الاستشارة الأولى حتى لحظة رؤية النتيجة النهائية.",
      duration: "?",
    },
    {
      id: "v2",
      category: "patient-stories",
      iconId: "jaw-surgery",
      title: "شهادة مريض حول التعافي بعد جراحة الفك",
      summary: "تجربة حقيقية لأحد المرضى خلال فترة التعافي من جراحة الفك والعودة التدريجية لحياته اليومية.",
      duration: "?",
    },
    {
      id: "v9",
      category: "patient-stories",
      iconId: "facial-cosmetic",
      title: "قصة مريضة مع جراحة تجميل الوجه",
      summary: "تجربة حقيقية لمريضة، من مرحلة اتخاذ القرار حتى فترة التعافي بعد جراحة تجميل الوجه.",
      duration: "?",
    },
    {
      id: "v3",
      category: "educational",
      iconId: "rhinoplasty",
      title: "زراعة الأسنان المتقدمة؛ ما الذي يجب معرفته قبل اتخاذ القرار؟",
      summary: "شرح علمي من الدكتور صديقي حول عملية التقييم، واختيار الطريقة المناسبة، والمراحل الأساسية لزراعة الأسنان.",
      duration: "?",
    },
    {
      id: "v4",
      category: "educational",
      iconId: "dental-implant",
      title: "خطوات الاستعداد لجراحة الأنف",
      summary: "ما هي الفحوصات اللازمة قبل جراحة الأنف، وكيف يستعد المريض ليوم العملية.",
      duration: "?",
    },
    {
      id: "v5",
      category: "educational",
      iconId: "jaw-surgery",
      title: "ما الذي يجب توقعه من جراحة الفك والذقن؟",
      summary: "نظرة عامة على مراحل جراحة الفك، والمخاطر المحتملة، والجدول الزمني الواقعي لرؤية النتيجة النهائية.",
      duration: "?",
    },
    {
      id: "v6",
      category: "before-after",
      iconId: "rhinoplasty",
      title: "قبل وبعد: جراحة تجميل الأنف",
      summary: "مقارنة مصورة لنتيجة إحدى عمليات تجميل الأنف، مع شرح للتغييرات الرئيسية.",
      duration: "?",
    },
    {
      id: "v7",
      category: "before-after",
      iconId: "facial-cosmetic",
      title: "قبل وبعد: جراحات تجميل الوجه",
      summary: "نموذج للتناسق والانسجام الذي تم تحقيقه في إحدى جراحات تجميل الوجه.",
      duration: "?",
    },
    {
      id: "v8",
      category: "before-after",
      iconId: "dental-implant",
      title: "قبل وبعد: زراعة الأسنان",
      summary: "مقارنة لحالة الأسنان قبل وبعد زراعة الأسنان وإعادة بناء الابتسامة.",
      duration: "?",
    },
  ],
  detailsCta: "عرض المزيد من التفاصيل",
  playAriaLabel: "تشغيل الفيديو",
} satisfies VideoHubDictionary;

export const faqSection = {
  heading: "الأسئلة الشائعة لدى المرضى",
  subheading: "إجابات عن أهم أسئلة المرضى حول جراحة الأنف وزراعة الأسنان وجراحات الفك والوجه؛ لتتخذوا قراركم بهدوء ووعي تام.",
  intro: "الإجابات التالية كتبها الدكتور صديقي شخصيًا.",
  categories: [
    { id: "rhinoplasty", label: "جراحة تجميل الأنف" },
    { id: "dental-implant", label: "زراعة الأسنان" },
    { id: "jaw-surgery", label: "جراحة الفك والوجه" },
  ],
  items: [
    { category: "rhinoplasty", question: "كم يومًا يجب أن أرتاح في المنزل؟", answer: "يخصص معظم المرضى من 5 إلى 7 أيام للراحة الأولية، ثم يعودون تدريجيًا للأنشطة اليومية الخفيفة؛ يُحدَّد الجدول الدقيق خلال جلسة الاستشارة." },
    { category: "rhinoplasty", question: "هل ستكون النتيجة مطابقة تمامًا للصورة المرجعية؟", answer: "يتم التصميم بناءً على تشريح وجهكم الفعلي، وليس نسخًا حرفيًا لصورة نموذجية؛ الهدف هو نتيجة طبيعية تناسب ملامح وجهكم." },
    { category: "rhinoplasty", question: "كم تستغرق مدة تورم الأنف؟", answer: "يخف الجزء الأكبر من التورم خلال الأسابيع الأولى، لكن الشكل النهائي للأنف قد يستمر في التبلور لعدة أشهر بعد ذلك." },
    { category: "rhinoplasty", question: "هل تظهر آثار الغرز بعد العملية؟", answer: "في الأساليب الحديثة، تلتئم مواضع الغرز عادة بسرعة ولا تكون ملحوظة بعد انتهاء فترة النقاهة الأولية." },
    { category: "rhinoplasty", question: "متى يمكنني ارتداء النظارات؟", answer: "يُستأنف استخدام النظارات عادة بعد بضعة أسابيع من العملية وبالتنسيق مع الطبيب، لتجنب الضغط على منطقة العملية." },
    { category: "rhinoplasty", question: "هل يمكن أن يعود الأنف للانحراف مجددًا؟", answer: "مع الالتزام بالعناية بعد العملية والمتابعة المنتظمة، يكون هذا الاحتمال منخفضًا؛ ويتم تقييمه حسب حالتكم خلال الاستشارة." },
    { category: "dental-implant", question: "هل تسبب زراعة الأسنان ألمًا؟", answer: "تتم عملية الزراعة تحت تخدير موضعي، ولا يُبلّغ معظم المرضى عن ألم يُذكر." },
    { category: "dental-implant", question: "كم تستغرق عملية الزراعة؟", answer: "تستغرق الجراحة نفسها عادة من ساعة إلى ساعتين؛ أما مدة العلاج الكاملة حتى الثبات النهائي فتمتد لعدة أشهر." },
    { category: "dental-implant", question: "هل يمكن إجراؤها مع انخفاض كثافة العظم؟", answer: "في كثير من الحالات، لا تزال زراعة الأسنان ممكنة باستخدام تقنيات ترميم وتقوية العظم؛ ويُقيَّم ذلك في الفحص الأولي." },
    { category: "dental-implant", question: "كم سنة تدوم زراعة الأسنان؟", answer: "مع العناية والنظافة المناسبتين، يمكن أن تدوم زراعة الأسنان سنوات طويلة، بل قد تدوم مدى الحياة." },
    { category: "dental-implant", question: "ماذا آكل بعد زراعة الأسنان؟", answer: "يُنصح بتناول الأطعمة الطرية في الأيام الأولى؛ وتتم العودة للنظام الغذائي المعتاد تدريجيًا وبإرشاد الطبيب." },
    { category: "dental-implant", question: "كم عدد الجلسات اللازمة للزراعة؟", answer: "حسب حالة المريض، يتم العلاج عادة على عدة مراحل تشمل الزراعة والشفاء وتركيب التاج النهائي." },
    { category: "jaw-surgery", question: "كم تستغرق فترة التعافي من جراحة الفك؟", answer: "تستغرق فترة النقاهة الأولية عادة بضعة أسابيع، ويكتمل التعافي الوظيفي الكامل خلال الأشهر التالية." },
    { category: "jaw-surgery", question: "هل سيتغير شكل وجهي؟", answer: "نعم، عادة ما يكون لتصحيح موضع الفك أثر إيجابي على التناسق العام للوجه أيضًا؛ ويتم محاكاة هذه التغييرات قبل العملية." },
    { category: "jaw-surgery", question: "كم ساعة تستغرق جراحة الفك؟", answer: "حسب تعقيد الحالة، تستغرق هذه الجراحة عادة بضع ساعات؛ وتُناقش التفاصيل الدقيقة خلال الاستشارة." },
    { category: "jaw-surgery", question: "هل يصبح الكلام صعبًا بعد العملية؟", answer: "قد تكون هناك صعوبة خفيفة في الأيام الأولى، تزول تدريجيًا خلال فترة النقاهة." },
    { category: "jaw-surgery", question: "متى يمكنني تناول الطعام الصلب؟", answer: "يُنصح بنظام غذائي طري في البداية؛ وتتم العودة للطعام الصلب تدريجيًا وفق برنامج الطبيب." },
    { category: "jaw-surgery", question: "هل تتطلب هذه الجراحة تخديرًا عامًا؟", answer: "نعم، تُجرى هذه الجراحة عادة تحت تخدير عام ووفقًا لأحدث المعايير السريرية." },
  ],
} satisfies FaqSectionDictionary;

export const assistantFlow = {
  // Round 2026-07-17 (Smart Assistant product redesign): exact new
  // opening copy per the Persian original; "متابعة الموعد" dropped from
  // the 5 main actions to match the new exact list.
  openingMessage: "مرحبًا، أنا المساعد الذكي لعيادة الدكتور عليرضا صديقي. يمكنني مساعدتكم في تحديد المسار المناسب لاستشارتكم أو حجزكم.",
  mainActions: [
    { id: "consultation_booking", label: "احجز استشارة" },
    { id: "service_selection", label: "اختيار الخدمة المناسبة" },
    { id: "triage", label: "تقييم أولي" },
    { id: "cost_question", label: "سؤال عن التكلفة" },
    { id: "care_guidance", label: "تعليمات ما قبل وبعد" },
  ],
  // Round 2026-07-13 (taxonomy correction): derived from
  // `src/content/services.ts` (`SERVICES`), plus `general_consultation`
  // (the one non-specialty catch-all — skips triage entirely).
  services: [...SERVICES.map((service) => ({ id: service.id, label: service.assistantLabel.ar })), { id: "general_consultation", label: "استشارة عامة" }],
  triageQuestions: {
    rhinoplasty: [
      "هل سبق أن أجريتم جراحة أنف من قبل؟",
      "ما هدفكم الأساسي؟ الجمال، التنفس، التصحيح، أم كلاهما؟",
      "هل لديكم أمراض مزمنة أو تتناولون أدوية معينة؟",
      "هل لديكم صور جاهزة للمراجعة الأولية؟",
    ],
    "orthognathic-surgery": [
      "ما هي مشكلتكم الأساسية؟",
      "هل لديكم صور أو أشعة أو سجلات طبية سابقة؟",
      "هل تعانون من ألم أو محدودية حركة أو مشاكل وظيفية؟",
    ],
    "advanced-dental-implant": [
      "كم عدد الأسنان التي تحتاج إلى زراعة؟",
      "هل لديكم أشعة أو صورة حديثة للأسنان؟",
      "هل لديكم أمراض مزمنة مثل السكري أو مشاكل في كثافة العظم؟",
    ],
    // TODO(content): draft — needs clinical sign-off.
    "impacted-tooth-surgery": [
      "ما هو السن المطمور الذي يقلقكم؟",
      "هل تعانون من ألم أو تورم أو التهاب في اللثة في تلك المنطقة؟",
      "هل لديكم أشعة أو صورة حديثة للأسنان؟",
    ],
    // TODO(content): draft — needs clinical sign-off.
    "facial-rejuvenation": [
      "ما المنطقة التي يقلقكم ترهلها أو فقدان حجمها أكثر؟",
      "هل سبق أن أجريتم حقنًا أو إجراء تجديد آخر؟",
      "هل لديكم أمراض مزمنة أو حساسية معينة؟",
    ],
    // TODO(content): draft — needs clinical sign-off.
    "facial-cosmetic-surgery": [
      "ما الجزء من الوجه الذي ترغبون بتصحيحه؟",
      "هل سبق أن أجريتم جراحة تجميل للوجه؟",
      "هل لديكم أمراض مزمنة أو تتناولون أدوية معينة؟",
    ],
  },
  safetyNotice: "تُستخدم هذه المعلومات فقط للفرز الأولي وتوجيه مسار الاستشارة. ويتم اتخاذ القرار النهائي بعد مراجعة الطبيب.",
  // Round 2026-07-18 (conversation-first UX pass) — إرشاد تكلفة مخصص وحتمي حسب الخدمة (البند 9).
  costGuidance: {
    generic:
      "تعتمد التكلفة الدقيقة على نوع الخدمة والمراجعة السريرية، وأحيانًا على الحاجة لصور أشعة، ولا يمكن تحديد رقم نهائي دون الفحص. لإرشادكم بدقة أكبر، هل يمكنكم إخباري بالخدمة التي تهمكم لأقدم تقديرًا أوليًا بناءً عليها؟",
    byService: {
      "advanced-dental-implant":
        "تعتمد تكلفة زراعة الأسنان على عدد الوحدات، وحالة العظم، والحاجة المحتملة لرفع الجيب الفكي أو ترقيع العظم، ونوع الدعامة، ومراجعة الصور. لا يمكن تحديد رقم نهائي دون المراجعة، لكن للحصول على تقدير أولي، كم سنًا تفكرون في زراعته، وهل لديكم صورة أشعة أو CBCT حديثة؟",
      rhinoplasty:
        "تعتمد تكلفة جراحة الأنف على نوع الأنف، وأي جراحة سابقة، ومقدار التصحيح المطلوب، ونتيجة الفحص الحضوري، ولا يمكن تحديد رقم دقيق دون الزيارة. للحصول على تقدير أولي، هل سبق أن أجريتم جراحة أنف، وهل هدفكم الأساسي هو الجمال أو التنفس أو كلاهما؟",
      "facial-rejuvenation":
        "تعتمد تكلفة تجميل الوجه على نوع الطريقة المختارة (حقن، شد، أو مزيج)، وحالة البشرة والترهل، ومدة بقاء النتيجة وعدد الجلسات المطلوبة. للحصول على تقدير أولي، ما هي المنطقة الأكثر إزعاجًا لكم في الوجه، وهل سبق أن أجريتم إجراءً مشابهًا؟",
      // Round 2026-07-21 (Smart Clinic Assistant V2) — استكمال التغطية لجميع الخدمات الست.
      "impacted-tooth-surgery":
        "تعتمد تكلفة جراحة الضرس المطمور على موقع وعمق الضرس، وتعقيد الجراحة، والحاجة المحتملة لصور إضافية، ولا يمكن تحديد رقم نهائي دون مراجعة الصورة. للحصول على تقدير أولي، أي ضرس مطمور يقلقكم، وهل لديكم صورة أشعة حديثة؟",
      "facial-cosmetic-surgery":
        "تعتمد تكلفة جراحة تجميل الوجه على المنطقة المستهدفة، ومقدار التصحيح المطلوب، واحتمال دمجها بإجراءات أخرى، ولا يمكن تحديد رقم دقيق دون فحص حضوري. للحصول على تقدير أولي، ما هو الجزء من وجهكم الذي تودون تصحيحه؟",
      "orthognathic-surgery":
        "تعتمد تكلفة جراحة الفك على مقدار ونوع التصحيح المطلوب (الفك العلوي أو السفلي أو كلاهما)، والحاجة للتنسيق مع تقويم الأسنان، ونتيجة الصور الشعاعية، ولا يمكن تحديد رقم دقيق دون فحص متخصص. للحصول على تقدير أولي، هل مشكلتكم الأساسية هي تقدم/تراجع الفك، عدم تناسق، أم مشكلة في المضغ أو إطباق الأسنان؟",
    } as Record<string, string>,
  },
  // Round 2026-07-18 — أسماء قصيرة ودارجة للخدمات لاستخدامها في تسميات الرقاقات.
  serviceShortLabels: {
    "advanced-dental-implant": "زراعة الأسنان",
    "impacted-tooth-surgery": "الضرس المطمور",
    "facial-rejuvenation": "تجميل الوجه",
    "facial-cosmetic-surgery": "جراحة تجميل الوجه",
    "orthognathic-surgery": "جراحة الفك",
    rhinoplasty: "تجميل الأنف",
    general_consultation: "استشارة عامة",
  },
  // Round 2026-07-20 (production UX fix, item 3) — إجابات "ما هي أفضل طريقة لحالتي"، تختلف عن إرشاد التكلفة.
  serviceGuidance: {
    byService: {
      "advanced-dental-implant":
        "بالنسبة لزراعة الأسنان، تعتمد أفضل طريقة على حالة العظم، وعدد الأسنان المفقودة، وموقعها، وصحة اللثة، ونتيجة صورة الأشعة أو CBCT. المسار المعتاد هو إجراء الفحص ومراجعة الصور أولاً، ثم تحديد ما إذا كانت الزراعة المباشرة ممكنة أو تحتاج إلى تحضير مثل ترقيع العظم أو رفع الجيب الفكي.\n\nلإرشادكم بدقة أكبر، يرجى إخباري:\n1. كم سنًا تحتاجون لزراعته؟\n2. الفك العلوي أم السفلي؟\n3. هل لديكم صورة أشعة أو CBCT حديثة؟",
      rhinoplasty:
        "بالنسبة لجراحة الأنف، تعتمد أفضل طريقة على بنية العظم والغضروف، وهدفكم الأساسي، وأي جراحة سابقة. المسار المعتاد هو إجراء فحص حضوري لبنية الأنف أولاً لتحديد التقنية المناسبة ومقدار التصحيح المناسب لكم.\n\nلإرشادكم بدقة أكبر، يرجى إخباري:\n1. هل هدفكم الأساسي الجمال أم التنفس أم كلاهما؟\n2. هل سبق أن أجريتم جراحة أنف؟\n3. هل لديكم مشكلة تنفسية أو انحراف في الحاجز الأنفي؟",
      "facial-rejuvenation":
        "بالنسبة لتجميل الوجه، تعتمد أفضل طريقة على نوع انزعاجكم (ترهل، تجاعيد، أو فقدان حجم)، وحالة بشرتكم، والنتيجة المرغوبة. المسار المعتاد هو إجراء فحص أولاً لتحديد ما إذا كان الحقن أو الشد أو مزيج منهما هو الأنسب.\n\nلإرشادكم بدقة أكبر، يرجى إخباري:\n1. ما هي المنطقة الأكثر إزعاجًا لكم في الوجه؟\n2. هل سبق أن أجريتم حقنًا أو إجراء تجميل؟\n3. هل تبحثون عن نتيجة مؤقتة أم أطول أمدًا؟",
      // Round 2026-07-21 (Smart Clinic Assistant V2) — استكمال التغطية لجميع الخدمات الست.
      "impacted-tooth-surgery":
        "بالنسبة لجراحة الضرس المطمور، تعتمد أفضل طريقة على الموقع الدقيق للضرس (قريب من العصب أو الجيب الفكي)، واتجاهه، ونتيجة صورة الأشعة. عادة تتم مراجعة الصورة (بانورامية أو CBCT) أولاً لتحديد ما إذا كانت الجراحة بسيطة أم تحتاج تحضيرًا إضافيًا.\n\nلإرشادكم بدقة أكبر، هل لديكم ألم أو تورم، وهل لديكم صورة أشعة حديثة؟",
      "facial-cosmetic-surgery":
        "بالنسبة لجراحة تجميل الوجه، تعتمد أفضل طريقة على المنطقة المستهدفة (الجفون، الخدود، خط الفك، أو مزيج)، وحالة الجلد والأنسجة، وهدفكم النهائي. المسار المعتاد هو إجراء فحص حضوري أولاً لتحديد التقنية المناسبة لبنية وجهكم.\n\nلإرشادكم بدقة أكبر، أي جزء من وجهكم تودون تصحيحه؟",
      "orthognathic-surgery":
        "بالنسبة لجراحة الفك، يبدأ المسار المعتاد بمراجعة العلاقة بين الفكين، وحالة الأسنان، والصور الشعاعية، وهدفكم العلاجي. في بعض الحالات يكفي تصحيح الذقن أو شكل الوجه فقط، بينما تحتاج حالات أخرى لتقييم متخصص للفك العلوي والسفلي.\n\nلإرشادكم بدقة أكبر، ما هي مشكلتكم الأساسية؟",
    } as Record<string, string>,
  },
  // Round 2026-07-21 (Smart Clinic Assistant V2, item 4) — رقاقات مخاوف جراحة الفك، كل واحدة برد حقيقي غير تشخيصي.
  jawConcernChips: {
    frontBack: {
      label: "تقدم أو تراجع الفك",
      contextLabel: "علاقة الفك العلوي والسفلي",
      reply:
        "فهمت. مشكلتكم تتعلق بعدم توافق العلاقة بين الفك العلوي والسفلي. في مثل هذه الحالات، عادة ما تكون هناك حاجة لمراجعة الصور الشعاعية، وضع الأسنان، وعلاقة الإطباق لتحديد ما إذا كان تقويم الأسنان وحده، أو جراحة الفك، أو مزيج من الاثنين هو المسار المناسب.\n\nللمتابعة، هل لديكم صورة أشعة أو CBCT حديثة؟",
    },
    deviation: {
      label: "عدم تناسق الفك",
      contextLabel: "عدم تناسق الفك",
      reply:
        "فهمت. مشكلتكم تتعلق بعدم تناسق الفك. هذا عادة يحتاج تقييمًا ثلاثي الأبعاد للوجه وأحيانًا صورة CBCT لتحديد مقدار وسبب عدم التناسق.\n\nللمتابعة، هل لديكم صورة أشعة أو CBCT حديثة؟",
    },
    bite: {
      label: "مشكلة في المضغ أو إطباق الأسنان",
      contextLabel: "مشكلة المضغ والإطباق",
      reply:
        "فهمت. مشكلتكم تتعلق بصعوبة المضغ أو عدم إطباق الأسنان بشكل صحيح. مثل هذه العلامات عادة تُقيَّم مع تقييم تقويم الأسنان ومراجعة الصور الشعاعية.\n\nللمتابعة، هل لديكم صورة أشعة أو CBCT حديثة؟",
    },
    aesthetics: {
      label: "تجميل الذقن أو شكل الوجه",
      contextLabel: "تجميل الذقن وشكل الوجه",
      reply:
        "فهمت. انزعاجكم الأساسي هو غالبًا شكل الذقن أو تجميل الوجه. حسب الفحص، قد يكفي إجراء أكثر محدودية مثل جراحة الذقن، أو قد يلزم مراجعة أشمل للفك.\n\nللمتابعة، هل لديكم صورة أشعة أو CBCT حديثة؟",
    },
  },
  leadForm: {
    fullNameLabel: "الاسم الكامل",
    mobileLabel: "رقم الجوال",
    cityLabel: "المدينة",
    ageRangeLabel: "الفئة العمرية (اختياري)",
    ageRangePlaceholder: "مثال: 25-35",
    contactMethodLabel: "طريقة التواصل المفضلة",
    contactMethods: { phone: "مكالمة هاتفية", whatsapp: "واتساب", instagram: "إنستغرام" },
    notesLabel: "ملاحظات (اختياري)",
    submitCta: "متابعة",
  },
  ui: {
    openButtonLabel: "فتح المساعد الذكي للعيادة",
    closeButtonLabel: "إغلاق المساعد",
    backToMenu: "العودة إلى القائمة الرئيسية",
    chooseServiceCta: "اختر خدمة",
    serviceSelectionEyebrow: "اختيار الخدمة",
    serviceSelectionTitle: "ما الخدمة التي تهمكم؟",
    triageEyebrow: "التقييم الأولي",
    triageAnswerPlaceholder: "إجابتكم...",
    consultationBookingEyebrow: "حجز استشارة",
    beforeAfterTitle: "أعمالنا",
    articlesTitle: "المقالات",
    imageUploadTitle: "إرسال صورة",
    careGuidanceTitle: "تعليمات ما قبل وبعد الإجراء",
    closeCta: "إغلاق",
    submittingLabel: "جارٍ الإرسال...",
    selectPlaceholder: "اختر...",
    paymentStepEyebrow: "خطوة الدفع",
    freeTextPlaceholder: "اكتبوا سؤالكم هنا...",
    freeTextSubmitCta: "اسأل",
    freeTextThinkingLabel: "جارٍ التحقق...",
    freeTextUnavailableMessage: "الردود الذكية غير متاحة مؤقتًا في الوقت الحالي. يمكنكم استخدام مسارات الإرشاد السريع، أو الاتصال بالعيادة مباشرة للتنسيق.",
    askQuestionCta: "اطرح سؤالاً",
  },
  steps: {
    consultationBooking: {
      intro: "لحجز استشارة، يرجى اختيار الخدمة التي تهمكم. سيقوم فريق العيادة، بعد المراجعة الأولية، بإرشادكم لإكمال المسار.",
    },
    imageUploadFuture: {
      notice: "سيتم تفعيل إرسال الصور للمراجعة الأولية في مرحلة لاحقة.",
    },
    beforeAfter: {
      body: "يمكنكم مشاهدة أعمال العيادة الحقيقية في قسم «النتائج السريرية» بالصفحة الرئيسية.",
      cta: "عرض أعمالنا",
    },
    articles: {
      body: "يمكنكم قراءة المقالات العلمية وأدلة المرضى في قسم «مركز المعرفة» بالصفحة الرئيسية.",
      cta: "زيارة مركز المعرفة",
    },
    careGuidance: {
      body: "أدلة العناية قبل وبعد كل إجراء متوفرة في صفحة «تعليمات ما قبل وبعد الإجراء» المخصصة.",
      cta: "عرض أدلة العناية",
    },
  },
  appointment: {
    heading: "الوقت المقترح للاستشارة",
    realAvailabilityNotice: "اختر أحد الأوقات المتاحة أدناه. هذا «طلب» فقط — يتم تأكيد موعدكم بعد اتصال منسقة العيادة بكم.",
    loadingOptionsNotice: "جارٍ التحقق من الأوقات المتاحة…",
    noRealAvailabilityNotice: "لا توجد أوقات متاحة للعرض حاليًا في النظام. يرجى إدخال الوقت المفضل لديكم ليتصل بكم منسق العيادة للتنسيق.",
    preferredDayLabel: "اليوم المفضل",
    preferredTimeLabel: "الفترة الزمنية المفضلة",
    timeRangeOptions: ["صباحًا (9 - 12)", "ظهرًا (12 - 3)", "عصرًا (3 - 6)"],
    submitCta: "إرسال طلب الحجز",
    requestSubmittedNotice: "هذا «طلب حجز» وليس موعدًا نهائيًا — سيتواصل معكم فريق العيادة بعد المراجعة.",
  },
  payment: {
    heading: "دفع العربون / رسوم الاستشارة",
    gatewayPendingNotice: "سيتم تفعيل دفع العربون الإلكتروني في المرحلة القادمة. في هذا الإصدار، يتم تسجيل طلبكم وستتصل بكم منسقة العيادة للتنسيق.",
    amountLabel: "المبلغ",
    currencyLabel: "عملة الدفع",
    currencyOptions: { IRR: "ريال إيراني", USDT: "تيثر (USDT)" },
  },
  // Round 2026-07-17 (Smart Assistant product redesign).
  identify: {
    description: "لمتابعة أسئلتكم وطلبكم، يرجى إدخال اسمكم ورقم جوالكم. بعد التحقق من الرقم، يمكنكم طرح حتى 3 أسئلة رئيسية على المساعد أو متابعة مسار الحجز.",
    submitCta: "متابعة",
  },
  aiConversation: {
    verifiedIntro: "تم التحقق من رقمكم. يمكنكم الآن طرح حتى 3 أسئلة رئيسية حول العلاج أو التحضير أو العناية أو مسار الحجز.",
    questionsRemainingLabels: {
      "3": "لإرشادكم بدقة أكبر، تبقّت لكم 3 أسئلة رئيسية.",
      "2": "لإرشادكم بدقة أكبر، تبقّى لكم سؤالان رئيسيان.",
      "1": "لإرشادكم بدقة أكبر، تبقّى لكم سؤال رئيسي واحد.",
    },
    // Round 2026-07-22 (focused-conversation UX fix, item 8) — exact required copy.
    // Round 2026-07-22 (V2.2, item 9) — exact required copy (supersedes the previous round's near-identical wording).
    limitReachedNotice: "تمت الإجابة عن أسئلتكم الرئيسية الثلاثة. لمراجعة أدق، من الأفضل متابعة أحد المسارات التالية.",
    safetyNotice: "هذا الإرشاد لا يغني عن الفحص ورأي الطبيب؛ يُتخذ القرار النهائي بعد مراجعة فريق العيادة.",
    viewSuggestedStepCta: "عرض",
    askAnotherCta: "السؤال التالي",
    relatedCareCta: "عناية ذات صلة",
    continueBookingCta: "متابعة الحجز",
    resumeBookingPrompt: "هل نتابع الحجز؟",
    changeServiceCta: "تغيير الخدمة",
    fallbackPrompt: "لإرشادكم بدقة أكبر، يرجى إخباري بأي موضوع يتعلق سؤالكم أكثر؟",
    fallbackChips: { cost: "التكلفة", service: "اختيار الخدمة", care: "العناية", booking: "حجز استشارة" },
    costEstimateCta: "تقدير أولي للتكلفة",
    bookServiceTemplate: "حجز استشارة {service}",
    careForServiceTemplate: "عناية {service}",
    correctionAcknowledgement: "أنتم محقون، سأجيب بدقة أكبر.",
    hasXrayCta: "لدي صورة / CBCT",
    noXrayCta: "ليس لدي صورة",
    hasXrayReply:
      "ممتاز. رفع الصور مباشرة غير مفعّل في هذا الإصدار حاليًا، لكن يرجى إحضار الصورة أو الـCBCT إلى جلسة الاستشارة ليتمكن فريق العيادة من مراجعتها بدقة. هل تودون تحديد موعد للفحص الحضوري/الاستشارة؟",
    noXrayReply:
      "لا مشكلة. سيرشدكم فريق العيادة في جلسة الاستشارة إلى كيفية الحصول على صورة أو CBCT — لا داعي لتجهيزها الآن. هل تودون تحديد موعد للفحص الحضوري/الاستشارة؟",
    preparationQuestionCta: "سؤال عن التحضير",
    handoffNotice: "لمراجعة أدق، يجب أن يطّلع فريق العيادة على حالتكم. يُسجَّل طلبكم مع ملخص هذه المحادثة ليتمكن فريق العيادة من المتابعة بكامل السياق.",
    // Round 2026-07-22 (focused-conversation UX fix): recap templates (item 7), resume-card third chip (item 4), post-limit composer lock (item 3).
    questionRecapTemplate: "سؤال حول {service}",
    serviceSelectedPrefix: "تم اختيار الخدمة: ",
    timeSelectedPrefix: "تم اختيار الوقت: ",
    cancelBookingCta: "إلغاء الحجز",
    requestCallCta: "طلب اتصال من العيادة",
    composerLocked: {
      prompt: "للمتابعة، يرجى اختيار أحد المسارات التالية.",
      careCta: "عرض العناية ذات الصلة",
    },
    recoveryQuestionCta: "سؤال حول فترة النقاهة",
    verifiedContextLabel: "تم التحقق من الرقم",
    viewJourneySummaryCta: "عرض ملخص المسار",
  },
  contextualAsk: {
    prompt: "هل لديكم سؤال قبل المتابعة؟",
    cta: "اطرح سؤالاً",
  },
  confirmation: {
    heading: "تم استلام طلبكم",
    body: "سيتواصل معكم فريقنا قريبًا لتنسيق الخطوات التالية.",
    summaryLabel: "ملخص الطلب",
    serviceLabel: "الخدمة المختارة",
    timeLabel: "الوقت المختار أو المقترح",
    contactStatusLabel: "حالة التواصل",
    contactStatusValue: "قيد المراجعة من فريق العيادة",
    tipsLabel: "ملاحظات قصيرة قبل الاتصال",
    tips: [
      "يرجى إبقاء هاتفكم الجوال في متناول اليد ليتمكن فريقنا من الاتصال بكم.",
      "في حال تغيّر الوقت المقترح، يرجى إبلاغ منسقة العيادة.",
      "يمكنكم أيضًا التواصل مع العيادة عبر واتساب للتنسيق بشكل أسرع.",
    ],
    viewCareCta: "عرض العناية ذات الصلة",
    askAnotherCta: "طرح سؤال آخر",
  },
  validation: {
    mobileInvalid: "رقم الجوال غير صالح — يرجى إدخال رقم جوال إيراني صحيح (مثال: 0912xxxxxxx).",
    fullNameRequired: "يرجى إدخال الاسم الكامل.",
  },
  phoneVerification: {
    eyebrow: "التحقق من رقم الجوال",
    description: "لإرشادكم بدقة أكبر وتمكين العيادة من المتابعة معكم، يرجى التحقق من رقم جوالكم.",
    mobileLabel: "رقم الجوال",
    requestCodeCta: "طلب الرمز",
    sendingLabel: "جارٍ الإرسال...",
    codeLabel: "رمز التحقق",
    codePlaceholder: "رمز مكوّن من 6 أرقام",
    verifyCta: "تحقق",
    verifyingLabel: "جارٍ التحقق...",
    changeMobileCta: "تغيير الرقم",
    resendCta: "إعادة إرسال الرمز",
    smsUnavailableMessage: "التحقق عبر الرسائل النصية غير متاح مؤقتًا في الوقت الحالي. يرجى الاتصال بالعيادة أو استخدام واتساب للحجز أو المتابعة.",
    smsUnavailableBookingMessage: "التحقق من رقم الجوال مطلوب لإتمام طلب الحجز. هذه الخطوة غير متاحة مؤقتًا حاليًا؛ يرجى الاتصال بالعيادة مباشرة.",
    invalidMobileMessage: "رقم الجوال غير صالح.",
    // Round 2026-07-19 (OTP UX/verification fix, item 6).
    invalidCodeMessage: "الرمز المدخل غير صحيح. يرجى التحقق من الرمز المُرسل إليكم عبر الرسائل النصية.",
    expiredCodeMessage: "انتهت صلاحية هذا الرمز. يرجى طلب رمز جديد.",
    tooManyAttemptsMessage: "عدد المحاولات تجاوز الحد المسموح. يرجى الانتظار قليلاً ثم طلب رمز جديد.",
    verifyUnavailableMessage: "يواجه التحقق من الرمز مشكلة حاليًا. يرجى المحاولة مرة أخرى بعد لحظات.",
    devBypassNotice: "🔧 وضع التطوير: لا توجد خدمة رسائل نصية متصلة. أدخلوا الرمز 000000 للمتابعة.",
    // Round 2026-07-19 (item 5) — `{time}` يُستبدل من جهة العميل.
    codeExpiryLabel: "مهلة صلاحية الرمز: {time}",
    resendCooldownLabel: "يمكنكم إعادة إرسال الرمز خلال {time} ثانية",
    codeExpiredNotice: "انتهت مهلة الرمز. يرجى طلب رمز جديد.",
    autoVerifyingLabel: "جارٍ التحقق من الرمز...",
    codeSentRecap: "تم إرسال رمز التحقق إلى {mobile}.",
  },
} satisfies AssistantFlowDictionary;

// Added 2026-07-13 (delivery-mode round) — content pages required by the
// contract. First-pass professional Arabic, same standing caveat as
// above (not yet clinically/legally reviewed). Disclaimer string is
// Hamid's exact given wording.
// Round 2026-07-13، نفس اليوم (إعادة تصميم صفحة "عن الطبيب" المتميزة) —
// ترجمة عربية احترافية، وليست ترجمة حرفية للنص الفارسي. لا وعود غير
// مدعومة ("الأفضل"، "نتائج مضمونة"، "تناظر مثالي") في أي مكان.
const about = {
  eyebrow: "عن الدكتور صديقي",
  title: "الدكتور عليرضا صديقي",
  subtitle: "جرّاح واستشاري جراحة الفم والفك والوجه",
  positioning: "نهج دقيق وعلمي وذو حس جمالي في جراحات الفك والوجه والأنف وزراعة الأسنان.",
  heroCtaPrimary: "احجز استشارة",
  heroCtaSecondary: "عرض مجالات التخصص",
  heroTrustMarkers: ["جرّاح واستشاري جراحة الفم والفك والوجه", "زمالة جراحات تجميل وترميم الوجه", "تخطيط علاجي مخصص لكل مريض"],
  metaTitle: "عن الدكتور علي رضا صديقي | جرّاح الفم والفك والوجه",

  bioEyebrow: "المسار العلمي",
  bioHeading: "المسار العلمي والمهني",
  bioBody: [
    "بدأ الدكتور عليرضا صديقي مسيرته المهنية بالحصول على الدكتوراه المهنية في طب الأسنان من جامعة تبريز للعلوم الطبية، ثم واصل تخصصه في جراحة الفم والفك والوجه. ومع تركيزه على جراحات الفك والوجه والترميمات الدقيقة، يجمع بين نظرته العلمية الدقيقة ونهج جمالي في علاج المرضى.",
    "وفي مسيرته اللاحقة، وبعد حصوله على المرتبة الأولى في امتحان زمالة جراحات تجميل وترميم الوجه في جامعة طهران للعلوم الطبية، وجّه تركيزه المهني نحو علاجات تراعي الوظيفة وتناسق الوجه معاً.",
  ],

  credentialsEyebrow: "الاعتماد العلمي",
  credentials: [
    "المرتبة ٥٣ على مستوى إيران في اختبار القبول الجامعي لفرع العلوم التجريبية",
    "الدكتوراه المهنية في طب الأسنان، جامعة تبريز للعلوم الطبية",
    "استشاري جراحة الفم والفك والوجه",
    "المرتبة الأولى في زمالة جراحات تجميل وترميم الوجه، جامعة طهران للعلوم الطبية",
  ],

  certificatesHeading: "الشهادات والاعتمادات العلمية",
  certificatesSubtitle:
    "مجموعة مختارة من شهادات الدكتور صديقي ومشاركاته العلمية في جراحة الفم والفك والوجه وجراحات تجميل وترميم الوجه.",
  certificatesStat: "١٤ شهادة وسجلًا علميًا",
  certificatesButton: "عرض جميع الشهادات",
  certificatesOpenOriginal: "فتح الصورة الأصلية",

  philosophyHeading: "نهج الدكتور صديقي العلاجي",
  philosophy: [
    "في نظر الدكتور صديقي، لا يقتصر نجاح العلاج على تنفيذ تقنية جراحية فحسب. فالفهم الدقيق لبنية الوجه، والإصغاء إلى رغبة المريض، ودراسة الجوانب الوظيفية، وتصميم مسار علاجي مخصص، كلها عناصر أساسية في قرار العلاج.",
    "الهدف هو نتيجة طبيعية ومتناسقة وسليمة طبياً؛ نتيجة تنسجم مع هوية وجه المريض، وتتشكل من خلال تقييم شامل وحوار شفاف.",
  ],

  specialtyHeading: "مجالات التخصص",
  specialtyViewDetailsCta: "عرض التفاصيل",

  technologyHeading: "تخطيط أدق بأدوات حديثة",
  technologyBody:
    "في علاجات الفك والوجه والأنف وزراعة الأسنان، يلعب التخطيط الدقيق دوراً مهماً في اتخاذ القرار. استخدام أدوات مثل المسح ثلاثي الأبعاد والتصوير المتقدم والنمذجة الرقمية، عند الحاجة السريرية، يمكن أن يساعد على فهم أفضل لبنية الوجه والمسار العلاجي وحوار أدق مع المريض.",

  patientRelationshipHeading: "تواصل واضح مع المريض",
  patientRelationshipBody: [
    "من أهم جوانب نهج الدكتور صديقي العلاجي التواصل الواضح والمفهوم مع المريض. من جلسة الاستشارة وحتى العناية بعد العلاج، يُحرص على أن يكون المسار العلاجي مفهوماً ومقسّماً إلى مراحل واضحة وقابلاً للمتابعة.",
    "وتستمر هذه النظرة في تصميم المساعد الذكي للعيادة، حيث يمكن للمريض بدء مسار الاستشارة الأولية، والاطلاع على إرشادات العناية، وتقديم طلب الحجز بتوجيه تدريجي خطوة بخطوة.",
  ],
  patientRelationshipCta: "بدء محادثة مع المساعد الذكي",

  experienceHeading: "السيرة المهنية",
  experience: [
    { period: "٢٠١٩ – ٢٠٢١", place: "عيادة أدينه آذر لطب الأسنان" },
    { period: "٢٠١٩ – ٢٠٢١", place: "مستشفى بهبود، تبريز" },
    { period: "منذ ٢٠٢٠", place: "عيادة حكيم أرسباران، أهر" },
    { period: "منذ ٢٠٢٠", place: "عيادة أستاد شهريار للهلال الأحمر، تبريز" },
    { period: "منذ ٢٠٢١", place: "مستشفى وليعصر الدولي، تبريز" },
  ],

  scientificHeading: "التعلّم والبحث والتعليم",
  scientificBody:
    "إلى جانب النشاط العلاجي، يهتم الدكتور صديقي بالتعلّم المستمر وحضور الفعاليات العلمية والمؤتمرات التخصصية وتبادل الخبرات مع المجتمع المهني. هذا الاهتمام يجعل مسار العلاج مواكباً للمعرفة الحديثة والخبرة العملية والتقييم الدقيق.",
  scientificNote: "كما شارك في أنشطة علمية وتعليمية مرتبطة بمجال زراعة الأسنان وجراحة الفك والوجه.",

  exploreEyebrow: "متابعة الاستكشاف",
  exploreServicesLabel: "خدمات الدكتور صديقي",
  exploreServicesSub: "استعراض كامل لخدمات جراحة الفك والوجه والأنف وزراعة الأسنان.",
  exploreCareLabel: "تعليمات ما قبل وبعد الإجراء",
  exploreCareSub: "إرشادات عامة للاستعداد قبل الجراحة والتعافي بعدها.",
  exploreBeforeAfterLabel: "قبل وبعد",
  exploreBeforeAfterSub: "صور حقيقية للنتائج، مع الإيضاحات اللازمة.",

  ctaHeading: "لست متأكدًا من المسار العلاجي المناسب؟",
  ctaBody: "يمكن للمساعد الذكي للعيادة استقبال معلوماتكم الأولية واقتراح الخدمة المناسبة وتسهيل مسار حجز الاستشارة.",
  ctaButton: "ابدأ الاستشارة",
  ctaSecondaryLabel: "عرض الخدمات",
} satisfies AboutPageDictionary;

const contact = {
  eyebrow: "تواصل معنا",
  title: "ابقوا على تواصل",
  subtitle: "لتنسيق موعد استشارة أو للإجابة عن أسئلتكم، تواصلوا معنا عبر المساعد الذكي أو بيانات التواصل أدناه.",
  formNoticeHeading: "تنسيق المواعيد",
  formNotice: "يتم حالياً تنسيق المواعيد عبر المساعد الذكي للعيادة أو الاتصال المباشر بمكاتبنا. سيتم تفعيل نموذج التواصل الإلكتروني في مرحلة تطوير لاحقة.",
  ctaButton: "بدء محادثة مع المساعد الذكي",
  locationsHeading: "مكاتب العيادة",
  hoursHeading: "ساعات العمل",
} satisfies ContactPageDictionary;

const servicesPage = {
  eyebrow: "الخدمات العلاجية",
  heading: "خدمات جراحة الفك والوجه والتجميل",
  subheading: "تبدأ كل خدمة باستشارة مخصصة، ويتم التخطيط لها بناءً على بنية الوجه والتوقعات الواقعية لكل مريض.",
  viewDetailsCta: "عرض التفاصيل",
  disclaimer: "هذه الصفحة للمعلومات العامة فقط ولا تغني عن الفحص أو رأي الطبيب.",
  beforeAfterCta: "مشاهدة نماذج قبل وبعد",
  assistantCtaHeading: "لست متأكداً من الخدمة المناسبة؟",
  assistantCtaBody: "يقترح المساعد الذكي للعيادة المسار المناسب لكم بعد بضعة أسئلة قصيرة.",
  assistantCtaButton: "البدء مع المساعد الذكي",
  // Round 2026-07-13 (service-page premium redesign): مشترك بين كل صفحات
  // الخدمات الست — تسلسل تشغيلي ثابت من 4 خطوات، وليس محتوى طبياً، لذا
  // نسخة واحدة مشتركة بدلاً من ست نسخ شبه متطابقة.
  heroCtaPrimary: "احجز استشارة",
  heroCtaSecondary: "عرض النتائج ذات الصلة",
  overviewTrustNote: "يُتخذ كل قرار علاجي فقط بعد استشارة دقيقة ومخصصة مع الدكتور صديقي.",
  consultationStepsHeading: "يبدأ مسار استشارتكم من هنا",
  consultationSteps: [
    { title: "البدء مع المساعد الذكي", body: "بضعة أسئلة قصيرة عبر المساعد الذكي للعيادة تسجّل معلوماتكم الأولية." },
    { title: "مراجعة فريق العيادة", body: "يراجع فريق الاستقبال المعلومات المسجّلة ويتواصل معكم لتنسيق موعد الاستشارة." },
    { title: "تخطيط الاستشارة", body: "في جلسة الاستشارة الحضورية، يراجع الدكتور صديقي بنية الحالة ويشرح المسار العلاجي." },
    { title: "تنسيق الخطوات التالية", body: "في حال رغبتكم بالمتابعة، ينسّق فريق العيادة معكم الجدول الزمني والخطوات التالية." },
  ],
  // Round 2026-07-13, same day (تصميم مستوحى من مرجع Dr. William Miami):
  // كتلة تحريرية مشتركة عن "النهج العلاجي" + تعليق شريط قبل وبعد.
  overviewHeading: "نبذة عن العلاج",
  approachEyebrow: "نهجنا العلاجي",
  approachHeading: "دقة وعناية في كل مرحلة",
  approachNote:
    "يخطط الدكتور صديقي كل مرحلة من العلاج بدقة وبناءً على البنية الحقيقية لكل مريض، لا وفق نموذج محدد مسبقاً — من الاستشارة الأولى وحتى المتابعة بعد العلاج.",
  beforeAfterBandHeading: "شاهدوا نتائج حقيقية",
  beforeAfterBandNote: "تختلف نتيجة كل مريض حسب بنيته وظروفه الفردية؛ هذه الصور للاطلاع العام فقط، وليست توقعاً لنتيجتكم الشخصية.",
  careGuideHeading: "دليل العناية ذو الصلة",
  // Round 2026-07-13 (taxonomy correction): exactly the 6 canonical
  // services from `src/content/services.ts` — see fa.ts's matching
  // comment for the full rationale.
  items: [
    {
      slug: "advanced-dental-implant",
      eyebrow: "زراعة الأسنان",
      title: "زراعة الأسنان المتقدمة",
      subtitle: "بديل ثابت للأسنان المفقودة",
      overview: "زراعة الأسنان إجراء لاستبدال جذر السن المفقود بدعامة من التيتانيوم، توفر أساساً ثابتاً للسن الصناعي.",
      suitableForHeading: "لمن تناسب هذه الخدمة عادةً؟",
      suitableFor: ["من فقدوا سناً واحداً أو أكثر", "من لديهم كثافة عظمية مناسبة، أو يحتاجون لتقييم إمكانية ترقيع العظم", "من يبحثون عن بديل أكثر ثباتاً من الحلول المتحركة"],
      consultationPathHeading: "مسار الاستشارة",
      consultationPath: "يُعد تقييم كثافة عظم الفك بالتصوير شرطاً أساسياً لتحديد خطة علاج زراعة دقيقة.",
      processHeading: "مراحل العلاج",
      process: [
        { title: "الاستشارة الأولية", body: "مراجعة حالة الأسنان المفقودة وصحة الفم العامة." },
        { title: "التقييم التصويري", body: "مراجعة كثافة وجودة عظم الفك." },
        { title: "زراعة الدعامة", body: "وضع الدعامة التيتانيومية عبر إجراء جراحي بسيط." },
        { title: "الترميم النهائي", body: "تركيب السن الصناعي بعد اكتمال فترة اندماج الزراعة." },
      ],
      faqHeading: "أسئلة شائعة",
      faq: [
        { question: "كم تستغرق فترة اندماج الزراعة؟", answer: "تعتمد هذه المدة على حالة العظم لدى كل شخص، وتُشرح خلال الاستشارة." },
        { question: "هل يمكن إجراؤها لمرضى انخفاض كثافة العظم؟", answer: "في كثير من الحالات نعم، عبر ترقيع العظم قبل الزراعة؛ يُحدَّد ذلك في التقييم التصويري." },
        { question: "كم تدوم الزراعة؟", answer: "مع العناية المناسبة، يمكن لزراعة الأسنان أن تدوم لفترة طويلة؛ تُناقش التفاصيل خلال الاستشارة." },
      ],
    },
    {
      slug: "impacted-tooth-surgery",
      eyebrow: "جراحة الفم والفكين",
      title: "جراحة الأسنان المطمورة",
      subtitle: "استخراج آمن للأسنان المطمورة بأقل ضرر ممكن للأنسجة المحيطة",
      overview: "تُجرى جراحة الأسنان المطمورة لاستخراج سن لم يبرز بالكامل من اللثة — غالباً ضرس العقل — ويمكن أن تمنع الألم أو العدوى أو الضرر للأسنان المجاورة.",
      suitableForHeading: "لمن تناسب هذه الجراحة عادةً؟",
      suitableFor: [
        "من لديهم سن مطمور مؤلم أو ملتهب",
        "من لديهم سن مطمور يضغط على الأسنان المجاورة",
        "من لديهم سن مطمور بدون أعراض تم اكتشافه خلال الفحص أو الأشعة",
      ],
      consultationPathHeading: "مسار الاستشارة",
      consultationPath: "تحديد موقع السن المطمور بدقة عبر الأشعة شرط أساسي لتحديد الأسلوب الجراحي المناسب.",
      processHeading: "مراحل العلاج",
      process: [
        { title: "الاستشارة الأولية", body: "مراجعة الأعراض والتاريخ السني للمريض." },
        { title: "التقييم التصويري", body: "تحديد دقيق لموقع وعمق السن المطمور." },
        { title: "إجراء الجراحة", body: "استخراج السن بأقل ضرر ممكن للعظم والأنسجة المحيطة." },
        { title: "الرعاية والمتابعة", body: "إرشادات داعمة لتسريع شفاء المنطقة." },
      ],
      faqHeading: "أسئلة شائعة",
      faq: [
        { question: "هل هذه الجراحة ضرورية دائماً؟", answer: "لا، يُنصح بها فقط عند وجود ألم أو عدوى أو خطر على الأسنان المجاورة، وهذا يُقيَّم خلال الفحص." },
        { question: "كم تستغرق فترة التعافي؟", answer: "عادةً فترة قصيرة؛ التفاصيل الدقيقة تُشرح خلال الاستشارة." },
        { question: "هل يلزم التخدير الكامل؟", answer: "في معظم الحالات يكفي التخدير الموضعي؛ يعتمد الأسلوب على تعقيد الحالة ويُحدَّد خلال الاستشارة." },
      ],
    },
    {
      slug: "facial-rejuvenation",
      eyebrow: "تجديد الشباب",
      title: "تجديد شباب الوجه",
      subtitle: "مزيج من تقنيات جراحية وغير جراحية لتجديد طبيعي دون مبالغة",
      overview:
        "يشمل تجديد شباب الوجه مزيجاً من الأساليب الجراحية وغير الجراحية لاستعادة الحجم والنضارة المفقودَين من الوجه، بهدف نتيجة طبيعية تتناسب مع العمر، لا تغييراً جذرياً في الملامح.",
      suitableForHeading: "لمن تناسب هذه الخدمة عادةً؟",
      suitableFor: [
        "من لديهم ترهل طبيعي أو فقدان حجم مرتبط بالتقدم في العمر",
        "من يبحثون عن مظهر أكثر نضارة وأقل إرهاقاً",
        "من يتوقعون نتيجة تدريجية وطبيعية، لا تغييراً مفاجئاً",
      ],
      consultationPathHeading: "مسار الاستشارة",
      consultationPath: "يُحدَّد المزيج المناسب من التقنيات الجراحية وغير الجراحية فقط بعد تقييم حضوري لبنية الجلد وجودته.",
      processHeading: "مراحل العلاج",
      process: [
        { title: "الاستشارة الأولية", body: "مراجعة المناطق المستهدفة وهدف المريض من التجديد." },
        { title: "التقييم والتخطيط", body: "تحديد المزيج المناسب من التقنيات الجراحية وغير الجراحية." },
        { title: "إجراء العلاج", body: "تنفيذ الخطة المتفق عليها مع التركيز على نتيجة طبيعية." },
        { title: "الرعاية والمتابعة", body: "المرافقة خلال فترة التعافي ومراجعة النتيجة." },
      ],
      faqHeading: "أسئلة شائعة",
      faq: [
        { question: "هل هذا الإجراء جراحي دائماً؟", answer: "لا، حسب الهدف وحالة الجلد قد يُقترح أسلوب غير جراحي أو مزيج من الأساليب." },
        { question: "ما مدى طبيعية النتيجة؟", answer: "الهدف الأساسي من هذا العلاج هو الحفاظ على مظهر طبيعي، لا تغيير جذري في الملامح." },
        { question: "كم مرة يجب تكرار هذا الإجراء؟", answer: "يعتمد ذلك على التقنية المختارة والهدف الفردي، ويُحدَّد خلال الاستشارة." },
      ],
    },
    {
      slug: "facial-cosmetic-surgery",
      eyebrow: "تجميل الوجه",
      title: "جراحات تجميل الوجه",
      subtitle: "تصحيح دقيق لملامح الوجه مع الحفاظ على الهوية الفردية وتناسق الوجه",
      overview:
        "تشمل جراحات تجميل الوجه مجموعة من الإجراءات الدقيقة لتصحيح ملامح مختلفة من الوجه — مع إعطاء الأولوية للحفاظ على الهوية الفردية للمريض وانسجام النتيجة مع الوجه ككل، لا نموذجاً واحداً للجميع.",
      suitableForHeading: "لمن تناسب هذه الخدمة عادةً؟",
      suitableFor: [
        "من لا يشعرون بالرضا عن ملمح واحد أو أكثر من ملامح وجههم",
        "من يبحثون عن تصحيح يتناسب مع الوجه ككل، لا تغييراً معزولاً",
        "من لديهم توقعات واقعية من نتيجة العلاج",
      ],
      consultationPathHeading: "مسار الاستشارة",
      consultationPath: "يُحدَّد الأسلوب الدقيق ومقدار التصحيح المناسب فقط بعد تقييم كامل لبنية الوجه في استشارة حضورية مع الدكتور صديقي.",
      processHeading: "مراحل العلاج",
      process: [
        { title: "الاستشارة الأولية", body: "مراجعة رغبات المريض والملامح المطلوب تصحيحها." },
        { title: "التقييم والتخطيط", body: "تحديد الأسلوب المناسب مع مراعاة تناسق الوجه ككل." },
        { title: "إجراء الجراحة", body: "تنفيذ الجراحة من قبل الدكتور صديقي." },
        { title: "الرعاية والمتابعة", body: "المرافقة خلال فترة التعافي وجلسات المتابعة." },
      ],
      faqHeading: "أسئلة شائعة",
      faq: [
        { question: "هل يمكن إجراء عدة تصحيحات دفعة واحدة؟", answer: "في بعض الحالات نعم، لكن هذا القرار يُتخذ فقط بعد تقييم كامل حضورياً." },
        { question: "هل ستتناسب النتيجة مع وجهي؟", answer: "هدف هذه الجراحات هو الانسجام مع هويتكم وتناسق وجهكم العام، لا نموذجاً محدداً مسبقاً." },
        { question: "كم تستغرق فترة التعافي؟", answer: "تختلف حسب الأسلوب المختار وتُشرح بشكل مخصص خلال الاستشارة." },
      ],
    },
    {
      slug: "orthognathic-surgery",
      eyebrow: "جراحة الفك والوجه",
      title: "جراحة الفك والذقن",
      subtitle: "تصحيح وظيفي وجمالي للفك والذقن",
      overview: "تُجرى جراحة الفك والذقن (تقويم الفكين) لتصحيح عدم التناسق بين الفك العلوي والسفلي، مما قد يحسّن وظيفة المضغ والتنفس وتناسق الوجه معاً. وهذا هو التخصص الأساسي للدكتور صديقي.",
      suitableForHeading: "لمن تناسب هذه الجراحة عادةً؟",
      suitableFor: ["من يعانون من صعوبات في المضغ أو النطق أو التنفس مرتبطة بعدم تناسق الفك", "من لديهم عدم تناسق ملحوظ في الفك أو الذقن", "من يخضعون بالفعل لعلاج تقويم الأسنان أو ينسقون معه"],
      consultationPathHeading: "مسار الاستشارة",
      consultationPath: "تتطلب هذه الجراحة تقييماً تصويرياً متخصصاً وغالباً تنسيقاً مع طبيب تقويم الأسنان؛ تُحدَّد خطة العلاج الدقيقة فقط بعد هذا التقييم.",
      processHeading: "مراحل العلاج",
      process: [
        { title: "الاستشارة الأولية", body: "مراجعة المشاكل الوظيفية والجمالية للفك مع الدكتور صديقي." },
        { title: "التقييم المتخصص", body: "مراجعة تصويرية وتنسيق مع فريق تقويم الأسنان عند الحاجة." },
        { title: "إجراء الجراحة", body: "تنفيذ جراحة الفك بتخطيط دقيق ومتخصص." },
        { title: "الرعاية والمتابعة", body: "المرافقة خلال فترة التعافي وتنسيق استمرار علاج تقويم الأسنان." },
      ],
      faqHeading: "أسئلة شائعة",
      faq: [
        { question: "هل هذه الجراحة تجميلية فقط؟", answer: "لا، الهدف الأساسي في كثير من الحالات هو تحسين وظيفة المضغ أو النطق أو التنفس، ويأتي تحسن جمال الوجه كنتيجة مصاحبة." },
        { question: "هل أحتاج للتنسيق مع طبيب تقويم أسنان؟", answer: "في كثير من الحالات نعم؛ يُقيَّم ذلك في الاستشارة الأولية." },
        { question: "كم تستغرق فترة التعافي من هذه الجراحة؟", answer: "نظراً لتعقيد هذه الجراحة، تُشرح فترة التعافي بشكل مخصص خلال الاستشارة." },
      ],
    },
    {
      slug: "rhinoplasty",
      eyebrow: "جراحة الأنف",
      title: "جراحة تجميل الأنف",
      subtitle: "تناسق شكل الأنف مع ملامح الوجه الطبيعية",
      overview: "جراحة تجميل الأنف إجراء جراحي لتصحيح شكل الأنف أو تناسقه أو وظيفته التنفسية، ويُخطَّط له بناءً على بنية العظم والغضروف لدى كل شخص، بهدف نتيجة طبيعية تتناسب مع الوجه.",
      suitableForHeading: "لمن تناسب هذه الجراحة عادةً؟",
      suitableFor: [
        "من لا يشعرون بالرضا عن شكل الأنف أو تناسقه أو حجمه",
        "من يعانون من مشاكل تنفسية مرتبطة بانحراف الحاجز الأنفي",
        "من يبحثون عن نتيجة طبيعية تناسب وجههم، لا نموذجاً محدداً مسبقاً",
      ],
      consultationPathHeading: "مسار الاستشارة",
      consultationPath: "يتحدد القرار النهائي حول مدى ملاءمة هذه الجراحة لكم فقط بعد الفحص الحضوري وتقييم بنية الأنف من قبل الدكتور صديقي.",
      processHeading: "مراحل العلاج",
      process: [
        { title: "الاستشارة الأولية", body: "مراجعة الرغبات وبنية الأنف وتحديد توقعات واقعية للنتيجة." },
        { title: "التقييم والتخطيط", body: "مراجعة تصويرية وتحديد الأسلوب المناسب بناءً على بنية العظم والغضروف." },
        { title: "إجراء الجراحة", body: "تنفيذ الجراحة من قبل الدكتور صديقي وفق الخطة المحددة." },
        { title: "الرعاية والمتابعة", body: "المرافقة خلال فترة التعافي وجلسات المتابعة بعد الجراحة." },
      ],
      faqHeading: "أسئلة شائعة",
      faq: [
        { question: "كم تستغرق فترة التعافي؟", answer: "تعتمد المدة الدقيقة للتعافي على الحالة الفردية، وتُشرح بالتفصيل خلال جلسة الاستشارة." },
        { question: "هل النتيجة قابلة للتوقع بشكل كامل؟", answer: "تعتمد النتيجة على بنية الأنف الطبيعية لكل شخص؛ الهدف هو الانسجام مع الوجه، وليس نتيجة مضمونة مسبقاً." },
        { question: "هل تعالج هذه الجراحة المشاكل التنفسية أيضاً؟", answer: "في بعض الحالات نعم، لكن يجب تأكيد ذلك خلال الفحص الحضوري." },
      ],
    },
  ],
} satisfies ServicesPageDictionary;

const healthTourism = {
  nav: { overview: "نظرة عامة", visa: "دليل التأشيرة", hotel: "الإقامة والفندق", transfer: "النقل" },
  overview: {
    eyebrow: "المرضى الدوليون",
    title: "مسار علاجي منسّق للمرضى الدوليين",
    subtitle: "استشارة وتخطيط علاجي ودعم لتنظيم السفر، معاً",
    intro: "ترحب عيادة الدكتور صديقي بالمرضى من خارج إيران ومن مدن أخرى بمسار منسّق — من الاستشارة الأولية عبر الإنترنت وحتى تنسيق الحضور إلى العيادة.",
    sections: [
      { title: "استشارة ما قبل السفر", body: "قبل السفر، يمكنكم طرح أسئلتكم الأولية عبر المساعد الذكي أو الاتصال المباشر، والحصول على تقييم مبدئي." },
      { title: "تنسيق خطة العلاج", body: "يتم تنسيق موعد الاستشارة الحضورية وطريقة العلاج بما يتناسب مع مدة إقامتكم." },
      { title: "الدعم خلال فترة الإقامة", body: "يرافقكم فريق العيادة بإرشادات أولية حول الإقامة والتنقل — التفاصيل في صفحات التأشيرة والإقامة والنقل." },
    ],
  },
  visa: {
    eyebrow: "دليل أولي",
    title: "دليل تأشيرة العلاج",
    subtitle: "معلومات أولية فقط — وليست استشارة قانونية أو ضماناً لإصدار التأشيرة",
    intro: "هذه الصفحة دليل أولي لمساعدتكم على معرفة الخطوات المعتادة في إجراءات تأشيرة العلاج. تساعد العيادة في إعداد خطاب الدعوة الطبية، لكن إصدار التأشيرة يبقى بيد الجهات الرسمية المختصة.",
    points: [
      "طلب خطاب دعوة طبية من العيادة بعد تنسيق موعد الاستشارة",
      "مراجعة السفارة أو القنصلية المعنية لمعرفة المستندات المطلوبة",
      "تنسيق موعد السفر مع خطة العلاج المقترحة",
    ],
    cautionNote: "لا تضمن العيادة إصدار التأشيرة؛ هذه الصفحة دليل تنسيقي أولي فقط.",
  },
  hotel: {
    eyebrow: "الإقامة",
    title: "دليل الإقامة والفندق",
    subtitle: "اقتراحات للإقامة قرب العيادة",
    intro: "حسب مدة الإقامة وخطة العلاج، يمكن لفريق العيادة اقتراح خيارات إقامة قريبة من مراكز العلاج في تبريز وطهران.",
    points: ["اقتراح فنادق وأماكن إقامة قريبة من العيادة", "تنسيق يراعي فترة النقاهة وجلسات المتابعة", "دليل أولي فقط — الحجز النهائي مسؤولية المريض"],
    cautionNote: "دور العيادة يقتصر على الإرشاد والاقتراح، ولا تتحمل مسؤولية مباشرة عن الحجز أو جودة مكان الإقامة.",
  },
  transfer: {
    eyebrow: "النقل",
    title: "دليل النقل والتنقل",
    subtitle: "تنسيق التنقل بين المطار والإقامة والعيادة",
    intro: "بالنسبة للمرضى القادمين من مدن أو دول أخرى، يُعد تنسيق التنقل جزءاً من تجربة علاجية أكثر هدوءاً.",
    points: [
      "تنسيق النقل من المطار في أيام الاستشارة أو العملية",
      "تخطيط التنقل بين مكان الإقامة والعيادة خلال فترة المتابعة",
      "إبلاغ المواعيد عبر المساعد الذكي أو الاتصال المباشر",
    ],
    cautionNote: "تُقدَّم خدمة النقل كدعم تنسيقي، وليست خدمة نقل عام مضمونة.",
  },
  ctaHeading: "هل أنتم مستعدون لتخطيط رحلتكم العلاجية؟",
  ctaBody: "يمكن للمساعد الذكي للعيادة بدء استشارتكم الأولية وتنسيق مسار علاجكم.",
  ctaButton: "بدء التنسيق",
} satisfies HealthTourismPageDictionary;

const beforeAfterPage = {
  eyebrow: "معرض قبل وبعد",
  title: "نماذج حقيقية قبل وبعد",
  subtitle: "صور حقيقية لإجراءات تمت في العيادة — تعتمد كل نتيجة على بنية الوجه والظروف الفردية للمريض.",
  disclaimer: "النتائج المعروضة خاصة بذلك المريض، وتختلف نتيجة العلاج لكل شخص حسب ظروفه الفردية. هذه الصفحة للمعلومات العامة فقط ولا تغني عن الفحص أو رأي الطبيب.",
  ctaHeading: "هل ترغبون في استكشاف نتيجة تناسب ملامح وجهكم؟",
  ctaBody: "في استشارة مخصصة، يمكن للدكتور صديقي أن يشرح لكم توقعاً واقعياً لنتيجة علاجكم.",
  ctaButton: "حجز استشارة",
} satisfies BeforeAfterPageDictionary;

const knowledge = {
  eyebrow: "المكتبة المعرفية",
  heading: "دليل علمي للمرضى",
  subheading: "مقالات لمساعدتكم على الاستعداد بوعي قبل أي قرار علاجي",
  readMoreCta: "متابعة القراءة",
  backToIndexCta: "العودة إلى المكتبة المعرفية",
  ctaHeading: "لديكم سؤال لم تجدوا إجابته في المقالات؟",
  ctaBody: "يمكن للمساعد الذكي للعيادة الإجابة عن أسئلتكم الشائعة أو بدء مسار الاستشارة.",
  ctaButton: "اسألوا المساعد الذكي",
  articles: [
    {
      slug: "preparing-for-consultation",
      category: "الاستشارة",
      readTime: "٤ دقائق",
      title: "كيف تستعدون لاستشارة تجميلية؟",
      summary: "خطوات بسيطة للحصول على استشارة أكثر فائدة وقرار أكثر وعياً.",
      body: [
        "قبل الاستشارة، اكتبوا قائمة بمخاوفكم وأسئلتكم. يساعد ذلك على عدم نسيان أي نقطة مهمة خلال الجلسة.",
        "الصور الحقيقية والحديثة لوضعكم الحالي، إضافة إلى أي تاريخ طبي أو عمليات سابقة، تساعد الطبيب على تقييم أدق.",
        "الأهم من ذلك، حافظوا على توقعات واقعية. هدف الاستشارة الجيدة هو الوصول إلى تفاهم مشترك حول الإمكانيات الحقيقية للعلاج، لا وعداً بنتيجة محددة مسبقاً.",
      ],
    },
    {
      slug: "what-to-ask-before-facial-procedures",
      category: "قرار واعٍ",
      readTime: "٥ دقائق",
      title: "ما الأسئلة التي يجب طرحها قبل إجراءات تجميل الوجه؟",
      summary: "أسئلة أساسية تساعدكم على اتخاذ قرار واضح وواثق.",
      body: [
        "اسألوا عن الخطوات الدقيقة للإجراء المقترح، وعن المدة المعتادة لفترة التعافي.",
        "اطلبوا من الطبيب شرح المخاطر والحدود الحقيقية للإجراء، لا الجوانب الإيجابية فقط.",
        "اسألوا عن خبرة الطبيب في هذا الإجراء تحديداً، وعن العناية بعد العملية، ليكون مسار علاجكم واضحاً تماماً.",
      ],
    },
    {
      slug: "understanding-before-after-results",
      category: "نتائج العلاج",
      readTime: "٤ دقائق",
      title: "كيف نفسّر صور قبل وبعد بمسؤولية؟",
      summary: "ملاحظات للنظر بواقعية إلى نماذج قبل وبعد عند اتخاذ قرار علاجي.",
      body: [
        "يجب أن تُظهر صور قبل وبعد مريضاً حقيقياً وإجراءً حقيقياً تم في العيادة نفسها، لا نماذج عامة أو غير ذات صلة.",
        "تعتمد نتيجة كل مريض على بنية وجهه وعمره وبشرته وأهدافه الفردية؛ نتيجة نموذج واحد لا تتكرر بالضرورة لشخص آخر.",
        "أفضل استخدام لهذه الصور هو كمرجع للحوار مع الطبيب، لا كمعيار قاطع للتنبؤ بنتيجتكم الشخصية.",
      ],
    },
  ],
} satisfies KnowledgePageDictionary;

// Added 2026-07-13 (patient-care hub)؛ تم دمج المحتوى الحقيقي في اليوم
// نفسه — ترجمة عربية احترافية، وليست ترجمة حرفية للنص الفارسي (الذي
// يبقى المصدر الأساسي للمحتوى). لهجة طبية حذرة: لا وعود بنتائج مضمونة،
// ولا جرعات دوائية باستثناء الإشارة إلى "حسب تعليمات الطبيب" أينما وردت
// الأدوية. `assistantPromptHints` توجيهات داخلية للمساعد الذكي فقط، ولا
// تُعرض أبداً في واجهة الصفحة — انظر التعليق التوضيحي على
// `CareTopicDetail` في dictionary-types.ts.
const careInstructions = {
  eyebrow: "دليل المرضى",
  heading: "تعليمات ما قبل وبعد الإجراء",
  subheading: "إرشادات عامة للعناية، للاستعداد قبل الجراحة والتعافي الهادئ بعدها.",
  trustNote: "أُعدّت هذه الأدلة بإشراف الفريق الطبي للعيادة، وهي مكمّلة لتعليمات الطبيب المباشرة لا بديلاً عنها.",
  viewGuideCta: "عرض الدليل",
  safetyNote: "هذه الإرشادات للتوعية العامة بالعناية ولا تغني عن تعليمات الطبيب المباشرة.",
  assistantCtaHeading: "لديكم سؤال حول العناية قبل أو بعد الإجراء؟",
  assistantCtaBody: "يمكن للمساعد الذكي للعيادة اقتراح الدليل المناسب لإجرائكم أو بدء مسار الاستشارة.",
  assistantCtaButton: "اسألوا المساعد الذكي",
  disclaimer:
    "هذه الصفحة للتوعية العامة والعناية الأولية بعد العلاج فقط، ولا تغني عن تعليمات الطبيب المباشرة أو الفحص أو المتابعة الحضورية. في حال ظهور أي أعراض غير معتادة، يرجى التواصل مع العيادة.",
  backToHubCta: "العودة إلى تعليمات ما قبل وبعد الإجراء",
  detail: {
    beforeHeading: "قبل الإجراء",
    afterHeading: "بعد الإجراء",
    warningSignsHeading: "متى تتواصلون مع العيادة",
    warningSignsBody: "تواصلوا مع العيادة فوراً في حال الشعور بألم شديد أو حمى أو نزيف غير معتاد أو أي عارض آخر مقلق.",
    faqHeading: "الأسئلة الشائعة",
    pendingReviewNotice: "المحتوى المخصص لهذا الدليل قيد الإعداد والمراجعة السريرية. للحصول على إرشاد فوري، استخدموا المساعد الذكي للعيادة أو تواصلوا مباشرة.",
  },
  topics: [
    {
      slug: "implant-care",
      beforeCare: [
        "يراجع الطبيب حالتكم الصحية العامة وحالة الفم قبل الجراحة.",
        "أخبروا الطبيب في حال وجود السكري أو ارتفاع ضغط الدم أو اضطرابات النزيف أو تناول أدوية معينة أو أي سوابق مرضية.",
        "تُجرى التصويرات اللازمة مثل الصورة البانورامية أو CBCT حسب رأي الطبيب.",
        "إذا كنتم تتناولون أدوية مسيّلة للدم أو مكملات معينة، لا توقفوها أو تغيّروها دون التنسيق مع الطبيب.",
        "يجب الحرص على نظافة الفم والأسنان جيداً قبل الجراحة.",
        "يُفضّل التوقف عن التدخين والكحول قبل الجراحة لأنهما قد يعيقان التعافي.",
        "احضروا يوم الجراحة وفق موعد مرتب مسبقاً، ومع مرافق إذا لزم الأمر.",
        "معرفة خطوات العناية بعد الجراحة مسبقاً تساعد على إدارة فترة التعافي بشكل أفضل.",
      ],
      afterCare: [
        "أبقوا الشاش المعقّم فوق موضع الجراحة بضغط خفيف لمدة ساعتين تقريباً.",
        "استخدموا كمادات باردة على الوجه خلال الـ ٢٤ ساعة الأولى؛ لا كمادات في اليوم الثاني، ومن اليوم الثالث يمكن استخدام منشفة دافئة حسب رأي الطبيب.",
        "عادةً يبلغ التورم ذروته في اليومين الثالث والرابع ثم يبدأ بالتراجع؛ التورم وحده ليس علامة على عدوى.",
        "تناولوا الأدوية الموصوفة بدقة وحسب تعليمات الطبيب.",
        "اعتمدوا على الأطعمة الطرية والسوائل في الأسبوع الأول؛ الطعام الطري البارد أنسب في اليوم الأول.",
        "تجنبوا استخدام الماصة لمدة أسبوعين.",
        "قد يكون خروج قليل من السائل الدموي طبيعياً حتى يومين؛ تجنبوا البصق.",
        "نظفوا باقي الأسنان ومنطقة الالتئام بفرشاة ناعمة، واستخدموا غسول الفم حسب التعليمات؛ بعد الغسل، دعوا السائل يخرج بهدوء دون بصق.",
        "تجنبوا التدخين والكحول.",
        "تُزال الغرز عادةً بعد أسبوعين تقريباً من الجراحة.",
        "إذا أُجري رفع للجيب الفكي في الوقت نفسه، تجنبوا نفخ الأنف والشفط الأنفي وأي ضغط على الأنف.",
      ],
      additionalCareHeading: "العناية بعد تركيب التاج / الترميم",
      additionalCare: [
        "يحتاج الزرع إلى عناية منتظمة، بل أكثر من السن الطبيعي أحياناً.",
        "خذوا التفريش والخيط الطبي، وجهاز الواتر جت إن أُوصي به، على محمل الجد.",
        "الفحوصات الدورية في السنة الأولى وفق برنامج الطبيب مهمة، وكذلك المتابعة المنتظمة بعدها.",
        "أبلغوا الطبيب فوراً في حال الشعور بارتفاع غير طبيعي أو انحشار الطعام أو تورم أو خروج صديد أو أي مشكلة غير معتادة.",
        "قد يكون هناك إحساس مختلف قليلاً داخل الفم في الأيام الأولى بعد تركيب التاج، وعادةً يخف مع التأقلم التدريجي.",
      ],
      warningSigns: [
        "حمى وقشعريرة",
        "خروج صديد",
        "ألم شديد أو متزايد",
        "نزيف غير قابل للسيطرة",
        "تورم مصحوب بعلامات عدوى",
        "إحساس بعدم الثبات أو أي مشكلة جدية في منطقة الزرع",
      ],
      faq: [
        {
          question: "هل التورم بعد زراعة الأسنان طبيعي؟",
          answer: "نعم، قد يكون التورم طبيعياً في الأيام الأولى، وعادةً يبدأ بالتراجع من اليوم الثالث أو الرابع.",
        },
        { question: "متى تُزال الغرز؟", answer: "عادةً بعد أسبوعين تقريباً من الجراحة، حسب رأي الطبيب." },
        {
          question: "هل يمكن استخدام الماصة بعد الزراعة؟",
          answer: "يُفضّل عدم استخدام الماصة لمدة أسبوعين تقريباً، لأن الشفط قد يؤثر سلباً على التعافي.",
        },
      ],
      assistantPromptHints: [
        "إذا سأل المستخدم عن التورم، اشرح أن ذروته تكون في الأيام الأولى.",
        "إذا ذُكرت الحمى أو الصديد أو الألم الشديد، وجّه المستخدم للتواصل مع العيادة.",
        "إذا كان المستخدم قد أجرى رفع جيب فكي أيضاً، ذكّره بتجنب نفخ الأنف والضغط عليه.",
      ],
    },
    {
      slug: "rhinoplasty-care",
      beforeCare: [
        "جهّزوا نسخة مطبوعة من الأشعة المقطعية والمستندات المطلوبة حسب طلب الطبيب وسلّموها للعيادة.",
        "جهّزوا الصور الاستوديوهية والتحاليل قبل العملية بحوالي أسبوع.",
        "أخبروا الطبيب مسبقاً في حال وجود مرض مزمن أو سوابق دخول مستشفى أو حساسية دوائية أو تناول أدوية معينة.",
        "أبلغوا الطبيب في حال الحمل أو احتمال وجوده.",
        "إذا كنتم قد تناولتم أدوية مثل الروأكوتان، يجب إخبار الطبيب بذلك حتماً.",
        "قد يؤثر التدخين سلباً على التئام الأنف؛ ناقشوا الأمر مع الطبيب وامتنعوا عنه حسب التوجيهات.",
        "تجنبوا الكحول والأدوية العشبية والشاي أو المشروبات العشبية في الأيام القريبة من العملية، حسب توصية الطبيب.",
        "أخبروا الطبيب في حال وجود سوابق التئام جروح سيئ أو نسيج ندبي زائد.",
        "يجب أن تُدار الأسبرين ومضادات التخثر فقط بإشراف الطبيب.",
        "قصّوا شعر داخل الأنف مساء ما قبل الجراحة حسب التعليمات.",
        "امتنعوا عن الأكل والشرب لمدة ٨ ساعات تقريباً قبل العملية، إلا إذا أعطى الطبيب توجيهاً آخر.",
      ],
      afterCare: [
        "ضعوا كمادات باردة على الخدين خلال اليومين الأولين.",
        "لا كمادات في اليوم الثالث، ومن اليوم الرابع يمكن استخدام منشفة دافئة حسب توصية الطبيب.",
        "تجنبوا التدخين والكحول لمدة شهر؛ فالتدخين قد يؤثر سلباً على التئام الأنف وشكله النهائي.",
        "اعتمدوا نظاماً غذائياً طرياً في الأسبوع الأول.",
        "لا تقودوا السيارة لمدة أسبوع.",
        "عادةً تُمارَس الرياضة الخفيفة بعد أسبوعين تقريباً، أما الرياضة الشاقة فتحتاج وقتاً أطول وبحذر وحسب رأي الطبيب.",
        "اغسلوا داخل الأنف بالمحلول الملحي حسب تعليمات الطبيب.",
        "تناولوا الأدوية الموصوفة بانتظام.",
        "تُزال الجبيرة والغرز عادةً حسب برنامج الطبيب؛ إذا ارتخت، تواصلوا مع العيادة.",
        "بعد إزالة الجبيرة، غيّروا لاصقة الأنف فقط حسب تعليمات الطبيب.",
        "تجنبوا الضغط على الأنف ونفخه والسباحة ووضع النظارات على الأنف لمدة ١٠ أسابيع تقريباً.",
        "التزموا بمواعيد المتابعة بعد العملية حسب برنامج العيادة.",
      ],
      warningSigns: [
        "نزيف شديد أو مستمر",
        "حمى أو خروج صديد أو رائحة كريهة غير معتادة",
        "ألم شديد أو تورم غير معتاد",
        "ارتخاء غير معتاد في الجبيرة أو الغرز",
        "تعرّض الأنف لضربة أو تغيّر مفاجئ في شكله",
      ],
      faq: [
        {
          question: "متى يجب مراجعة الطبيب بعد عملية الأنف؟",
          answer: "يُحدَّد برنامج المراجعة حسب رأي الطبيب؛ عادةً تكون المراجعات الأولى في الأسابيع الأولى مهمة جداً.",
        },
        {
          question: "كيف يجب لصق لاصقة الأنف؟",
          answer: "يجب لصق اللاصقة وتغييرها فقط حسب تعليمات الطبيب. اللصق الخاطئ قد يسبب مشاكل.",
        },
        {
          question: "هل نفخ الأنف مسموح بعد تجميل الأنف؟",
          answer: "في الأسابيع الأولى، يجب تجنب نفخ الأنف والضغط عليه.",
        },
      ],
      assistantPromptHints: [
        "إذا سأل المستخدم عن لاصقة الأنف، أكّد أنها يجب أن تكون حسب تعليمات الطبيب فقط.",
        "إذا سأل عن النزيف أو الضربة أو الحمى أو خروج الصديد، وجّهه للتواصل مع العيادة.",
        "لا تعطِ إطلاقاً وقتاً قطعياً للتعافي أو النتيجة النهائية.",
      ],
    },
    {
      slug: "blepharoplasty-care",
      beforeCare: [
        "أخبروا الطبيب مسبقاً في حال وجود مرض مزمن أو سوابق دخول مستشفى أو مشكلة في الرؤية أو التئام جروح سيئ أو تناول دواء معين.",
        "يجب أن تُدار أدوية مضادات التخثر مثل الأسبرين أو تُوقَف فقط بإشراف الطبيب المعالج.",
        "في حال الحمل أو احتمال وجوده، أثيروا الموضوع قبل الجراحة حتماً.",
        "من المفيد معرفة أن الوجه والعينين ليسا متماثلين تماماً حتى قبل العملية، وتوقع تناظر مطلق بعدها ليس واقعياً.",
        "تجنبوا تناول أي دواء أو مكمل يؤثر على النزيف من تلقاء أنفسكم قبل الجراحة.",
      ],
      afterCare: [
        "عادةً يزداد التورم في الأيام الثلاثة إلى الأربعة الأولى ثم يتراجع تدريجياً.",
        "تناولوا الأدوية الموصوفة بدقة وحسب تعليمات الطبيب.",
        "تُزال الغرز عادةً بعد ١٠ إلى ١٤ يوماً من الجراحة.",
        "استخدموا كمادات باردة في اليومين الأولين؛ لا كمادات في اليوم الثالث، ومن اليوم الرابع يمكن استخدام منشفة دافئة للمساعدة في امتصاص الكدمات والتورم بشكل أسرع، حسب توصية الطبيب.",
        "ابتداءً من اليوم التالي للجراحة، ضعوا كمية قليلة جداً من مرهم الالتئام بحيث لا يدخل إلى العين.",
        "يُفضّل الراحة في المنزل خلال اليومين الأولين.",
        "لا تقودوا السيارة لمدة ٤ إلى ٥ أيام.",
        "تجنبوا الرياضة الشاقة ورفع الأجسام الثقيلة لمدة ثلاثة أسابيع.",
        "قلّلوا من الأطعمة شديدة الملوحة والدسمة التي قد تزيد التورم.",
        "خلال الليلتين الأوليين، أبقوا الرأس أعلى من مستوى الجسم أثناء النوم.",
        "قد يكون خروج قليل من السائل الدموي من موضع الجرح في اليومين الأولين طبيعياً؛ نظفوا المنطقة برفق بشاش معقّم دون ضغط أو عبث.",
        "تجنبوا التدخين لمدة أسبوعين.",
        "استخدموا نظارات شمسية عند التعرض لأشعة الشمس.",
        "قد يحدث تشوش خفيف في الرؤية خلال الأيام الأولى بسبب التورم حول العينين، وعادةً يزول من تلقاء نفسه.",
      ],
      warningSigns: [
        "ألم شديد خلف العين أو إحساس بضغط غير طبيعي داخلها",
        "انخفاض في الرؤية أو تغيّر واضح فيها",
        "نزيف شديد أو تورم غير معتاد",
        "خروج صديد أو حمى أو ألم متزايد",
        "أي عرض مفاجئ أو مقلق",
      ],
      faq: [
        {
          question: "كم يستمر التورم بعد جراحة الجفون؟",
          answer: "عادةً يكون التورم أكثر وضوحاً في الأيام الأولى ثم يتراجع تدريجياً؛ تختلف سرعة التراجع من شخص لآخر.",
        },
        { question: "متى تُزال الغرز؟", answer: "عادةً بين ١٠ و١٤ يوماً بعد الجراحة، حسب تقييم الطبيب." },
        {
          question: "هل تشوش الرؤية بعد العملية طبيعي؟",
          answer: "قد يظهر تشوش خفيف في الأيام الأولى، لكن انخفاض الرؤية أو الألم الشديد خلف العين يجب إبلاغ الطبيب به فوراً.",
        },
      ],
      assistantPromptHints: [
        "إذا سأل المستخدم عن التورم أو الكدمات، اشرح أنها طبيعية في الأيام الأولى لكن الأعراض الشديدة تحتاج مراجعة.",
        "إذا ذكر المستخدم انخفاض الرؤية أو ألماً خلف العين أو ضغطاً شديداً، وجّهه للتواصل الفوري مع العيادة.",
        "لا تقدّم تشخيصاً طبياً.",
      ],
    },
    {
      slug: "wisdom-tooth-care",
      beforeCare: [
        "هذا الدليل يتعلق بشكل أساسي بالعناية بعد الجراحة.",
        "قبل الجراحة، أخبروا الطبيب بأي مرض مزمن أو أدوية أو حساسية دوائية أو سوابق طبية.",
        "إذا طلب الطبيب تصويراً أو تحضيراً معيناً، أنجزوه قبل الجراحة.",
      ],
      afterCare: [
        "أبقوا الشاش المعقّم فوق منطقة الجراحة بضغط خفيف لمدة ساعتين تقريباً.",
        "اعتمدوا على الأطعمة الطرية في الأسبوع الأول.",
        "تجنبوا الماصة وأي شفط لمدة أسبوعين؛ فالشفط قد يزيل الجلطة الدموية ويسبب ألماً شديداً أو التهاب السنخ الجاف.",
        "استخدموا كمادات باردة في اليوم الأول؛ لا كمادات في اليوم الثاني، ومن اليوم الثالث استخدموا منشفة دافئة حسب رأي الطبيب.",
        "قد يكون خروج قليل من السائل الدموي طبيعياً حتى يومين. لا تبصقوا، وإذا لزم الأمر اضغطوا بشاش معقّم مبلل بماء بارد على المنطقة لمدة نصف ساعة تقريباً.",
        "حافظوا على نظافة الفم باستخدام فرشاة ناعمة وغسول الفم حسب التعليمات.",
        "بعد غسل الفم، أميلوا الرأس ودعوا السائل يخرج بهدوء؛ البصق ممنوع.",
        "تُزال الغرز عادةً بعد أسبوع تقريباً.",
        "قد يكون الألم طبيعياً حتى ٣ أيام تقريباً، والتورم والكدمات حتى أسبوع تقريباً.",
        "قد تكون محدودية فتح وإغلاق الفم طبيعية حتى ١٠ أيام تقريباً؛ ابدأوا تمارين الفك فقط حسب التوجيهات.",
        "أبقوا الرأس مرتفعاً أثناء النوم.",
        "تجنبوا التدخين والكحول لمدة أسبوعين.",
        "تناولوا المضاد الحيوي والأدوية الموصوفة في مواعيدها.",
        "لا تستخدموا غسول الفم لمدة أطول من الموصى بها.",
      ],
      warningSigns: [
        "زيادة التورم بعد اليوم الخامس",
        "نزيف شديد أو غير مسيطر عليه",
        "حمى وقشعريرة",
        "ألم شديد أو متزايد",
        "ضيق في التنفس",
        "رائحة كريهة شديدة أو خروج صديد",
      ],
      faq: [
        {
          question: "لماذا لا يجب البصق بعد جراحة ضرس العقل؟",
          answer: "البصق والشفط قد يزيلان الجلطة الدموية من موضع الجراحة ويزيدان احتمال الألم الشديد أو السنخ الجاف.",
        },
        {
          question: "إلى متى يكون الألم طبيعياً بعد جراحة ضرس العقل؟",
          answer: "قد يكون الألم طبيعياً في الأيام الأولى، لكن الألم الشديد أو المتزايد يجب أن يُراجَع.",
        },
        { question: "متى تُزال الغرز؟", answer: "عادةً بعد أسبوع تقريباً من الجراحة، حسب رأي الطبيب." },
      ],
      assistantPromptHints: [
        "إذا سأل المستخدم عن البصق أو الماصة أو الشفط، اشرح أن عليه تجنبها للحفاظ على الجلطة الدموية.",
        "إذا سأل عن الألم الشديد أو الحمى أو النزيف أو ضيق التنفس، اقترح التواصل الفوري مع العيادة.",
        "لا توصِ بتمارين الفك إلا بعد الوقت المناسب وحسب تعليمات الطبيب.",
      ],
    },
    {
      slug: "facelift-browlift-care",
      beforeCare: [
        "جهّزوا التحاليل والصور اللازمة وسلّموها للعيادة قبل العملية بحوالي أسبوع.",
        "أخبروا الطبيب في حال وجود مرض مزمن أو تناول دواء معين أو سوابق دخول مستشفى أو حساسية دوائية.",
        "أبلغوا الطبيب في حال الحمل أو احتمال وجوده.",
        "إذا تناولتم دواءً مثل الروأكوتان، ناقشوا الأمر مع الطبيب.",
        "قد يؤثر التدخين سلباً على التئام الجلد؛ امتنعوا عنه حسب تعليمات الطبيب.",
        "تجنبوا الكحول والأدوية العشبية والشاي أو المشروبات العشبية في الأيام القريبة من العملية حسب توصية الطبيب.",
        "أخبروا الطبيب بأي سوابق التئام جروح سيئ أو نسيج ندبي زائد.",
        "يجب أن تُدار مضادات التخثر مثل الأسبرين فقط بالتنسيق مع الطبيب.",
        "امتنعوا عن الطعام لمدة ٨ ساعات تقريباً قبل العملية، إلا إذا أعطى الطبيب توجيهاً آخر.",
        "أداروا التوتر لديكم واتبعوا تعليمات ما قبل العملية بدقة.",
      ],
      afterCare: [
        "تناولوا الأدوية الموصوفة حسب التعليمات.",
        "خلال الليلتين الأولى والثانية، أبقوا الرأس أعلى من مستوى الجسم.",
        "راجعوا العيادة خلال ثلاثة أيام كحد أقصى بعد الجراحة لإزالة الضماد والفحص الأولي حسب البرنامج.",
        "تجنبوا غسل منطقة الرأس لمدة ثلاثة أيام؛ بعدها، وبإذن الطبيب، يمكن الغسل بحذر وبأقل تلامس ممكن.",
        "استخدموا كمادات باردة حول منطقة الجراحة في اليومين الأولين.",
        "من اليوم الثالث، يمكن أن تساعد الكمادات الدافئة حسب توصية الطبيب.",
        "تجنبوا التدخين والكحول لمدة ثلاثة أسابيع.",
        "تُزال الغرز داخل الشعر عادةً بعد أسبوعين تقريباً.",
        "قد يكون الحكة أو الوخز الخفيف أو الشد الخفيف في موضع الجرح جزءاً من عملية الالتئام.",
        "تجنبوا التدليك أو العبث أو الضغط غير الضروري على منطقة العملية.",
      ],
      warningSigns: [
        "نزيف شديد",
        "خروج صديد أو حمى",
        "ألم شديد أو متزايد",
        "انفتاح الجرح",
        "تورم أحادي الجانب أو مفاجئ وغير معتاد",
        "أي عرض مقلق في موضع الضماد أو الغرز",
      ],
      faq: [
        {
          question: "هل الحكة أو الوخز بعد شد الوجه طبيعي؟",
          answer: "في كثير من الحالات، قد تكون الحكة أو الوخز الخفيف جزءاً من عملية الالتئام، لكن الأعراض الشديدة أو المصحوبة بإفرازات يجب أن تُراجَع.",
        },
        {
          question: "متى تُزال الغرز؟",
          answer: "عادةً تُزال الغرز داخل الشعر بعد أسبوعين تقريباً، لكن التوقيت الدقيق يحدده الطبيب.",
        },
        {
          question: "متى يمكن غسل الرأس؟",
          answer: "عادةً بعد عدة أيام وبإذن الطبيب، مع الحذر وأقل تلامس ممكن.",
        },
      ],
      assistantPromptHints: [
        "إذا سأل المستخدم عن الغسل أو الضماد، أكّد على اتباع تعليمات الطبيب وجدول العيادة.",
        "إذا سأل عن الحكة أو الوخز، اشرح بهدوء لكن أحل الأعراض الشديدة إلى المتابعة الطبية.",
        "اعتبروا أي نزيف أو إفرازات أو حمى إشارة تحذير.",
      ],
    },
    {
      slug: "jaw-surgery-care",
      beforeCare: [
        "يجب عادةً خلع أضراس العقل المطمورة قبل جراحة الفك بأشهر؛ يحدَّد التوقيت الدقيق برأي الطبيب.",
        "تلعب تقويم الأسنان قبل جراحة الفك وبعدها دوراً مهماً في نتيجة العلاج.",
        "للقالب الرقمي، يجب أن يكون قد مرّ وقت كافٍ منذ آخر تعديل لسلك التقويم.",
        "جهّزوا المستندات اللازمة مثل التحاليل والصور الاستوديوهية وخطاب الجاهزية للعملية والأشعة المقطعية ثلاثية الأبعاد وصور القياس الرأسي (Cephalometric) وصور OPG وقالب التقويم حسب التعليمات.",
        "أخبروا الطبيب في حال وجود مرض مزمن أو تناول دواء أو حساسية دوائية أو غذائية أو سوابق دخول مستشفى أو أي مشكلة خاصة.",
        "يجب فحص تسوس الأسنان أو الجير الشديد قبل الجراحة وعلاجه إن لزم الأمر.",
        "للعلاج الرقمي، الحضور في الموعد المحدد للقالب والتحضير أمر ضروري.",
        "تجنبوا المشروبات العشبية والجينسنغ والإكثار من الشاي والتدخين في الأيام التي تسبق العملية حسب رأي الطبيب.",
      ],
      afterCare: [
        "بعد جراحة الفك، تحتاجون إلى فترة راحة ونشاط محدود في المنزل.",
        "تجنبوا النشاط الشاق لعدة أسابيع؛ يمكن بدء المشي الخفيف بعد الوقت المناسب وبرأي الطبيب.",
        "النظام الغذائي الطري والمهروس والسائل مهم جداً؛ تجنبوا مضغ الطعام الصلب حتى يسمح الطبيب بذلك.",
        "يجب الاعتناء بنظافة الفم بدقة ودون ضغط مباشر على الجروح.",
        "تناولوا الأدوية والمضاد الحيوي وغسول الفم فقط حسب تعليمات الطبيب.",
        "لا يُنصح باستخدام غسول الفم لفترة طويلة دون توجيه الطبيب.",
        "بالنسبة للألم، تناولوا الدواء الموصوف حسب التعليمات، وأبلغوا العيادة في حال الألم الشديد.",
        "قد تساعد الكمادات الباردة في اليومين الأولين، والكمادات الدافئة من اليوم الرابع حسب رأي الطبيب، في تقليل الالتهاب.",
        "استخدموا فرشاة ناعمة وفرشاة بين الأسنان بحذر للحفاظ على نظافة الفم.",
        "التزموا بالمتابعة المنتظمة مع جراح الفك وطبيب التقويم، والعلاج الطبيعي إن لزم الأمر، حسب البرنامج.",
        "تجنبوا التدخين والكحول خلال فترة التعافي.",
      ],
      warningSigns: [
        "ألم شديد أو لا يُحتمل",
        "حمى أو خروج صديد أو رائحة كريهة",
        "نزيف شديد",
        "ضيق في التنفس أو صعوبة جدية في البلع",
        "زيادة غير معتادة في التورم",
        "صعوبة شديدة في فتح وإغلاق الفم تتجاوز المتوقع",
      ],
      faq: [
        {
          question: "ما الأطعمة المناسبة بعد جراحة الفك؟",
          answer: "الأطعمة الطرية والمهروسة والسوائل أنسب حسب توصية الطبيب. يجب تجنب مضغ الأطعمة الصلبة.",
        },
        {
          question: "هل العلاج الطبيعي للفك ضروري بعد العملية؟",
          answer: "في كثير من الحالات، يُعد العلاج الطبيعي مهماً لاستعادة نطاق حركة الفك بشكل أفضل، ويجب أن يتم حسب برنامج الطبيب.",
        },
        {
          question: "هل التورم بعد جراحة الفك طبيعي؟",
          answer: "نعم، التورم جزء من عملية الالتئام، لكن الزيادة الشديدة أو الحمى أو الألم غير المعتاد تحتاج إلى مراجعة.",
        },
      ],
      assistantPromptHints: [
        "إذا سأل المستخدم عن النظام الغذائي بعد جراحة الفك، اقصر الإجابة على الأطعمة الطرية وتجنب المضغ.",
        "إذا ذكر المستخدم ألماً شديداً أو حمى أو ضيق تنفس أو نزيفاً، وجّهه فوراً للتواصل مع العيادة.",
        "إذا سأل عن تمارين الفك، أحله إلى دليل العلاج الطبيعي ورأي الطبيب.",
      ],
    },
    {
      slug: "jaw-physiotherapy",
      intro:
        "يمكن للعلاج الطبيعي بعد جراحة الفك أن يلعب دوراً مهماً في استعادة الوظيفة الطبيعية للعضلات، وتقليل التيبس، وتحسين نطاق الحركة، والمساعدة في عملية الالتئام. يجب تحديد نوع التمرين وتوقيت البدء وشدته وفق حالة كل مريض وتعليمات الطبيب.",
      beforeCare: [],
      afterCare: [
        "يجب أن تكون تمارين الفك هادئة ومتحكَّماً بها ودون ضغط شديد.",
        "قد يساعد فتح وإغلاق الفم ببطء على تحسين نطاق الحركة.",
        "الحركة الهادئة للفك يميناً ويساراً، بإذن الطبيب، مفيدة لزيادة مرونة العضلات.",
        "قد تُستخدم حركة الفك الأمامية والخلفية الهادئة لتحسين توازن الحركة.",
        "قد يساعد التدليك اللطيف لعضلات الفك ومنطقة الخد، حسب توجيه المختص، على تقليل التشنج.",
        "الاستمرارية في التمارين مهمة، لكن لا يجب تجاهل الألم الشديد أو الضغط غير المعتاد.",
        "قد تستغرق فترة العلاج الطبيعي من عدة أسابيع إلى عدة أشهر، وتختلف حسب نوع الجراحة وعملية الالتئام.",
        "يُفضّل إجراء التمارين تحت إشراف الطبيب أو أخصائي العلاج الطبيعي.",
        "الصبر والمتابعة المنتظمة وأداء التمارين بشكل صحيح ضرورية لنتيجة أفضل.",
      ],
      warningSigns: [
        "ألم شديد أثناء التمرين",
        "قفل الفك",
        "زيادة مفاجئة في التورم",
        "صوت أو إحساس غير معتاد مصحوب بألم",
        "انخفاض نطاق الحركة بدلاً من تحسّنه",
        "أي عرض يزداد سوءاً بعد التمرين",
      ],
      faq: [
        {
          question: "متى يبدأ العلاج الطبيعي للفك؟",
          answer: "يعتمد وقت البدء على نوع الجراحة ورأي الطبيب. لا يجب بدء تمارين جدية دون إذن الطبيب.",
        },
        {
          question: "هل يجب أن تكون التمارين مؤلمة؟",
          answer: "قد يكون الشد الخفيف طبيعياً، لكن الألم الشديد أو غير المعتاد علامة على التوقف والتواصل مع الطبيب.",
        },
        { question: "كم يجب أن أتمرن؟", answer: "يجب تحديد عدد المرات ومدة التمرين حسب برنامج الطبيب أو أخصائي العلاج الطبيعي." },
      ],
      assistantPromptHints: [
        "إذا سأل المستخدم عن تمرين معين، أكّد أنه يجب أن يبدأ بإذن الطبيب.",
        "لا تقدّم برنامج تمارين ثابتاً وعاماً.",
        "في حال الألم الشديد أو قفل الفك، وجّه المستخدم للتواصل مع العيادة.",
      ],
    },
    {
      slug: "sinus-lift-care",
      beforeCare: [
        "قبل الجراحة، تُفحص صحة الجيب الفكي وسماكة العظم بتصوير مثل CBCT.",
        "أخبروا الطبيب مسبقاً في حال وجود التهاب الجيوب الأنفية أو نزلة برد أو انسداد أنفي أو عطاس متكرر.",
        "يجب أن تكون الأمراض المزمنة مثل السكري أو ضغط الدم تحت السيطرة.",
        "يجب أن تُدار الأدوية المسيّلة للدم فقط بإشراف الطبيب.",
        "تجنبوا التدخين لمدة أسبوعين على الأقل قبل الجراحة.",
        "تناولوا الأدوية الموصوفة وغسول الفم فقط حسب تعليمات الطبيب.",
      ],
      afterCare: [
        "أهم نقطة بعد رفع الجيب الفكي هي تجنب أي ضغط في الأنف والجيب الفكي.",
        "تجنبوا نفخ الأنف لمدة أسبوعين على الأقل.",
        "عند العطاس، أبقوا الفم مفتوحاً وتجنبوا العطاس بفم مغلق.",
        "لا تستخدموا غسولاً أنفياً قوياً أو عالي الضغط.",
        "تجنبوا الماصة والشفط والبصق بقوة.",
        "تجنبوا السفر الجوي أو تغيّر ضغط الهواء لمدة أسبوعين إلا بإذن الطبيب.",
        "تناولوا المضاد الحيوي والمسكن حسب الوصفة.",
        "إذا وُصف بخاخ محلول ملحي أو دواء أنفي، استخدموه بضغط خفيف فقط وحسب التعليمات.",
        "قد تساعد الكمادات الباردة وإبقاء الرأس مرتفعاً أثناء النوم خلال أول ٢٤ ساعة في السيطرة على التورم.",
        "قد يكون تورم الخد وخروج قليل من السائل الدموي من الأنف والشعور بضغط في الجيب الفكي وكدمة خفيفة تحت العين أموراً طبيعية.",
        "يستغرق تكوّن العظم الجديد عادةً عدة أشهر، ويحدَّد توقيت زراعة الأسنان اللاحقة برأي الطبيب.",
      ],
      warningSigns: [
        "حمى مرتفعة",
        "خروج صديد",
        "نزيف شديد",
        "ألم غير قابل للسيطرة",
        "رائحة كريهة شديدة في الفم",
        "استمرار خروج سائل أو دم من الأنف",
        "زيادة شديدة في التورم أو الألم",
      ],
      faq: [
        {
          question: "لماذا لا يجب نفخ الأنف بعد رفع الجيب الفكي؟",
          answer: "نفخ الأنف والضغط عليه قد يضرّان بالطعم العظمي أو غشاء الجيب الفكي ويرفعان احتمال حدوث مضاعفات.",
        },
        {
          question: "هل خروج قليل من السائل من الأنف طبيعي؟",
          answer: "الكمية القليلة قد تكون طبيعية، لكن النزيف الشديد أو المستمر يجب أن يُراجَع.",
        },
        {
          question: "متى تُجرى زراعة الأسنان؟",
          answer: "يعتمد التوقيت الدقيق على حالة العظم ونوع رفع الجيب الفكي ورأي الطبيب، وقد يحتاج إلى عدة أشهر.",
        },
      ],
      assistantPromptHints: [
        "إذا سأل المستخدم عن نفخ الأنف أو العطاس أو غسل الأنف، اشرح بجدية ضرورة تجنب الضغط.",
        "إذا ذكر المستخدم حمى أو صديداً أو رائحة كريهة شديدة أو ألماً غير قابل للسيطرة، وجّهه فوراً للتواصل مع العيادة.",
        "لا تعلن تكلفة أو توقيتاً قطعياً للزراعة دون فحص.",
      ],
    },
    {
      slug: "genioplasty-care",
      beforeCare: [
        "قبل الجراحة، أخبروا الطبيب بالأدوية التي تتناولونها والأمراض المزمنة والحساسية الدوائية وسوابق الجراحة أو دخول المستشفى.",
        "إذا طلب الطبيب صوراً أو تحاليل أو تصويراً، جهّزوها قبل العملية.",
        "نسّقوا مع الطبيب بشأن التدخين والكحول ومضادات التخثر.",
      ],
      afterCare: [
        "استخدموا كمادات باردة خلال أول ٤٨ ساعة، عادةً بشكل دوري مع فترات راحة بينها.",
        "أثناء النوم والراحة، أبقوا الرأس أعلى من مستوى الجسم.",
        "تناولوا الأدوية الموصوفة حسب تعليمات الطبيب.",
        "تجنبوا النشاط الشاق والرياضة ورفع الأجسام الثقيلة لمدة أسبوعين.",
        "اعتمدوا على الأطعمة الطرية والفاترة وتجنبوا مضغ الأطعمة الصلبة.",
        "اعتنوا بنظافة الفم بدقة، واستخدموا غسول الفم إذا وُصف لكم.",
        "غيّروا لاصقة أو ضماد الذقن فقط حسب تعليمات الطبيب.",
        "التورم والكدمات والشعور بالشد في الأيام الأولى أمور طبيعية وتتراجع تدريجياً.",
        "قد يستمر التنميل في الشفة السفلى أو الذقن لعدة أسابيع إلى عدة أشهر، وعادةً يتحسن تدريجياً.",
        "تجنبوا التدخين والأرجيلة والكحول لمدة ٤ أسابيع.",
        "تجنبوا تعرّض منطقة الذقن لأي ضربة حتى اكتمال الالتئام.",
        "يمكن تقييم النتيجة النهائية بعد التراجع الكامل للتورم وخلال عدة أشهر.",
      ],
      warningSigns: [
        "حمى",
        "نزيف شديد",
        "خروج صديد",
        "ألم غير قابل للسيطرة",
        "زيادة مفاجئة في التورم",
        "تعرّض منطقة العملية لضربة",
        "تغيّر مفاجئ أو مقلق في وضع الذقن",
      ],
      faq: [
        {
          question: "هل التنميل بعد جراحة الذقن طبيعي؟",
          answer: "قد يستمر التنميل في الشفة السفلى أو الذقن لفترة، وعادةً يتحسن تدريجياً، لكن يجب متابعته في المواعيد.",
        },
        {
          question: "متى تظهر النتيجة النهائية؟",
          answer: "بعد التراجع الكامل للتورم، يمكن عادةً تقييم النتيجة بشكل أفضل خلال الأشهر التالية.",
        },
        { question: "ما الأطعمة المناسبة؟", answer: "الأطعمة الطرية والفاترة التي لا تحتاج إلى مضغ كثير أنسب." },
      ],
      assistantPromptHints: [
        "إذا سأل المستخدم عن التنميل، أجب بهدوء وحذر وأحله إلى متابعة المواعيد.",
        "إذا ذُكرت الحمى أو خروج الصديد أو الألم غير القابل للسيطرة، فالتواصل مع العيادة ضروري.",
        "لا تعطِ إطلاقاً وقتاً قطعياً للنتيجة النهائية.",
      ],
    },
  ],
} satisfies CareInstructionsPageDictionary;

export const ar = {
  header,
  footer,
  hero,
  aiConcierge,
  services,
  doctorStory,
  caseGallery,
  patientJourney,
  patientStories,
  knowledgeCenter,
  videoHub,
  faqSection,
  assistantFlow,
  about,
  contact,
  servicesPage,
  healthTourism,
  beforeAfterPage,
  knowledge,
  careInstructions,
};
