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
 * English — full homepage + Smart Clinic Assistant coverage, per Hamid's
 * 2026-07-13 "not acceptable for the current product direction" brief
 * (docs/adr/0006-full-homepage-and-assistant-locale-rollout.md). Real,
 * professional English throughout — not a literal or machine translation.
 * Where Persian phrasing doesn't map 1:1, the English aims to read as
 * something a premium international aesthetic/maxillofacial clinic would
 * actually publish: calm, precise, discreet, medically trustworthy —
 * never generic clinic marketing, never AI-sounding.
 *
 * This is a first-pass professional translation, not yet clinically or
 * legally reviewed by Hamid or medical staff — same standing caveat this
 * project already applies to draft Persian copy (see fa.ts's
 * `TODO(content)` convention).
 *
 * `id`/`iconId`/`href` values are never translated — they're stable keys
 * (service slugs, category ids, icon filenames, internal routes) shared
 * across all three locales, not display text.
 */

export const header = {
  logoSubtitle: "Facial & Jaw Surgery Specialist",
  navItems: [
    { href: "/en/about", label: "Dr. Sadighi" },
    { href: "#services", label: "Services" },
    { href: "#before-after", label: "Before & After" },
    { href: "#faq", label: "FAQ" },
    { href: "#videos", label: "Videos" },
    { href: "#knowledge-center", label: "Knowledge Center" },
    { href: "#contact", label: "Contact" },
  ],
  ctaLabel: "Book a Consultation",
  openMenuLabel: "Open menu",
  closeMenuLabel: "Close menu",
} satisfies HeaderDictionary;

export const footer = {
  tagline: "Dr. Alireza Sadighi Aesthetic Clinic",
  description:
    "A calm, precise, and intelligent experience in facial aesthetics and reconstruction, under the direct supervision of Dr. Alireza Sadighi.",
  // Round 2026-07-13 (taxonomy correction): real links now, derived from
  // `src/content/services.ts` (single source of truth).
  // Round 2026-07-13 (patient-care hub, per Hamid): 7th entry appended
  // after the 6 real service links, not replacing any of them.
  services: [
    ...SERVICES.map((service) => ({ label: service.footerLabel.en, href: getServiceHref("en", service.slug) })),
    { label: "Pre & Post Procedure Care", href: "/en/care-instructions" },
  ],
  guide: [
    { label: "Dr. Sadighi", href: "#why-dr-sadighi" },
    { label: "Before & After", href: "#before-after" },
    { label: "FAQ", href: "#faq" },
    { label: "Videos", href: "#videos" },
    { label: "Knowledge Center", href: "#knowledge-center" },
    { label: "Contact", href: "#contact" },
    { label: "About the Doctor", href: "/en/about" },
    { label: "Treatments", href: "/en/services" },
    { label: "Health Tourism", href: "/en/health-tourism" },
    { label: "Privacy Policy", href: null },
    { label: "Terms of Use", href: null },
  ],
  locations: {
    tabriz: {
      label: "Tabriz, Iran",
      addressLines: ["Valiasr Street, Roudaki Square, Farid Building", "4th Floor (next to Dr. Zarei Pharmacy)"],
      phone: "041-33334539",
      mobile: "09120149500",
    },
    tehran: {
      label: "Tehran",
      address: "Coming soon",
    },
  },
  hours: ["Saturday–Wednesday: 10:00 AM – 7:00 PM", "Thursday: 10:00 AM – 2:00 PM", "Friday: Closed"],
  instagram: "@dr.sadighi.alireza",
  siteName: "Dr. Alireza Sadighi",
  columnHeadings: { services: "Services", contact: "Contact", guide: "Explore" },
  instagramLabel: "Instagram: ",
  copyrightSuffix: "Digital architecture by",
  linkedInAriaLabel: "Nextuply on LinkedIn",
} satisfies FooterDictionary;

export const hero = {
  title: "The architecture of beauty — with a surgeon's precision and an artist's eye",
  doctorName: "Dr. Alireza Sadighi",
  doctorSpecialty: "Specialist in Jaw, Facial & Rhinoplasty Surgery",
  ctaPrimary: "Start a Consultation",
  ctaSecondary: "View Services",
} satisfies HeroDictionary;

export const aiConcierge = {
  eyebrow: "Dr. Alireza Sadighi Smart Clinic Assistant",
  onlineStatus: "Available around the clock",
  sampleQuestions: [
    "What does rhinoplasty typically cost?",
    "Show me facelift results.",
    "What's required for a dental implant?",
    "What does aftercare involve?",
  ],
  chips: ["Initial Cost Estimate", "Our Work", "Articles", "Pre- & Post-Op Care", "Send a Photo"],
  ctaPrimary: "Start the Conversation",
  ctaSecondary: "Book a Consultation",
  headline: "Every question about your treatment starts here.",
  description:
    "Our Smart Clinic Assistant helps you find the right treatment, review real results, get an initial cost estimate, and — when you're ready — arrange an in-person or online consultation.",
  inputPlaceholder: "Type your question...",
} satisfies AiConciergeDictionary;

/**
 * `titleEn` here (unlike `ar.ts`) is NOT a literal translation of `title`
 * — both are already English. It carries the concise clinical/technical
 * term as a secondary editorial label (the component renders it small,
 * uppercase, tracked-out beneath the main title), avoiding a literal
 * duplicate line. `ar.ts` keeps the original fa.ts convention instead
 * (local-language title + English clinical term), since that pairing is
 * a genuine, common convention in Arabic medical marketing.
 */
export const services = {
  eyebrow: "SPECIALIZED SERVICES",
  heading: "Dr. Sadighi's Areas of Expertise",
  subheading: "Six specialized fields spanning jaw, facial, and nasal surgery — from dental implants to rhinoplasty.",
  // Round 2026-07-13 (taxonomy correction): the item list itself moved to
  // `src/content/services.ts` (`SERVICES`) — see `ServicesDictionary`'s
  // doc-comment in `dictionary-types.ts`.
} satisfies ServicesDictionary;

export const doctorStory = {
  headline: "Why Dr. Alireza Sadighi?",
  body: "Dr. Alireza Sadighi treats every case not as an isolated procedure, but as part of a long-term design for the face. This perspective combines the scientific precision of jaw and facial surgery with a genuine understanding of aesthetics — and before any decision is made, risks and realistic expectations are explained clearly.",
  metrics: [
    { value: "2", label: "Cities, one standard of quality — Tehran & Tabriz" },
    { value: "Ranked #1", label: "Fellowship exam in facial aesthetic & reconstructive surgery, University of Tehran" },
  ],
  principles: [
    "Transparency in explaining every risk",
    "A long-term design for the face, not a single short procedure",
    "The same standard of quality in Tehran and Tabriz",
  ],
  cta: "Meet Dr. Sadighi",
  portraitAlt: "Portrait of Dr. Alireza Sadighi",
  surgeryAlt: "Dr. Alireza Sadighi in surgery",
} satisfies DoctorStoryDictionary;

export const caseGallery = {
  heading: "Clinical Results & Treatment Records",
  subheading: "A reflection of precision, artistry, and clinical expertise — case-by-case results from facial, jaw, and nasal surgery at Dr. Sadighi's clinic.",
} satisfies CaseGalleryDictionary;

export const patientJourney = {
  heading: "Your Path to the Result You Want",
  steps: [
    {
      id: "consultation",
      title: "Specialist Consultation & Initial Assessment",
      body: "In the first step, your medical history, imaging, and needs are carefully reviewed. In this session, your concerns, expectations, and treatment history are heard, and — based on a thorough clinical examination and specialist imaging — you're given a clear picture of your current condition and what treatment can realistically achieve.",
    },
    {
      id: "treatment-design",
      title: "Personalized Treatment Design",
      body: "Following the initial assessment, a treatment plan is designed specifically for you — based on the anatomy of your face and jaw, tissue characteristics, and how your features work together. This design may include 3D modeling, simulation of likely outcomes, and careful selection of surgical technique, so the path forward is genuinely tailored to you.",
    },
    {
      id: "surgery",
      title: "Surgery to International Standards",
      body: "Surgery takes place in a fully controlled environment that meets current scientific standards. At this stage, the surgical team executes the planned treatment with a focus on precision, safety, and aesthetics — preserving structural function (breathing, chewing, speech) while achieving the best possible facial harmony.",
    },
    {
      id: "recovery",
      title: "Post-Operative Care & Recovery",
      body: "After surgery, your recovery begins under the care team's supervision. You'll receive precise aftercare guidance, a schedule of follow-up visits, support managing swelling and bruising, and ongoing monitoring of your healing — so this period passes with greater calm and confidence, and the final result settles as intended.",
    },
    {
      id: "follow-up",
      title: "Ongoing Follow-Up & Final Assessment",
      body: "At follow-up visits, the final result is assessed: before-and-after photos are compared, and if needed, minor adjustments or additional guidance are discussed. The goal of this stage is to make sure the outcome is stable, harmonious, and genuinely satisfying for you.",
    },
  ],
  cta: "Start My Journey",
} satisfies PatientJourneyDictionary;

export const patientStories = {
  heading: "Real Patient Stories",
  subheading:
    "At Dr. Alireza Sadighi's clinic, no surgery is just a “procedure” — each one marks the beginning of a new chapter in someone's life. Here you'll find short documentaries, real footage, verified Google reviews, and moments shared on Instagram — no actors, no exaggeration, only real patient stories.",
  videoLabel: "A real documentary — no actors",
  moreThanLabel: "More than",
  googleReviewCount: "X",
  googleBadge: "five-star Google reviews",
  instagramBadge: "Dozens of before-and-after stories on Instagram",
  evidence: [
    { id: "video-1", type: "video", caption: "Pre-Rhinoplasty Nerves" },
    {
      id: "review-1",
      type: "review",
      name: "Maryam, 32",
      quote: "“I felt at ease from the very first consultation — the result was exactly what I wanted.”",
    },
    { id: "instagram-1", type: "instagram", caption: "Before / After – Nose Surgery" },
    { id: "video-2", type: "video", caption: "First Look at the New Result" },
    { id: "photo-1", type: "photo" },
  ],
  photoStories: [
    { quote: "After years, I can finally stand in front of a camera at ease again.", meta: "Treatment record — Rebuilding confidence" },
    { quote: "For the first time, I actually enjoy seeing photos of myself.", meta: "Treatment record — Rhinoplasty" },
    { quote: "My face finally feels like it matches who I am inside.", meta: "Treatment record — Jaw & chin surgery" },
    { quote: "I found the confidence I had been searching for, for years.", meta: "Treatment record — Facial rejuvenation" },
    { quote: "I no longer look away from my old photos.", meta: "Treatment record — Facial cosmetic surgery" },
  ],
  playAriaLabel: "Play documentary",
  verifiedOnGoogleLabel: "Verified on Google",
} satisfies PatientStoriesDictionary;

