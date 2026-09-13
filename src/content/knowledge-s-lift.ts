import type {
  KnowledgeArticle,
  KnowledgeArticleClinicalImage,
  KnowledgeArticleReference,
  KnowledgeArticleSection,
} from "./knowledge-articles";

const MEDIA_BASE = "/media/knowledge/اس-لیفت-شقیقه";

function clinicalImage(fileName: string, alt: string, width: number, height: number, caption?: string): KnowledgeArticleClinicalImage {
  return { src: `${MEDIA_BASE}/${fileName}`, alt, width, height, caption };
}

const faBefore = clinicalImage("before.jpg", "تصویر قبل از اس لیفت شقیقه دکتر علیرضا صدیقی", 918, 1280);
const faAfter = clinicalImage("after.jpg", "تصویر بعد از اس لیفت شقیقه دکتر علیرضا صدیقی", 1051, 1497);
const faIncision = clinicalImage(
  "incision.jpg",
  "نمای بالینی محل برش اس لیفت در ناحیه خط رویش مو",
  1200,
  1600,
  "نمای بالینی محل برش اس لیفت در ناحیه خط رویش مو"
);
const faSuture = clinicalImage("suture.jpg", "نمای نزدیک بخیه پوستی محل برش اس لیفت شقیقه", 1200, 1600, "نمای نزدیک بخیه پوستی محل برش");

const enBefore = clinicalImage("before.jpg", "Before S Lift temple lift by Dr. Alireza Sadighi", 918, 1280);
const enAfter = clinicalImage("after.jpg", "After S Lift temple lift by Dr. Alireza Sadighi", 1051, 1497);
const enIncision = clinicalImage(
  "incision.jpg",
  "Clinical view of the S Lift incision at the hairline",
  1200,
  1600,
  "Clinical view of the S Lift incision at the hairline"
);
const enSuture = clinicalImage(
  "suture.jpg",
  "Close-up view of the skin sutures at the S Lift temple incision",
  1200,
  1600,
  "Close-up of the skin sutures at the S Lift temple incision"
);

const arBefore = clinicalImage("before.jpg", "صورة قبل إجراء إس ليفت لشد الصدغ لدى الدكتور عليرضا صديقي", 918, 1280);
const arAfter = clinicalImage("after.jpg", "صورة بعد إجراء إس ليفت لشد الصدغ لدى الدكتور عليرضا صديقي", 1051, 1497);
const arIncision = clinicalImage(
  "incision.jpg",
  "منظر سريري لموضع شق إس ليفت عند خط الشعر",
  1200,
  1600,
  "منظر سريري لموضع شق إس ليفت عند خط الشعر"
);
const arSuture = clinicalImage("suture.jpg", "منظر مقرب لغرز الجلد في موضع شق إس ليفت للصدغ", 1200, 1600, "منظر مقرب لغرز الجلد في موضع الشق");

/**
 * Authoritative external sources for the S Lift article (2026-09-13).
 * Verified against NCBI E-utilities (all three PMIDs resolve to exactly
 * these titles) and plasticsurgery.org (the old `/facelift/risks-and-safety`
 * URL now 301s to the overview page, so the overview itself is cited).
 *
 * Declared ONCE at article level: the template resolves
 * `content.references ?? article.references`, so FA/EN/AR all render this
 * same set without duplicating the array into each translation.
 *
 * These provide historical S-Lift terminology context, general facelift
 * safety/recovery context, and general tissue-sealant literature. They do
 * NOT validate Dr. Sadighi's own current technique — titles are kept in
 * their official English form and must never be translated or used to
 * imply equivalence with the clinic's method.
 */
const S_LIFT_REFERENCES: readonly KnowledgeArticleReference[] = [
  {
    title: "The S-lift facelift featuring the U-suture and O-suture combined with skin resurfacing",
    source: "Dermatologic Surgery · 2001",
    href: "https://pubmed.ncbi.nlm.nih.gov/11231235/",
  },
  {
    title: "Minimal access cranial suspension lift: a modified S-lift",
    source: "Plastic and Reconstructive Surgery · 2002",
    href: "https://pubmed.ncbi.nlm.nih.gov/11994618/",
  },
  {
    title: "Use of tissue sealants in face-lifts: a metaanalysis",
    source: "Aesthetic Plastic Surgery · 2009",
    href: "https://pubmed.ncbi.nlm.nih.gov/19089492/",
  },
  {
    title: "American Society of Plastic Surgeons — Facelift overview, including risks and safety information",
    source: "American Society of Plastic Surgeons",
    href: "https://www.plasticsurgery.org/cosmetic-procedures/facelift",
  },
  {
    title: "American Society of Plastic Surgeons — Facelift Recovery",
    source: "American Society of Plastic Surgeons",
    href: "https://www.plasticsurgery.org/cosmetic-procedures/facelift/recovery",
  },
];

