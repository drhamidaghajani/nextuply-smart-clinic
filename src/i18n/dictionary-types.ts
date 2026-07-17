/**
 * Narrow, per-section dictionary interfaces — see
 * docs/adr/0005-locale-rollout-en-ar.md and docs/adr/0006-full-homepage-
 * and-assistant-locale-rollout.md for why these exist instead of typing
 * `en.ts`/`ar.ts` against `Dictionary = typeof fa` (fa.ts's full shape).
 * `fa.ts` is `as const`, so `Dictionary["hero"]["title"]` etc. are
 * literal Persian-string types, not `string` — an `en`/`ar` object can
 * never satisfy that type no matter how correct its shape is. Every
 * homepage section component and every assistant step component is
 * therefore typed against the plain-`string` interfaces below, not
 * against `Dictionary["xxx"]` directly. `fa.ts`'s own slices still
 * structurally satisfy these interfaces (a literal string is a valid
 * `string`), so passing `fa.hero` where a `HeroDictionary` is expected
 * works with no cast.
 */

export interface NavItem {
  href: string;
  label: string;
}

export interface HeaderDictionary {
  logoSubtitle: string;
  navItems: readonly NavItem[];
  ctaLabel: string;
  openMenuLabel: string;
  closeMenuLabel: string;
}

export interface FooterDictionary {
  tagline: string;
  description: string;
  /** Round 2026-07-13 (taxonomy correction): now linked entries (label + real `/services/[slug]` href), not label-only text — derived from `src/content/services.ts`, single source of truth. */
  services: readonly { label: string; href: string }[];
  guide: readonly { label: string; href: string | null }[];
  locations: {
    tabriz: { label: string; addressLines: readonly string[]; phone: string; mobile: string };
    tehran: { label: string; address: string };
  };
  hours: readonly string[];
  instagram: string;
  siteName: string;
  columnHeadings: { services: string; contact: string; guide: string };
  instagramLabel: string;
  copyrightSuffix: string;
  linkedInAriaLabel: string;
}