export const knowledgeCenter = {
  eyebrow: "Knowledge Center",
  heading: "Dr. Sadighi's Clinical Journal & Patient Guide",
  subheading: "Clinical articles, educational videos, and answers to patients' most common questions.",
  articles: {
    feature: {
      iconId: "rhinoplasty",
      label: "Rhinoplasty",
      title: "How to Prepare for Safe, Evidence-Based Rhinoplasty",
      lead: "The right preparation before rhinoplasty — from choosing a surgeon to the days-before checklist — has a direct bearing on safety and the quality of the final result. In this article, we walk through that preparation step by step.",
      href: "/blog/rhinoplasty-preparation",
    },
    side: [
      {
        iconId: "dental-implant",
        label: "Advanced Dental Implants",
        title: "The Complete Guide to Dental Implants for Patients with Low Bone Density",
        summary: "A clinical look at the challenges of implant placement in patients with reduced bone density, and today's methods for a durable result.",
        href: "/blog/dental-implant-low-bone-density",
      },
      {
        iconId: "jaw-surgery",
        label: "Orthognathic Surgery",
        title: "Signs You May Need Jaw & Chin (Orthognathic) Surgery",
        summary: "From chewing and breathing difficulties to facial asymmetry — the signs worth a specialist orthognathic evaluation.",
        href: "/blog/orthognathic-signs",
      },
      {
        iconId: "facial-rejuvenation",
        label: "Facial Rejuvenation",
        title: "When Should You Consider Facial Rejuvenation?",
        summary: "The natural signs of volume and elasticity loss in facial skin, and today's evidence-based, measured approaches to renewal.",
        href: "/blog/facial-rejuvenation-signs",
      },
    ],
  },
  readMoreCta: "Continue Reading",
} satisfies KnowledgeCenterDictionary;

export const videoHub = {
  heading: "Documentary & Educational Videos",
  subheading:
    "A mix of real patient documentaries, Dr. Sadighi's clinical explanations, and before-and-after guidance for rhinoplasty, implant, and jaw/facial procedures.",
  categories: [
    { id: "patient-stories", label: "Patient Documentaries" },
    { id: "educational", label: "Educational Videos" },
    { id: "before-after", label: "Before & After" },
  ],
  videos: [
    {
      id: "v1",
      category: "patient-stories",
      iconId: "rhinoplasty",
      title: "One Patient's Journey — From Fear to Rhinoplasty Results",
      summary: "A short documentary following one patient's real journey — from first-consultation nerves to the moment she saw her final result.",
      duration: "?",
    },
    {
      id: "v2",
      category: "patient-stories",
      iconId: "jaw-surgery",
      title: "A Patient's Account of Recovery After Jaw Surgery",
      summary: "One patient's real experience of the orthognathic recovery period and the gradual return to daily life.",
      duration: "?",
    },
    {
      id: "v9",
      category: "patient-stories",
      iconId: "facial-cosmetic",
      title: "A Patient's Story — Facial Cosmetic Surgery",
      summary: "One patient's real experience, from the decision to proceed through recovery after facial cosmetic surgery.",
      duration: "?",
    },
    {
      id: "v3",
      category: "educational",
      iconId: "rhinoplasty",
      title: "Advanced Dental Implants — What to Know Before You Decide",
      summary: "Dr. Sadighi explains the evaluation process, how the right technique is chosen, and the main stages of dental implant treatment.",
      duration: "?",
    },
    {
      id: "v4",
      category: "educational",
      iconId: "dental-implant",
      title: "Steps to Prepare for Rhinoplasty",
      summary: "Which examinations are needed before rhinoplasty, and how a patient should prepare for surgery day.",
      duration: "?",
    },
    {
      id: "v5",
      category: "educational",
      iconId: "jaw-surgery",
      title: "What to Expect From Jaw & Chin Surgery",
      summary: "An overview of the orthognathic surgery process, its risks, and a realistic timeline for seeing the final result.",
      duration: "?",
    },
    {
      id: "v6",
      category: "before-after",
      iconId: "rhinoplasty",
      title: "Before & After: Rhinoplasty",
      summary: "A visual comparison of one rhinoplasty result, with an explanation of the key changes.",
      duration: "?",
    },
    {
      id: "v7",
      category: "before-after",
      iconId: "facial-cosmetic",
      title: "Before & After: Facial Cosmetic Surgery",
      summary: "An example of the balance and harmony achieved through one facial cosmetic procedure.",
      duration: "?",
    },
    {
      id: "v8",
      category: "before-after",
      iconId: "dental-implant",
      title: "Before & After: Dental Implants",
      summary: "A comparison of dental condition before and after implant placement and smile restoration.",
      duration: "?",
    },
  ],
  detailsCta: "View More Details",
  playAriaLabel: "Play video",
} satisfies VideoHubDictionary;

export const faqSection = {
  heading: "Frequently Asked Questions",
  subheading:
    "Answers to patients' most important questions about rhinoplasty, dental implants, and jaw and facial surgery — so you can move toward your decision calmly and well-informed.",
  intro: "The answers below are written by Dr. Sadighi.",
  categories: [
    { id: "rhinoplasty", label: "Rhinoplasty" },
    { id: "dental-implant", label: "Dental Implants" },
    { id: "jaw-surgery", label: "Jaw & Facial Surgery" },
  ],
  items: [
    { category: "rhinoplasty", question: "How many days of rest do I need at home?", answer: "Most patients plan for 5 to 7 days of initial rest, then gradually return to light daily activities. Your exact schedule is set during the consultation." },
    { category: "rhinoplasty", question: "Will the result look exactly like my reference photo?", answer: "Your design is based on your actual facial anatomy, not an exact copy of a reference photo — the goal is a natural result that suits your own face." },
    { category: "rhinoplasty", question: "How long does nasal swelling last?", answer: "Most of the swelling subsides within the first few weeks, though the nose can continue refining its final shape for several months afterward." },
    { category: "rhinoplasty", question: "Will scarring be visible after surgery?", answer: "With today's techniques, incision sites typically heal quickly and are not noticeable once the initial recovery period has passed." },
    { category: "rhinoplasty", question: "When can I start wearing glasses again?", answer: "Wearing glasses is usually resumed a few weeks after surgery, in coordination with your doctor, to avoid putting pressure on the treated area." },
    { category: "rhinoplasty", question: "Could my nose become crooked again?", answer: "With proper aftercare and regular follow-up, this is unlikely — your specific risk is assessed during the consultation." },
    { category: "dental-implant", question: "Is implant placement painful?", answer: "The procedure is performed under local anesthesia, and most patients report no significant pain." },
    { category: "dental-implant", question: "How long does the implant process take?", answer: "The surgery itself usually takes one to two hours; full treatment through to final stabilization takes several months." },
    { category: "dental-implant", question: "Is it still possible with low bone density?", answer: "In many cases, bone grafting and augmentation techniques still make implants possible — this is assessed during your initial examination." },
    { category: "dental-implant", question: "How many years does an implant last?", answer: "With proper care and hygiene, dental implants can last many years — often a lifetime." },
    { category: "dental-implant", question: "What should I eat after getting an implant?", answer: "Soft foods are recommended for the first few days; returning to a normal diet happens gradually and under your doctor's guidance." },
    { category: "dental-implant", question: "How many visits does an implant require?", answer: "Depending on your case, treatment usually happens in several stages: placement, healing, and fitting the final crown." },
    { category: "jaw-surgery", question: "How long is recovery from jaw surgery?", answer: "The initial recovery period typically takes a few weeks, with full functional healing over the following months." },
    { category: "jaw-surgery", question: "Will the shape of my face change?", answer: "Yes — correcting jaw position typically has a positive effect on overall facial harmony as well; these changes are simulated before surgery." },
    { category: "jaw-surgery", question: "How many hours does jaw surgery take?", answer: "Depending on the complexity of the case, this surgery typically takes a few hours; exact details are reviewed during the consultation." },
    { category: "jaw-surgery", question: "Will speaking be difficult after surgery?", answer: "There may be mild difficulty in the first few days, which gradually resolves over the recovery period." },
    { category: "jaw-surgery", question: "When can I eat solid food again?", answer: "A soft diet is recommended at first; the return to solid food happens gradually and according to your doctor's schedule." },
    { category: "jaw-surgery", question: "Does this surgery require general anesthesia?", answer: "Yes — this surgery is typically performed under general anesthesia, in line with current clinical standards." },
  ],
} satisfies FaqSectionDictionary;