const faSections: readonly KnowledgeArticleSection[] = [
  {
    blocks: [
      {
        type: "paragraph",
        text: "اگر این روزها دنبال روشی می‌گردید که به کمک روش جراحی ماندگار ولی کم تهاجمی، افتادگی پوست ناحیه شقیقه و گونه را اصلاح کند، احتمالاً به نام «اس لیفت» یا S Lift برخورده‌اید. این روش که این روزها طرفداران زیادی در بین افرادی که به دنبال جوان‌سازی صورت هستند پیدا کرده، دقیقاً همان چیزی است که خیلی‌ها دنبالش بودند: نتیجه‌ای طبیعی ، اما بدون درد، بدون نخ، بدون بیهوشی عمومی و بدون جای بخیه.",
        links: [{ text: "افتادگی پوست ناحیه شقیقه و گونه", href: "/services/facial-cosmetic-surgery/temple-face-lift" }],
      },
      {
        type: "paragraph",
        text: "در این مقاله قرار است به‌طور کامل با اس لیفت آشنا شویم؛ از اینکه دقیقاً چیست و چطور انجام می‌شود، تا نقش مواد جوان‌ساز و چسب فیبرینی طبیعی در ماندگاری نتیجه، دوره نقاهت و اینکه چه کسانی کاندید مناسبی برای این روش هستند.",
      },
    ],
  },
  {
    heading: "اس لیفت چیست؟",
    blocks: [
      {
        type: "paragraph",
        text: "اس لیفت یک روش نوین و کم‌تهاجمی برای لیفت ناحیه شقیقه و بالای صورت است، بدون اینکه از هیچ نخی استفاده شود. در این تکنیک، با بی‌حسی موضعی، بافت‌های شل و افتاده پوست ناحیه شقیقه و گونه به شکلی کاملاً طبیعی بالا کشیده می‌شوند و در موقعیت جدید و جوان‌تری تثبیت می‌شوند.",
      },
      {
        type: "paragraph",
        text: "برخلاف تصوری که خیلی‌ها از لیفت صورت دارند، اس لیفت هیچ جسم خارجی مثل نخ یا ایمپلنت در پوست باقی نمی‌گذارد. نتیجه کار، لیفتی است که کاملاً با فرم طبیعی صورت هماهنگ است، نه یک تغییر مصنوعی و قابل تشخیص.",
        links: [{ text: "لیفت صورت", href: "/services/facial-cosmetic-surgery" }],
      },
    ],
  },
  {
    heading: "چرا شقیقه؟ چرا این ناحیه اینقدر اهمیت دارد؟",
    blocks: [
      {
        type: "paragraph",
        text: "خیلی از افراد وقتی به فکر جوان‌سازی صورت می‌افتند، تمرکزشان روی خط فک، گونه یا دور چشم است و ناحیه شقیقه را نادیده می‌گیرند. اما واقعیت این است که افتادگی و فرورفتگی شقیقه یکی از اولین نشانه‌های پیری صورت است. با گذر زمان، حجم چربی و کلاژن این ناحیه کاهش پیدا می‌کند، پوست شل می‌شود و همین موضوع باعث می‌شود ابروها هم کمی افتاده‌تر به نظر برسند و چین و چروک‌های ریز اطراف چشم و شقیقه بیشتر خودنمایی کنند.",
      },
      {
        type: "paragraph",
        text: "وقتی شقیقه لیفت می‌شود، تاثیر آن فقط محدود به همان ناحیه نیست؛ کل بالای صورت، از جمله ابرو و گوشه چشم، حالتی کشیده‌تر و جوان‌تر پیدا می‌کند و چین و چروک‌های این ناحیه به‌طور محسوسی کاهش پیدا می‌کنند. به همین دلیل است که اس لیفت را یکی از تاثیرگذارترین روش‌ها برای جوان‌سازی کلی صورت می‌دانند، در حالی که خیلی از افراد فکر می‌کنند این ناحیه اهمیت کمتری دارد.",
      },
    ],
  },
  {
    heading: "اس لیفت چطور انجام می‌شود؟",
    blocks: [
      { type: "paragraph", text: "روند انجام اس لیفت معمولاً به این شکل است:" },
      { type: "subheading", text: "۱. مشاوره و طراحی نقشه صورت" },
      {
        type: "paragraph",
        text: "پیش از هر اقدامی، پزشک ساختار صورت، میزان افتادگی پوست و نقاطی که نیاز به لیفت دارند را بررسی می‌کند. این مرحله برای رسیدن به نتیجه‌ای طبیعی و متناسب با فرم صورت هر فرد بسیار مهم است، تا نتیجه نهایی هیچ‌وقت حالت مصنوعی یا اغراق‌شده پیدا نکند.",
      },
      { type: "subheading", text: "۲. بی‌حسی موضعی" },
      {
        type: "paragraph",
        text: "برخلاف تصوری که خیلی‌ها از عمل‌های زیبایی دارند، اس لیفت نیازی به بیهوشی عمومی ندارد. فقط ناحیه مورد نظر با بی‌حسی موضعی، بی‌حس می‌شود و شما در تمام مراحل هوشیار هستید اما هیچ دردی احساس نمی‌کنید.",
      },
      { type: "subheading", text: "۳. انجام لیفت" },
      {
        type: "paragraph",
        text: "بدون استفاده از هیچ نخی ، به کمک برش یک سانتیمتری داخل مو که بعدا از داخل ان هم مو رویش میکند ،بافت‌های شل ناحیه شقیقه و بالای صورت به آرامی به موقعیت جدید و جوان‌تر خود بازگردانده می‌شوند. دقیقاً همین موضوع است که باعث می‌شود بعد از عمل، اثری از بخیه، زخم یا جسم خارجی زیر پوست باقی نماند.",
      },
      { type: "clinicalMedia", media: { type: "image", image: faIncision } },
      { type: "subheading", text: "۴. تزریق مواد جوان‌ساز و چسب فیبرینی طبیعی" },
      {
        type: "paragraph",
        text: "برای اینکه نتیجه کار بهتر و ماندگارتر شود، در مرحله پایانی، مواد جوان‌ساز به همراه چسب فیبرینی جوان‌ساز که از خون خود فرد تهیه می‌شود، به ناحیه تزریق می‌شود. از آنجا که این ماده کاملاً از بدن خود فرد گرفته می‌شود، نه‌تنها خطر واکنش آلرژیک یا حساسیت وجود ندارد، بلکه به تحریک بازسازی طبیعی بافت و تثبیت بهتر نتیجه لیفت کمک می‌کند.",
      },
      { type: "paragraph", text: "کل این فرآیند معمولاً بین ۳۰ تا ۶۰ دقیقه طول می‌کشد و بلافاصله بعد از آن می‌توانید کلینیک را ترک کنید." },
    ],
  },
  {
    heading: "بدون درد، بدون نخ، واقعاً همینطور است؟",
    blocks: [
      {
        type: "paragraph",
        text: "یکی از سوال‌هایی که تقریباً همه از این روش می‌پرسند همین است. و پاسخ آن بله است. اس لیفت فقط با برش یک سانتی متری داخل مو بدون اینکه از نخ یا هر جسم خارجی دیگری استفاده می‌کند، به همین دلیل اثری از بخیه یا زخم باز باقی نمی‌ماند. حداکثر چیزی که ممکن است در محل انجام کار دیده شود، کمی قرمزی یا تورم وکبودی خفیف است که طی چند روز به‌طور کامل از بین می‌رود.",
      },
      {
        type: "paragraph",
        text: "بی‌حسی موضعی هم باعث می‌شود در طول انجام کار هیچ دردی حس نکنید. بعضی افراد فقط کمی احساس فشار یا کشش در ناحیه شقیقه دارند که کاملاً طبیعی و قابل تحمل است.",
      },
    ],
  },
  {
    heading: "نقش مواد جوان‌ساز و چسب فیبرینی طبیعی در ماندگاری نتیجه",
    blocks: [
      {
        type: "paragraph",
        text: "یکی از نکاتی که اس لیفت را از خیلی از روش‌های مشابه متمایز می‌کند، استفاده از مواد جوان‌ساز همراه با چسب فیبرینی است که از خود بدن فرد گرفته می‌شود. این ماده معمولاً از نمونه خون خود فرد تهیه و آماده‌سازی می‌شود و سپس به ناحیه شقیقه تزریق می‌گردد.",
      },
      {
        type: "paragraph",
        text: "فایده اصلی این کار این است که علاوه بر لیفت مکانیکی بافت، فرآیند بازسازی و ترمیم طبیعی پوست هم تحریک می‌شود. به زبان ساده، نتیجه کار فقط یک «جابه‌جایی» ساده بافت نیست، بلکه کیفیت پوست هم بهبود پیدا می‌کند و همین موضوع باعث می‌شود نتیجه نهایی هم طبیعی‌تر باشد و هم برای مدت طولانی‌تری پایدار بماند.",
      },
      {
        type: "paragraph",
        text: "از آنجا که این ماده کاملاً از خود فرد گرفته می‌شود، بدن هیچ واکنش خارجی یا حساسیتی نسبت به آن نشان نمی‌دهد و این یکی از دلایلی است که اس لیفت را به روشی ایمن و سازگار با بدن تبدیل کرده است.",
      },
    ],
  },
  {
    heading: "اس لیفت طبیعی است، نه مصنوعی",
    blocks: [
      {
        type: "paragraph",
        text: "یکی از بزرگ‌ترین نگرانی‌های افرادی که به فکر لیفت صورت هستند، این است که نتیجه کار خیلی «واضح» یا غیرطبیعی به نظر برسد؛ صورتی که حالت کشیده و بی‌حالت (ماسکه) پیدا کند یا حالت متعجب و بالازده به خود بگیرد. خبر خوب این است که اس لیفت دقیقاً برای جلوگیری از همین مشکل طراحی شده است.",
      },
      {
        type: "paragraph",
        text: "از آنجا که در این روش بافت‌ها به شکل ملایم و متناسب با فرم طبیعی صورت جابه‌جا می‌شوند و در کنار آن از مواد جوان‌ساز طبیعی خود فرد هم استفاده می‌شود، نتیجه نهایی کاملاً طبیعی به نظر می‌رسد. صورت شما همچنان حالت‌های طبیعی خود را در خنده، اخم و بقیه حالت‌های چهره حفظ می‌کند و خبری از چهره بی‌حرکت و ماسکه یا ابروهای بیش از حد بالازده و حالت تعجب‌آلود نیست. هدف اس لیفت، جوان‌تر نشان دادن شما به شکل خودتان است، نه تغییر دادن فرم صورت به چیزی متفاوت.",
      },
      { type: "clinicalMedia", media: { type: "comparison", before: faBefore, after: faAfter, beforeLabel: "قبل", afterLabel: "بعد" } },
    ],
  },
  {
    heading: "دوره نقاهت اس لیفت چقدر طول می‌کشد؟",
    blocks: [
      {
        type: "paragraph",
        text: "یکی از بزرگ‌ترین مزیت‌های اس لیفت نسبت به اندوسکوپیک، کوتاه بودن دوره نقاهت آن است. در حالی که فیس‌لیفت جراحی ممکن است هفته‌ها زمان برای بهبودی کامل نیاز داشته باشد، دوره نقاهت اس لیفت معمولاً حدود یک هفته است.",
      },
      { type: "paragraph", text: "در این یک هفته:" },
      {
        type: "list",
        items: [
          "ممکن است کمی تورم یا کبودی خفیف در ناحیه شقیقه دیده شود که طبیعی است و به‌مرور از بین می‌رود.",
          "توصیه می‌شود از فشار آوردن مستقیم به ناحیه عمل، ماساژ صورت و قرار گرفتن طولانی‌مدت زیر آفتاب خودداری کنید.",
          "خوابیدن با سر کمی بالاتر از بدن در چند شب اول می‌تواند به کاهش تورم کمک کند.",
          "اکثر افراد از همان روز دوم یا سوم می‌توانند به فعالیت‌های روزمره خود برگردند، البته با رعایت مراقبت‌های ساده‌ای که پزشک توصیه می‌کند.",
        ],
      },
      {
        type: "paragraph",
        text: "نکته مهم این است که برخلاف جراحی‌های باز، در اس لیفت نیازی به مرخصی طولانی یا محدودیت‌های سخت‌گیرانه نیست و اکثر افراد می‌توانند با کمی برنامه‌ریزی، این روش را بدون اختلال جدی در زندگی روزمره خود انجام دهند.",
      },
    ],
  },
  {
    heading: "نتیجه اس لیفت از چه زمانی مشخص می‌شود؟",
    blocks: [
      {
        type: "paragraph",
        text: "یکی از نکات جذاب این روش این است که نتیجه اولیه تقریباً بلافاصله بعد از انجام عمل قابل مشاهده است. با این حال، نتیجه نهایی و طبیعی‌تر معمولاً بعد از فروکش کردن تورم اولیه و اثرگذاری کامل مواد جوان‌ساز تزریق‌شده، یعنی حدود یک تا دو هفته بعد، کاملاً خودش را نشان می‌دهد.",
        links: [{ text: "نتیجه اولیه", href: "/before-after" }],
      },
      {
        type: "paragraph",
        text: "از نظر ماندگاری، نتایج اس لیفت بسته به نوع پوست، سبک زندگی و مراقبت‌های بعد از عمل متفاوت است، اما به‌طور کلی ترکیب لیفت طبیعی بافت با مواد جوان‌ساز و چسب فیبرینی خود فرد، نتیجه‌ای ماندگارتر و پایدارتر به همراه دارد و برای مدت طولانی می‌توانید از ظاهر جوان‌تر، شاداب‌تر و بدون چین و چروک صورت خود لذت ببرید.",
      },
    ],
  },
  {
    heading: "چه کسانی کاندید مناسب اس لیفت هستند؟",
    blocks: [
      { type: "paragraph", text: "اس لیفت مخصوصاً برای افرادی مناسب است که:" },
      {
        type: "list",
        items: [
          "افتادگی در ناحیه شقیقه و بالای گونه دارند.",
          "چین و چروک‌های ریز اطراف شقیقه و گوشه چشم آزارشان می‌دهد.",
          "به دنبال روشی سریع، کم‌تهاجمی، بدون نخ و بدون دوره نقاهت طولانی هستند.",
          "هنوز آمادگی یا تمایل به انجام جراحی‌های فیس‌لیفت را ندارند.",
          "می‌خواهند نتیجه‌ای کاملاً طبیعی و ماندگار داشته باشند و نگران چهره ماسکه یا حالت غیرطبیعی و متعجب هستند.",
        ],
      },
      {
        type: "paragraph",
        text: "البته بهترین راه برای اطمینان از اینکه این روش برای شما مناسب است یا خیر، مشاوره حضوری با پزشک متخصص است تا بر اساس شرایط پوست و صورت شما، بهترین تصمیم گرفته شود.",
        links: [{ text: "پزشک متخصص", href: "/about" }],
      },
    ],
  },
  {
    heading: "تفاوت اس لیفت با فیس‌لیفت جراحی",
    blocks: [
      { type: "paragraph", text: "خیلی از افراد بین این دو روش دچار سردرگمی می‌شوند. تفاوت اصلی در میزان تهاجمی بودن این دو روش است:" },
      {
        type: "paragraph",
        text: "جراحی فیس‌لیفت معمولاً شامل برش‌های بزرگ‌تر، بیهوشی عمومی، بخیه و دوره نقاهت طولانی‌تر (معمولاً چند هفته) است. در مقابل، اس لیفت بدون نخ، با برشی کوچک و با بی‌حسی موضعی انجام می‌شود، به کمک مواد جوان‌ساز طبیعی خود فرد تقویت می‌شود و دوره نقاهت آن در حدود یک هفته است. از نظر نتیجه، فیس‌لیفت جراحی معمولاً برای افتادگی‌های ناحیه گونه و نیمه تحتانی صورت گزینه بهتری است، در حالی که اس لیفت برای افتادگی‌های ناحیه شقیقه، انتخابی هوشمندانه، کم‌ریسک‌تر و با نتیجه‌ای کاملاً طبیعی و ماندگار محسوب می‌شود.",
      },
    ],
  },
  {
    heading: "مقایسه برش و میزان دستکاری با روش اندوسکوپیک",
    blocks: [
      {
        type: "paragraph",
        text: "یکی دیگر از مزایای اس لیفت، کوچک‌تر بودن محل برش و محدودتر بودن دستکاری بافت‌ها در مقایسه با روش‌های اندوسکوپیک است. در اس لیفت، لیفت از طریق یک برش حدود یک سانتی‌متری در داخل مو انجام می‌شود؛ بنابراین وسعت برش و ناحیه‌ای که تحت جراحی و دستکاری قرار می‌گیرد محدودتر است.",
      },
      {
        type: "paragraph",
        text: "با توجه به محدودتر بودن محل مداخله و میزان دستکاری بافت‌ها، احتمال آسیب یا تحریک ساختارهای عصبی ناحیه نیز می‌تواند کمتر باشد. عوارض عصبی پس از جراحی‌های ناحیه شقیقه ممکن است به شکل بی‌حسی، گزگز، کاهش حس پوست یا در موارد نادر اختلالات حرکتی موقت بروز کند. کوچک بودن برش و انجام لیفت در محدوده مشخص در روش اس لیفت، می‌تواند به کاهش احتمال چنین عوارضی کمک کند.",
      },
      {
        type: "paragraph",
        text: "در روش اندوسکوپیک نیز برش‌ها نسبت به جراحی‌های باز کوچک هستند، اما برای وارد کردن ابزار و دوربین و آزادسازی بافت‌ها، معمولاً ناحیه وسیع‌تری در زیر پوست مورد مداخله قرار می‌گیرد. در مقابل، در اس لیفت با یک برش کوچک داخل مو و دستکاری محدودتر بافت، هدف این است که علاوه بر ایجاد نتیجه طبیعی، میزان آسیب بافتی و احتمال بروز عوارض عصبی نیز تا حد امکان کاهش پیدا کند.",
      },
      {
        type: "paragraph",
        text: "البته احتمال بروز عوارض در هر روش جراحی به عوامل مختلفی از جمله آناتومی هر فرد، تکنیک مورد استفاده و مهارت و تجربه پزشک بستگی دارد و نمی‌توان احتمال عوارض را در هیچ روش جراحی به‌طور کامل صفر دانست.",
      },
    ],
  },
  {
    heading: "نکاتی برای مراقبت بهتر بعد از اس لیفت",
    blocks: [
      {
        type: "paragraph",
        text: "برای اینکه نتیجه اس لیفت شما بهترین حالت ممکن را داشته باشد، رعایت چند نکته ساده می‌تواند کمک زیادی کند:",
        links: [{ text: "رعایت چند نکته ساده", href: "/care-instructions/facelift-browlift-care" }],
      },
      { type: "paragraph", text: "بخیه های روی پوست حداکثر سه روز بعد باید خارج شوند" },
      { type: "clinicalMedia", media: { type: "image", image: faSuture } },
      {
        type: "list",
        items: [
          "در روزهای اول از دست زدن یا فشار آوردن به ناحیه عمل خودداری کنید.",
          "تا حد امکان از قرار گرفتن طولانی‌مدت زیر نور مستقیم آفتاب پرهیز کنید و در صورت نیاز از ضدآفتاب استفاده کنید.",
          "از ورزش‌های سنگین و فعالیت‌هایی که باعث افزایش شدید ضربان قلب می‌شوند، در هفته اول خودداری کنید.",
          "در خواب سعی کنید فشار مستقیمی به سمت صورتی که تحت عمل قرار گرفته وارد نشود.",
          "در صورت مشاهده هرگونه علامت غیرعادی مانند درد شدید، قرمزی گسترده یا تب، حتماً با پزشک خود تماس بگیرید.",
        ],
      },
    ],
  },
  {
    heading: "جمع‌بندی",
    blocks: [
      {
        type: "paragraph",
        text: "اس لیفت یکی از هوشمندانه‌ترین راه‌حل‌ها برای کسانی است که به دنبال جوان‌سازی صورت هستند، اما نمی‌خواهند وارد فرآیند پیچیده و طولانی جراحی‌های باز شوند یا نگران نتیجه‌ای غیرطبیعی و مصنوعی باشند. بدون نخ، بدون درد، با جای بخیه کوچک، همراه با تزریق مواد جوان‌ساز و چسب فیبرینی طبیعی خود فرد برای نتیجه‌ای بهتر و ماندگارتر، با دوره نقاهتی کوتاه در حدود یک هفته و نتیجه‌ای طبیعی و بدون چین و چروک، این روش توانسته توجه بسیاری از افرادی که به دنبال ظاهری شاداب‌تر و جوان‌تر هستند را به خود جلب کند، بدون اینکه چهره‌شان حالت ماسکه یا متعجب پیدا کند.",
      },
      {
        type: "paragraph",
        text: "اگر شما هم به فکر لیفت ناحیه شقیقه هستید و می‌خواهید بدون ریسک‌های جراحی سنگین، نتیجه‌ای طبیعی، ماندگار و چشمگیر داشته باشید، مشاوره با یک متخصص مجرب می‌تواند اولین قدم درست برای شما باشد.",
      },
    ],
  },
];

