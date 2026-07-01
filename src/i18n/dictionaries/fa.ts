/**
 * Persian homepage copy. Real facts sourced from CONTENT_INVENTORY.md;
 * anything not yet confirmed by the client is marked TODO rather than invented.
 * See docs/adr/0002-fa-first-locale-scope.md — this is the only fully-populated locale for now.
 */
export const fa = {
  meta: {
    siteName: "دکتر علیرضا صدیقی",
  },
  nav: {
    services: "خدمات",
    gallery: "نمونه کارها",
    about: "درباره دکتر",
    contact: "تماس",
    bookConsultation: "رزرو مشاوره",
  },
  hero: {
    // Title + doctor line confirmed by Hamid 2026-07-02 — approved copy, not a placeholder.
    // No CTA button in the Hero per his instruction.
    title: "معماری زیبایی، با دقت یک جراح و نگاه یک هنرمند",
    doctorName: "دکتر علیرضا صدیقی",
    doctorSpecialty: "جراح تخصصی فک، صورت و زیبایی بینی",
  },
  brandIntro: {
    // TODO(content): manifesto copy — draft below follows Nextuply's brand-tone DNA (formal, analytical, no hype); needs client sign-off.
    heading: "پزشکی زیبایی، با استاندارد بین‌المللی",
    body: "هر تصمیم در این کلینیک از یک اصل پیروی می‌کند: نتیجه‌ای که هم از نظر فنی دقیق باشد و هم از نظر انسانی قابل اعتماد. این همان استانداردی است که Nextuply برای معماری تجربه دیجیتال این کلینیک هم به کار برده است.",
    cta: "مشاهده بیشتر",
  },
  doctorStory: {
    heading: "درباره دکتر صدیقی",
    body: "دکتر علیرضا صدیقی، متخصص جراحی فک و صورت با فلوشیپ زیبایی و بازسازی صورت از دانشگاه علوم پزشکی تهران، در دو شهر تهران و تبریز به بیماران خود خدمت می‌دهد.",
    cta: "درباره دکتر",
  },
  beforeAfter: {
    heading: "نتایج واقعی",
    subheading: "نمونه‌کارهای واقعی، پیش از انتشار با رضایت بیمار",
    cta: "مشاهده نتایج بیشتر",
    // TODO(assets): real case photos pending — see CONTENT_INVENTORY.md §8 for intake spec.
  },
  aiExperience: {
    heading: "کلینیکی که همیشه در دسترس است",
    items: [
      {
        title: "دستیار پذیرش هوشمند",
        body: "پاسخ‌گویی ۲۴ ساعته به سوالات اولیه شما، حتی خارج از ساعات کاری.",
      },
      {
        title: "رزرو نوبت هوشمند",
        body: "رزرو و پیگیری وقت مشاوره بدون نیاز به تماس تلفنی.",
      },
      {
        title: "پیگیری اختصاصی",
        body: "یادآوری نوبت و اطلاع‌رسانی مراحل درمان به‌صورت خودکار.",
      },
    ],
    cta: "کشف دستیار هوشمند کلینیک",
  },
  services: {
    heading: "خدمات",
    aestheticCategory: "خدمات زیبایی",
    aestheticItems: [
      "بلفاروپلاستی (جراحی پلک)",
      "رینوپلاستی (زیبایی بینی)",
      "بوتاکس",
      "تزریق ژل و چربی",
      "ایمپلنت گونه",
      "کاهش چربی گونه (باکال فت)",
      "لیپوساکشن زیر چانه",
      "لیفت ابرو و شقیقه",
      "فیس‌لیفت",
      "بازسازی نقص‌های صورت",
    ],
    maxillofacialCategory: "جراحی فک و دهان",
    maxillofacialItems: [
      "ایمپلنت دندان",
      "جراحی فک",
      "کشیدن دندان عقل",
      "جراحی دندان نهفته",
    ],
    cta: "مشاهده همه خدمات",
  },
  patientJourney: {
    heading: "مسیر شما تا نتیجه دلخواه",
    steps: [
      { title: "اولین تماس", body: "گفت‌وگو با دستیار هوشمند یا تیم پذیرش" },
      { title: "ویزیت حضوری", body: "معاینه و مشاوره تخصصی با دکتر صدیقی" },
      { title: "انجام عمل/درمان", body: "اجرای دقیق برنامه درمانی" },
      { title: "پیگیری نتیجه", body: "مراقبت پس از عمل و پیگیری رضایت" },
    ],
    cta: "شروع مسیر من",
  },
  statistics: {
    heading: "در یک نگاه",
    // TODO(content): real numbers needed from the client — do not publish placeholder stats.
  },
  testimonials: {
    heading: "تجربه بیماران",
    items: [
      {
        // Real fragment from the current live site (CONTENT_INVENTORY.md §4); full quote and attribution pending client confirmation.
        quote: "مشکل ۱۲ ساله دندان دخترم ظرف نیم ساعت حل شد.",
        attribution: "یکی از بیماران دکتر صدیقی",
      },
    ],
    cta: "خواندن بیشتر",
  },
  finalCta: {
    heading: "آماده شروع تحول خود هستید؟",
    ctaPrimary: "رزرو نوبت",
    ctaSecondary: "مشاوره در واتساپ",
  },
  footer: {
    locations: {
      tabriz: {
        label: "تبریز",
        address: "خیابان ولیعصر، میدان رودکی، ساختمان فرید، طبقه ۴ (جنب داروخانه دکتر زارعی)",
        phone: "041-33334539",
        mobile: "09120149500",
      },
      tehran: {
        label: "تهران",
        // TODO(content): Tehran address/hours pending — see CONTENT_INVENTORY.md §7.
        address: "به‌زودی",
      },
    },
    hours: "شنبه تا چهارشنبه ۱۰:۰۰ تا ۱۹:۰۰ | پنجشنبه ۱۰:۰۰ تا ۱۴:۰۰ | جمعه تعطیل",
    instagram: "@dr.sadighi.alireza",
  },
} as const;

export type Dictionary = typeof fa;