export const assistantFlow = {
  // Round 2026-07-17 (Smart Assistant product redesign): exact new
  // opening copy per the Persian original; "Follow Up on My Appointment"
  // dropped from the 5 main actions to match the new exact list.
  openingMessage: "Hello, I'm Dr. Alireza Sadighi Clinic's Smart Assistant. I can help you find the right path for your consultation or booking.",
  mainActions: [
    { id: "consultation_booking", label: "Book a Consultation" },
    { id: "service_selection", label: "Choose the Right Service" },
    { id: "triage", label: "Initial Assessment" },
    { id: "cost_question", label: "Ask About Cost" },
    { id: "care_guidance", label: "Pre & Post Care" },
  ],
  // Round 2026-07-13 (taxonomy correction): derived from
  // `src/content/services.ts` (`SERVICES`), plus `general_consultation`
  // (the one non-specialty catch-all — skips triage entirely).
  services: [...SERVICES.map((service) => ({ id: service.id, label: service.assistantLabel.en })), { id: "general_consultation", label: "General Consultation" }],
  triageQuestions: {
    rhinoplasty: [
      "Have you had rhinoplasty before?",
      "What's your main goal — appearance, breathing, revision, or both?",
      "Do you have any underlying medical conditions or take any medication?",
      "Do you have photos ready for an initial review?",
    ],
    "orthognathic-surgery": [
      "What is your main concern?",
      "Do you have photos, X-rays, or previous medical records?",
      "Do you experience pain, limited movement, or any functional issues?",
    ],
    "advanced-dental-implant": [
      "How many teeth need implants?",
      "Do you have a recent dental X-ray or photo?",
      "Do you have any underlying conditions such as diabetes or bone-density issues?",
    ],
    // TODO(content): draft — needs clinical sign-off.
    "impacted-tooth-surgery": [
      "Which impacted tooth is concerning you?",
      "Are you experiencing pain, swelling, or gum inflammation in that area?",
      "Do you have a recent dental X-ray or photo?",
    ],
    // TODO(content): draft — needs clinical sign-off.
    "facial-rejuvenation": [
      "Which area of facial sagging or volume loss concerns you most?",
      "Have you had any previous injectable or rejuvenation treatment?",
      "Do you have any underlying conditions or known allergies?",
    ],
    // TODO(content): draft — needs clinical sign-off.
    "facial-cosmetic-surgery": [
      "Which facial feature would you like to address?",
      "Have you had any previous facial cosmetic surgery?",
      "Do you have any underlying medical conditions or take any medication?",
    ],
  },
  safetyNotice: "This information is used only for initial screening and consultation guidance. The final decision is made after the doctor's review.",
  // Round 2026-07-18 (conversation-first UX pass) — deterministic, service-tailored cost guidance (item 9).
  costGuidance: {
    generic:
      "The exact cost depends on the service, a clinical review, and sometimes imaging — we can't give a firm number without an examination. To guide you more precisely, could you tell me which service you're interested in so I can give an initial estimate based on that?",
    byService: {
      "advanced-dental-implant":
        "Implant cost depends on the number of units, bone condition, a possible need for a sinus lift or bone graft, the abutment type, and an imaging review. We can't give a firm number without a review, but for an initial estimate, could you tell me how many teeth you're considering and whether you have a recent X-ray or CBCT scan?",
      rhinoplasty:
        "Rhinoplasty cost depends on your nose type, any previous surgery, how much correction is needed, and an in-person examination — we can't give an exact number without a visit. For an initial estimate, have you had rhinoplasty before, and is your main goal appearance, breathing, or both?",
      "facial-rejuvenation":
        "Facial rejuvenation cost depends on the chosen method (injectables, a lift, or a combination), your skin condition and sagging, and how long results last / how many sessions are needed. For an initial estimate, which area of your face concerns you most, and have you had a similar procedure before?",
    } as Record<string, string>,
  },
  // Round 2026-07-18 — short, colloquial service names for chip labels.
  serviceShortLabels: {
    "advanced-dental-implant": "Implants",
    "impacted-tooth-surgery": "Impacted Tooth",
    "facial-rejuvenation": "Facial Rejuvenation",
    "facial-cosmetic-surgery": "Facial Cosmetic Surgery",
    "orthognathic-surgery": "Jaw Surgery",
    rhinoplasty: "Rhinoplasty",
    general_consultation: "General Consultation",
  },
  // Round 2026-07-20 (production UX fix, item 3) — "what's the best approach for me" answers, distinct from cost guidance.
  serviceGuidance: {
    byService: {
      "advanced-dental-implant":
        "For implants, the best approach depends on your bone condition, the number of missing teeth, the location, gum health, and the result of an X-ray or CBCT scan. The standard path is usually an exam and imaging review first, which determines whether a direct implant is possible or whether preparation like a bone graft or sinus lift is needed.\n\nTo guide you more precisely, could you tell me:\n1. How many teeth need an implant?\n2. Is it the upper or lower jaw?\n3. Do you have a recent X-ray or CBCT scan?",
      rhinoplasty:
        "For rhinoplasty, the best approach depends on your nasal bone and cartilage structure, your main goal, and any previous surgery. The standard path is an in-person exam of your nasal structure first, which determines the right technique and how much correction suits you.\n\nTo guide you more precisely, could you tell me:\n1. Is your main goal appearance, breathing, or both?\n2. Have you had rhinoplasty before?\n3. Do you have breathing issues or a deviated septum?",
      "facial-rejuvenation":
        "For facial rejuvenation, the best approach depends on your main concern (sagging, wrinkles, or lost volume), your skin condition, and your desired outcome. The standard path is an exam first, which determines whether injectables, a lift, or a combination suits you better.\n\nTo guide you more precisely, could you tell me:\n1. Which area of your face concerns you most?\n2. Have you had injectables or a rejuvenation procedure before?\n3. Are you looking for a temporary or longer-lasting result?",
    } as Record<string, string>,
  },
  leadForm: {
    fullNameLabel: "Full Name",
    mobileLabel: "Mobile Number",
    cityLabel: "City",
    ageRangeLabel: "Age Range (optional)",
    ageRangePlaceholder: "e.g. 25–35",
    contactMethodLabel: "Preferred Contact Method",
    contactMethods: { phone: "Phone Call", whatsapp: "WhatsApp", instagram: "Instagram" },
    notesLabel: "Notes (optional)",
    submitCta: "Continue",
  },
  ui: {
    openButtonLabel: "Open the clinic's smart assistant",
    closeButtonLabel: "Close assistant",
    backToMenu: "Back to main menu",
    chooseServiceCta: "Choose a Service",
    serviceSelectionEyebrow: "Choose a Service",
    serviceSelectionTitle: "Which service are you interested in?",
    triageEyebrow: "Initial Assessment",
    triageAnswerPlaceholder: "Your answer...",
    consultationBookingEyebrow: "Book a Consultation",
    beforeAfterTitle: "Our Work",
    articlesTitle: "Articles",
    imageUploadTitle: "Send a Photo",
    careGuidanceTitle: "Pre & Post Procedure Care",
    closeCta: "Close",
    submittingLabel: "Submitting...",
    selectPlaceholder: "Select...",
    paymentStepEyebrow: "Payment Step",
    freeTextPlaceholder: "Type your question here...",
    freeTextSubmitCta: "Ask",
    freeTextThinkingLabel: "Thinking...",
    freeTextUnavailableMessage: "Smart replies are temporarily unavailable right now. You can use the quick-guidance options instead, or call the clinic directly to coordinate.",
    askQuestionCta: "Ask a Question",
  },
  steps: {
    consultationBooking: {
      intro: "To book a consultation, please choose the service you're interested in. After an initial review, our clinic team will guide you through the next steps.",
    },
    imageUploadFuture: {
      notice: "Photo upload for initial review will be enabled in an upcoming update.",
    },
    beforeAfter: {
      body: "You can view the clinic's real results in the “Clinical Results” section of the homepage.",
      cta: "View Our Work",
    },
    articles: {
      body: "You can read clinical articles and patient guides in the “Knowledge Center” section of the homepage.",
      cta: "Visit the Knowledge Center",
    },
    careGuidance: {
      body: "Pre and post-procedure care guides for every treatment are available on the dedicated “Pre & Post Procedure Care” page.",
      cta: "View care guides",
    },
  },
  appointment: {
    heading: "Suggested Consultation Time",
    realAvailabilityNotice: "Choose one of the available times below. This is a “request” — your appointment is finalized once our reception team calls you.",
    loadingOptionsNotice: "Checking available times…",
    noRealAvailabilityNotice: "No appointment times are available to display right now. Please enter your preferred time and our clinic receptionist will call to coordinate.",
    preferredDayLabel: "Preferred Day",
    preferredTimeLabel: "Preferred Time Range",
    timeRangeOptions: ["Morning (9 AM – 12 PM)", "Midday (12 – 3 PM)", "Afternoon (3 – 6 PM)"],
    submitCta: "Submit Booking Request",
    requestSubmittedNotice: "This is a “booking request,” not a confirmed appointment — our clinic team will contact you after reviewing it.",
  },
  payment: {
    heading: "Deposit / Consultation Fee Payment",
    gatewayPendingNotice: "Online deposit payment will be enabled in the next phase. For now, your request will be submitted and our clinic receptionist will call you to coordinate.",
    amountLabel: "Amount",
    currencyLabel: "Currency",
    currencyOptions: { IRR: "IRR (Iranian Rial)", USDT: "USDT (Tether)" },
  },
  // Round 2026-07-17 (Smart Assistant product redesign).
  identify: {
    description:
      "So we can follow up on your questions and request, please enter your name and mobile number. Once verified, you can ask the assistant up to 3 main questions, or continue with the booking path.",
    submitCta: "Continue",
  },
  aiConversation: {
    verifiedIntro: "Your number is verified. You can now ask up to 3 main questions about your treatment, preparation, care, or the booking path.",
    questionsRemainingLabels: {
      "3": "For more precise guidance, you have 3 main questions left.",
      "2": "For more precise guidance, you have 2 main questions left.",
      "1": "For more precise guidance, you have 1 main question left.",
    },
    limitReachedNotice: "For a more thorough review, please continue through the consultation booking path.",
    safetyNotice: "This guidance does not replace an in-person examination or a doctor's opinion; the final decision is made after review by our clinic team.",
    viewSuggestedStepCta: "View",
    askAnotherCta: "Next Question",
    relatedCareCta: "Related Care",
    continueBookingCta: "Continue Booking",
    resumeBookingPrompt: "Shall we continue your booking?",
    changeServiceCta: "Change Service",
    fallbackPrompt: "To guide you more precisely, could you tell me what your question is mostly about?",
    fallbackChips: { cost: "Cost", service: "Choose a Service", care: "Care", booking: "Book a Consultation" },
    costEstimateCta: "Initial Cost Estimate",
    bookServiceTemplate: "Book a {service} Consultation",
    careForServiceTemplate: "{service} Care",
    correctionAcknowledgement: "You're right — let me answer that more precisely.",
    hasXrayCta: "I have an X-ray / CBCT",
    noXrayCta: "I don't have one",
    hasXrayReply: "Great — please bring the X-ray or CBCT scan to your consultation so our team can review it closely.",
    noXrayReply: "No problem — our team will guide you at the consultation on where and how to get an X-ray or CBCT scan.",
  },
  contextualAsk: {
    prompt: "Have a question before continuing?",
    cta: "Ask a Question",
  },
  confirmation: {
    heading: "Your Request Has Been Submitted",
    body: "Our team will contact you shortly to coordinate the next steps.",
    summaryLabel: "Request Summary",
    serviceLabel: "Selected Service",
    timeLabel: "Selected or Requested Time",
    contactStatusLabel: "Contact Status",
    contactStatusValue: "Pending review by our clinic team",
    tipsLabel: "A Few Notes Before We Call",
    tips: [
      "Please keep your mobile phone reachable so our team can call you.",
      "If your preferred time changes, please let our receptionist know.",
      "You can also reach the clinic on WhatsApp for faster coordination.",
    ],
    viewCareCta: "View Related Care",
    askAnotherCta: "Ask Another Question",
  },
  validation: {
    mobileInvalid: "Invalid mobile number — please enter a valid Iranian mobile number (e.g. 0912xxxxxxx).",
    fullNameRequired: "Please enter your full name.",
  },
  phoneVerification: {
    eyebrow: "Mobile Verification",
    description: "To guide you more precisely and allow our clinic to follow up, please verify your mobile number.",
    mobileLabel: "Mobile Number",
    requestCodeCta: "Request Code",
    sendingLabel: "Sending...",
    codeLabel: "Verification Code",
    codePlaceholder: "6-digit code",
    verifyCta: "Verify",
    verifyingLabel: "Verifying...",
    changeMobileCta: "Change Number",
    resendCta: "Resend Code",
    smsUnavailableMessage: "SMS verification is temporarily unavailable right now. Please call the clinic or use WhatsApp to book or follow up.",
    smsUnavailableBookingMessage: "Mobile verification is required to finalize your booking request. This step is temporarily unavailable right now — please call the clinic directly.",
    invalidMobileMessage: "This mobile number isn't valid.",
    // Round 2026-07-19 (OTP UX/verification fix, item 6).
    invalidCodeMessage: "That code isn't correct. Please double-check the code we texted you.",
    expiredCodeMessage: "This code has expired. Please request a new one.",
    tooManyAttemptsMessage: "Too many attempts. Please wait a bit and request a new code.",
    verifyUnavailableMessage: "Verification is having trouble right now. Please try again in a moment.",
    devBypassNotice: "🔧 Dev mode: no SMS provider is connected. Enter code 000000 to continue.",
    // Round 2026-07-19 (item 5) — `{time}` replaced client-side.
    codeExpiryLabel: "Code valid for: {time}",
    resendCooldownLabel: "You can resend the code in {time}s",
    codeExpiredNotice: "This code has expired. Please request a new one.",
    autoVerifyingLabel: "Verifying code...",
    codeSentRecap: "A verification code was sent to {mobile}.",
  },
} satisfies AssistantFlowDictionary;