const faFaq = [
  { question: "آیا در اس لیفت از نخ استفاده می‌شود؟", answer: "خیر، اس لیفت بدون استفاده از هیچ نخ یا جسم خارجی دیگری انجام می‌شود و به همین دلیل نتیجه‌ای کاملاً طبیعی دارد." },
  { question: "آیا اس لیفت درد دارد؟", answer: "خیر، این روش با بی‌حسی موضعی انجام می‌شود و در طول عمل هیچ دردی احساس نمی‌کنید." },
  {
    question: "آیا بعد از اس لیفت جای بخیه یا اسکار می‌ماند؟",
    answer: "خیر، چون برش یک سانتی داخل مو هست و از داخل برش مو رویش میکند هیچ پوستی برداشته نمی شود ، جای بخیه یا اسکاری باقی نمی‌ماند.",
  },
  {
    question: "چسب فیبرینی جوان‌ساز که در اس لیفت استفاده می‌شود از کجا تهیه می‌شود؟",
    answer: "این ماده به‌طور کامل از خون خود فرد تهیه می‌شود، به همین دلیل خطر حساسیت یا واکنش آلرژیک وجود ندارد و به بازسازی طبیعی بافت و ماندگاری بهتر نتیجه کمک می‌کند.",
  },
  {
    question: "آیا اس لیفت باعث چهره ماسکه یا حالت غیرطبیعی می‌شود؟",
    answer: "خیر، برخلاف بعضی روش‌های دیگر، اس لیفت نتیجه‌ای کاملاً طبیعی دارد و صورت شما همچنان حالت‌های طبیعی خود را در حرکات و حالات چهره حفظ می‌کند، بدون حالت متعجب یا ابروهای بیش از حد بالازده.",
  },
  { question: "دوره نقاهت اس لیفت چقدر است؟", answer: "معمولاً حدود یک هفته، که در این مدت تورم و کبودی اولیه به‌طور کامل از بین می‌رود." },
  {
    question: "نتیجه اس لیفت چقدر ماندگار است؟",
    answer: "نتایج این روش پایدار و ماندگار است و استفاده از مواد جوان‌ساز و چسب فیبرینی طبیعی خود فرد به ماندگاری بیشتر آن کمک می‌کند، هرچند مدت‌زمان دقیق آن به نوع پوست و سبک زندگی هر فرد بستگی دارد.",
  },
  {
    question: "چه زمانی نتیجه نهایی اس لیفت مشخص می‌شود؟",
    answer: "نتیجه اولیه تقریباً بلافاصله بعد از عمل قابل مشاهده است، اما نتیجه نهایی و طبیعی‌تر معمولاً یک تا دو هفته بعد کاملاً خودش را نشان می‌دهد.",
  },
] as const;