export interface HeroDictionary {
  title: string;
  doctorName: string;
  doctorSpecialty: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

/** The homepage "Smart Clinic Assistant" marketing section — not the drawer flow itself (see `AssistantFlowDictionary`). */
export interface AiConciergeDictionary {
  eyebrow: string;
  onlineStatus: string;
  sampleQuestions: readonly string[];
  chips: readonly string[];
  ctaPrimary: string;
  ctaSecondary: string;
  headline: string;
  description: string;
  inputPlaceholder: string;
}

/**
 * Round 2026-07-13 (taxonomy correction, per Hamid): the 6-item service
 * list itself moved to `src/content/services.ts` (`SERVICES`) — the
 * single source of truth every consumer (homepage cards, case gallery,
 * `/services` pages, footer, Assistant) now reads from, instead of each
 * keeping its own copy of service names. This dictionary keeps only the
 * page-level editorial copy (eyebrow/heading/subheading) that's genuine
 * per-locale prose, not service data.
 */
export interface ServicesDictionary {
  eyebrow: string;
  heading: string;
  subheading: string;
}

export interface DoctorStoryDictionary {
  headline: string;
  body: string;
  metrics: readonly { value: string; label: string }[];
  principles: readonly string[];
  cta: string;
  portraitAlt: string;
  surgeryAlt: string;
}

export interface CaseGalleryDictionary {
  heading: string;
  subheading: string;
}

export interface PatientJourneyDictionary {
  heading: string;
  steps: readonly { id: string; title: string; body: string }[];
  cta: string;
}

export type PatientStoryEvidence =
  | { id: string; type: "video"; caption: string }
  | { id: string; type: "review"; name: string; quote: string }
  | { id: string; type: "instagram"; caption: string }
  | { id: string; type: "photo" };

export interface PatientStoriesDictionary {
  heading: string;
  subheading: string;
  videoLabel: string;
  moreThanLabel: string;
  googleReviewCount: string;
  googleBadge: string;
  instagramBadge: string;
  evidence: readonly PatientStoryEvidence[];
  photoStories: readonly { quote: string; meta: string }[];
  playAriaLabel: string;
  verifiedOnGoogleLabel: string;
}

export interface KnowledgeCenterArticle {
  iconId: string;
  label: string;
  title: string;
  lead?: string;
  summary?: string;
  href: string;
}

export interface KnowledgeCenterDictionary {
  eyebrow: string;
  heading: string;
  subheading: string;
  articles: {
    feature: KnowledgeCenterArticle;
    side: readonly KnowledgeCenterArticle[];
  };
  readMoreCta: string;
}

export interface VideoHubVideo {
  id: string;
  category: string;
  iconId: string;
  title: string;
  summary: string;
  duration: string;
}

export interface VideoHubDictionary {
  heading: string;
  subheading: string;
  categories: readonly { id: string; label: string }[];
  videos: readonly VideoHubVideo[];
  detailsCta: string;
  playAriaLabel: string;
}

export interface FaqSectionDictionary {
  heading: string;
  subheading: string;
  intro: string;
  categories: readonly { id: string; label: string }[];
  items: readonly { category: string; question: string; answer: string }[];
}

export interface AssistantServiceOption {
  id: string;
  label: string;
}

/**
 * Full Smart Clinic Assistant drawer flow — every step's copy, not just
 * the entry point. `triageQuestions` is keyed by `ServiceId` (see
 * `application/types.ts`) but typed as a plain string-keyed record here
 * (not the literal `ServiceId` union) so `en`/`ar` object literals don't
 * need to satisfy an exact-key-set check field-by-field; the actual
 * lookup at the call site (`triage-step.tsx`) already treats it as a
 * `Record<string, readonly string[]>` with a safe `?? []` fallback.
 */
export interface AssistantFlowDictionary {
  openingMessage: string;
  mainActions: readonly AssistantServiceOption[];
  services: readonly AssistantServiceOption[];
  triageQuestions: Record<string, readonly string[]>;
  safetyNotice: string;
  /** Round 2026-07-18 (conversation-first UX pass) — deterministic, service-tailored cost guidance (item 9 of the brief): explains what actually drives the price instead of inventing a number, keyed by `ServiceId`. `generic` covers any service without its own tailored entry (and the case where no service is known yet). */
  costGuidance: {
    generic: string;
    byService: Record<string, string>;
  };
  /** Round 2026-07-18 — short, natural service names for chip labels ("رزرو مشاوره ایمپلنت") — `services[].label` is the full formal name and reads awkwardly inside a small chip. */
  serviceShortLabels: Record<string, string>;
  /** Round 2026-07-20 (production UX fix, item 3) — "what does this involve / what's the best approach" answers for a plain service question ("ایمپلنت برای من مناسبه؟"), distinct from `costGuidance` (price-specific). Falls back to `costGuidance` for services without a curated entry here — see `ask-assistant-question.ts`'s `buildGroundedAnswer`. */
  serviceGuidance: {
    byService: Record<string, string>;
  };
  /**
   * Round 2026-07-21 (Smart Clinic Assistant V2, per Hamid — item 4's
   * explicit jaw-surgery example): concern-specific follow-up chips,
   * each with its own deterministic (no question consumed) reply —
   * "جلو یا عقب بودن فک" ≠ "انحراف فک" ≠ a generic "tell me more" chip.
   * Only populated for `orthognathic-surgery` this round (the one
   * service with a fully-specified example); other services keep using
   * the general-purpose `serviceAwareChips`/`implantAwareChips`
   * patterns already built — see the final report for why this wasn't
   * extended to all 6 without an equivalent example for each.
   */
  jawConcernChips: {
    frontBack: { label: string; reply: string };
    deviation: { label: string; reply: string };
    bite: { label: string; reply: string };
    aesthetics: { label: string; reply: string };
  };
  leadForm: {
    fullNameLabel: string;
    mobileLabel: string;
    cityLabel: string;
    ageRangeLabel: string;
    ageRangePlaceholder: string;
    contactMethodLabel: string;
    contactMethods: { phone: string; whatsapp: string; instagram: string };
    notesLabel: string;
    submitCta: string;
  };
  ui: {
    openButtonLabel: string;
    closeButtonLabel: string;
    backToMenu: string;
    chooseServiceCta: string;
    serviceSelectionEyebrow: string;
    serviceSelectionTitle: string;
    triageEyebrow: string;
    triageAnswerPlaceholder: string;
    consultationBookingEyebrow: string;
    beforeAfterTitle: string;
    articlesTitle: string;
    imageUploadTitle: string;
    careGuidanceTitle: string;
    closeCta: string;
    submittingLabel: string;
    selectPlaceholder: string;
    paymentStepEyebrow: string;
    freeTextPlaceholder: string;
    freeTextSubmitCta: string;
    freeTextThinkingLabel: string;
    /** Round 2026-07-16 — AI transport failure/not-configured. Round 2026-07-18 — the old `freeTextUnclearMessage` ("I didn't understand") is retired; see `aiConversation.fallbackPrompt`, its real replacement. */
    freeTextUnavailableMessage: string;
    /** Round 2026-07-17 (Smart Assistant product redesign) — the deliberate, distinct "ask a question" action on the opening menu; replaces the old always-open free-text composer. */
    askQuestionCta: string;
  };
  steps: {
    consultationBooking: { intro: string };
    imageUploadFuture: { notice: string };
    beforeAfter: { body: string; cta: string };
    articles: { body: string; cta: string };
    careGuidance: { body: string; cta: string };
  };
  appointment: {
    heading: string;
    /** Shown above the real availability-slot option list (round 2026-07-15) — distinct from `noRealAvailabilityNotice` below, which is the manual-fallback message. */
    realAvailabilityNotice: string;
    loadingOptionsNotice: string;
    noRealAvailabilityNotice: string;
    preferredDayLabel: string;
    preferredTimeLabel: string;
    timeRangeOptions: readonly string[];
    submitCta: string;
    requestSubmittedNotice: string;
  };
  payment: {
    heading: string;
    gatewayPendingNotice: string;
    amountLabel: string;
    currencyLabel: string;
    currencyOptions: { IRR: string; USDT: string };
  };
  /** Round 2026-07-17 (Smart Assistant product redesign) — collects name+mobile before an AI conversation's OTP step (`identify-step.tsx`); a lighter two-field form than `leadForm`'s full booking contact capture. */
  identify: {
    description: string;
    submitCta: string;
  };
  /** Round 2026-07-17 — the post-OTP, up-to-3-question AI conversation, now folded directly into the drawer's single conversation transcript (round 2026-07-18) rather than a separate step screen. */
  aiConversation: {
    verifiedIntro: string;
    /** Keyed by remaining-question count as a string — only "1"/"2"/"3" are ever looked up (0 shows `limitReachedNotice` instead). Round 2026-07-18 (item 7) — softer phrasing than a bare counter, so it reads as guidance, not a penalty. */
    questionsRemainingLabels: { "3": string; "2": string; "1": string };
    limitReachedNotice: string;
    safetyNotice: string;
    /** Chip shown alongside an AI-suggested next step ("مشاهده"), not the step's own title — kept short since it's a chip, not a heading. */
    viewSuggestedStepCta: string;
    askAnotherCta: string;
    relatedCareCta: string;
    continueBookingCta: string;
    /** Round 2026-07-18 (item 4) — shown after answering a question that interrupted booking, offering to resume exactly where the patient left off. */
    resumeBookingPrompt: string;
    changeServiceCta: string;
    /** Round 2026-07-18 (item 8) — replaces the old vague "use the buttons above" fallback with a genuinely helpful clarifying prompt. */
    fallbackPrompt: string;
    fallbackChips: { cost: string; service: string; care: string; booking: string };
    /** Round 2026-07-18 (item 2) — chip offered after a cost answer to re-show the same guidance without spending another question. */
    costEstimateCta: string;
    /** `"{service}"` placeholder templates for service-aware chip labels ("رزرو مشاوره ایمپلنت" / "مراقبت‌های ایمپلنت") — a template (not string concatenation) so word order stays grammatical in en/ar too. */
    bookServiceTemplate: string;
    careForServiceTemplate: string;
    /** Round 2026-07-20 (production UX fix, item 4) — shown before retrying the last topic in response to a recognized dissatisfaction phrase ("این جواب من نیست"). */
    correctionAcknowledgement: string;
    /** Round 2026-07-20 (item 3) — the two imaging-status follow-up chips on a service-guidance answer, plus their deterministic (no question consumed) canned replies. Round 2026-07-21 (V2) — copy updated to the new exact spec: never a dead end, always ends with a concrete next step + offer. */
    hasXrayCta: string;
    noXrayCta: string;
    hasXrayReply: string;
    noXrayReply: string;
    /** Round 2026-07-21 (V2, item 7) — the "سؤال درباره آماده‌سازی" chip shown after an imaging-status reply; functions the same as `askAnotherCta` (opens the composer) but topic-labeled to match what was just discussed. */
    preparationQuestionCta: string;
    /** Round 2026-07-21 (V2, item 13) — "human handoff ready": exact required public copy, shown when a handoff is recommended (explicit request, repeated dissatisfaction, or the question limit reached while still engaged). Never a full handoff system — just this notice + a booking offer, and a `role: "system"` log entry for staff (see `log-handoff.ts`). */
    handoffNotice: string;
    /** Round 2026-07-22 (focused-conversation UX fix, item 7) — `"{service}"` template for the collapsed recap line of a completed free-text Q&A turn ("✓ سؤال درباره جراحی فک"); used only when the question had a known service context, see `assistant-drawer.tsx`'s recap-boundary logic. */
    questionRecapTemplate: string;
    /** Round 2026-07-22 (item 7) — prefixes for the service-selected/time-selected collapse recap lines, matching the exact "✓ خدمت انتخاب شد: …" / "✓ زمان انتخاب شد: …" pattern. */
    serviceSelectedPrefix: string;
    timeSelectedPrefix: string;
    /** Round 2026-07-22 (item 4) — "لغو رزرو", the third resume-card chip; abandons the in-progress booking back to the main menu. */
    cancelBookingCta: string;
    /** Round 2026-07-22 (item 3/8) — "درخواست تماس از کلینیک", offered once the question limit is reached; routes through the existing handoff log (no new CRM/notification system). */
    requestCallCta: string;
    /** Round 2026-07-22 (item 3) — the persistent decision card shown INSTEAD of the free-text composer once a verified session has used all its questions (`questionsRemaining <= 0`), distinct from the one-time `limitReachedNotice` transcript entry shown the moment the limit is first reached. */
    composerLocked: { prompt: string; careCta: string };
  };
  /** Round 2026-07-17 — the "قبل از ادامه، سؤالی دارید؟" prompt shown on booking-flow steps (item 6 of the brief). */
  contextualAsk: {
    prompt: string;
    cta: string;
  };
  confirmation: {
    heading: string;
    body: string;
    /** Round 2026-07-17 (richer confirmation screen, per Hamid) */
    summaryLabel: string;
    serviceLabel: string;
    timeLabel: string;
    contactStatusLabel: string;
    contactStatusValue: string;
    tipsLabel: string;
    tips: readonly string[];
    viewCareCta: string;
    askAnotherCta: string;
  };
  validation: {
    mobileInvalid: string;
    fullNameRequired: string;
  };
  phoneVerification: {
    eyebrow: string;
    description: string;
    mobileLabel: string;
    requestCodeCta: string;
    sendingLabel: string;
    codeLabel: string;
    codePlaceholder: string;
    verifyCta: string;
    verifyingLabel: string;
    changeMobileCta: string;
    resendCta: string;
    smsUnavailableMessage: string;
    /** Round 2026-07-16 — shown specifically when SMS is unavailable during the final booking submit (`purpose: "booking_request"`), naming that consequence explicitly rather than the generic message. */
    smsUnavailableBookingMessage: string;
    invalidMobileMessage: string;
    /** Round 2026-07-19 (OTP UX/verification fix, item 6) — user-friendly, specific copy replacing the old generic messages. */
    invalidCodeMessage: string;
    expiredCodeMessage: string;
    tooManyAttemptsMessage: string;
    /** Shown when `verifyOtp` itself returns `"unavailable"` (a transport/provider issue during the verify call, not the same as `smsUnavailableMessage`, which covers SMS-send-time unavailability). */
    verifyUnavailableMessage: string;
    devBypassNotice: string;
    /** Round 2026-07-19 — countdown/auto-verify copy for the OTP card. `{time}` is a literal placeholder replaced client-side (mm:ss for expiry, a plain seconds count for resend). */
    codeExpiryLabel: string;
    resendCooldownLabel: string;
    codeExpiredNotice: string;
    autoVerifyingLabel: string;
    /** Round 2026-07-20 (item 2) — the compact recap shown instead of asking for the mobile a second time; `{mobile}` placeholder. */
    codeSentRecap: string;
  };
}

/**
 * Delivery-mode content pages (Hamid's 2026-07-13 brief) — `about`,
 * `contact`, `services` (index + 8 detail pages), `healthTourism`
 * (overview + visa/hotel/transfer), `beforeAfterPage`, `knowledge`
 * (index + starter articles). Kept as plain-`string` interfaces for the
 * same reason as every type above: `en`/`ar` object literals must
 * structurally satisfy them without fighting `fa.ts`'s `as const` literal
 * types.
 */
export interface PageFaqItem {
  question: string;
  answer: string;
}

/**
 * Round 2026-07-13 (premium About-page redesign, per Hamid — content
 * rewritten and polished from Dr. Sadighi's previous website, not pasted
 * raw). 10 sections: hero, editorial biography, credentials, philosophy,
 * specialty focus (reads the canonical 6 services from
 * `content/services.ts`, not duplicated here), technology & planning,
 * patient relationship, work-experience timeline, scientific activity,
 * final CTA. `metaTitle` feeds this page's own `generateMetadata` —
 * the first per-page metadata override in this app (root layout's
 * `metadata` stays the site-wide fallback for every other page).
 */
export interface AboutPageDictionary {
  eyebrow: string;
  title: string;
  subtitle: string;
  positioning: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  /** 3 compact trust-marker chips shown inside the hero, per the round-2 premium-redesign brief. */
  heroTrustMarkers: readonly string[];
  metaTitle: string;