// Added 2026-07-13 (delivery-mode round) — content pages required by the
// contract. First-pass professional English, same standing caveat as
// above (not yet clinically/legally reviewed). Disclaimer string is
// Hamid's exact given wording.
// Round 2026-07-13, same day (premium About-page redesign) — professional
// English, not a literal translation of the Persian source. No
// unsupported claims ("best," "guaranteed," "perfect symmetry") anywhere.
const about = {
  eyebrow: "About Dr. Sadighi",
  title: "Dr. Alireza Sadighi",
  subtitle: "Oral & Maxillofacial Surgeon",
  positioning: "A precise, evidence-based, and aesthetically considered approach to jaw, facial, nasal, and implant surgery.",
  heroCtaPrimary: "Book a Consultation",
  heroCtaSecondary: "View Areas of Focus",
  heroTrustMarkers: ["Oral & Maxillofacial Surgeon", "Fellowship in Facial Aesthetic & Reconstructive Surgery", "Personalized Treatment Planning"],
  metaTitle: "About Dr. Alireza Sadighi | Oral & Maxillofacial Surgeon",

  bioEyebrow: "Academic Path",
  bioHeading: "Academic & Professional Path",
  bioBody: [
    "Dr. Alireza Sadighi began his professional path with a Doctor of Dental Surgery degree from Tabriz University of Medical Sciences, then continued into the specialty of oral and maxillofacial surgery. With a focus on jaw, facial, and delicate reconstructive surgery, he brings together a precise, evidence-based perspective with an aesthetic sensibility in patient care.",
    "He went on to place first in the facial aesthetic and reconstructive surgery fellowship examination at Tehran University of Medical Sciences, sharpening his professional focus on treatments that address both function and facial harmony.",
  ],

  credentialsEyebrow: "Academic Credentials",
  credentials: [
    "Ranked 53rd nationally in Iran's experimental sciences university entrance exam",
    "Doctor of Dental Surgery, Tabriz University of Medical Sciences",
    "Specialist in Oral & Maxillofacial Surgery",
    "First place, Facial Aesthetic & Reconstructive Surgery Fellowship, Tehran University of Medical Sciences",
  ],

  certificatesHeading: "Certificates & Scientific Credentials",
  certificatesSubtitle:
    "A curated selection of Dr. Sadighi's certificates, academic recognitions, and scientific participation in oral, maxillofacial, facial aesthetic and reconstructive surgery.",
  certificatesStat: "14 certificates and scientific records",
  certificatesButton: "View All Certificates",
  certificatesOpenOriginal: "Open Original",

  philosophyHeading: "Dr. Sadighi's Clinical Approach",
  philosophy: [
    "In Dr. Sadighi's view, a successful outcome is never just the execution of a surgical technique. A precise understanding of facial structure, listening closely to what the patient wants, assessing functional considerations, and designing a personalized treatment path are all central to the treatment decision.",
    "The goal is a result that is natural, proportionate, and medically sound — one that's in harmony with the patient's own facial identity, shaped through thorough assessment and transparent conversation.",
  ],

  specialtyHeading: "Areas of Focus",
  specialtyViewDetailsCta: "View details",

  technologyHeading: "More Precise Planning with Modern Tools",
  technologyBody:
    "In jaw, facial, nasal, and implant treatments, precise planning plays an important role in decision-making. Tools such as 3D scanning, advanced imaging, and digital modeling — where clinically appropriate — can support a clearer understanding of facial structure, the treatment path, and a more precise conversation with the patient.",

  patientRelationshipHeading: "Clear Communication with Patients",
  patientRelationshipBody: [
    "A core part of Dr. Sadighi's treatment approach is clear, understandable communication with each patient. From the initial consultation through post-treatment care, the goal is for the treatment path to feel understandable, structured in clear stages, and easy to follow.",
    "This same principle carries through to the design of the Smart Clinic Assistant, where a patient can begin their initial consultation path, review care guidance, and request a booking with step-by-step guidance.",
  ],
  patientRelationshipCta: "Start a Conversation with the Assistant",

  experienceHeading: "Professional Background",
  experience: [
    { period: "2019 – 2021", place: "Adineh Azar Dental Clinic" },
    { period: "2019 – 2021", place: "Behboud Hospital, Tabriz" },
    { period: "Since 2020", place: "Hakim Arasbaran Clinic, Ahar" },
    { period: "Since 2020", place: "Ostad Shahriar Red Crescent Clinic, Tabriz" },
    { period: "Since 2021", place: "Valiasr International Hospital, Tabriz" },
  ],

  scientificHeading: "Learning, Research & Teaching",
  scientificBody:
    "Alongside clinical practice, Dr. Sadighi values continuous learning — attending scientific events, specialty congresses, and exchanging experience with the professional community. This keeps his treatment approach grounded in current knowledge, practical experience, and careful clinical judgment.",
  scientificNote: "He has also taken part in scientific and educational activities related to dental implants and maxillofacial surgery.",

  exploreEyebrow: "Continue Exploring",
  exploreServicesLabel: "Dr. Sadighi's Services",
  exploreServicesSub: "A full overview of jaw, facial, nasal, and implant treatments.",
  exploreCareLabel: "Pre & Post Care",
  exploreCareSub: "General guidance for preparing before surgery and recovering after.",
  exploreBeforeAfterLabel: "Before & After",
  exploreBeforeAfterSub: "Real result photos, with the context they need.",

  ctaHeading: "Not sure which treatment path is right?",
  ctaBody: "The Smart Clinic Assistant can take your initial information, suggest the right treatment, and simplify the path to booking a consultation.",
  ctaButton: "Start Consultation",
  ctaSecondaryLabel: "View Services",
} satisfies AboutPageDictionary;

const contact = {
  eyebrow: "Contact",
  title: "Get in touch",
  subtitle: "To schedule a consultation or ask a question, reach us through the Smart Clinic Assistant or the details below.",
  formNoticeHeading: "Scheduling",
  formNotice:
    "Appointment scheduling currently runs through the Smart Clinic Assistant or a direct call to our offices. An online contact form will be enabled in a later development phase.",
  ctaButton: "Start a conversation with the Assistant",
  locationsHeading: "Clinic Locations",
  hoursHeading: "Hours",
} satisfies ContactPageDictionary;