const enSections: readonly KnowledgeArticleSection[] = [
  {
    blocks: [
      {
        type: "paragraph",
        text: "If these days you are looking for a lasting but minimally invasive surgical method to correct sagging skin in the temple and cheek area, you have probably come across the name “S Lift.” This method, which has recently gained many supporters among people seeking facial rejuvenation, is exactly what many have been looking for: a natural result, but without pain, without threads, without general anesthesia, and without a visible suture mark.",
        links: [{ text: "sagging skin in the temple and cheek area", href: "/services/facial-cosmetic-surgery/temple-face-lift" }],
      },
      {
        type: "paragraph",
        text: "In this article, we will become fully acquainted with S Lift: from exactly what it is and how it is performed, to the role of rejuvenating substances and natural fibrin adhesive in the result's longevity, the recovery period, and who is a suitable candidate for this method.",
      },
    ],
  },
  {
    heading: "What is S Lift?",
    blocks: [
      {
        type: "paragraph",
        text: "S Lift is a modern, minimally invasive method for lifting the temple area and upper face without using any thread. In this technique, under local anesthesia, the loose and sagging tissues of the temple and cheek are lifted in a completely natural way and secured in a new, more youthful position.",
      },
      {
        type: "paragraph",
        text: "Contrary to what many people imagine about a facelift, S Lift leaves no foreign object such as a thread or implant in the skin. The result is a lift that is completely harmonious with the face's natural form, not an artificial and noticeable change.",
        links: [{ text: "facelift", href: "/services/facial-cosmetic-surgery" }],
      },
    ],
  },
  {
    heading: "Why the temple? Why is this area so important?",
    blocks: [
      {
        type: "paragraph",
        text: "When many people think about facial rejuvenation, they focus on the jawline, cheeks, or eye area and overlook the temple. But the reality is that sagging and hollowing of the temple is one of the first signs of facial aging. Over time, the volume of fat and collagen in this area decreases, the skin becomes loose, and this makes the brows appear slightly more drooped while fine wrinkles around the eyes and temples become more noticeable.",
      },
      {
        type: "paragraph",
        text: "When the temple is lifted, its effect is not limited to that area alone; the entire upper face, including the brow and outer corner of the eye, takes on a more lifted and youthful appearance, and wrinkles in this area are noticeably reduced. This is why S Lift is considered one of the most effective methods for overall facial rejuvenation, even though many people think this area is less important.",
      },
    ],
  },
  {
    heading: "How is S Lift performed?",
    blocks: [
      { type: "paragraph", text: "The S Lift process usually proceeds as follows:" },
      { type: "subheading", text: "1. Consultation and facial mapping" },
      {
        type: "paragraph",
        text: "Before taking any action, the doctor examines the facial structure, the degree of skin laxity, and the points that need lifting. This stage is very important for achieving a natural result proportionate to each person's facial form, so that the final result never takes on an artificial or exaggerated appearance.",
      },
      { type: "subheading", text: "2. Local anesthesia" },
      {
        type: "paragraph",
        text: "Contrary to what many people imagine about cosmetic operations, S Lift does not require general anesthesia. Only the target area is numbed with local anesthesia, and you remain awake throughout every stage but feel no pain.",
      },
      { type: "subheading", text: "3. Performing the lift" },
      {
        type: "paragraph",
        text: "Without using any thread, and with the help of a one-centimeter incision inside the hair where hair later also grows from within it, the loose tissues of the temple and upper face are gently returned to their new, more youthful position. This is exactly what means that after the operation, no trace of a suture, wound, or foreign object remains beneath the skin.",
      },
      { type: "clinicalMedia", media: { type: "image", image: enIncision } },
      { type: "subheading", text: "4. Injection of rejuvenating substances and natural fibrin adhesive" },
      {
        type: "paragraph",
        text: "To make the result better and longer-lasting, in the final stage, rejuvenating substances together with a rejuvenating fibrin adhesive prepared from the person's own blood are injected into the area. Because this material is taken entirely from the person's own body, there is not only no risk of an allergic reaction or sensitivity, but it also helps stimulate natural tissue regeneration and better stabilization of the lift result.",
      },
      { type: "paragraph", text: "This entire process usually takes between 30 and 60 minutes, and you can leave the clinic immediately afterward." },
    ],
  },
  {
    heading: "Pain-free, thread-free—is it really so?",
    blocks: [
      {
        type: "paragraph",
        text: "This is one of the questions almost everyone asks about this method. And the answer is yes. S Lift uses only a one-centimeter incision inside the hair without using thread or any other foreign object; for this reason, no trace of a suture or open wound remains. At most, what may be seen at the treatment site is a little redness, swelling, and mild bruising, which completely disappears within a few days.",
      },
      {
        type: "paragraph",
        text: "Local anesthesia also means you feel no pain while the procedure is being performed. Some people only feel a little pressure or pulling in the temple area, which is completely natural and tolerable.",
      },
    ],
  },
  {
    heading: "The role of rejuvenating substances and natural fibrin adhesive in the longevity of the result",
    blocks: [
      {
        type: "paragraph",
        text: "One point that distinguishes S Lift from many similar methods is the use of rejuvenating substances together with fibrin adhesive taken from the person's own body. This material is usually prepared and processed from a sample of the person's own blood and is then injected into the temple area.",
      },
      {
        type: "paragraph",
        text: "The main benefit is that, in addition to mechanically lifting the tissue, the skin's natural regeneration and repair process is also stimulated. Put simply, the result is not merely a simple “movement” of tissue; skin quality also improves, and this makes the final result both more natural and stable for a longer period.",
      },
      {
        type: "paragraph",
        text: "Because this material is taken entirely from the person, the body shows no foreign reaction or sensitivity to it, and this is one reason S Lift has become a method that is safe and compatible with the body.",
      },
    ],
  },
  {
    heading: "S Lift is natural, not artificial",
    blocks: [
      {
        type: "paragraph",
        text: "One of the greatest concerns of people considering a facelift is that the result may look too “obvious” or unnatural—a face that takes on a stretched, expressionless (mask-like) appearance, or looks surprised and overly raised. The good news is that S Lift was designed precisely to prevent this problem.",
      },
      {
        type: "paragraph",
        text: "Because in this method the tissues are moved gently and in proportion to the face's natural form, and the person's own natural rejuvenating substances are also used alongside this, the final result looks completely natural. Your face still preserves its natural expressions when smiling, frowning, and in other facial expressions, with none of the immobile, mask-like face or excessively raised brows and surprised look. The aim of S Lift is to make you look younger as yourself, not to change the form of your face into something different.",
      },
      { type: "clinicalMedia", media: { type: "comparison", before: enBefore, after: enAfter, beforeLabel: "Before", afterLabel: "After" } },
    ],
  },
  {
    heading: "How long is S Lift recovery?",
    blocks: [
      {
        type: "paragraph",
        text: "One of S Lift's greatest advantages over the endoscopic method is its short recovery period. While a surgical facelift may require weeks for complete recovery, the S Lift recovery period is usually about one week.",
      },
      { type: "paragraph", text: "During this week:" },
      {
        type: "list",
        items: [
          "A little swelling or mild bruising may be seen in the temple area, which is natural and gradually goes away.",
          "It is recommended to avoid direct pressure on the operated area, facial massage, and prolonged exposure to the sun.",
          "Sleeping with the head slightly higher than the body during the first few nights can help reduce swelling.",
          "Most people can return to their everyday activities from the second or third day, while following the simple care instructions recommended by the doctor.",
        ],
      },
      {
        type: "paragraph",
        text: "The important point is that, unlike open surgeries, S Lift does not require extended leave or strict limitations, and with a little planning, most people can undergo this method without serious disruption to their daily lives.",
      },
    ],
  },
  {
    heading: "When do S Lift results become visible?",
    blocks: [
      {
        type: "paragraph",
        text: "One appealing point about this method is that the initial result is visible almost immediately after the operation. However, the final and more natural result usually reveals itself fully after the initial swelling has subsided and the injected rejuvenating substances have taken full effect—that is, about one to two weeks later.",
        links: [{ text: "the initial result", href: "/before-after" }],
      },
      {
        type: "paragraph",
        text: "In terms of longevity, S Lift results vary depending on skin type, lifestyle, and post-operative care, but in general, combining the natural lift of the tissue with the person's own rejuvenating substances and fibrin adhesive produces a longer-lasting and more stable result, and for a long time you can enjoy the younger, fresher, wrinkle-free appearance of your face.",
      },
    ],
  },
  {
    heading: "Who is a suitable candidate for S Lift?",
    blocks: [
      { type: "paragraph", text: "S Lift is especially suitable for people who:" },
      {
        type: "list",
        items: [
          "Have sagging in the temple area and upper cheek.",
          "Are bothered by fine wrinkles around the temple and outer corner of the eye.",
          "Are looking for a fast, minimally invasive, thread-free method without a long recovery period.",
          "Are not yet ready or willing to undergo facelift surgeries.",
          "Want a completely natural and lasting result and are concerned about a mask-like face or an unnatural, surprised look.",
        ],
      },
      {
        type: "paragraph",
        text: "Of course, the best way to make sure whether this method is suitable for you is an in-person consultation with a specialist so that the best decision can be made based on the condition of your skin and face.",
        links: [{ text: "specialist", href: "/about" }],
      },
    ],
  },
  {
    heading: "The difference between S Lift and a surgical facelift",
    blocks: [
      { type: "paragraph", text: "Many people become confused between these two methods. The main difference lies in how invasive they are:" },
      {
        type: "paragraph",
        text: "Facelift surgery usually involves larger incisions, general anesthesia, sutures, and a longer recovery period (usually several weeks). In contrast, S Lift is performed without threads, with a small incision and local anesthesia, is reinforced with the person's own natural rejuvenating substances, and has a recovery period of about one week. In terms of results, surgical facelift is usually a better option for sagging in the cheek area and lower half of the face, while S Lift is considered an intelligent, lower-risk choice for sagging in the temple area, with a completely natural and lasting result.",
      },
    ],
  },
  {
    heading: "Incision size and tissue handling compared with the endoscopic approach",
    blocks: [
      {
        type: "paragraph",
        text: "Another advantage of S Lift is the smaller incision site and more limited tissue manipulation compared with endoscopic methods. In S Lift, the lift is performed through an incision about one centimeter long inside the hair; therefore, the extent of the incision and the area subjected to surgery and manipulation are more limited.",
      },
      {
        type: "paragraph",
        text: "Given the more limited intervention site and degree of tissue manipulation, the likelihood of damage to or irritation of the area's nerve structures may also be lower. Neurological complications after surgery in the temple area may appear as numbness, tingling, reduced skin sensation, or, in rare cases, temporary movement disorders. The small incision and performance of the lift within a defined area in the S Lift method may help reduce the likelihood of such complications.",
      },
      {
        type: "paragraph",
        text: "In the endoscopic method, the incisions are also small compared with open surgery, but a broader area beneath the skin is usually manipulated to insert instruments and a camera and to release the tissues. In contrast, with a small incision inside the hair and more limited tissue manipulation in S Lift, the aim is to reduce tissue damage and the likelihood of neurological complications as much as possible, in addition to creating a natural result.",
      },
      {
        type: "paragraph",
        text: "Of course, the likelihood of complications in every surgical method depends on various factors, including each person's anatomy, the technique used, and the doctor's skill and experience, and the possibility of complications cannot be considered completely zero in any surgical method.",
      },
    ],
  },
  {
    heading: "Tips for better care after S Lift",
    blocks: [
      {
        type: "paragraph",
        text: "To help your S Lift result be in the best possible condition, following a few simple tips can help greatly:",
        links: [{ text: "following a few simple tips", href: "/care-instructions/facelift-browlift-care" }],
      },
      { type: "paragraph", text: "The sutures on the skin must be removed no later than three days afterward" },
      { type: "clinicalMedia", media: { type: "image", image: enSuture } },
      {
        type: "list",
        items: [
          "During the first few days, avoid touching or applying pressure to the operated area.",
          "As far as possible, avoid prolonged exposure to direct sunlight and use sunscreen if needed.",
          "Avoid heavy exercise and activities that cause a sharp increase in heart rate during the first week.",
          "While sleeping, try not to apply direct pressure to the side of the face that underwent the operation.",
          "If you notice any unusual sign such as severe pain, widespread redness, or fever, be sure to contact your doctor.",
        ],
      },
    ],
  },
  {
    heading: "Summary",
    blocks: [
      {
        type: "paragraph",
        text: "S Lift is one of the most intelligent solutions for people seeking facial rejuvenation who do not want to enter the complex, lengthy process of open surgery or worry about an unnatural and artificial result. Thread-free, pain-free, with a small suture mark, accompanied by injection of the person's own natural rejuvenating substances and fibrin adhesive for a better and longer-lasting result, with a short recovery period of about one week and a natural, wrinkle-free result, this method has attracted the attention of many people seeking a fresher and younger appearance without making their face look mask-like or surprised.",
      },
      {
        type: "paragraph",
        text: "If you are also considering a temple-area lift and want a natural, lasting, and striking result without the risks of major surgery, consulting an experienced specialist can be the right first step for you.",
      },
    ],
  },
];