  bioEyebrow: string;
  bioHeading: string;
  bioBody: readonly string[];

  credentialsEyebrow: string;
  credentials: readonly string[];

  /** "Certificates & Scientific Credentials" section, placed after the credentials band and before biography. Reuses `credentialsEyebrow` above as its kicker rather than a new eyebrow string. Featured-composition + modal gallery — see `certificate-gallery-section.tsx`. */
  certificatesHeading: string;
  certificatesSubtitle: string;
  certificatesStat: string;
  certificatesButton: string;
  certificatesOpenOriginal: string;

  philosophyHeading: string;
  philosophy: readonly string[];

  specialtyHeading: string;
  specialtyViewDetailsCta: string;

  technologyHeading: string;
  technologyBody: string;

  patientRelationshipHeading: string;
  patientRelationshipBody: readonly string[];
  patientRelationshipCta: string;

  experienceHeading: string;
  experience: readonly { period: string; place: string }[];

  scientificHeading: string;
  scientificBody: string;
  scientificNote: string;

  /** Round-3 addition — refined "next step" tiles: Services/Care/Before-After (icon + label + short caption each). */
  exploreEyebrow: string;
  exploreServicesLabel: string;
  exploreServicesSub: string;
  exploreCareLabel: string;
  exploreCareSub: string;
  exploreBeforeAfterLabel: string;
  exploreBeforeAfterSub: string;