const servicesPage = {
  eyebrow: "Treatments",
  heading: "Maxillofacial & Aesthetic Surgery Services",
  subheading: "Every treatment begins with a dedicated consultation, planned around your facial structure and realistic expectations.",
  viewDetailsCta: "View details",
  disclaimer: "This page is for general information only and does not replace a doctor’s examination or medical advice.",
  beforeAfterCta: "View before & after cases",
  assistantCtaHeading: "Not sure which treatment is right for you?",
  assistantCtaBody: "The Smart Clinic Assistant can suggest the right path after a few short questions.",
  assistantCtaButton: "Start with the Assistant",
  // Round 2026-07-13 (service-page premium redesign): shared across all 6
  // detail pages — a fixed, operational 4-step sequence, not medical
  // content, so one shared copy rather than six near-identical repeats.
  heroCtaPrimary: "Book a Consultation",
  heroCtaSecondary: "View Related Results",
  overviewTrustNote: "Every treatment decision follows a careful, dedicated consultation with Dr. Sadighi.",
  consultationStepsHeading: "Your consultation path starts here",
  consultationSteps: [
    { title: "Start with the Smart Assistant", body: "A few short questions through the clinic's Smart Assistant capture your initial information." },
    { title: "Review by the clinic team", body: "Our reception team reviews your information and reaches out to coordinate a consultation time." },
    { title: "Consultation planning", body: "In an in-person consultation, Dr. Sadighi reviews your structure and explains the treatment path." },
    { title: "Next-step coordination", body: "If you choose to proceed, the clinic team coordinates scheduling and next steps with you." },
  ],
  // Round 2026-07-13, same day (Dr. William Miami-inspired redesign):
  // shared editorial "approach" block + before/after band caption.
  overviewHeading: "About This Treatment",
  approachEyebrow: "Our Approach",
  approachHeading: "Precision and care, at every step",
  approachNote:
    "Dr. Sadighi plans every stage of treatment around each patient's real structure, not a predetermined template — from the first consultation through follow-up care.",
  beforeAfterBandHeading: "See real results",
  beforeAfterBandNote: "Every patient's result depends on their own structure and circumstances; these images are for general awareness, not a prediction of your own outcome.",
  careGuideHeading: "Related Care Guide",
  // Round 2026-07-13 (taxonomy correction): exactly the 6 canonical
  // services from `src/content/services.ts` — see fa.ts's matching
  // comment for the full rationale.
  items: [
    {
      slug: "advanced-dental-implant",
      eyebrow: "Dental Implants",
      title: "Advanced Dental Implant",
      subtitle: "A durable replacement for missing teeth",
      overview: "A dental implant replaces the root of a missing tooth with a titanium post, providing a stable foundation for a prosthetic tooth.",
      suitableForHeading: "Who this is typically suitable for",
      suitableFor: [
        "Patients with one or more missing teeth",
        "Patients with adequate bone density, or who may need a bone graft assessment",
        "Patients seeking a more permanent alternative to removable options",
      ],
      consultationPathHeading: "Consultation path",
      consultationPath: "Imaging assessment of jawbone density is a prerequisite for a precise implant treatment plan.",
      processHeading: "Treatment journey",
      process: [
        { title: "Initial consultation", body: "Reviewing missing teeth and overall oral health." },
        { title: "Imaging assessment", body: "Reviewing jawbone density and quality." },
        { title: "Implant placement", body: "Placing the titanium post via a minor surgical procedure." },
        { title: "Final restoration", body: "Fitting the prosthetic tooth once the implant has fully integrated." },
      ],
      faqHeading: "Frequently asked questions",
      faq: [
        { question: "How long does implant integration take?", answer: "This depends on individual bone conditions and is explained during consultation." },
        { question: "Is this possible with low bone density?", answer: "In many cases yes, with a bone graft prior to implant placement — determined during imaging assessment." },
        { question: "How long do implants last?", answer: "With proper care, dental implants can last long-term; details are discussed during consultation." },
      ],
    },
    {
      slug: "impacted-tooth-surgery",
      eyebrow: "Oral & Maxillofacial Surgery",
      title: "Impacted Tooth Surgery",
      subtitle: "Safe removal of impacted teeth with minimal trauma to surrounding tissue",
      overview:
        "Impacted tooth surgery removes a tooth that hasn't fully emerged through the gum — most often a wisdom tooth — and can prevent pain, infection, or damage to neighboring teeth.",
      suitableForHeading: "Who this is typically suitable for",
      suitableFor: [
        "Patients with a painful or inflamed impacted tooth",
        "Patients whose impacted tooth is pressing on neighboring teeth",
        "Patients with an asymptomatic impacted tooth identified during examination or imaging",
      ],
      consultationPathHeading: "Consultation path",
      consultationPath: "Precise imaging of the impacted tooth's position is a prerequisite for determining the right surgical approach.",
      processHeading: "Treatment journey",
      process: [
        { title: "Initial consultation", body: "Reviewing symptoms and dental history." },
        { title: "Imaging assessment", body: "Precisely locating the depth and position of the impacted tooth." },
        { title: "Surgery", body: "Removing the tooth with minimal trauma to surrounding bone and tissue." },
        { title: "Aftercare & follow-up", body: "Guidance to support faster healing of the area." },
      ],
      faqHeading: "Frequently asked questions",
      faq: [
        { question: "Is this surgery always necessary?", answer: "No — it's recommended only when there's pain, infection, or a risk to neighboring teeth, assessed during examination." },
        { question: "How long is recovery?", answer: "Typically a short window; exact details are explained during consultation." },
        { question: "Is general anesthesia required?", answer: "Local anesthesia is sufficient in most cases; the approach depends on case complexity, determined during consultation." },
      ],
    },
    {
      slug: "facial-rejuvenation",
      eyebrow: "Facial Rejuvenation",
      title: "Facial Rejuvenation",
      subtitle: "Surgical and non-surgical techniques combined for natural, understated renewal",
      overview:
        "Facial rejuvenation combines surgical and non-surgical techniques to restore lost facial volume and freshness, aiming for a natural result appropriate to your age — not a fundamental change to your face.",
      suitableForHeading: "Who this is typically suitable for",
      suitableFor: [
        "Patients with natural age-related volume loss or skin laxity",
        "Patients seeking a fresher, less tired appearance",
        "Patients expecting a gradual, natural result rather than a sudden change",
      ],
      consultationPathHeading: "Consultation path",
      consultationPath: "The right combination of surgical and non-surgical techniques is determined only after an in-person assessment of skin structure and quality.",
      processHeading: "Treatment journey",
      process: [
        { title: "Initial consultation", body: "Reviewing areas of concern and the patient's rejuvenation goals." },
        { title: "Assessment & planning", body: "Determining the right combination of surgical and non-surgical techniques." },
        { title: "Treatment", body: "Carrying out the agreed plan with a focus on a natural result." },
        { title: "Aftercare & follow-up", body: "Support through recovery and reviewing the result." },
      ],
      faqHeading: "Frequently asked questions",
      faq: [
        { question: "Is this always a surgical procedure?", answer: "No — depending on your goals and skin condition, a non-surgical or combined approach may be recommended." },
        { question: "How natural will the result look?", answer: "The primary goal of this treatment is preserving a natural look, not fundamentally altering your appearance." },
        { question: "How often does this need to be repeated?", answer: "This depends on the technique chosen and your individual goals, determined during consultation." },
      ],
    },
    {
      slug: "facial-cosmetic-surgery",
      eyebrow: "Facial Aesthetics",
      title: "Facial Cosmetic Surgery",
      subtitle: "Precise refinement of facial features that preserves your identity and overall harmony",
      overview:
        "Facial cosmetic surgery covers a range of targeted procedures to refine individual facial features — prioritizing your own identity and a result in harmony with your whole face, not a one-size-fits-all template.",
      suitableForHeading: "Who this is typically suitable for",
      suitableFor: [
        "Patients unhappy with one or more facial features",
        "Patients seeking a correction that suits their whole face, not an isolated change",
        "Patients with realistic expectations for the treatment result",
      ],
      consultationPathHeading: "Consultation path",
      consultationPath: "The precise technique and extent of correction is determined only after a full facial assessment during an in-person consultation with Dr. Sadighi.",
      processHeading: "Treatment journey",
      process: [
        { title: "Initial consultation", body: "Reviewing the patient's goals and the features to be addressed." },
        { title: "Assessment & planning", body: "Determining the right approach with the whole face's harmony in mind." },
        { title: "Surgery", body: "Performed by Dr. Sadighi." },
        { title: "Aftercare & follow-up", body: "Support through recovery and follow-up visits." },
      ],
      faqHeading: "Frequently asked questions",
      faq: [
        { question: "Can multiple corrections be done at once?", answer: "In some cases yes, but this decision is only made after a full in-person assessment." },
        { question: "Will the result suit my face?", answer: "The goal of this surgery is harmony with your own identity and overall facial balance, not a predetermined template." },
        { question: "How long is recovery?", answer: "This varies by technique and is explained individually during consultation." },
      ],
    },
    {
      slug: "orthognathic-surgery",
      eyebrow: "Maxillofacial Surgery",
      title: "Orthognathic Surgery",
      subtitle: "Functional and aesthetic correction of the jaw and chin",
      overview:
        "Orthognathic (jaw) surgery corrects misalignment between the upper and lower jaw, which can improve both chewing/breathing function and facial proportion. This is Dr. Sadighi's core specialization.",
      suitableForHeading: "Who this is typically suitable for",
      suitableFor: [
        "Patients with chewing, speech, or breathing difficulty related to jaw misalignment",
        "Patients with noticeable jaw or chin asymmetry",
        "Patients already undergoing, or coordinating with, orthodontic treatment",
      ],
      consultationPathHeading: "Consultation path",
      consultationPath: "This procedure requires specialized imaging assessment and often coordination with an orthodontist; a precise treatment plan is only set after that evaluation.",
      processHeading: "Treatment journey",
      process: [
        { title: "Initial consultation", body: "Reviewing functional and aesthetic jaw concerns with Dr. Sadighi." },
        { title: "Specialist assessment", body: "Imaging review and orthodontic coordination where needed." },
        { title: "Surgery", body: "Jaw surgery performed with precise, specialized planning." },
        { title: "Aftercare & follow-up", body: "Support through recovery and coordination of ongoing orthodontic treatment." },
      ],
      faqHeading: "Frequently asked questions",
      faq: [
        { question: "Is this surgery purely cosmetic?", answer: "No — in many cases the primary goal is improving chewing, speech, or breathing function, with facial improvement as an accompanying benefit." },
        { question: "Do I need to coordinate with an orthodontist?", answer: "In many cases, yes — this is assessed during the initial consultation." },
        { question: "How long is recovery from this surgery?", answer: "Given the complexity of this surgery, recovery is explained individually during consultation." },
      ],
    },
    {
      slug: "rhinoplasty",
      eyebrow: "Nasal Surgery",
      title: "Rhinoplasty",
      subtitle: "Bringing nasal shape into harmony with the face",
      overview:
        "Rhinoplasty is a surgical procedure to refine the shape, symmetry, or breathing function of the nose. It's planned around each patient's own bone and cartilage structure, aiming for a natural result in proportion with the face.",
      suitableForHeading: "Who this is typically suitable for",
      suitableFor: [
        "Patients unhappy with the shape, symmetry, or size of their nose",
        "Patients with breathing difficulty related to a deviated septum",
        "Patients seeking a natural result suited to their own face, not a predetermined template",
      ],
      consultationPathHeading: "Consultation path",
      consultationPath: "Whether this procedure suits you is determined only after an in-person examination and assessment of your nasal structure by Dr. Sadighi.",
      processHeading: "Treatment journey",
      process: [
        { title: "Initial consultation", body: "Reviewing your goals, nasal structure, and setting realistic expectations." },
        { title: "Assessment & planning", body: "Imaging review and determining the right approach based on bone and cartilage structure." },
        { title: "Surgery", body: "The procedure is performed by Dr. Sadighi according to the agreed plan." },
        { title: "Aftercare & follow-up", body: "Support through recovery and follow-up visits after surgery." },
      ],
      faqHeading: "Frequently asked questions",
      faq: [
        { question: "How long is recovery?", answer: "Exact recovery time depends on individual factors and is discussed in detail during consultation." },
        { question: "Is the result fully predictable?", answer: "Results depend on each patient's own nasal structure — the goal is harmony with the face, not a guaranteed outcome." },
        { question: "Can this also fix breathing problems?", answer: "In some cases, yes — this must be confirmed during an in-person examination." },
      ],
    },
  ],
} satisfies ServicesPageDictionary;