const enFaq = [
  { question: "Are threads used in S Lift?", answer: "No. S Lift is performed without using any thread or other foreign object, and for this reason it has a completely natural result." },
  { question: "Is S Lift painful?", answer: "No. This method is performed under local anesthesia, and you feel no pain during the operation." },
  {
    question: "Does a suture mark or scar remain after S Lift?",
    answer: "No. Because the one-centimeter incision is inside the hair and hair grows from within the incision, no skin is removed, and no suture mark or scar remains.",
  },
  {
    question: "Where does the rejuvenating fibrin adhesive used in S Lift come from?",
    answer: "This material is prepared entirely from the person's own blood, so there is no risk of sensitivity or an allergic reaction, and it helps natural tissue regeneration and better longevity of the result.",
  },
  {
    question: "Does S Lift cause a mask-like face or an unnatural appearance?",
    answer: "No. Unlike some other methods, S Lift has a completely natural result, and your face still preserves its natural movements and expressions, without a surprised appearance or excessively raised brows.",
  },
  { question: "How long is S Lift recovery?", answer: "Usually about one week, during which the initial swelling and bruising disappear completely." },
  {
    question: "How long-lasting are S Lift results?",
    answer: "The results of this method are stable and lasting, and the use of the person's own natural rejuvenating substances and fibrin adhesive helps them last longer, although the exact duration depends on each person's skin type and lifestyle.",
  },
  {
    question: "When does the final S Lift result become visible?",
    answer: "The initial result is visible almost immediately after the operation, but the final and more natural result usually reveals itself fully one to two weeks later.",
  },
] as const;