  ctaHeading: string;
  ctaBody: string;
  ctaButton: string;
  /** Round-2 addition — secondary link on the final CTA ("View Services"). */
  ctaSecondaryLabel: string;
}

export interface ContactPageDictionary {
  eyebrow: string;
  title: string;
  subtitle: string;
  formNoticeHeading: string;
  formNotice: string;
  ctaButton: string;
  locationsHeading: string;
  hoursHeading: string;
}

export interface ServiceDetail {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  overview: string;
  suitableForHeading: string;
  suitableFor: readonly string[];
  consultationPathHeading: string;
  consultationPath: string;
  processHeading: string;
  process: readonly { title: string; body: string }[];
  faqHeading: string;
  faq: readonly PageFaqItem[];
}

export interface ServicesPageDictionary {
  eyebrow: string;
  heading: string;
  subheading: string;
  viewDetailsCta: string;
  items: readonly ServiceDetail[];
  disclaimer: string;
  beforeAfterCta: string;
  assistantCtaHeading: string;
  assistantCtaBody: string;
  assistantCtaButton: string;
  /** Round 2026-07-13 (service-page premium redesign) — shared across all 6 detail pages, not per-service. */
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  overviewTrustNote: string;
  consultationStepsHeading: string;
  consultationSteps: readonly { title: string; body: string }[];
  /** Round 2026-07-13, same day (Dr. William Miami-inspired redesign) — the shared "approach" editorial block and the before/after band's caption. */
  overviewHeading: string;
  approachEyebrow: string;
  approachHeading: string;
  approachNote: string;
  beforeAfterBandHeading: string;
  beforeAfterBandNote: string;
  /** Round 2026-07-13 (patient-care hub) — links a service detail page to its related `/care-instructions/[slug]` guide(s). */
  careGuideHeading: string;
}

export interface HealthTourismSubpage {
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string;
  points: readonly string[];
  cautionNote: string;
}

export interface HealthTourismPageDictionary {
  nav: { overview: string; visa: string; hotel: string; transfer: string };
  overview: {
    eyebrow: string;
    title: string;
    subtitle: string;
    intro: string;
    sections: readonly { title: string; body: string }[];
  };
  visa: HealthTourismSubpage;
  hotel: HealthTourismSubpage;
  transfer: HealthTourismSubpage;
  ctaHeading: string;
  ctaBody: string;
  ctaButton: string;
}

export interface BeforeAfterPageDictionary {
  eyebrow: string;
  title: string;
  subtitle: string;
  disclaimer: string;
  ctaHeading: string;
  ctaBody: string;
  ctaButton: string;
}

export interface KnowledgeArticle {
  slug: string;
  category: string;
  readTime: string;
  title: string;
  summary: string;
  body: readonly string[];
}

/**
 * Round 2026-07-13 (patient-care hub, per Hamid's "مراقبت‌های قبل و بعد
 * عمل" brief) — page-level chrome only, shared across the hub and every
 * detail page. Per-topic identity (title/description/image) lives in
 * `content/care-instructions.ts`, same split as `content/services.ts`
 * vs. `servicesPage` — this is where the rich page content lives, same
 * role as `ServicesPageDictionary.items`.
 *
 * Round 2026-07-13, same day (real content integration, per Hamid — real
 * copy extracted/rewritten from Dr. Sadighi's previous website): `topics`
 * now carries real before/after/warning-sign/FAQ content for all 9 care
 * topics. `pendingReviewNotice` stays defined (a future 10th topic added
 * without ready content would still need a safe fallback) but is no
 * longer rendered for any of today's 9 — see the detail page's own
 * doc-comment.
 */
export interface CareTopicDetail {
  /** Matches a `CareTopicId` from `content/care-instructions.ts`. */
  slug: string;
  /** Only `jaw-physiotherapy` uses this — a lead paragraph for a topic with no discrete before/after split. */
  intro?: string;
  /** Empty array renders no "before" section (e.g. `jaw-physiotherapy`, `wisdom-tooth-care`'s minimal case). */
  beforeCare: readonly string[];
  afterCare: readonly string[];
  /** Only `implant-care` uses this — the crown/prosthesis follow-up phase, distinct enough from surgical aftercare to warrant its own heading. */
  additionalCareHeading?: string;
  additionalCare?: readonly string[];
  warningSigns: readonly string[];
  faq: readonly PageFaqItem[];
  /**
   * Internal guidance for how the Smart Clinic Assistant SHOULD respond
   * if a patient asks about this topic in free text — written as
   * directives to an AI ("اگر کاربر پرسید X..., هدایت کن"), not patient-
   * readable copy. Deliberately NOT rendered anywhere in the page UI
   * today (no per-topic AI prompt wiring exists yet — building that is a
   * separate, unrequested AI-flow change). Kept as structured data so a
   * future round can wire it into the AI Gateway's system prompt without
   * a content rewrite.
   */
  assistantPromptHints: readonly string[];
}

export interface CareInstructionsPageDictionary {
  eyebrow: string;
  heading: string;
  subheading: string;
  trustNote: string;
  viewGuideCta: string;
  safetyNote: string;
  assistantCtaHeading: string;
  assistantCtaBody: string;
  assistantCtaButton: string;
  disclaimer: string;
  backToHubCta: string;
  detail: {
    beforeHeading: string;
    afterHeading: string;
    warningSignsHeading: string;
    warningSignsBody: string;
    faqHeading: string;
    pendingReviewNotice: string;
  };
  topics: readonly CareTopicDetail[];
}

export interface KnowledgePageDictionary {
  eyebrow: string;
  heading: string;
  subheading: string;
  readMoreCta: string;
  backToIndexCta: string;
  articles: readonly KnowledgeArticle[];
  ctaHeading: string;
  ctaBody: string;
  ctaButton: string;
}