const healthTourism = {
  nav: { overview: "Overview", visa: "Visa Guidance", hotel: "Stay & Hotel", transfer: "Transfer" },
  overview: {
    eyebrow: "International Patients",
    title: "A Coordinated Treatment Journey for International Patients",
    subtitle: "Consultation, treatment planning, and travel support — brought together",
    intro:
      "Dr. Sadighi's clinic welcomes patients from outside Iran and other cities with a coordinated journey — from an initial online consultation through your visit to the clinic.",
    sections: [
      { title: "Pre-travel consultation", body: "Before you travel, raise your initial questions through the Smart Clinic Assistant or a direct call and receive a preliminary assessment." },
      { title: "Treatment plan coordination", body: "In-person consultation and procedure timing is coordinated around the length of your stay." },
      { title: "Support during your stay", body: "The clinic team offers initial guidance on accommodation and transfer — see the visa, hotel, and transfer pages for details." },
    ],
  },
  visa: {
    eyebrow: "Preliminary Guidance",
    title: "Medical Visa Guidance",
    subtitle: "General information only — not legal advice or a visa guarantee",
    intro:
      "This page offers a preliminary guide to the typical steps involved in a medical visa process. The clinic assists with preparing a medical invitation letter, but visa issuance itself is the responsibility of the relevant official authorities.",
    points: [
      "Requesting a medical invitation letter from the clinic once a consultation is scheduled",
      "Contacting the relevant embassy or consulate for required documentation",
      "Coordinating travel timing with your proposed treatment plan",
    ],
    cautionNote: "The clinic does not guarantee visa issuance; this page is preliminary coordination support only.",
  },
  hotel: {
    eyebrow: "Accommodation",
    title: "Stay & Hotel Guidance",
    subtitle: "Suggestions for accommodation near the clinic",
    intro: "Depending on your length of stay and treatment plan, the clinic team can suggest accommodation options near our Tabriz and Tehran locations.",
    points: [
      "Suggestions for hotels and stays near the clinic",
      "Coordination that accounts for your recovery period and follow-up visits",
      "Preliminary guidance only — final booking is the patient's responsibility",
    ],
    cautionNote: "The clinic's role is limited to guidance and referral; it does not take direct responsibility for bookings or accommodation quality.",
  },
  transfer: {
    eyebrow: "Transfer",
    title: "Transfer Guidance",
    subtitle: "Coordinating travel between the airport, accommodation, and clinic",
    intro: "For patients traveling from other cities or countries, coordinated transfer support is part of a calmer treatment experience.",
    points: [
      "Coordinating airport transfer on consultation or procedure days",
      "Planning travel between accommodation and the clinic during follow-up",
      "Timing communicated through the Smart Clinic Assistant or a direct call",
    ],
    cautionNote: "Transfer support is offered as coordination assistance, not a guaranteed public transport service.",
  },
  ctaHeading: "Ready to plan your treatment journey?",
  ctaBody: "The Smart Clinic Assistant can start your initial consultation and travel coordination.",
  ctaButton: "Start coordination",
} satisfies HealthTourismPageDictionary;

const beforeAfterPage = {
  eyebrow: "Before & After Gallery",
  title: "Real Before & After Cases",
  subtitle: "Real photography from procedures performed at the clinic — every result depends on the patient's own facial structure and individual circumstances.",
  disclaimer:
    "Results shown are specific to that patient, and treatment outcomes vary by individual circumstances. These images do not replace a doctor's examination or medical advice.",
  ctaHeading: "Want to explore a result suited to your own face?",
  ctaBody: "In a dedicated consultation, Dr. Sadighi can walk you through a realistic expectation of your own treatment result.",
  ctaButton: "Book a consultation",
} satisfies BeforeAfterPageDictionary;

const knowledge = {
  eyebrow: "Knowledge Center",
  heading: "A Patient's Guide, Grounded in Evidence",
  subheading: "Articles to help you prepare, informed, before any treatment decision",
  readMoreCta: "Continue reading",
  backToIndexCta: "Back to Knowledge Center",
  ctaHeading: "Have a question the articles didn't answer?",
  ctaBody: "The Smart Clinic Assistant can answer common questions or start your consultation path.",
  ctaButton: "Ask the Assistant",
  articles: [
    {
      slug: "preparing-for-consultation",
      category: "Consultation",
      readTime: "4 min",
      title: "How to Prepare for a Cosmetic Consultation",
      summary: "A few simple steps for a more useful consultation and a more informed decision.",
      body: [
        "Before your consultation, write down your concerns and questions. This helps make sure nothing important gets missed during the session.",
        "Recent, real photos of your current condition — along with any relevant medical history or prior procedures — help your doctor make a more accurate assessment.",
        "Most importantly, keep your expectations realistic. A good consultation aims for a shared understanding of what treatment can genuinely achieve, not a promise of a predetermined result.",
      ],
    },
    {
      slug: "what-to-ask-before-facial-procedures",
      category: "Informed Decisions",
      readTime: "5 min",
      title: "What to Ask Before a Facial Aesthetic Procedure",
      summary: "Key questions that help you make a clear, confident decision.",
      body: [
        "Ask exactly what steps the proposed procedure involves, and how long recovery typically takes.",
        "Ask your doctor to explain the real risks and limitations of the procedure, not just its benefits.",
        "Ask about the doctor's experience with that specific procedure, and about aftercare — so your treatment path is fully transparent.",
      ],
    },
    {
      slug: "understanding-before-after-results",
      category: "Treatment Results",
      readTime: "4 min",
      title: "How to Interpret Before & After Photos Responsibly",
      summary: "Notes on viewing before/after examples realistically when making a treatment decision.",
      body: [
        "Before/after photos should show a real patient and a real procedure performed at that same clinic — not generic or unrelated examples.",
        "Every patient's result depends on their own facial structure, age, skin, and individual goals; one example's outcome won't necessarily repeat for someone else.",
        "The best use of these images is as a starting point for conversation with your doctor, not a definitive predictor of your own personal result.",
      ],
    },
  ],
} satisfies KnowledgePageDictionary;