const arSections: readonly KnowledgeArticleSection[] = [
  {
    blocks: [
      {
        type: "paragraph",
        text: "إذا كنتم تبحثون هذه الأيام عن طريقة جراحية دائمة ولكن قليلة التوغل لتصحيح ترهل جلد منطقة الصدغ والخد، فربما صادفتم اسم «إس ليفت» أو S Lift. هذه الطريقة، التي وجدت في الآونة الأخيرة رواجاً كبيراً بين الأشخاص الباحثين عن تجديد شباب الوجه، هي بالضبط ما كان يبحث عنه كثيرون: نتيجة طبيعية، ولكن من دون ألم، ومن دون خيوط، ومن دون تخدير عام، ومن دون أثر للغرز.",
        links: [{ text: "ترهل جلد منطقة الصدغ والخد", href: "/services/facial-cosmetic-surgery/temple-face-lift" }],
      },
      {
        type: "paragraph",
        text: "سنتعرف في هذا المقال بصورة كاملة على إس ليفت؛ بدءاً من ماهيته بالضبط وكيفية إجرائه، وصولاً إلى دور المواد المجددة للشباب واللاصق الفيبريني الطبيعي في دوام النتيجة، وفترة التعافي، ومن هم المرشحون المناسبون لهذه الطريقة.",
      },
    ],
  },
  {
    heading: "ما هو إس ليفت؟",
    blocks: [
      {
        type: "paragraph",
        text: "إس ليفت طريقة حديثة وقليلة التوغل لشد منطقة الصدغ وأعلى الوجه، من دون استخدام أي خيط. في هذه التقنية، وتحت التخدير الموضعي، تُرفع الأنسجة الرخوة والمترهلة في منطقة الصدغ والخد بصورة طبيعية تماماً وتُثبّت في موضع جديد وأكثر شباباً.",
      },
      {
        type: "paragraph",
        text: "خلافاً لما يتصوره كثيرون عن شد الوجه، لا يترك إس ليفت أي جسم غريب مثل الخيط أو الغرسة داخل الجلد. وتكون النتيجة شداً منسجماً تماماً مع الشكل الطبيعي للوجه، لا تغييراً صناعياً يمكن ملاحظته.",
        links: [{ text: "شد الوجه", href: "/services/facial-cosmetic-surgery" }],
      },
    ],
  },
  {
    heading: "لماذا الصدغ؟ لماذا لهذه المنطقة كل هذه الأهمية؟",
    blocks: [
      {
        type: "paragraph",
        text: "عندما يفكر كثير من الأشخاص في تجديد شباب الوجه، يركزون على خط الفك أو الخد أو محيط العين ويتجاهلون منطقة الصدغ. لكن الحقيقة أن ترهل الصدغ وتقعره من أولى علامات شيخوخة الوجه. فمع مرور الوقت ينخفض حجم الدهون والكولاجين في هذه المنطقة، ويرتخي الجلد، وهذا يجعل الحاجبين يبدوان أكثر تدلياً بقليل ويُظهر التجاعيد الدقيقة حول العين والصدغ بصورة أوضح.",
      },
      {
        type: "paragraph",
        text: "عندما يُشد الصدغ، لا يقتصر تأثير ذلك على المنطقة نفسها؛ بل يكتسب أعلى الوجه كله، بما في ذلك الحاجب وزاوية العين، مظهراً أكثر ارتفاعاً وشباباً، وتنخفض تجاعيد هذه المنطقة بصورة ملحوظة. ولهذا يُعد إس ليفت من أكثر طرق تجديد شباب الوجه ككل تأثيراً، في حين يعتقد كثير من الأشخاص أن هذه المنطقة أقل أهمية.",
      },
    ],
  },
  {
    heading: "كيف يُجرى إس ليفت؟",
    blocks: [
      { type: "paragraph", text: "تسير عملية إس ليفت عادة على النحو الآتي:" },
      { type: "subheading", text: "١. الاستشارة ورسم خريطة الوجه" },
      {
        type: "paragraph",
        text: "قبل اتخاذ أي إجراء، يفحص الطبيب بنية الوجه ودرجة ترهل الجلد والنقاط التي تحتاج إلى الشد. هذه المرحلة مهمة جداً للوصول إلى نتيجة طبيعية ومتناسبة مع شكل وجه كل شخص، حتى لا تتخذ النتيجة النهائية أبداً مظهراً صناعياً أو مبالغاً فيه.",
      },
      { type: "subheading", text: "٢. التخدير الموضعي" },
      {
        type: "paragraph",
        text: "خلافاً لما يتصوره كثيرون عن عمليات التجميل، لا يحتاج إس ليفت إلى التخدير العام. تُخدّر المنطقة المطلوبة فقط بالتخدير الموضعي، وتبقون واعين في جميع المراحل ولكنكم لا تشعرون بأي ألم.",
      },
      { type: "subheading", text: "٣. إجراء الشد" },
      {
        type: "paragraph",
        text: "من دون استخدام أي خيط، وبمساعدة شق بطول سنتيمتر واحد داخل الشعر ينمو الشعر لاحقاً من داخله أيضاً، تُعاد الأنسجة الرخوة في منطقة الصدغ وأعلى الوجه بلطف إلى موضعها الجديد والأكثر شباباً. وهذا بالضبط ما يجعل العملية لا تترك بعدها أثراً لغرز أو جرح أو جسم غريب تحت الجلد.",
      },
      { type: "clinicalMedia", media: { type: "image", image: arIncision } },
      { type: "subheading", text: "٤. حقن المواد المجددة للشباب واللاصق الفيبريني الطبيعي" },
      {
        type: "paragraph",
        text: "لكي تكون النتيجة أفضل وأكثر دواماً، تُحقن في المرحلة الأخيرة مواد مجددة للشباب مع لاصق فيبريني مجدد للشباب يُحضّر من دم الشخص نفسه. ولأن هذه المادة مأخوذة بالكامل من جسم الشخص نفسه، فلا يقتصر الأمر على عدم وجود خطر لتفاعل تحسسي أو حساسية، بل تساعد أيضاً على تحفيز التجدد الطبيعي للأنسجة وتثبيت نتيجة الشد بصورة أفضل.",
      },
      { type: "paragraph", text: "تستغرق هذه العملية كلها عادة ما بين 30 و60 دقيقة، ويمكنكم مغادرة العيادة فوراً بعدها." },
    ],
  },
  {
    heading: "من دون ألم، ومن دون خيوط، هل الأمر كذلك حقاً؟",
    blocks: [
      {
        type: "paragraph",
        text: "هذا أحد الأسئلة التي يطرحها الجميع تقريباً عن هذه الطريقة. والإجابة هي نعم. يُجرى إس ليفت بشق طوله سنتيمتر واحد فقط داخل الشعر ومن دون استخدام خيط أو أي جسم غريب آخر، ولهذا لا يبقى أثر لغرز أو جرح مفتوح. وأقصى ما قد يُرى في موضع الإجراء هو بعض الاحمرار أو التورم والكدمات الخفيفة التي تزول بالكامل خلال بضعة أيام.",
      },
      {
        type: "paragraph",
        text: "كما أن التخدير الموضعي يجعلكم لا تشعرون بأي ألم أثناء الإجراء. ويشعر بعض الأشخاص فقط بقليل من الضغط أو الشد في منطقة الصدغ، وهو أمر طبيعي تماماً ويمكن تحمله.",
      },
    ],
  },
  {
    heading: "دور المواد المجددة للشباب واللاصق الفيبريني الطبيعي في دوام النتيجة",
    blocks: [
      {
        type: "paragraph",
        text: "من النقاط التي تميز إس ليفت عن كثير من الطرق المشابهة استخدام مواد مجددة للشباب مع لاصق فيبريني مأخوذ من جسم الشخص نفسه. تُحضّر هذه المادة عادة من عينة من دم الشخص نفسه وتُجهز، ثم تُحقن في منطقة الصدغ.",
      },
      {
        type: "paragraph",
        text: "الفائدة الأساسية من ذلك هي أنه بالإضافة إلى الرفع الميكانيكي للأنسجة، تُحفز أيضاً عملية التجدد والترميم الطبيعي للجلد. وبعبارة بسيطة، لا تكون النتيجة مجرد «نقل» بسيط للأنسجة، بل تتحسن جودة الجلد أيضاً، وهذا يجعل النتيجة النهائية أكثر طبيعية وأكثر ثباتاً لمدة أطول.",
      },
      {
        type: "paragraph",
        text: "ولأن هذه المادة مأخوذة بالكامل من الشخص نفسه، لا يُظهر الجسم أي تفاعل غريب أو حساسية تجاهها، وهذا أحد الأسباب التي جعلت إس ليفت طريقة آمنة ومتوافقة مع الجسم.",
      },
    ],
  },
  {
    heading: "إس ليفت طبيعي وليس صناعياً",
    blocks: [
      {
        type: "paragraph",
        text: "من أكبر مخاوف الأشخاص الذين يفكرون في شد الوجه أن تبدو النتيجة «واضحة» جداً أو غير طبيعية؛ أي أن يكتسب الوجه مظهراً مشدوداً وعديم التعبير (كالقناع)، أو يبدو متفاجئاً ومرفوعاً أكثر من اللازم. والخبر الجيد هو أن إس ليفت صُمم تحديداً لمنع هذه المشكلة.",
      },
      {
        type: "paragraph",
        text: "لأن الأنسجة في هذه الطريقة تُنقل بلطف وبما يتناسب مع الشكل الطبيعي للوجه، وتُستخدم إلى جانب ذلك المواد الطبيعية المجددة للشباب الخاصة بالشخص نفسه، تبدو النتيجة النهائية طبيعية تماماً. ويظل وجهكم محتفظاً بتعبيراته الطبيعية عند الضحك والعبوس وبقية تعبيرات الوجه، من دون وجه جامد كالقناع أو حاجبين مرفوعين أكثر من اللازم ومظهر يوحي بالدهشة. هدف إس ليفت هو أن يجعلكم تبدون أصغر سناً بصورتكم أنتم، لا أن يغير شكل الوجه إلى شيء مختلف.",
      },
      { type: "clinicalMedia", media: { type: "comparison", before: arBefore, after: arAfter, beforeLabel: "قبل", afterLabel: "بعد" } },
    ],
  },
  {
    heading: "كم تستغرق فترة التعافي من إس ليفت؟",
    blocks: [
      {
        type: "paragraph",
        text: "من أكبر مزايا إس ليفت مقارنة بالطريقة التنظيرية قصر فترة التعافي. ففي حين قد يحتاج شد الوجه الجراحي إلى أسابيع للتعافي الكامل، تكون فترة التعافي من إس ليفت عادة نحو أسبوع واحد.",
      },
      { type: "paragraph", text: "خلال هذا الأسبوع:" },
      {
        type: "list",
        items: [
          "قد يظهر بعض التورم أو الكدمات الخفيفة في منطقة الصدغ، وهو أمر طبيعي ويزول تدريجياً.",
          "يُنصح بتجنب الضغط المباشر على منطقة العملية وتدليك الوجه والتعرض للشمس مدة طويلة.",
          "يمكن أن يساعد النوم مع رفع الرأس قليلاً عن مستوى الجسم خلال الليالي الأولى على تقليل التورم.",
          "يستطيع معظم الأشخاص العودة إلى أنشطتهم اليومية من اليوم الثاني أو الثالث، مع مراعاة تعليمات العناية البسيطة التي يوصي بها الطبيب.",
        ],
      },
      {
        type: "paragraph",
        text: "النقطة المهمة هي أن إس ليفت، خلافاً للجراحات المفتوحة، لا يحتاج إلى إجازة طويلة أو قيود صارمة، ويمكن لمعظم الأشخاص بقليل من التخطيط الخضوع لهذه الطريقة من دون تعطيل جدي لحياتهم اليومية.",
      },
    ],
  },
  {
    heading: "متى تظهر نتيجة إس ليفت؟",
    blocks: [
      {
        type: "paragraph",
        text: "من النقاط الجذابة في هذه الطريقة أن النتيجة الأولية تكون مرئية فوراً تقريباً بعد إجراء العملية. ومع ذلك، تظهر النتيجة النهائية والأكثر طبيعية بالكامل عادة بعد زوال التورم الأولي واكتمال تأثير المواد المجددة للشباب المحقونة، أي بعد نحو أسبوع إلى أسبوعين.",
        links: [{ text: "النتيجة الأولية", href: "/before-after" }],
      },
      {
        type: "paragraph",
        text: "أما من حيث الدوام، فتختلف نتائج إس ليفت بحسب نوع الجلد ونمط الحياة والعناية بعد العملية، لكن الجمع بصورة عامة بين الرفع الطبيعي للأنسجة والمواد المجددة للشباب واللاصق الفيبريني المأخوذين من الشخص نفسه يحقق نتيجة أطول دواماً وأكثر ثباتاً، ويمكنكم لمدة طويلة الاستمتاع بمظهر وجه أكثر شباباً ونضارة ومن دون تجاعيد.",
      },
    ],
  },
  {
    heading: "من هم المرشحون المناسبون لإس ليفت؟",
    blocks: [
      { type: "paragraph", text: "يكون إس ليفت مناسباً بصورة خاصة للأشخاص الذين:" },
      {
        type: "list",
        items: [
          "لديهم ترهل في منطقة الصدغ وأعلى الخد.",
          "تزعجهم التجاعيد الدقيقة حول الصدغ وزاوية العين.",
          "يبحثون عن طريقة سريعة وقليلة التوغل ومن دون خيوط ومن دون فترة تعاف طويلة.",
          "ليسوا مستعدين بعد أو لا يرغبون في الخضوع لجراحات شد الوجه.",
          "يريدون نتيجة طبيعية تماماً ودائمة ويقلقون من الوجه الشبيه بالقناع أو المظهر غير الطبيعي والمتفاجئ.",
        ],
      },
      {
        type: "paragraph",
        text: "وبالطبع، أفضل طريقة للتأكد مما إذا كانت هذه الطريقة مناسبة لكم هي الاستشارة الحضورية مع طبيب متخصص حتى يُتخذ أفضل قرار بناءً على حالة جلدكم ووجهكم.",
        links: [{ text: "طبيب متخصص", href: "/about" }],
      },
    ],
  },
  {
    heading: "الفرق بين إس ليفت وشد الوجه الجراحي",
    blocks: [
      { type: "paragraph", text: "يشعر كثير من الأشخاص بالحيرة بين هاتين الطريقتين. والفرق الأساسي هو مقدار التوغل في كل منهما:" },
      {
        type: "paragraph",
        text: "تتضمن جراحة شد الوجه عادة شقوقاً أكبر وتخديراً عاماً وغرزاً وفترة تعاف أطول (عادة عدة أسابيع). وفي المقابل، يُجرى إس ليفت من دون خيوط، وبشق صغير، وتحت التخدير الموضعي، ويُعزز بالمواد الطبيعية المجددة للشباب الخاصة بالشخص نفسه، وتبلغ فترة التعافي منه نحو أسبوع واحد. ومن حيث النتيجة، تكون جراحة شد الوجه عادة خياراً أفضل لترهل منطقة الخد والنصف السفلي من الوجه، في حين يُعد إس ليفت خياراً ذكياً وأقل خطورة لترهل منطقة الصدغ، مع نتيجة طبيعية تماماً ودائمة.",
      },
    ],
  },
  {
    heading: "مقارنة حجم الشق ومدى التعامل مع الأنسجة في الطريقة التنظيرية",
    blocks: [
      {
        type: "paragraph",
        text: "من المزايا الأخرى لإس ليفت صغر موضع الشق ومحدودية التعامل مع الأنسجة مقارنة بالطرق التنظيرية. ففي إس ليفت، يُجرى الشد عبر شق بطول سنتيمتر واحد تقريباً داخل الشعر؛ ولذلك يكون امتداد الشق والمنطقة التي تخضع للجراحة والتعامل معها أكثر محدودية.",
      },
      {
        type: "paragraph",
        text: "وبالنظر إلى محدودية موضع التدخل ومقدار التعامل مع الأنسجة، فقد يكون احتمال إصابة البنى العصبية في المنطقة أو تهيجها أقل أيضاً. وقد تظهر المضاعفات العصبية بعد جراحات منطقة الصدغ في صورة خدر أو وخز أو انخفاض إحساس الجلد، أو في حالات نادرة اضطرابات حركية مؤقتة. ويمكن لصغر الشق وإجراء الشد ضمن نطاق محدد في طريقة إس ليفت أن يساعدا على تقليل احتمال هذه المضاعفات.",
      },
      {
        type: "paragraph",
        text: "وفي الطريقة التنظيرية أيضاً تكون الشقوق صغيرة مقارنة بالجراحات المفتوحة، لكن إدخال الأدوات والكاميرا وتحرير الأنسجة يتطلب عادة التعامل مع منطقة أوسع تحت الجلد. وفي المقابل، يكون الهدف في إس ليفت، من خلال شق صغير داخل الشعر وتعامل أكثر محدودية مع الأنسجة، هو تقليل مقدار الضرر النسيجي واحتمال حدوث مضاعفات عصبية إلى أقصى حد ممكن، بالإضافة إلى تحقيق نتيجة طبيعية.",
      },
      {
        type: "paragraph",
        text: "وبالطبع، يعتمد احتمال حدوث المضاعفات في أي طريقة جراحية على عوامل مختلفة، منها تشريح جسم كل شخص والتقنية المستخدمة ومهارة الطبيب وخبرته، ولا يمكن اعتبار احتمال المضاعفات صفراً تماماً في أي طريقة جراحية.",
      },
    ],
  },
  {
    heading: "نصائح لعناية أفضل بعد إس ليفت",
    blocks: [
      {
        type: "paragraph",
        text: "لكي تكون نتيجة إس ليفت لديكم في أفضل حال ممكنة، يمكن أن تساعد مراعاة بعض النصائح البسيطة كثيراً:",
        links: [{ text: "مراعاة بعض النصائح البسيطة", href: "/care-instructions/facelift-browlift-care" }],
      },
      { type: "paragraph", text: "يجب إزالة الغرز الموجودة على الجلد بعد ثلاثة أيام كحد أقصى" },
      { type: "clinicalMedia", media: { type: "image", image: arSuture } },
      {
        type: "list",
        items: [
          "في الأيام الأولى، تجنبوا لمس منطقة العملية أو الضغط عليها.",
          "تجنبوا قدر الإمكان التعرض المطول لأشعة الشمس المباشرة، واستخدموا واقي الشمس عند الحاجة.",
          "تجنبوا التمارين الشاقة والأنشطة التي تسبب ارتفاعاً شديداً في معدل ضربات القلب خلال الأسبوع الأول.",
          "حاولوا أثناء النوم ألا يقع ضغط مباشر على جهة الوجه التي خضعت للعملية.",
          "إذا لاحظتم أي علامة غير طبيعية مثل الألم الشديد أو الاحمرار الواسع أو الحمى، فتواصلوا حتماً مع طبيبكم.",
        ],
      },
    ],
  },
  {
    heading: "الخلاصة",
    blocks: [
      {
        type: "paragraph",
        text: "إس ليفت أحد أذكى الحلول لمن يبحثون عن تجديد شباب الوجه، لكنهم لا يريدون الدخول في العملية المعقدة والطويلة للجراحات المفتوحة أو يقلقون من نتيجة غير طبيعية وصناعية. ومن دون خيوط، ومن دون ألم، ومع أثر صغير للغرز، إلى جانب حقن المواد المجددة للشباب واللاصق الفيبريني الطبيعي المأخوذ من الشخص نفسه للحصول على نتيجة أفضل وأكثر دواماً، وفترة تعاف قصيرة تبلغ نحو أسبوع واحد، ونتيجة طبيعية ومن دون تجاعيد، استطاعت هذه الطريقة جذب اهتمام كثير من الباحثين عن مظهر أكثر نضارة وشباباً، من دون أن يكتسب وجههم مظهراً شبيهاً بالقناع أو متفاجئاً.",
      },
      {
        type: "paragraph",
        text: "إذا كنتم تفكرون أيضاً في شد منطقة الصدغ وتريدون نتيجة طبيعية ودائمة ولافتة من دون مخاطر الجراحات الكبرى، فقد تكون استشارة اختصاصي متمرس الخطوة الأولى الصحيحة لكم.",
      },
    ],
  },
];

const arFaq = [
  { question: "هل تُستخدم الخيوط في إس ليفت؟", answer: "لا، يُجرى إس ليفت من دون استخدام أي خيط أو جسم غريب آخر، ولهذا تكون نتيجته طبيعية تماماً." },
  { question: "هل يسبب إس ليفت الألم؟", answer: "لا، تُجرى هذه الطريقة تحت التخدير الموضعي، ولا تشعرون بأي ألم أثناء العملية." },
  {
    question: "هل يبقى أثر للغرز أو ندبة بعد إس ليفت؟",
    answer: "لا، لأن الشق بطول سنتيمتر واحد يقع داخل الشعر وينمو الشعر من داخل الشق ولا يُزال أي جلد، فلا يبقى أثر للغرز أو ندبة.",
  },
  {
    question: "من أين يُحضّر اللاصق الفيبريني المجدد للشباب المستخدم في إس ليفت؟",
    answer: "تُحضّر هذه المادة بالكامل من دم الشخص نفسه، ولهذا لا يوجد خطر للحساسية أو التفاعل التحسسي، كما تساعد على التجدد الطبيعي للأنسجة ودوام النتيجة بصورة أفضل.",
  },
  {
    question: "هل يسبب إس ليفت وجهاً شبيهاً بالقناع أو مظهراً غير طبيعي؟",
    answer: "لا، خلافاً لبعض الطرق الأخرى، يعطي إس ليفت نتيجة طبيعية تماماً ويظل وجهكم محتفظاً بحركاته وتعبيراته الطبيعية، من دون مظهر متفاجئ أو حاجبين مرفوعين أكثر من اللازم.",
  },
  { question: "كم تستغرق فترة التعافي من إس ليفت؟", answer: "عادة نحو أسبوع واحد، يزول خلاله التورم والكدمات الأولية بالكامل." },
  {
    question: "ما مدى دوام نتيجة إس ليفت؟",
    answer: "نتائج هذه الطريقة ثابتة ودائمة، ويساعد استخدام المواد المجددة للشباب واللاصق الفيبريني الطبيعي المأخوذين من الشخص نفسه على زيادة دوامها، مع أن المدة الدقيقة تعتمد على نوع جلد كل شخص ونمط حياته.",
  },
  {
    question: "متى تظهر النتيجة النهائية لإس ليفت؟",
    answer: "تكون النتيجة الأولية مرئية فوراً تقريباً بعد العملية، لكن النتيجة النهائية والأكثر طبيعية تظهر بالكامل عادة بعد أسبوع إلى أسبوعين.",
  },
] as const;