// Added 2026-07-13 (patient-care hub); real content integrated same day
// — professional English, not a literal translation of the Persian
// source (which remains the source of truth). Medically cautious tone:
// no guaranteed outcomes, no dosage beyond "as directed by your doctor"
// wherever medication is mentioned. `assistantPromptHints` are internal
// AI-response directives, never rendered in the page UI — see
// dictionary-types.ts's doc-comment on `CareTopicDetail`.
const careInstructions = {
  eyebrow: "Patient Guide",
  heading: "Pre & Post Procedure Care",
  subheading: "General care guidance for preparing before surgery and a calm recovery afterward.",
  trustNote: "These guides are prepared under the clinic's medical team and complement — not replace — your doctor's direct instructions.",
  viewGuideCta: "View Guide",
  safetyNote: "These guides are for general care awareness and do not replace direct medical instructions from your doctor.",
  assistantCtaHeading: "Have a question about care before or after your procedure?",
  assistantCtaBody: "The Smart Clinic Assistant can suggest the right guide for your procedure or start your consultation path.",
  assistantCtaButton: "Ask the Assistant",
  disclaimer:
    "This page is for general awareness and early post-treatment care only. It does not replace your doctor's direct instructions, an in-person examination, or follow-up care. If you notice any unusual symptoms, please contact the clinic.",
  backToHubCta: "Back to Pre & Post Procedure Care",
  detail: {
    beforeHeading: "Before the Procedure",
    afterHeading: "After the Procedure",
    warningSignsHeading: "When to Contact the Clinic",
    warningSignsBody: "Contact the clinic immediately if you experience severe pain, fever, unusual bleeding, or any other concerning symptom.",
    faqHeading: "Frequently Asked Questions",
    pendingReviewNotice: "This guide's dedicated content is being prepared and is pending clinical review. For immediate guidance, use the Smart Clinic Assistant or contact the clinic directly.",
  },
  topics: [
    {
      slug: "implant-care",
      beforeCare: [
        "Your general health and oral condition will be reviewed by your doctor before surgery.",
        "Let your doctor know about diabetes, blood pressure conditions, bleeding disorders, specific medications, or any prior medical history.",
        "Imaging such as a panoramic X-ray or CBCT scan will be taken as directed by your doctor.",
        "If you take blood thinners or specific supplements, do not stop or change them without coordinating with your doctor.",
        "Careful oral hygiene before surgery is important.",
        "It's best to stop smoking and alcohol before surgery, as both can interfere with healing.",
        "Plan ahead for the day of surgery, and bring a companion if needed.",
        "Understanding the aftercare steps in advance helps you manage your recovery more comfortably.",
      ],
      afterCare: [
        "Keep the sterile gauze over the surgical site with gentle pressure for about 2 hours.",
        "Use a cold compress on the face for the first 24 hours; skip it on day two, and from day three a warm compress may help, as directed by your doctor.",
        "Swelling usually peaks around day three or four and then subsides — swelling on its own is not a sign of infection.",
        "Take any prescribed medication exactly as directed.",
        "Stick to soft foods and liquids during the first week; cold, soft food is more comfortable on day one.",
        "Avoid using a straw for two weeks.",
        "Slight oozing for up to two days can be normal — avoid spitting.",
        "Brush your other teeth and the healing area gently with a soft brush, and use mouthwash as directed; after rinsing, let the liquid fall out gently rather than spitting.",
        "Avoid smoking and alcohol.",
        "Stitches are usually removed around two weeks after surgery.",
        "If a sinus lift was performed at the same time, avoid blowing your nose, nasal suction, or any pressure on the nose.",
      ],
      additionalCareHeading: "Caring for Your Crown or Prosthesis",
      additionalCare: [
        "An implant needs regular care — if anything, more consistent than a natural tooth.",
        "Take brushing, flossing, and (if recommended) a water flosser seriously.",
        "Regular check-ups in the first year, as scheduled by your doctor, matter — and ongoing check-ups after that too.",
        "Let your doctor know promptly about any sense of looseness, food trapping, swelling, discharge, or anything that feels off.",
        "A slightly different feeling in your mouth in the first days after the crown is placed is common and usually settles as you adjust.",
      ],
      warningSigns: [
        "Fever and chills",
        "Discharge of pus",
        "Severe or worsening pain",
        "Uncontrolled bleeding",
        "Swelling accompanied by signs of infection",
        "A feeling of looseness or any serious concern around the implant",
      ],
      faq: [
        {
          question: "Is swelling normal after an implant?",
          answer: "Yes — swelling in the first few days can be normal and usually starts easing from day three or four.",
        },
        { question: "When are the stitches removed?", answer: "Usually around two weeks after surgery, as determined by your doctor." },
        {
          question: "Can I use a straw after an implant?",
          answer: "It's best to avoid straws for about two weeks, since the suction can interfere with healing.",
        },
      ],
      assistantPromptHints: [
        "If the user asks about swelling, explain that it typically peaks in the first few days.",
        "If fever, pus, or severe pain comes up, direct the user to contact the clinic.",
        "If the user also had a sinus lift, remind them to avoid nose-blowing and nasal pressure.",
      ],
    },
    {
      slug: "rhinoplasty-care",
      beforeCare: [
        "Prepare a printed CT scan and any documents requested by your doctor, and hand them to the clinic.",
        "Have studio photographs and lab tests ready about a week before surgery.",
        "Let your doctor know beforehand about any underlying condition, prior hospitalization, drug allergy, or medication you take.",
        "Inform your doctor if you're pregnant or think you might be.",
        "Be sure to mention if you've taken medications such as isotretinoin (Accutane).",
        "Smoking can interfere with nasal healing — discuss this with your doctor and avoid it as directed.",
        "As advised by your doctor, avoid alcohol, herbal medicines, tea, or herbal infusions in the days close to surgery.",
        "Let your doctor know about any history of poor wound healing or keloid scarring.",
        "Aspirin and blood-thinning medication should only be managed under your doctor's guidance.",
        "Trim the hair inside your nose the night before surgery, as instructed.",
        "Do not eat or drink for about 8 hours before surgery, unless your doctor tells you otherwise.",
      ],
      afterCare: [
        "Apply a cold compress to the cheeks for the first two days.",
        "Skip the compress on day three; from day four, a warm compress may be used if your doctor advises it.",
        "Avoid smoking and alcohol for a month — smoking can negatively affect healing and the nose's final shape.",
        "Keep to a soft diet during the first week.",
        "Don't drive for a week.",
        "Light exercise is usually possible after about two weeks; strenuous exercise should wait longer and only with your doctor's approval.",
        "Rinse inside the nose with saline as your doctor instructs.",
        "Take prescribed medication regularly.",
        "The splint and stitches are usually removed on your doctor's schedule — if it loosens early, contact the clinic.",
        "After the splint is removed, only change your nasal tape as your doctor has shown you.",
        "Avoid pressure on the nose, blowing your nose, swimming, or resting glasses on your nose for about 10 weeks.",
        "Keep your follow-up visits on the clinic's schedule.",
      ],
      warningSigns: [
        "Heavy or persistent bleeding",
        "Fever, pus discharge, or an unusual bad odor",
        "Severe pain or unusual swelling",
        "The splint or stitches coming loose unexpectedly",
        "A blow to the nose or a sudden change in its shape",
      ],
      faq: [
        {
          question: "When should I have a follow-up visit after rhinoplasty?",
          answer: "Your visit schedule follows your doctor's plan — the early follow-ups in the first weeks matter most.",
        },
        {
          question: "How should I apply nasal tape?",
          answer: "Tape should only be applied and changed as your doctor has shown you — doing it incorrectly can cause problems.",
        },
        {
          question: "Is blowing my nose allowed after rhinoplasty?",
          answer: "In the early weeks, you should avoid blowing your nose or putting any pressure on it.",
        },
      ],
      assistantPromptHints: [
        "If the user asks about nasal tape, emphasize it must be done exactly as the doctor showed them.",
        "If bleeding, trauma, fever, or pus discharge comes up, direct the user to contact the clinic.",
        "Never promise a definite recovery timeline or final result.",
      ],
    },
    {
      slug: "blepharoplasty-care",
      beforeCare: [
        "Let your doctor know beforehand about any underlying condition, prior hospitalization, vision problems, poor wound healing, or specific medication.",
        "Blood thinners such as aspirin should only be managed or stopped under your treating doctor's guidance.",
        "If you're pregnant or think you might be, raise this before surgery.",
        "It's worth understanding that faces and eyes are never perfectly symmetrical even before surgery — expecting absolute symmetry afterward isn't realistic.",
        "Avoid taking any medication or supplement that affects bleeding on your own before surgery.",
      ],
      afterCare: [
        "Swelling is usually more noticeable in the first 3 to 4 days and then gradually eases.",
        "Take prescribed medication exactly as your doctor directs.",
        "Stitches are usually removed about 10 to 14 days after surgery.",
        "Use a cold compress for the first two days; skip it on day three, and from day four a warm towel may help bruising and swelling resolve faster, if your doctor recommends it.",
        "Starting the day after surgery, apply a very small amount of healing ointment, taking care to keep it away from the eye itself.",
        "Rest at home is best for the first two days.",
        "Avoid driving for 4 to 5 days.",
        "Avoid strenuous exercise and heavy lifting for three weeks.",
        "Cut back on very salty or fatty foods, which can add to swelling.",
        "Keep your head elevated above your body while sleeping for the first two nights.",
        "A small amount of oozing from the incision in the first two days can be normal — gently clean the area with sterile gauze, without pressing or manipulating it.",
        "Avoid smoking for two weeks.",
        "Wear sunglasses whenever you're out in the sun.",
        "Mild blurred vision in the first few days can happen from swelling around the eyes and usually passes.",
      ],
      warningSigns: [
        "Severe pain behind the eye or an unusual pressure sensation inside it",
        "Reduced vision or a clear change in eyesight",
        "Heavy bleeding or unusual swelling",
        "Pus discharge, fever, or worsening pain",
        "Any symptom that feels sudden or concerning",
      ],
      faq: [
        {
          question: "How long does swelling last after blepharoplasty?",
          answer: "Swelling is usually more noticeable in the first few days and then gradually eases — the pace varies from person to person.",
        },
        { question: "When are the stitches removed?", answer: "Usually between 10 and 14 days after surgery, depending on your doctor's assessment." },
        {
          question: "Is blurred vision normal after surgery?",
          answer: "Mild blurring can appear in the first few days, but reduced vision or severe pain behind the eye should be reported to your doctor right away.",
        },
      ],
      assistantPromptHints: [
        "If the user asks about swelling or bruising, explain that it's normal in the first few days but severe symptoms need review.",
        "If the user mentions reduced vision, pain behind the eye, or severe pressure, direct them to contact the clinic immediately.",
        "Never offer a medical diagnosis.",
      ],
    },
    {
      slug: "wisdom-tooth-care",
      beforeCare: [
        "This guide mostly covers aftercare.",
        "Before surgery, let your doctor know about any underlying condition, medications, drug allergies, and medical history.",
        "If your doctor has requested imaging or any specific preparation, complete it before surgery.",
      ],
      afterCare: [
        "Keep sterile gauze over the surgical site with gentle pressure for about 2 hours.",
        "Stick to soft foods during the first week.",
        "Avoid straws and any suction for two weeks — suction can dislodge the blood clot and lead to severe pain or dry socket.",
        "Use a cold compress on day one; skip it on day two, and from day three a warm towel may be used, as your doctor advises.",
        "A small amount of oozing for up to two days can be normal. Don't spit — if needed, press a cold, damp sterile gauze on the area for about half an hour.",
        "Maintain oral hygiene with a soft brush and mouthwash as directed.",
        "After rinsing your mouth, tilt your head and let the liquid fall out gently — do not spit.",
        "Stitches are usually removed about a week later.",
        "Pain for up to about 3 days and swelling or bruising for up to about a week can be normal.",
        "Limited jaw opening for up to about 10 days can be normal — only begin jaw exercises as instructed.",
        "Keep your head elevated while sleeping.",
        "Avoid tobacco and alcohol for two weeks.",
        "Take antibiotics and any prescribed medication on schedule.",
        "Don't use mouthwash for longer than recommended.",
      ],
      warningSigns: [
        "Increasing swelling after day five",
        "Heavy or uncontrolled bleeding",
        "Fever and chills",
        "Severe or worsening pain",
        "Shortness of breath",
        "A strong bad odor or pus discharge",
      ],
      faq: [
        {
          question: "Why shouldn't I spit after wisdom tooth surgery?",
          answer: "Spitting and suction can dislodge the blood clot from the surgical site and increase the risk of severe pain or dry socket.",
        },
        {
          question: "How long is pain normal after wisdom tooth surgery?",
          answer: "Pain in the first few days can be normal, but severe or worsening pain should be checked.",
        },
        { question: "When are the stitches removed?", answer: "Usually about a week after surgery, as determined by your doctor." },
      ],
      assistantPromptHints: [
        "If the user asks about spitting, straws, or suction, explain they should avoid these to protect the blood clot.",
        "If severe pain, fever, bleeding, or shortness of breath comes up, suggest contacting the clinic right away.",
        "Only recommend jaw exercises once the appropriate time has passed and as the doctor directs.",
      ],
    },
    {
      slug: "facelift-browlift-care",
      beforeCare: [
        "Have the necessary lab tests and photographs ready and delivered to the clinic about a week before surgery.",
        "Let your doctor know about any underlying condition, specific medication, prior hospitalization, or drug allergy.",
        "Inform your doctor if you're pregnant or think you might be.",
        "If you've taken a medication such as isotretinoin (Accutane), discuss this with your doctor.",
        "Smoking can interfere with skin healing — avoid it as your doctor directs.",
        "As advised by your doctor, avoid alcohol, herbal medicines, tea, or herbal infusions in the days close to surgery.",
        "Let your doctor know about any history of poor wound healing or keloid scarring.",
        "Blood thinners such as aspirin should only be managed in coordination with your doctor.",
        "Fast for about 8 hours before surgery, unless your doctor instructs otherwise.",
        "Manage your stress and follow the pre-operative instructions closely.",
      ],
      afterCare: [
        "Take prescribed medication as directed.",
        "Keep your head elevated above your body on the first and second nights.",
        "Visit the clinic within three days after surgery, as scheduled, to have the dressing removed and checked.",
        "Avoid washing your head for three days; after that, with your doctor's approval, wash gently with minimal contact.",
        "Use a cold compress around the surgical area for the first two days.",
        "From day three, a warm compress may help, as your doctor advises.",
        "Avoid smoking and alcohol for three weeks.",
        "Stitches hidden in the hairline are usually removed around two weeks later.",
        "Mild itching, tingling, or a pulling sensation at the incision can be part of the healing process.",
        "Avoid massaging, manipulating, or putting unnecessary pressure on the surgical area.",
      ],
      warningSigns: [
        "Heavy bleeding",
        "Pus discharge or fever",
        "Severe or worsening pain",
        "A wound reopening",
        "One-sided, sudden, or unusual swelling",
        "Any concerning sign at the dressing or incision site",
      ],
      faq: [
        {
          question: "Is itching or tingling normal after a lift?",
          answer: "Mild itching or tingling is often part of healing, but severe symptoms or symptoms with discharge should be checked.",
        },
        {
          question: "When are the stitches removed?",
          answer: "Stitches hidden in the hairline are usually removed around two weeks later, though the exact timing follows your doctor's assessment.",
        },
        {
          question: "When can I wash my hair?",
          answer: "Usually after a few days and with your doctor's approval, washing gently with minimal contact.",
        },
      ],
      assistantPromptHints: [
        "If the user asks about washing or the dressing, emphasize following the doctor's instructions and the clinic's schedule.",
        "If they ask about itching/tingling, reassure calmly but flag severe symptoms for follow-up.",
        "Treat any bleeding, discharge, or fever as a warning sign.",
      ],
    },
    {
      slug: "jaw-surgery-care",
      beforeCare: [
        "Impacted wisdom teeth usually need to be removed months before jaw surgery — the exact timing is set by your doctor.",
        "Orthodontic treatment before and after jaw surgery plays an important role in the outcome.",
        "For digital impressions, enough time must have passed since your last orthodontic wire adjustment.",
        "Prepare required documents — lab tests, studio photographs, pre-surgery clearance letter, 3D CT scan, cephalometric and OPG X-rays, and orthodontic molds — as instructed.",
        "Let your doctor know about any underlying condition, medication, drug or food allergy, prior hospitalization, or specific concern.",
        "Significant tooth decay or tartar buildup should be assessed and treated before surgery if needed.",
        "For digital treatment planning, arriving on time for impressions and preparation is essential.",
        "As your doctor advises, avoid herbal infusions, ginseng, heavy tea consumption, and tobacco in the days before surgery.",
      ],
      afterCare: [
        "After jaw surgery, a period of rest and limited activity at home is needed.",
        "Avoid strenuous activity for several weeks; light walking can usually begin once your doctor approves.",
        "A soft, blended, liquid diet matters a great deal. Avoid chewing hard food until your doctor allows it.",
        "Oral hygiene should be done carefully, without direct pressure on the wounds.",
        "Take medication, antibiotics, and mouthwash only as your doctor directs.",
        "Extended mouthwash use without your doctor's direction isn't recommended.",
        "For pain, take your prescribed medication as directed, and let the clinic know if pain is severe.",
        "A cold compress for the first two days, and from day four a warm compress if your doctor advises, can help reduce swelling.",
        "Use a soft toothbrush and interdental brush carefully to keep your mouth clean.",
        "Keep up regular follow-up with your jaw surgeon, orthodontist, and physiotherapist if needed, on schedule.",
        "Avoid tobacco and alcohol during recovery.",
      ],
      warningSigns: [
        "Severe or unbearable pain",
        "Fever, pus discharge, or bad odor",
        "Heavy bleeding",
        "Shortness of breath or serious difficulty swallowing",
        "Unusual increase in swelling",
        "Severe difficulty opening or closing the mouth beyond what's expected",
      ],
      faq: [
        {
          question: "What foods are suitable after jaw surgery?",
          answer: "Soft, blended foods and liquids are more suitable, as your doctor advises. Avoid chewing hard foods.",
        },
        {
          question: "Is physiotherapy necessary after jaw surgery?",
          answer: "In many cases, physiotherapy matters for regaining jaw range of motion, and should follow your doctor's plan.",
        },
        {
          question: "Is swelling normal after jaw surgery?",
          answer: "Yes, swelling is part of healing, but a sharp increase, fever, or unusual pain needs to be checked.",
        },
      ],
      assistantPromptHints: [
        "If the user asks about diet after jaw surgery, keep the answer to soft foods and avoiding chewing.",
        "If the user mentions severe pain, fever, shortness of breath, or bleeding, direct them to contact the clinic immediately.",
        "If they ask about jaw exercises, refer them to the physiotherapy guide and their doctor's advice.",
      ],
    },
    {
      slug: "jaw-physiotherapy",
      intro:
        "Physiotherapy after jaw surgery can play an important role in restoring normal muscle function, reducing stiffness, improving range of motion, and supporting healing. The type of exercise, when to start, and its intensity should be set based on each patient's condition and their doctor's guidance.",
      beforeCare: [],
      afterCare: [
        "Jaw exercises should be gentle, controlled, and never forced.",
        "Slowly opening and closing the mouth can help improve range of motion.",
        "Gentle side-to-side jaw movement, with your doctor's approval, can help with muscle flexibility.",
        "Gently moving the jaw forward and back may be used to improve movement balance.",
        "Gentle massage of the jaw and cheek muscles, as a specialist shows you, can help ease tension.",
        "Consistency matters, but severe pain or unusual pressure should never be ignored.",
        "Physiotherapy can take anywhere from a few weeks to a few months, depending on the surgery and healing progress.",
        "It's best for exercises to be done under a doctor's or physiotherapist's supervision.",
        "Patience, regular follow-through, and doing the exercises correctly matter for a better outcome.",
      ],
      warningSigns: [
        "Severe pain during exercise",
        "The jaw locking",
        "A sudden increase in swelling",
        "An unusual sound or sensation along with pain",
        "Reduced range of motion instead of improvement",
        "Any symptom that worsens after exercise",
      ],
      faq: [
        {
          question: "When does jaw physiotherapy start?",
          answer: "The start time depends on the type of surgery and your doctor's assessment. Serious exercise should never begin without your doctor's approval.",
        },
        {
          question: "Should the exercises hurt?",
          answer: "A gentle stretching sensation can be normal, but severe or unusual pain is a sign to stop and contact your doctor.",
        },
        { question: "How much should I exercise?", answer: "Frequency and duration should be set by your doctor's or physiotherapist's plan." },
      ],
      assistantPromptHints: [
        "If the user asks about a specific exercise, emphasize it should only start with the doctor's approval.",
        "Don't provide a fixed, generic exercise program.",
        "If severe pain or jaw locking comes up, direct the user to contact the clinic.",
      ],
    },
    {
      slug: "sinus-lift-care",
      beforeCare: [
        "Before surgery, sinus health and bone thickness are assessed with imaging such as a CBCT scan.",
        "Let your doctor know beforehand about any sinus infection, cold, nasal congestion, or frequent sneezing.",
        "Underlying conditions such as diabetes or high blood pressure should be well controlled.",
        "Blood-thinning medication should only be managed under your doctor's guidance.",
        "Avoid smoking for at least two weeks before surgery.",
        "Take prescribed medication and mouthwash only as your doctor directs.",
      ],
      afterCare: [
        "The most important rule after a sinus lift is avoiding any pressure in the nose and sinus.",
        "Avoid blowing your nose for at least two weeks.",
        "Sneeze with your mouth open — avoid sneezing with your mouth closed.",
        "Don't use forceful or high-pressure nasal rinses.",
        "Avoid straws, suction, and forceful spitting.",
        "Avoid flying or pressure changes for two weeks unless your doctor approves.",
        "Take antibiotics and pain relief exactly as prescribed.",
        "If a saline spray or nasal medication is prescribed, use it only with gentle pressure and as instructed.",
        "A cold compress and keeping your head elevated while sleeping for the first 24 hours can help control swelling.",
        "Cheek swelling, slight nasal oozing, a feeling of sinus pressure, and mild bruising under the eye can be normal.",
        "New bone formation usually takes a few months, and the timing of the follow-up implant is set by your doctor.",
      ],
      warningSigns: [
        "High fever",
        "Pus discharge",
        "Heavy bleeding",
        "Uncontrolled pain",
        "A strong bad taste or odor in the mouth",
        "Ongoing fluid or blood from the nose",
        "A sharp increase in swelling or pain",
      ],
      faq: [
        {
          question: "Why shouldn't I blow my nose after a sinus lift?",
          answer: "Blowing your nose or putting pressure on it can damage the bone graft or sinus membrane and raise the risk of complications.",
        },
        {
          question: "Is a little nasal oozing normal?",
          answer: "A small amount can be normal, but heavy or persistent bleeding should be checked.",
        },
        {
          question: "When is the implant placed?",
          answer: "The exact timing depends on bone condition, the type of sinus lift, and your doctor's assessment, and may take a few months.",
        },
      ],
      assistantPromptHints: [
        "If the user asks about nose-blowing, sneezing, or nasal rinsing, explain clearly that pressure must be avoided.",
        "If fever, pus, a strong bad odor, or uncontrolled pain comes up, direct the user to contact the clinic right away.",
        "Never state a definite cost or implant timeline without an examination.",
      ],
    },
    {
      slug: "genioplasty-care",
      beforeCare: [
        "Before surgery, let your doctor know about your medications, any underlying conditions, drug allergies, and prior surgery or hospitalization.",
        "If your doctor has requested photographs, lab tests, or imaging, complete these before surgery.",
        "Coordinate with your doctor about smoking, alcohol, and blood-thinning medication.",
      ],
      afterCare: [
        "Use a cold compress for the first 48 hours, usually in intervals with rest periods between.",
        "Keep your head elevated above body level while sleeping and resting.",
        "Take prescribed medication as your doctor directs.",
        "Avoid strenuous activity, exercise, and heavy lifting for two weeks.",
        "Stick to soft, lukewarm foods and avoid chewing anything hard.",
        "Maintain careful oral hygiene, and use mouthwash if prescribed.",
        "Change the chin tape or bandage only as your doctor has shown you.",
        "Swelling, bruising, and a feeling of tightness are normal in the first days and gradually ease.",
        "Numbness in the lower lip or chin may last a few weeks to a few months and usually improves over time.",
        "Avoid smoking, hookah, and alcohol for 4 weeks.",
        "Protect the chin area from any impact until healing is complete.",
        "The final result can be properly assessed after swelling fully subsides, over the following months.",
      ],
      warningSigns: [
        "Fever",
        "Heavy bleeding",
        "Pus discharge",
        "Uncontrolled pain",
        "A sudden increase in swelling",
        "An impact to the surgical area",
        "Any sudden or concerning change in the chin's appearance",
      ],
      faq: [
        {
          question: "Is numbness normal after genioplasty?",
          answer: "Numbness in the lower lip or chin can last a while and usually improves gradually, but it should be checked at your follow-up visits.",
        },
        {
          question: "When is the final result visible?",
          answer: "Once swelling has fully subsided, the result is usually better assessed over the following months.",
        },
        { question: "What foods are suitable?", answer: "Soft, lukewarm foods that don't require much chewing are more suitable." },
      ],
      assistantPromptHints: [
        "If the user asks about numbness, answer calmly and cautiously, and refer them to their follow-up visits.",
        "If fever, pus discharge, or uncontrolled pain comes up, contacting the clinic is necessary.",
        "Never give a definite timeline for the final result.",
      ],
    },
  ],
} satisfies CareInstructionsPageDictionary;

export const en = {
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