export const S_LIFT_ARTICLE = {
  postId: "direct-s-lift-2026-09-12",
  slug: "اس-لیفت-شقیقه",
  legacyUrls: [],
  title: "S lift اس لیفت چیست؟",
  seoTitle: "اس لیفت چیست؟ S Lift و لیفت شقیقه | دکتر علیرضا صدیقی",
  seoDescription: "اس لیفت یا S Lift چیست؟ با روش لیفت شقیقه دکتر علیرضا صدیقی، نحوه انجام، دوره نقاهت، ماندگاری، مراقبت‌ها و پرسش‌های متداول آشنا شوید.",
  excerpt: "راهکاری طبیعی وبه روش بدون نخ برای لیفت شقیقه و جوان‌سازی صورت",
  topicCluster: "facial-cosmetic-surgery",
  serviceRelation: "facial-cosmetic-surgery",
  procedureRelation: "temple-face-lift",
  medicalReview: {
    reviewerName: "دکتر علیرضا صدیقی",
    reviewerCredentialsRef: "about",
    reviewedAt: "2026-09-12",
  },
  reviewStatus: "needs-doctor-review",
  translationStatus: "source",
  translations: {
    en: {
      slug: "s-lift-temple-lift",
      title: "What Is S Lift?",
      seoTitle: "What Is S Lift? S Lift and Temple Lift | Dr. Alireza Sadighi",
      seoDescription: "What is S Lift? Learn about Dr. Alireza Sadighi's temple-lift method, how it is performed, recovery, longevity, aftercare, and frequently asked questions.",
      excerpt: "A natural, thread-free approach to temple lifting and facial rejuvenation",
      contentSections: enSections,
      faq: enFaq,
      faqHeading: "Frequently asked questions about S Lift",
      translationStatus: "translated-needs-review",
    },
    ar: {
      slug: "اس-ليفت-شد-الصدغ",
      title: "ما هو S Lift؟",
      seoTitle: "ما هو إس ليفت؟ S Lift وشد الصدغ | الدكتور عليرضا صديقي",
      seoDescription: "ما هو إس ليفت أو S Lift؟ تعرفوا على طريقة شد الصدغ لدى الدكتور عليرضا صديقي، وكيفية إجرائها، وفترة التعافي، والدوام، والعناية، والأسئلة الشائعة.",
      excerpt: "حل طبيعي وبطريقة خالية من الخيوط لشد الصدغ وتجديد شباب الوجه",
      contentSections: arSections,
      faq: arFaq,
      faqHeading: "الأسئلة الشائعة حول إس ليفت",
      translationStatus: "translated-needs-review",
    },
  },
  publishedAt: "2026-09-12",
  updatedAt: "2026-09-12",
  readingTime: "۱۳ دقیقه مطالعه",
  contentSections: faSections,
  faq: faFaq,
  faqHeading: "سوالات متداول درباره اس لیفت",
  structuredDataType: "MedicalWebPage",
  mediaStatus: "inline-clinical",
  needsMediaReview: false,
  sourceImageUrl: "",
  localImagePath: `${MEDIA_BASE}/after.jpg`,
  heroImage: {
    src: `${MEDIA_BASE}/after.jpg`,
    alt: "تصویر بعد از اس لیفت شقیقه دکتر علیرضا صدیقی",
    altByLocale: {
      en: "After S Lift temple lift by Dr. Alireza Sadighi",
      ar: "صورة بعد إجراء إس ليفت لشد الصدغ لدى الدكتور عليرضا صديقي",
    },
    width: 1051,
    height: 1497,
  },
  socialImage: null,
  references: S_LIFT_REFERENCES,
} as const satisfies KnowledgeArticle;
