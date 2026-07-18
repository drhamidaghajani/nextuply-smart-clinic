"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getDictionary } from "@/i18n/get-dictionary";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

import { ACTION_STEP_MAP } from "../application/action-step-map";
import type { AssistantIntent, AssistantStep, LeadInfo, PaymentCurrency, ServiceId, TriageAnswer } from "../application/types";
import { askAssistantQuestion } from "../server/ai/ask-assistant-question";
import { logHandoffEvent } from "../server/ai/log-handoff";
import type { OtpPurpose } from "../server/request-otp";
import { submitBookingRequest } from "../server/submit-booking-request";
import { useAssistant } from "./assistant-provider";
import { AppointmentSelectionStep, type AppointmentSelectionResult } from "./steps/appointment-selection-step";
import { ConfirmationStep } from "./steps/confirmation-step";
import { ContactCaptureStep } from "./steps/contact-capture-step";
import { IdentifyStep } from "./steps/identify-step";
import { PaymentPreparationStep } from "./steps/payment-preparation-step";
import { PhoneVerificationStep } from "./steps/phone-verification-step";
import { ServiceSelectionStep } from "./steps/service-selection-step";
import { TriageStep } from "./steps/triage-step";
import { AssistantBubble, Chip, ChoiceRecap, GuidedCard, TypingIndicator, UserBubble } from "./drawer-controls";
import { useAssistantFlow } from "./use-assistant-flow";

/** The guided booking steps — anything else is a menu/informational/AI intent, not a card in "booking" mode. */
const BOOKING_STEPS: readonly AssistantStep[] = ["service_selection", "triage", "appointment_selection", "contact_capture", "payment_preparation"];

/**
 * Round 2026-07-20 (production UX fix, item 4) — plain-substring
 * "that's not my answer" phrases. Deliberately generic/service-blind
 * (unlike `local-intent-matcher.ts`'s keyword groups) — a message that
 * itself names a service ("سوال من درباره ایمپلنته") already resolves
 * correctly through the normal free-text path and doesn't need this
 * special case.
 */
/**
 * Round 2026-07-21 (Smart Clinic Assistant V2, item 13 — "human handoff
 * ready"): an explicit, low-false-positive request to talk to a person
 * — one of the three concrete handoff triggers actually wired this
 * round (see `triggerHandoff`'s doc-comment for why "cost sensitivity"/
 * "complex surgery question" were deliberately NOT auto-detected).
 */
const HUMAN_REQUEST_KEYWORDS: Record<Locale, string[]> = {
  fa: ["صحبت با انسان", "با اپراتور", "با یک نفر صحبت", "با همکار شما", "با پرسنل", "با منشی", "با یک نفر واقعی"],
  en: ["talk to a human", "speak to someone", "talk to a person", "human agent", "speak to a human"],
  ar: ["التحدث مع إنسان", "مع موظف", "مع شخص", "التحدث مع شخص حقيقي"],
};

const DISSATISFACTION_KEYWORDS: Record<Locale, string[]> = {
  fa: [
    "این جواب من نیست",
    "جواب سوالم",
    "سوالم رو جواب",
    "سوالم را جواب",
    "متوجه نشدی",
    "بی‌ربط",
    "نه منظورم",
    "منظورم این نبود",
    "درست جواب نده",
    "جوابمو ندادی",
    "جواب درست نبود",
  ],
  en: ["that's not my answer", "answer my question", "you didn't understand", "not relevant", "that's not what i meant", "wrong answer"],
  ar: ["هذا ليس جوابي", "أجب عن سؤالي", "لم تفهم", "غير ذي صلة", "لم أقصد ذلك", "إجابة خاطئة"],
};

/**
 * Round 2026-07-23 (Urgency & Safety Router, per Hamid — critical bug:
 * "بینیم شکسته... فوری و اورژانسی" got a generic rhinoplasty explanation
 * instead of an urgent/safety response, because service-keyword matching
 * ran before any urgency check). Deliberately broad substring keywords —
 * a false positive here just means an urgent-flavored response to a
 * message that wasn't truly urgent (safe direction to err in); a false
 * negative means a genuinely urgent message gets generic service content
 * (the actual bug), which is the direction that must never happen. His
 * exact given Persian list, plus reasonable en/ar equivalents.
 */
const URGENCY_KEYWORDS: Record<Locale, string[]> = {
  fa: [
    "فوری",
    "اورژانسی",
    "شکستگی",
    "شکسته",
    "ضربه",
    "تصادف",
    "خونریزی",
    "خون دماغ شدید",
    "درد شدید",
    "تورم شدید",
    "عفونت",
    "تب",
    "نمی‌تونم نفس بکشم",
    "نمیتونم نفس بکشم",
    "مشکل تنفس",
    "نفس کشیدن سخت شده",
    "همین الان",
    "سریع وقت می‌خوام",
    "سریع وقت میخوام",
  ],
  en: [
    "urgent",
    "emergency",
    "fracture",
    "fractured",
    "broken",
    "trauma",
    "accident",
    "bleeding",
    "heavy nosebleed",
    "severe pain",
    "severe swelling",
    "infection",
    "fever",
    "can't breathe",
    "cannot breathe",
    "breathing problem",
    "trouble breathing",
    "right now",
    "need an appointment fast",
    "asap",
  ],
  ar: [
    "عاجل",
    "طارئ",
    "طارئة",
    "كسر",
    "مكسور",
    "صدمة",
    "حادث",
    "نزيف",
    "رعاف شديد",
    "ألم شديد",
    "تورم شديد",
    "عدوى",
    "حمى",
    "لا أستطيع التنفس",
    "مشكلة تنفس",
    "صعوبة تنفس",
    "الآن",
    "أريد موعد بسرعة",
  ],
};

/**
 * Round 2026-07-23 — his given "service-specific trauma examples", used
 * to (a) confirm urgency even without a generic urgency word present, and
 * (b) pick which service/topic the urgent response names. Matched with
 * simple AND-of-substrings (`requireAll`) rather than exact phrases —
 * natural Persian adds possessive/verb suffixes ("بینیم شکسته" for "my
 * nose is broken") that an exact-phrase match like `"بینی شکسته"` would
 * miss; "بینیم".includes("بینی") still holds, so `["بینی","شکست"]`
 * (stemmed, not "شکسته"/"شکستگی" separately) catches both. Order matters
 * — first match wins, so more specific rules (a named service) are listed
 * before the fully generic "bleeding after any surgery" rule.
 */
const TRAUMA_TOPIC_RULES: Record<Locale, Array<{ requireAll: string[]; serviceId: ServiceId | null; topicLabel: string }>> = {
  fa: [
    { requireAll: ["بینی", "شکست"], serviceId: "rhinoplasty", topicLabel: "شکستگی بینی" },
    { requireAll: ["بینی", "ضربه"], serviceId: "rhinoplasty", topicLabel: "ضربه به بینی" },
    { requireAll: ["فک", "شکست"], serviceId: "orthognathic-surgery", topicLabel: "شکستگی فک" },
    { requireAll: ["دندان", "درد", "شدید"], serviceId: "impacted-tooth-surgery", topicLabel: "درد شدید دندان" },
    { requireAll: ["ایمپلنت", "عفونت"], serviceId: "advanced-dental-implant", topicLabel: "عفونت ایمپلنت" },
    { requireAll: ["ایمپلنت", "خونریزی"], serviceId: "advanced-dental-implant", topicLabel: "خونریزی ایمپلنت" },
    { requireAll: ["صورت", "ورم"], serviceId: "facial-cosmetic-surgery", topicLabel: "تورم شدید صورت" },
    { requireAll: ["تزریق", "ورم"], serviceId: "facial-rejuvenation", topicLabel: "واکنش شدید بعد از تزریق" },
    { requireAll: ["تزریق", "عفونت"], serviceId: "facial-rejuvenation", topicLabel: "واکنش شدید بعد از تزریق" },
    { requireAll: ["خونریزی", "جراحی"], serviceId: null, topicLabel: "خونریزی پس از جراحی" },
  ],
  en: [
    { requireAll: ["nose", "broken"], serviceId: "rhinoplasty", topicLabel: "a broken nose" },
    { requireAll: ["nose", "fracture"], serviceId: "rhinoplasty", topicLabel: "a broken nose" },
    { requireAll: ["nose", "trauma"], serviceId: "rhinoplasty", topicLabel: "nose trauma" },
    { requireAll: ["jaw", "broken"], serviceId: "orthognathic-surgery", topicLabel: "a broken jaw" },
    { requireAll: ["jaw", "fracture"], serviceId: "orthognathic-surgery", topicLabel: "a broken jaw" },
    { requireAll: ["tooth", "severe pain"], serviceId: "impacted-tooth-surgery", topicLabel: "severe tooth pain" },
    { requireAll: ["implant", "infection"], serviceId: "advanced-dental-implant", topicLabel: "an implant infection" },
    { requireAll: ["implant", "bleeding"], serviceId: "advanced-dental-implant", topicLabel: "bleeding after implant surgery" },
    { requireAll: ["face", "swelling"], serviceId: "facial-cosmetic-surgery", topicLabel: "severe facial swelling" },
    { requireAll: ["filler", "swelling"], serviceId: "facial-rejuvenation", topicLabel: "a severe reaction after an injection" },
    { requireAll: ["botox", "swelling"], serviceId: "facial-rejuvenation", topicLabel: "a severe reaction after an injection" },
    { requireAll: ["bleeding", "surgery"], serviceId: null, topicLabel: "bleeding after surgery" },
  ],
  ar: [
    { requireAll: ["أنف", "كسر"], serviceId: "rhinoplasty", topicLabel: "كسر في الأنف" },
    { requireAll: ["أنف", "صدمة"], serviceId: "rhinoplasty", topicLabel: "صدمة في الأنف" },
    { requireAll: ["فك", "كسر"], serviceId: "orthognathic-surgery", topicLabel: "كسر في الفك" },
    { requireAll: ["سن", "ألم شديد"], serviceId: "impacted-tooth-surgery", topicLabel: "ألم شديد في الأسنان" },
    { requireAll: ["زراعة", "عدوى"], serviceId: "advanced-dental-implant", topicLabel: "عدوى في الزرعة" },
    { requireAll: ["زراعة", "نزيف"], serviceId: "advanced-dental-implant", topicLabel: "نزيف بعد زراعة الأسنان" },
    { requireAll: ["وجه", "تورم"], serviceId: "facial-cosmetic-surgery", topicLabel: "تورم شديد في الوجه" },
    { requireAll: ["فيلر", "تورم"], serviceId: "facial-rejuvenation", topicLabel: "رد فعل شديد بعد الحقن" },
    { requireAll: ["بوتوكس", "تورم"], serviceId: "facial-rejuvenation", topicLabel: "رد فعل شديد بعد الحقن" },
    { requireAll: ["نزيف", "جراحة"], serviceId: null, topicLabel: "نزيف بعد الجراحة" },
  ],
};

/** Round 2026-07-23 — first matching rule wins; `null` means no trauma-specific topic was named (the caller falls back to session/context service, or the generic urgent-review copy). */
function detectTraumaTopic(normalized: string, locale: Locale): { serviceId: ServiceId | null; topicLabel: string } | null {
  for (const rule of TRAUMA_TOPIC_RULES[locale]) {
    if (rule.requireAll.every((keyword) => normalized.includes(keyword))) return { serviceId: rule.serviceId, topicLabel: rule.topicLabel };
  }
  return null;
}

/**
 * Round 2026-07-22 (focused-conversation UX fix, per Hamid — "the UI
 * behaves like an infinite transcript"): `"decision"` is a new terminal
 * mode with no live-area card of its own (`renderLiveArea` falls through
 * to `null` for it, same as the old unhandled-default case) — its whole
 * point is that the just-pushed assistant entry (limit-reached notice or
 * mid-booking resume prompt) is ALREADY the live content, chips and all,
 * so no separate composer/card should render underneath it. Distinct
 * from `"menu"` (which also renders no live area) so `showBack` still
 * shows the "back to menu" affordance while the user is mid-flow at a
 * decision point, not actually back at the main menu.
 */
type AssistantMode = "menu" | "conversation" | "booking" | "identify" | "otp" | "confirmation" | "decision";

interface ChipAction {
  label: string;
  onClick: () => void;
  emphasized?: boolean;
}

type ConversationEntry =
  /** An assistant-authored line, optionally with follow-up quick replies. */
  | { id: string; kind: "assistant"; text: string; chips?: ChipAction[] }
  /** A patient-typed free-text question. Round 2026-07-22 (item 7) — `recapLabel`, when known (a service context was active), is the short topic used for the collapsed recap line ("✓ سؤال درباره جراحی فک") once this turn is no longer the active one; falls back to a truncated `text` when absent. */
  | { id: string; kind: "user"; text: string; recapLabel?: string }
  /** A compact recap of a completed guided card (service picked, triage done, time chosen, OTP verified, …) — deliberately not a full bubble pair, since the card itself already showed the question. */
  | { id: string; kind: "choice"; text: string }
  /** A small muted aside — the softened question-counter, a transport-failure notice. */
  | { id: string; kind: "note"; text: string };

/** Plain `Omit` collapses a discriminated union down to its common keys only (`keyof (A|B)` is the intersection of each member's keys) — this distributes `Omit` over each member instead, so `pushEntry` can still accept e.g. `{ kind: "assistant", text, chips }` without losing `chips` to the union collapse. */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

/**
 * The real assistant panel this module's earlier `TODO(assistant)` was
 * pointing at (see `assistant-provider.tsx`) — built per Hamid's
 * 2026-07-12 contract-driven brief. Docks to `start-0` (logical) — under
 * this site's `dir="rtl"` that's the physical right edge. Focus
 * management: focuses the close button on open, traps Tab, Escape closes,
 * body scroll locked while open (same pattern as `mobile-menu.tsx`).
 *
 * Round 2026-07-18 (conversation-first UX pass, per Hamid — "it still
 * feels like a form with a chat attached to it"): rebuilt as ONE
 * continuous, persistent conversation transcript (`entries`) instead of
 * a wizard that swaps between separate full-screen views. Every
 * interaction — the opening message, quick actions, free-text questions/
 * answers, and every guided booking step — now renders inside the SAME
 * scrolling feed: completed guided steps collapse into a compact
 * `ChoiceRecap` line, while the CURRENTLY active step (a real booking
 * card, the identify form, OTP, or the free-text composer) stays "live"
 * at the end of the transcript. This is a refactor of the container, not
 * a rewrite of the flow: every step component (`ServiceSelectionStep`,
 * `TriageStep`, `AppointmentSelectionStep`, `ContactCaptureStep`,
 * `PaymentPreparationStep`, `PhoneVerificationStep`, `IdentifyStep`,
 * `ConfirmationStep`) keeps its exact previous props/validation/server
 * calls — only wrapped in `GuidedCard` instead of filling the whole
 * panel. `GeneralStep`/`AiConversationStep` (the old separate landing
 * screen and separate AI-conversation screen) are retired — their roles
 * are now just entries/chips and the `mode === "conversation"` composer
 * in this same file.
 *
 * `AssistantMode` (menu/conversation/booking/identify/otp/confirmation)
 * drives what the "live" area at the end of the transcript shows;
 * `useAssistant()`'s `step` (unchanged external contract — every other
 * CTA on the site still just calls `open(intent)`) still tracks WHICH
 * booking card is active while `mode === "booking"`. `returnStep`
 * remembers which booking card to resume after a mid-booking detour to
 * ask a question (item 4) — never cleared just by asking another
 * question, only by actually resuming, changing service, or leaving.
 *
 * `sessionToken`/`questionsRemaining` (docs/adr/0007, and the 3-question
 * conversation limit) are preserved from the previous rounds exactly —
 * `runGated` is still the one gate, `askAssistantQuestion` is still the
 * one server entry point enforcing the real limit.
 */
export function AssistantDrawer() {
  const { isOpen, step, setStep, close, source, locale, intent } = useAssistant();
  const router = useRouter();
  const localeDict = getDictionary(locale);
  const dict = localeDict.assistantFlow;
  const isRtl = LOCALE_DIRECTION[locale] === "rtl";
  const { state, dispatch } = useAssistantFlow();
  const shouldReduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  /** Round 2026-07-20 (item 8) — the growing content wrapper, observed by `ResizeObserver` so ANY height change (a new entry, a booking card swapping in, an async-loaded option list, a timer label appearing) re-scrolls — not just the specific state changes a deps array would need enumerating. Round 2026-07-22 — kept as a SUPPLEMENT to `activeTurnRef` below (per Hamid's explicit "do not rely only on content height ResizeObserver"), not the primary mechanism anymore. */
  const contentRef = useRef<HTMLDivElement>(null);
  /**
   * Round 2026-07-22 (focused-conversation UX fix, item 2) — wraps the
   * CURRENTLY ACTIVE turn (the still-expanded tail of `entries` plus
   * whatever `renderLiveArea()` renders underneath it): the one thing
   * that must always be scrolled into view, deterministically, on every
   * state transition that produces new active content — not just
   * whenever the content wrapper's total height happens to change.
   */
  const activeTurnRef = useRef<HTMLDivElement>(null);
  const entryIdRef = useRef(0);
  const seededForRef = useRef<string | null>(null);
  const shownIntroRef = useRef(false);

  const [mode, setMode] = useState<AssistantMode>("menu");
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [composerMessage, setComposerMessage] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Mobile verification (docs/adr/0007) ---
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [pendingPurpose, setPendingPurpose] = useState<OtpPurpose>("assistant_access");
  const pendingActionRef = useRef<((token: string) => void) | null>(null);
  /** Round 2026-07-19 (OTP UX/verification fix, item 1) — bumped every time `runGated` opens a FRESH verification attempt (never on the OTP card's own internal resend, which reuses the same instance/timers on purpose). Passed as `PhoneVerificationStep`'s `key` so a genuinely new gated action can never reuse a stale mobile/code/timer state left over from a previous attempt — React remounts a clean instance instead. */
  const [otpAttemptId, setOtpAttemptId] = useState(0);

  // --- Post-OTP AI conversation state + mid-booking detour memory (item 5) ---
  const [questionsRemaining, setQuestionsRemaining] = useState(3);
  const [returnStep, setReturnStep] = useState<AssistantStep | null>(null);
  /** Round 2026-07-20 (production UX fix, item 6) — the session's last-discussed service, lightweight client-side memory (NOT a CRM concept): set whenever a service is picked via a card OR resolved from free text, read as a fallback so a short follow-up ("چند جلسه طول می‌کشه؟") or a correction ("این جواب من نیست") resolves against the right service without the patient repeating its name. */
  const [lastServiceId, setLastServiceId] = useState<ServiceId | null>(null);
  /** Round 2026-07-21 (Smart Clinic Assistant V2, item 13) — how many DISSATISFACTION corrections / "unclear" results have happened BACK TO BACK (reset to 0 the moment a real answer lands) — the two repeated-failure handoff triggers. Not persisted, not a CRM field, just enough memory to notice "this isn't working" within one session. */
  const [consecutiveDissatisfaction, setConsecutiveDissatisfaction] = useState(0);
  const [consecutiveUnclear, setConsecutiveUnclear] = useState(0);

  /**
   * Round 2026-07-22 (V2.2 — focused full-screen assistant, item 5/6 —
   * jaw-surgery state-machine fix): the real bug wasn't the concern
   * CHIP itself (that always called `handleJawConcern` deterministically)
   * — it was that a FOLLOW-UP free-text message mentioning "فک" (very
   * natural after picking a concern, e.g. "آره همون جلو بودنش") re-matches
   * `orthognathic-surgery` in `local-intent-matcher.ts` and returns
   * `step: "triage"` again, which `implantAwareChips` used to answer with
   * the SAME 4 concern chips a second time — indistinguishable from "the
   * assistant asked the same question again." `jawStage` makes that
   * structurally impossible: once a concern is selected, `implantAwareChips`
   * can never re-show `jawConcernChipsList()` for this service again this
   * session, no matter what triggers it.
   */
  const [jawStage, setJawStage] = useState<"intro" | "concern_selected" | "imaging_question" | "booking_offer" | "booking_flow">("intro");
  /** The short topic phrase for the compact public context summary ("… · رابطه فک بالا و پایین") — item 7. Not service-specific by construction (any future concern-style state could set it), but only the jaw flow populates it today. */
  const [activeConcern, setActiveConcern] = useState<string | null>(null);

  /**
   * Round 2026-07-23 (Urgency & Safety Router) — set only when "درخواست
   * تماس فوری کلینیک" is clicked while NOT yet verified: remembers what
   * to finalize (which service, which topic) once the patient has gone
   * through the lightweight identify form + OTP, so `handleIdentifySubmit`
   * can route to `finalizeUrgentCallRequest` instead of the normal
   * `enterConversationMode` — see both for how this is consumed.
   */
  const [pendingUrgentContext, setPendingUrgentContext] = useState<{ serviceId: ServiceId | null; topicLabel: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  /**
   * Round 2026-07-20 (production UX fix, item 8 — bug: "new messages/
   * cards do not auto-scroll into view"): a `ResizeObserver` on the
   * growing content wrapper, not a `[entries, mode, step]` dependency
   * effect — the old version missed height changes that happen WITHOUT
   * one of those three changing (an async option list resolving inside
   * an already-mounted booking card, a timer label appearing, the OTP
   * card's phase flipping from "sending" to "enter code"). This catches
   * every case the brief lists (user message, assistant response, OTP
   * card, next booking card, confirmation, error, resume card)
   * uniformly, since all of them are content-height changes.
   */
  useEffect(() => {
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      bottomRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "end" });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldReduceMotion]);

  /**
   * Round 2026-07-22 (focused-conversation UX fix, item 2 — "do not rely
   * only on content height ResizeObserver; the active decision card must
   * come into view"): the explicit, deterministic mechanism. Fires on
   * every transition that produces a new active turn — a new entry
   * (assistant response, chip result, resume/limit/confirmation card),
   * a mode change (OTP card opening, booking↔conversation), a booking
   * step change (the next booking card), a fresh OTP attempt, or the
   * typing indicator appearing. Double `requestAnimationFrame` — the
   * first waits for React to commit the DOM, the second for the browser
   * to complete layout on that new DOM — before measuring/scrolling, so
   * this doesn't race an about-to-be-stale layout the way a single rAF
   * (or none) can.
   */
  useEffect(() => {
    if (!isOpen) return;
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        activeTurnRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
      });
    });
    return () => cancelAnimationFrame(raf1);
  }, [isOpen, mode, step, entries.length, isAsking, otpAttemptId, shouldReduceMotion]);

  // On mobile, the on-screen keyboard opening resizes the visual
  // viewport (not the document) — re-anchor to the active turn (not just
  // the literal bottom) so the composer/active card stays visible above
  // the keyboard instead of sliding under it. Instant, not smooth — this
  // is a viewport correction, not a content-arrival animation.
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const handleViewportResize = () => {
      activeTurnRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    };
    viewport.addEventListener("resize", handleViewportResize);
    return () => viewport.removeEventListener("resize", handleViewportResize);
  }, []);

  const pushEntry = (entry: DistributiveOmit<ConversationEntry, "id">) => {
    entryIdRef.current += 1;
    setEntries((prev) => [...prev, { id: `e${entryIdRef.current}`, ...entry } as ConversationEntry]);
  };

  const mainActionLabel = (id: string) => dict.mainActions.find((action) => action.id === id)?.label ?? id;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * The one gate. `action` receives the verified session token directly
   * as a parameter (never reads `sessionToken` from closure scope) so a
   * pending action created BEFORE verification still gets the FRESH
   * token when it's replayed after.
   */
  const runGated = (action: (token: string) => void, purpose: OtpPurpose = "assistant_access") => {
    if (sessionToken) {
      action(sessionToken);
      return;
    }
    setPendingPurpose(purpose);
    pendingActionRef.current = action;
    setOtpAttemptId((id) => id + 1);
    setMode("otp");
  };

  /**
   * Round 2026-07-22 (focused-conversation UX fix, item 5 — "never ask
   * OTP again inside a verified session"): the ONE place "is this
   * session verified" is decided. Deliberately NOT combined with
   * `questionsRemaining` (that was the actual bug — see
   * `handleAskQuestionEntry`'s previous version) or any other state:
   * verification and "has questions left" are independent facts. Every
   * other check in this file (OTP gating, booking, the composer-lock
   * guard) reads this instead of `sessionToken` directly, so there's
   * exactly one definition of "verified" to keep correct.
   */
  const isVerified = Boolean(sessionToken);

  const modeForStep = (target: AssistantStep): AssistantMode => (BOOKING_STEPS.includes(target) ? "booking" : "menu");

  const handleVerified = (token: string, mobile: string) => {
    setSessionToken(token);
    dispatch({ type: "SET_LEAD_INFO", leadInfo: { mobile } });
    pushEntry({ kind: "choice", text: `${dict.phoneVerification.eyebrow} ✓` });
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) {
      action(token);
    } else {
      setMode(modeForStep(step));
    }
  };

  const handleVerificationCancel = () => {
    pendingActionRef.current = null;
    setMode(modeForStep(step));
  };

  const focusComposer = () => {
    setMode("conversation");
    requestAnimationFrame(() => composerInputRef.current?.focus());
  };

  const enterConversationMode = () => {
    if (!shownIntroRef.current) {
      shownIntroRef.current = true;
      pushEntry({ kind: "assistant", text: dict.aiConversation.verifiedIntro });
      pushEntry({ kind: "note", text: dict.aiConversation.safetyNotice });
    }
    setMode("conversation");
    requestAnimationFrame(() => composerInputRef.current?.focus());
  };

  /**
   * Round 2026-07-22 (item 5 — bug fix): used to require BOTH
   * `sessionToken` AND `questionsRemaining > 0` to skip the identify/OTP
   * step, which meant a genuinely verified patient who'd already used
   * all 3 questions was wrongly sent back to `mode="identify"` (asking
   * for name/mobile again) instead of just being shown their remaining
   * options while staying recognized. Now: verified is verified, full
   * stop — `enterConversationMode` always runs for a verified session,
   * and `renderLiveArea`'s composer-lock guard (item 3) is what decides
   * whether that shows the composer or the locked decision card.
   */
  const handleAskQuestionEntry = (fromStep?: AssistantStep) => {
    if (fromStep) setReturnStep(fromStep);
    if (isVerified) {
      enterConversationMode();
      return;
    }
    setMode("identify");
  };

  const handleIdentifySubmit = (values: { fullName: string; mobile: string }) => {
    dispatch({ type: "SET_LEAD_INFO", leadInfo: values });
    pushEntry({ kind: "choice", text: `${values.fullName} · ${values.mobile}` });
    // Round 2026-07-23 (Urgency & Safety Router) — an urgent call request
    // that needed identify+OTP first finalizes as THAT request, not a
    // normal AI-conversation entry.
    if (pendingUrgentContext) {
      const context = pendingUrgentContext;
      setPendingUrgentContext(null);
      runGated(() => finalizeUrgentCallRequest(context.serviceId, context.topicLabel), "assistant_access");
      return;
    }
    runGated(() => enterConversationMode(), "assistant_access");
  };

  const handleReturnToBooking = () => {
    if (!returnStep) return;
    pushEntry({ kind: "choice", text: dict.aiConversation.continueBookingCta });
    setMode("booking");
    setStep(returnStep);
    setReturnStep(null);
  };

  /** Round 2026-07-22 (item 4) — "لغو رزرو": abandons the interrupted booking rather than forcing a resume/change-service choice, per the exact 3-chip resume-card spec. Returns to the main menu; the partially-filled booking state is simply not resumed (a fresh "رزرو مشاوره" click starts clean from service selection), no separate reset action needed. */
  const handleCancelBooking = () => {
    pushEntry({ kind: "choice", text: dict.aiConversation.cancelBookingCta });
    setReturnStep(null);
    setMode("menu");
    setStep("general");
  };

  const nextQuestionChip = (): ChipAction =>
    isVerified && questionsRemaining > 0
      ? { label: dict.aiConversation.askAnotherCta, onClick: focusComposer }
      : { label: dict.ui.askQuestionCta, onClick: () => handleAskQuestionEntry() };

  const serviceAwareChips = (serviceId: ServiceId | null): ChipAction[] => {
    if (serviceId) {
      const short = dict.serviceShortLabels[serviceId] ?? dict.services.find((service) => service.id === serviceId)?.label ?? "";
      return [
        { label: dict.aiConversation.bookServiceTemplate.replace("{service}", short), onClick: () => handleServiceSelect(serviceId), emphasized: true },
        { label: dict.aiConversation.costEstimateCta, onClick: () => showCostGuidance(serviceId) },
        { label: dict.aiConversation.careForServiceTemplate.replace("{service}", short), onClick: () => routeToStep("care_guidance") },
        nextQuestionChip(),
      ];
    }
    return [
      { label: mainActionLabel("consultation_booking"), onClick: () => routeToStep("consultation_booking"), emphasized: true },
      { label: mainActionLabel("service_selection"), onClick: () => routeToStep("service_selection") },
      { label: dict.aiConversation.relatedCareCta, onClick: () => routeToStep("care_guidance") },
      nextQuestionChip(),
    ];
  };

  const showCostGuidance = (serviceId: ServiceId | null) => {
    if (serviceId) setLastServiceId(serviceId);
    const text = (serviceId && dict.costGuidance.byService[serviceId]) || dict.costGuidance.generic;
    pushEntry({ kind: "assistant", text, chips: serviceAwareChips(serviceId) });
  };

  /**
   * Round 2026-07-20 (production UX fix, item 3) — chips for a
   * SERVICE-GUIDANCE answer ("ایمپلنت برای من مناسبه؟"), distinct from
   * `serviceAwareChips` (used for cost/care answers): offers the two
   * imaging-status replies the guidance text's own clarifying questions
   * ask for, instead of a generic cost-estimate chip that doesn't fit
   * the question just asked.
   *
   * Round 2026-07-21 (V2, item 4) — `orthognathic-surgery` gets its own
   * CONCERN-specific chip set instead (his exact given jaw-surgery
   * example: "جلو یا عقب بودن فک" / "انحراف فک" / etc., each with a real
   * reply) — a generic "do you have an X-ray" chip doesn't fit a jaw
   * question the way it fits an implant question.
   *
   * Round 2026-07-22 (V2.2, item 5/6 — state-machine fix): the concern
   * question (`jawConcernChipsList`) is offered ONLY while `jawStage ===
   * "intro"`. Once a concern has been picked, ANY later call here for
   * orthognathic-surgery (a fresh AI answer that re-matched the service
   * from free text, a stale chip, whatever) falls through to
   * `jawImagingChips` instead — idempotently re-offering the imaging
   * question/booking options rather than ever re-asking "what's your
   * main concern?" a second time.
   */
  const implantAwareChips = (serviceId: ServiceId): ChipAction[] => {
    if (serviceId === "orthognathic-surgery") return jawStage === "intro" ? jawConcernChipsList() : jawImagingChips();
    const short = dict.serviceShortLabels[serviceId] ?? dict.services.find((service) => service.id === serviceId)?.label ?? "";
    return [
      { label: dict.aiConversation.bookServiceTemplate.replace("{service}", short), onClick: () => handleServiceSelect(serviceId), emphasized: true },
      { label: dict.aiConversation.hasXrayCta, onClick: () => acknowledgeXrayAnswer(true, serviceId) },
      { label: dict.aiConversation.noXrayCta, onClick: () => acknowledgeXrayAnswer(false, serviceId) },
      { label: dict.aiConversation.careForServiceTemplate.replace("{service}", short), onClick: () => routeToStep("care_guidance") },
      nextQuestionChip(),
    ];
  };

  /**
   * Round 2026-07-21 (V2, item 7) — the follow-up chips after an
   * imaging-status reply: exactly رزرو مشاوره / سؤال درباره آماده‌سازی /
   * مراقبت‌های مرتبط, never a dead end. "سؤال درباره آماده‌سازی" opens
   * the composer, same mechanism as "سؤال بعدی" but topic-labeled to
   * match what was just discussed.
   */
  const xrayFollowUpChips = (serviceId: ServiceId): ChipAction[] => {
    const short = dict.serviceShortLabels[serviceId] ?? dict.services.find((service) => service.id === serviceId)?.label ?? "";
    return [
      { label: dict.aiConversation.bookServiceTemplate.replace("{service}", short), onClick: () => handleServiceSelect(serviceId), emphasized: true },
      { label: dict.aiConversation.preparationQuestionCta, onClick: focusComposer },
      { label: dict.aiConversation.careForServiceTemplate.replace("{service}", short), onClick: () => routeToStep("care_guidance") },
    ];
  };

  /**
   * Deterministic, free (no server call, no question consumed) — a chip
   * click acknowledging whether the patient already has imaging, then
   * ALWAYS gives a concrete next step (item 7 — never a dead end like
   * "bring it to the clinic" and stop).
   */
  const acknowledgeXrayAnswer = (hasXray: boolean, serviceId: ServiceId) => {
    pushEntry({ kind: "choice", text: hasXray ? dict.aiConversation.hasXrayCta : dict.aiConversation.noXrayCta });
    pushEntry({
      kind: "assistant",
      text: hasXray ? dict.aiConversation.hasXrayReply : dict.aiConversation.noXrayReply,
      chips: xrayFollowUpChips(serviceId),
    });
    // Round 2026-07-22 (V2.2, item 6) — jaw_imaging_question → jaw_booking_offer.
    if (serviceId === "orthognathic-surgery") setJawStage("booking_offer");
  };

  /** Round 2026-07-21 (V2, item 4) — the 4 jaw-surgery concern chips + a direct booking chip. Only ever shown while `jawStage === "intro"` — see `implantAwareChips`. */
  const jawConcernChipsList = (): ChipAction[] => {
    const short = dict.serviceShortLabels["orthognathic-surgery"] ?? "";
    return [
      { label: dict.jawConcernChips.frontBack.label, onClick: () => handleJawConcern("frontBack") },
      { label: dict.jawConcernChips.deviation.label, onClick: () => handleJawConcern("deviation") },
      { label: dict.jawConcernChips.bite.label, onClick: () => handleJawConcern("bite") },
      { label: dict.jawConcernChips.aesthetics.label, onClick: () => handleJawConcern("aesthetics") },
      { label: dict.aiConversation.bookServiceTemplate.replace("{service}", short), onClick: () => handleServiceSelect("orthognathic-surgery"), emphasized: true },
    ];
  };

  /**
   * Round 2026-07-22 (V2.2, item 5/6) — the jaw_imaging_question stage's
   * chip set: exactly دارم عکس/CBCT, ندارم عکس, رزرو مشاوره جراحی فک,
   * سؤال درباره دوران نقاهت. Reuses the existing generic
   * `acknowledgeXrayAnswer`/`xrayFollowUpChips` mechanism for the imaging
   * answer (no need for a jaw-specific duplicate) — only the entry chips
   * offered right after a concern is picked are jaw-specific. Also the
   * fallback `implantAwareChips` returns once `jawStage` has moved past
   * "intro", so a stray re-match never re-asks the concern question.
   */
  const jawImagingChips = (): ChipAction[] => {
    const short = dict.serviceShortLabels["orthognathic-surgery"] ?? "";
    return [
      { label: dict.aiConversation.hasXrayCta, onClick: () => acknowledgeXrayAnswer(true, "orthognathic-surgery") },
      { label: dict.aiConversation.noXrayCta, onClick: () => acknowledgeXrayAnswer(false, "orthognathic-surgery") },
      { label: dict.aiConversation.bookServiceTemplate.replace("{service}", short), onClick: () => handleServiceSelect("orthognathic-surgery"), emphasized: true },
      { label: dict.aiConversation.recoveryQuestionCta, onClick: focusComposer },
    ];
  };

  /**
   * Round 2026-07-22 (V2.2, item 5/6 — the actual fix): a real,
   * concern-specific explanation ENDING in the imaging/CBCT question
   * (his exact given text for `frontBack`), with `jawImagingChips` —
   * never the old book/care/ask-again set, which had no forward
   * momentum and (combined with the old unconditional `jawConcernChipsList`
   * in `implantAwareChips`) is what let the concern question resurface.
   * Advances `jawStage` to "imaging_question" and records `activeConcern`
   * for the compact context summary (item 7) — both are what make the
   * "don't ask again" guard above actually hold.
   */
  const handleJawConcern = (key: "frontBack" | "deviation" | "bite" | "aesthetics") => {
    const concern = dict.jawConcernChips[key];
    pushEntry({ kind: "choice", text: concern.label });
    setLastServiceId("orthognathic-surgery");
    setActiveConcern(concern.contextLabel);
    setJawStage("imaging_question");
    pushEntry({
      kind: "assistant",
      text: concern.reply,
      chips: jawImagingChips(),
    });
  };

  /**
   * Round 2026-07-20 (production UX fix, item 3/6) — the real,
   * non-diagnostic "what does this involve" answer for a plain service
   * question, used both for a normal question AND for the dissatisfaction/
   * correction path (item 4) — same content either way.
   */
  const showServiceGuidance = (serviceId: ServiceId) => {
    const text = dict.serviceGuidance.byService[serviceId] || dict.costGuidance.byService[serviceId] || dict.costGuidance.generic;
    pushEntry({ kind: "assistant", text, chips: implantAwareChips(serviceId) });
  };

  const isDissatisfactionPhrase = (text: string): boolean => DISSATISFACTION_KEYWORDS[locale].some((keyword) => text.includes(keyword));
  const isHumanRequestPhrase = (text: string): boolean => HUMAN_REQUEST_KEYWORDS[locale].some((keyword) => text.includes(keyword));

  /**
   * Round 2026-07-21 (Smart Clinic Assistant V2, item 13 — "human
   * handoff ready"): NOT a full handoff/ticketing system — shows the
   * exact required public notice + a direct booking offer (booking is
   * the one concrete action that actually gets a human clinic team
   * member involved in this codebase today), and best-effort logs WHY
   * as a `role: "system"` message via `logHandoffEvent` (reuses the
   * existing `AssistantMessage` log, no new table/migration). `reason`
   * is a short staff-facing phrase, never raw patient text. `triggeringMessage`
   * is passed only when the patient's own message that caused this
   * hasn't already been logged through the normal `askAssistantQuestion`
   * path (the human-request and dissatisfaction triggers both short-
   * circuit BEFORE that call, so they'd otherwise never reach the DB —
   * see `log-handoff.ts`'s doc-comment).
   */
  const triggerHandoff = (reason: string, triggeringMessage?: string) => {
    const short = lastServiceId ? (dict.serviceShortLabels[lastServiceId] ?? "") : "";
    pushEntry({
      kind: "assistant",
      text: dict.aiConversation.handoffNotice,
      chips: lastServiceId
        ? [{ label: dict.aiConversation.bookServiceTemplate.replace("{service}", short), onClick: () => handleServiceSelect(lastServiceId), emphasized: true }]
        : [{ label: mainActionLabel("consultation_booking"), onClick: () => routeToStep("consultation_booking"), emphasized: true }],
    });
    // Round 2026-07-22 (item 3/4) — a handoff notice is itself a terminal
    // decision point (its one chip IS the next action); never leave the
    // free-text composer open underneath it.
    setMode("decision");
    void logHandoffEvent(sessionToken, reason, locale, triggeringMessage);
  };

  const fallbackChips = (): ChipAction[] => [
    { label: dict.aiConversation.fallbackChips.cost, onClick: () => routeToStep("cost_question") },
    { label: dict.aiConversation.fallbackChips.service, onClick: () => routeToStep("service_selection") },
    { label: dict.aiConversation.fallbackChips.care, onClick: () => routeToStep("care_guidance") },
    { label: dict.aiConversation.fallbackChips.booking, onClick: () => routeToStep("consultation_booking") },
  ];

  /**
   * Round 2026-07-23 (Urgency & Safety Router) — priority-1 check, run
   * BEFORE `isHumanRequestPhrase`/`isDissatisfactionPhrase` and well
   * before any server call, so a genuinely urgent message can never reach
   * `local-intent-matcher.ts`'s plain service-keyword matching (the root
   * cause: "بینی" alone routed straight to generic rhinoplasty guidance).
   * True on either a generic urgency word OR a trauma-topic combination
   * (`detectTraumaTopic`) matching on its OWN — "بینیم شکسته" with no
   * "فوری" anywhere is still urgent.
   */
  const isUrgencyPhrase = (text: string): boolean => {
    const normalized = text.trim().toLowerCase();
    if (!normalized) return false;
    if (URGENCY_KEYWORDS[locale].some((keyword) => normalized.includes(keyword.toLowerCase()))) return true;
    return detectTraumaTopic(normalized, locale) !== null;
  };

  /**
   * Round 2026-07-23 — exactly his given 5-chip set for the rhinoplasty
   * case (call / book review / <48h / >48h / breathing issue), generalized
   * for any other detected/contextual service: "مشکل تنفس دارم" only
   * makes sense for the nose, so it's rhinoplasty-only; every other chip
   * applies regardless of which service (or none) was detected. Never a
   * dead end — every chip either logs the urgent request, jumps straight
   * to contact capture, or leads to another concrete urgent-flow reply.
   */
  const urgentChips = (serviceId: ServiceId | null, topicLabel: string): ChipAction[] => {
    const chips: ChipAction[] = [{ label: dict.aiConversation.urgent.callCta, onClick: () => handleUrgentCallRequest(serviceId, topicLabel), emphasized: true }];
    if (serviceId) {
      const short = dict.serviceShortLabels[serviceId] ?? dict.services.find((service) => service.id === serviceId)?.label ?? "";
      chips.push({ label: dict.aiConversation.urgent.bookReviewTemplate.replace("{service}", short), onClick: () => handleUrgentBookingReview(serviceId) });
    } else {
      chips.push({ label: dict.aiConversation.urgent.bookReviewGeneric, onClick: () => handleUrgentBookingReview(null) });
    }
    chips.push({ label: dict.aiConversation.urgent.within48hCta, onClick: () => acknowledgeUrgentTiming(true, serviceId, topicLabel) });
    chips.push({ label: dict.aiConversation.urgent.moreThanFewDaysCta, onClick: () => acknowledgeUrgentTiming(false, serviceId, topicLabel) });
    if (serviceId === "rhinoplasty") {
      chips.push({ label: dict.aiConversation.urgent.breathingIssueCta, onClick: () => handleUrgentBreathingIssue(serviceId, topicLabel) });
    }
    return chips;
  };

  /**
   * Round 2026-07-23 — runs once verification is confirmed (either
   * already verified, or just completed via `handleIdentifySubmit`'s
   * `pendingUrgentContext` branch). Deliberately does NOT push the
   * generic `handoffNotice`/`triggerHandoff` content — the urgent
   * response already said what's needed; this just confirms the request
   * was logged, per the exact required line.
   */
  const finalizeUrgentCallRequest = (serviceId: ServiceId | null, topicLabel: string) => {
    if (serviceId) dispatch({ type: "SET_SERVICE", serviceId });
    pushEntry({ kind: "assistant", text: dict.aiConversation.urgent.callRequestConfirmed });
    void logHandoffEvent(sessionToken, `درخواست تماس فوری کلینیک — ${topicLabel}`, locale);
    setMode("decision");
  };

  /**
   * Round 2026-07-23 — "درخواست تماس فوری کلینیک": if already verified,
   * logs and confirms immediately (no re-verification, per the standing
   * "never ask OTP again" rule — `runGated`/`isVerified` unchanged). If
   * not, routes to the lightweight identify/OTP contact-capture form
   * (not the full multi-field `ContactCaptureStep` — urgency shouldn't
   * mean more friction) and finalizes once that completes.
   */
  const handleUrgentCallRequest = (serviceId: ServiceId | null, topicLabel: string) => {
    if (isVerified) {
      finalizeUrgentCallRequest(serviceId, topicLabel);
      return;
    }
    setPendingUrgentContext({ serviceId, topicLabel });
    setMode("identify");
  };

  /** Round 2026-07-23 — "رزرو بررسی {service}": jumps STRAIGHT to contact capture, skipping triage/appointment-slot picking entirely — an urgent patient needs the clinic to call them, not a normal multi-step booking wizard. Falls back to `general_consultation` when no specific service was detected. */
  const handleUrgentBookingReview = (serviceId: ServiceId | null) => {
    const targetService = serviceId ?? "general_consultation";
    dispatch({ type: "SET_SERVICE", serviceId: targetService });
    setLastServiceId(targetService);
    const label = dict.services.find((service) => service.id === targetService)?.label ?? targetService;
    pushEntry({ kind: "choice", text: `✓ ${dict.aiConversation.serviceSelectedPrefix}${label}` });
    setMode("booking");
    setStep("contact_capture");
  };

  /** Deterministic, free — acknowledges timing, then re-offers the same urgent actions (never a dead end), with a tone-appropriate reply either way. */
  const acknowledgeUrgentTiming = (recentTrauma: boolean, serviceId: ServiceId | null, topicLabel: string) => {
    pushEntry({ kind: "choice", text: recentTrauma ? dict.aiConversation.urgent.within48hCta : dict.aiConversation.urgent.moreThanFewDaysCta });
    pushEntry({
      kind: "assistant",
      text: recentTrauma ? dict.aiConversation.urgent.recentTraumaReply : dict.aiConversation.urgent.olderTraumaReply,
      chips: urgentChips(serviceId, topicLabel),
    });
  };

  /** Deterministic, free — breathing difficulty is one of the safety-check symptoms named in the urgent response itself; reinforces contacting the clinic/emergency care without declaring a diagnosis. */
  const handleUrgentBreathingIssue = (serviceId: ServiceId | null, topicLabel: string) => {
    pushEntry({ kind: "choice", text: dict.aiConversation.urgent.breathingIssueCta });
    pushEntry({ kind: "assistant", text: dict.aiConversation.urgent.breathingIssueReply, chips: urgentChips(serviceId, topicLabel) });
  };

  /**
   * Round 2026-07-22 (item 8) — exact required 4-chip set for the "3
   * questions answered" notice. No `returnStep`/"continue booking" chip
   * here on purpose: when the limit lands WHILE mid-booking, the resume
   * card (`resumeChips`, item 4) is shown instead — see the call sites in
   * `handleAskFreeText` — so this set only ever appears when the patient
   * wasn't mid-booking to begin with.
   */
  const limitReachedChips = (): ChipAction[] => [
    { label: mainActionLabel("consultation_booking"), onClick: () => routeToStep("consultation_booking"), emphasized: true },
    { label: mainActionLabel("service_selection"), onClick: () => routeToStep("service_selection") },
    { label: dict.aiConversation.requestCallCta, onClick: () => triggerHandoff("درخواست تماس از کلینیک پس از پایان سؤالات") },
    { label: dict.ui.closeCta, onClick: close },
  ];

  /**
   * Round 2026-07-22 (item 4) — exact required 3-chip set: "ادامه رزرو"
   * always, "سؤال دیگر" ONLY if verified with questions left (asking
   * again is genuinely still possible), "لغو رزرو" always. `تغییر خدمت`/
   * `بستن` (the old 4th/2nd chips) are dropped — not part of the spec for
   * this specific card, and both are still reachable via the booking
   * card itself once resumed.
   */
  const resumeChips = (): ChipAction[] => {
    const chips: ChipAction[] = [{ label: dict.aiConversation.continueBookingCta, onClick: handleReturnToBooking, emphasized: true }];
    if (isVerified && questionsRemaining > 0) chips.push({ label: dict.aiConversation.askAnotherCta, onClick: focusComposer });
    chips.push({ label: dict.aiConversation.cancelBookingCta, onClick: handleCancelBooking });
    return chips;
  };

  const answerChips = (suggestedStep: AssistantStep | null, suggestedServiceId: ServiceId | null): ChipAction[] => {
    // A "triage"/"contact_capture" suggestion with a known service is the
    // service-GUIDANCE case (item 3) — its own imaging-aware chip set,
    // not the cost/care-flavored `serviceAwareChips`.
    if (suggestedServiceId && (suggestedStep === "triage" || suggestedStep === "contact_capture")) {
      return implantAwareChips(suggestedServiceId);
    }
    if (suggestedServiceId) return serviceAwareChips(suggestedServiceId);
    if (suggestedStep === "cost_question" || suggestedStep === "care_guidance") return serviceAwareChips(null);
    const chips: ChipAction[] = [];
    if (suggestedStep) chips.push({ label: dict.aiConversation.viewSuggestedStepCta, onClick: () => routeToStep(suggestedStep), emphasized: true });
    chips.push({ label: mainActionLabel("consultation_booking"), onClick: () => routeToStep("consultation_booking") });
    chips.push({ label: mainActionLabel("service_selection"), onClick: () => routeToStep("service_selection") });
    chips.push(nextQuestionChip());
    return chips;
  };

  /** Central router for every non-service-specific intent/step — the main menu, an AI-suggested step, or a chip. Service-specific navigation goes through `handleServiceSelect` instead, which also decides triage vs. straight-to-availability. */
  const routeToStep = (target: AssistantStep) => {
    if (BOOKING_STEPS.includes(target)) {
      setMode("booking");
      setStep(target);
      return;
    }
    switch (target) {
      case "cost_question":
        showCostGuidance(state.leadInfo.selectedService);
        return;
      case "care_guidance":
        pushEntry({
          kind: "assistant",
          text: dict.steps.careGuidance.body,
          chips: [
            {
              label: dict.steps.careGuidance.cta,
              onClick: () => {
                close();
                router.push(`/${locale}/care-instructions`);
              },
              emphasized: true,
            },
            nextQuestionChip(),
          ],
        });
        return;
      case "before_after":
        pushEntry({
          kind: "assistant",
          text: dict.steps.beforeAfter.body,
          chips: [{ label: dict.steps.beforeAfter.cta, onClick: () => { close(); scrollToSection("before-after"); }, emphasized: true }, nextQuestionChip()],
        });
        return;
      case "articles":
        pushEntry({
          kind: "assistant",
          text: dict.steps.articles.body,
          chips: [{ label: dict.steps.articles.cta, onClick: () => { close(); scrollToSection("knowledge-center"); }, emphasized: true }, nextQuestionChip()],
        });
        return;
      case "consultation_booking":
        pushEntry({
          kind: "assistant",
          text: dict.steps.consultationBooking.intro,
          chips: [{ label: dict.ui.chooseServiceCta, onClick: () => routeToStep("service_selection"), emphasized: true }],
        });
        return;
      case "image_upload_future":
        pushEntry({
          kind: "assistant",
          text: dict.steps.imageUploadFuture.notice,
          chips: [{ label: dict.ui.chooseServiceCta, onClick: () => routeToStep("service_selection"), emphasized: true }],
        });
        return;
      case "confirmation":
        setMode("confirmation");
        setStep("confirmation");
        return;
      default:
        setMode("menu");
        setStep("general");
    }
  };

  const mainMenuChips = (): ChipAction[] => [
    ...dict.mainActions.map((action, index) => ({ label: action.label, onClick: () => handleMainAction(action.id), emphasized: index === 0 })),
    { label: dict.ui.askQuestionCta, onClick: () => handleAskQuestionEntry() },
  ];

  const handleMainAction = (actionId: string) => {
    pushEntry({ kind: "choice", text: mainActionLabel(actionId) });
    routeToStep(ACTION_STEP_MAP[actionId] ?? "general");
  };

  const seedConversation = (startIntent: AssistantIntent) => {
    setEntries([]);
    entryIdRef.current = 0;
    setReturnStep(null);
    setJawStage("intro");
    setActiveConcern(null);
    if (startIntent === "general") {
      setMode("menu");
      setStep("general");
      pushEntry({ kind: "assistant", text: dict.openingMessage, chips: mainMenuChips() });
      return;
    }
    routeToStep(startIntent);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (seededForRef.current === intent && entries.length > 0) return;
    seededForRef.current = intent;
    seedConversation(intent);
    // Deliberately narrow deps — only re-seeds on a genuinely new external
    // intent while open, never on the drawer's own internal navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, intent]);

  const handleServiceSelect = (serviceId: ServiceId) => {
    dispatch({ type: "SET_SERVICE", serviceId });
    setLastServiceId(serviceId);
    // Round 2026-07-22 (V2.2, item 6) — entering the real booking flow for
    // jaw surgery is the "jaw_booking_flow" stage; picking a DIFFERENT
    // service clears the jaw concern context entirely (starting fresh if
    // the patient ever returns to orthognathic-surgery later).
    if (serviceId === "orthognathic-surgery") {
      setJawStage("booking_flow");
    } else if (jawStage !== "intro") {
      setJawStage("intro");
      setActiveConcern(null);
    }
    const label = dict.services.find((service) => service.id === serviceId)?.label ?? serviceId;
    pushEntry({ kind: "choice", text: `✓ ${dict.aiConversation.serviceSelectedPrefix}${label}` });
    setMode("booking");
    setStep(serviceId === "general_consultation" ? "appointment_selection" : "triage");
  };

  const handleTriageComplete = (answers: TriageAnswer[]) => {
    dispatch({ type: "SET_TRIAGE_ANSWERS", answers });
    dispatch({ type: "COMPLETE_TRIAGE" });
    pushEntry({ kind: "choice", text: `${dict.ui.triageEyebrow} ✓` });
    setStep("appointment_selection");
  };

  const handleAppointmentSubmit = (result: AppointmentSelectionResult) => {
    dispatch({
      type: "SET_APPOINTMENT_PREFERENCE",
      preferredDay: result.preferredDay,
      preferredTimeRange: result.preferredTimeRange,
      selectedSlotId: result.selectedSlotId,
      appointmentDate: result.appointmentDate,
      displayLabel: result.displayLabel,
    });
    // Round 2026-07-20 (item 7) — the already-formatted (Jalali for fa)
    // label, not the raw ISO `preferredDay`/`preferredTimeRange`.
    pushEntry({ kind: "choice", text: `✓ ${dict.aiConversation.timeSelectedPrefix}${result.displayLabel}` });
    setStep("contact_capture");
  };

  const handleContactSubmit = (leadInfo: LeadInfo) => {
    dispatch({ type: "SET_LEAD_INFO", leadInfo });
    pushEntry({ kind: "choice", text: `${leadInfo.fullName} · ${leadInfo.mobile}` });
    setStep("payment_preparation");
  };

  const handleFinalSubmit = () => {
    const serviceId = state.leadInfo.selectedService;
    if (!serviceId) return;
    runGated((token) => {
      void (async () => {
        setIsSubmittingBooking(true);
        setSubmitError(null);
        const result = await submitBookingRequest({
          leadInfo: state.leadInfo,
          serviceId,
          slotId: state.appointment.selectedSlotId,
          appointmentDate: state.appointment.appointmentDate,
          preferredDay: state.appointment.preferredDay,
          preferredTimeRange: state.appointment.preferredTimeRange,
          triageAnswers: state.triageAnswers,
          payment: { currency: state.payment.currency, paymentType: state.payment.paymentType, amount: state.payment.amount },
          source,
          locale,
          sessionToken: token,
        });
        setIsSubmittingBooking(false);
        if (result.ok) {
          dispatch({ type: "SUBMITTED", requestId: result.leadId ?? result.request.requestedAt });
          setMode("confirmation");
          setStep("confirmation");
        } else {
          setSubmitError(result.error);
        }
      })();
    }, "booking_request");
  };

  const handleAskFreeText = () => {
    const trimmed = composerMessage.trim();
    if (!trimmed || isAsking) return;
    const contextServiceId = state.leadInfo.selectedService ?? lastServiceId;
    // Round 2026-07-22 (item 7) — a service-topic recap label, captured
    // at ask-time, is what the transcript collapse shows once this turn
    // is no longer active ("✓ سؤال درباره جراحی فک") instead of a raw,
    // possibly long/casual truncation of what the patient actually typed.
    const recapLabel = contextServiceId
      ? dict.aiConversation.questionRecapTemplate.replace("{service}", dict.serviceShortLabels[contextServiceId] ?? "")
      : undefined;
    pushEntry({ kind: "user", text: trimmed, recapLabel });
    setComposerMessage("");

    // Round 2026-07-23 (Urgency & Safety Router, per Hamid — critical
    // response-quality fix): PRIORITY 1, checked before absolutely
    // everything else, including the human-request/dissatisfaction
    // checks below and the server call (so it can never reach
    // `local-intent-matcher.ts`'s plain service-keyword matching — the
    // actual root cause of "بینیم شکسته... فوری" getting a generic
    // rhinoplasty explanation). Deterministic, free, no question consumed.
    // `detectTraumaTopic` runs on the SAME message to pick which
    // service/topic the response names; the exact static text is used
    // only when THIS message itself named a nose fracture/impact — a
    // remembered `contextServiceId` of "rhinoplasty" from earlier in the
    // conversation is not enough to justify the nose-specific wording.
    if (isUrgencyPhrase(trimmed)) {
      const trauma = detectTraumaTopic(trimmed.trim().toLowerCase(), locale);
      const urgentServiceId = trauma?.serviceId ?? contextServiceId;
      const topicLabel = trauma?.topicLabel ?? dict.aiConversation.urgent.genericTopicLabel;
      if (urgentServiceId) setLastServiceId(urgentServiceId);
      const responseText =
        trauma?.serviceId === "rhinoplasty" ? dict.aiConversation.urgent.noseTraumaResponse : dict.aiConversation.urgent.genericResponseTemplate.replace("{topic}", topicLabel);
      pushEntry({ kind: "assistant", text: responseText, chips: urgentChips(urgentServiceId, topicLabel) });
      // Best-effort — silently no-ops if not yet verified (same limitation
      // every handoff log in this file already has, see `triggerHandoff`);
      // logged again in `finalizeUrgentCallRequest` once a session exists.
      void logHandoffEvent(sessionToken, `درخواست فوری شناسایی شد — ${topicLabel}`, locale, trimmed);
      setMode("decision");
      return;
    }

    // Round 2026-07-21 (V2, item 13) — an explicit request for a human
    // is answered immediately, client-side, no question consumed —
    // checked BEFORE dissatisfaction/AI, since it's the clearest,
    // lowest-false-positive of the three handoff triggers.
    if (isHumanRequestPhrase(trimmed)) {
      triggerHandoff("درخواست صریح کاربر برای صحبت با انسان", trimmed);
      return;
    }

    // Round 2026-07-20 (production UX fix, item 4 — "when the user says
    // the answer was not helpful, the assistant does not correct
    // itself"): a recognized dissatisfaction phrase, WITH a remembered
    // topic to retry, is answered entirely client-side — deterministic,
    // free, no server round-trip, so it can never consume one of the
    // patient's 3 questions (matches item 4's explicit "do not consume
    // another question" requirement) — see `showServiceGuidance`. Round
    // 2026-07-21 (V2, item 13) — a SECOND dissatisfaction in a row also
    // offers a human handoff (repeated dissatisfaction is one of the
    // explicit trigger conditions), appended after the correction.
    if (isDissatisfactionPhrase(trimmed) && contextServiceId) {
      const repeatCount = consecutiveDissatisfaction + 1;
      setConsecutiveDissatisfaction(repeatCount);
      setConsecutiveUnclear(0);
      setIsAsking(true);
      setTimeout(() => {
        setIsAsking(false);
        pushEntry({ kind: "assistant", text: dict.aiConversation.correctionAcknowledgement });
        showServiceGuidance(contextServiceId);
        if (repeatCount >= 2) triggerHandoff("نارضایتی مکرر از پاسخ‌های دستیار", trimmed);
      }, 400);
      return;
    }

    setIsAsking(true);
    void (async () => {
      const result = await askAssistantQuestion({
        sessionToken,
        message: trimmed,
        locale,
        currentStep: mode === "booking" ? step : "conversation",
        fullName: state.leadInfo.fullName || null,
        serviceSlug: contextServiceId,
      });
      setIsAsking(false);

      if (result.type === "unavailable") {
        // Nothing was persisted server-side for this turn — drop the
        // optimistic user bubble too, so the transcript never shows a
        // question with no answer under it.
        setEntries((prev) => prev.slice(0, -1));
        pushEntry({ kind: "note", text: dict.ui.freeTextUnavailableMessage });
        return;
      }
      if (result.type === "not_verified" || result.type === "limit_reached") {
        setQuestionsRemaining(0);
        // Round 2026-07-22 (item 3 vs item 4 reconciliation) — a
        // mid-booking side question that lands on an already-exhausted
        // session still owes the patient a way back into their booking;
        // the resume card (with no "ask another" chip, since there are
        // none left) takes priority over the generic limit card, which
        // only applies when the patient wasn't mid-booking.
        if (returnStep) {
          pushEntry({ kind: "assistant", text: dict.aiConversation.resumeBookingPrompt, chips: resumeChips() });
        } else {
          pushEntry({ kind: "assistant", text: dict.aiConversation.limitReachedNotice, chips: limitReachedChips() });
        }
        setMode("decision");
        return;
      }
      if (result.type === "unclear") {
        // Round 2026-07-21 (V2, item 13) — a SECOND "the assistant
        // couldn't tell what was meant" in a row is treated as "AI
        // cannot answer safely" and offers a human handoff too.
        const repeatCount = consecutiveUnclear + 1;
        setConsecutiveUnclear(repeatCount);
        setConsecutiveDissatisfaction(0);
        pushEntry({ kind: "assistant", text: dict.aiConversation.fallbackPrompt, chips: returnStep ? undefined : fallbackChips() });
        setQuestionsRemaining(result.questionsRemaining);
        if (returnStep) {
          // Round 2026-07-22 (item 4 — bug fix): used to leave `mode`
          // untouched here, so the free-text composer stayed open right
          // alongside this resume prompt. Closing it is the whole point
          // of the resume card — the patient must choose resume/ask-
          // again/cancel, not keep typing past it.
          pushEntry({ kind: "assistant", text: dict.aiConversation.resumeBookingPrompt, chips: resumeChips() });
          setMode("decision");
        } else if (repeatCount >= 2) {
          triggerHandoff("عدم تشخیص مکرر منظور کاربر توسط دستیار");
        } else if (result.questionsRemaining <= 0) {
          // Round 2026-07-22 (item 8) — the 3rd question itself can land
          // as "unclear"; that still counts as the limit being reached.
          pushEntry({ kind: "assistant", text: dict.aiConversation.limitReachedNotice, chips: limitReachedChips() });
          setMode("decision");
        } else {
          pushEntry({ kind: "note", text: dict.aiConversation.questionsRemainingLabels[String(result.questionsRemaining) as "1" | "2" | "3"] });
        }
        return;
      }
      // "answer" — a real answer landed, so the repeated-failure streaks reset.
      setConsecutiveDissatisfaction(0);
      setConsecutiveUnclear(0);
      if (result.suggestedServiceId) setLastServiceId(result.suggestedServiceId);
      pushEntry({ kind: "assistant", text: result.answer, chips: returnStep ? undefined : answerChips(result.suggestedStep, result.suggestedServiceId) });
      setQuestionsRemaining(result.questionsRemaining);
      if (returnStep) {
        pushEntry({ kind: "assistant", text: dict.aiConversation.resumeBookingPrompt, chips: resumeChips() });
        setMode("decision");
      } else if (result.questionsRemaining <= 0) {
        // Round 2026-07-22 (item 8) — the 3rd successful answer itself
        // is where the limit is actually reached (`askAssistantQuestion`
        // only returns the separate "limit_reached" type on a 4th
        // ATTEMPT) — show the exact required notice right here, not just
        // on the next (blocked) attempt.
        pushEntry({ kind: "assistant", text: dict.aiConversation.limitReachedNotice, chips: limitReachedChips() });
        setMode("decision");
      } else {
        pushEntry({ kind: "note", text: dict.aiConversation.questionsRemainingLabels[String(result.questionsRemaining) as "1" | "2" | "3"] });
      }
    })();
  };

  const handleBackToMenu = () => {
    setMode("menu");
    setStep("general");
    setReturnStep(null);
  };

  const renderBookingCard = () => {
    switch (step) {
      case "service_selection":
        return <ServiceSelectionStep dict={dict} onSelect={handleServiceSelect} />;
      case "triage":
        return state.leadInfo.selectedService ? (
          <TriageStep dict={dict} serviceId={state.leadInfo.selectedService} onComplete={handleTriageComplete} />
        ) : (
          <ServiceSelectionStep dict={dict} onSelect={handleServiceSelect} />
        );
      case "appointment_selection":
        return <AppointmentSelectionStep dict={dict} locale={locale} onSubmit={handleAppointmentSubmit} />;
      case "contact_capture":
        return <ContactCaptureStep dict={dict} leadInfo={state.leadInfo} onSubmit={handleContactSubmit} />;
      case "payment_preparation":
        return (
          <>
            <PaymentPreparationStep
              dict={dict}
              payment={state.payment}
              onCurrencyChange={(currency: PaymentCurrency) => dispatch({ type: "SET_PAYMENT", payment: { currency } })}
              onSubmit={handleFinalSubmit}
              isSubmitting={isSubmittingBooking}
            />
            {submitError ? <p className="mt-3 text-xs text-red-600">{submitError}</p> : null}
          </>
        );
      default:
        return <ServiceSelectionStep dict={dict} onSelect={handleServiceSelect} />;
    }
  };

  /**
   * Round 2026-07-22 (item 3) — the persistent decision card that
   * REPLACES the composer once a verified session's questions are used
   * up. Distinct from `limitReachedChips`/`resumeChips` (one-time
   * transcript entries pushed the moment a specific answer lands): this
   * is a defense-in-depth render guard inside `renderLiveArea` itself,
   * so ANY path that lands in `mode === "conversation"` with no
   * questions left (a stale chip, `ConfirmationStep`'s "ask another",
   * re-clicking "پرسیدن سؤال") shows this instead of a composer the
   * server would just reject anyway.
   */
  const composerLockedChips = (): ChipAction[] => [
    { label: mainActionLabel("consultation_booking"), onClick: () => routeToStep("consultation_booking"), emphasized: true },
    { label: mainActionLabel("service_selection"), onClick: () => routeToStep("service_selection") },
    { label: dict.aiConversation.composerLocked.careCta, onClick: () => routeToStep("care_guidance") },
    { label: dict.aiConversation.requestCallCta, onClick: () => triggerHandoff("درخواست تماس از کلینیک") },
  ];

  /**
   * Round 2026-07-22 (V2.2, item 1) — pulled out of `renderLiveArea` so
   * it can render in a genuinely FIXED bottom bar outside the scrolling
   * stage (per the brief's "fixed bottom composer/CTA area"), instead of
   * being just the last thing inside the scrollable content.
   */
  const renderComposerBar = () => (
    <div className="flex items-center gap-2">
      <input
        ref={composerInputRef}
        type="text"
        value={composerMessage}
        onChange={(event) => setComposerMessage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleAskFreeText();
          }
        }}
        placeholder={dict.ui.freeTextPlaceholder}
        disabled={isAsking}
        className="w-full flex-1 rounded-xl border border-charcoal/15 bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
      />
      <button
        type="button"
        onClick={handleAskFreeText}
        disabled={isAsking || !composerMessage.trim()}
        className="shrink-0 rounded-full bg-gradient-to-b from-gold to-gold-hover px-4 py-2.5 text-sm font-semibold text-deep-navy transition-[filter] duration-200 hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
      >
        {isAsking ? dict.ui.freeTextThinkingLabel : dict.ui.freeTextSubmitCta}
      </button>
    </div>
  );

  const renderLiveArea = () => {
    if (mode === "conversation") {
      // Round 2026-07-22 (V2.2, item 3) — the composer itself now renders
      // in the fixed footer (`isComposerActive`, see the JSX below); this
      // branch only ever needs to handle the LOCKED case, which stays a
      // normal stage card (short, chip-driven, not a text input).
      if (isVerified && questionsRemaining <= 0) {
        return (
          <div className="flex flex-col items-start gap-2">
            <AssistantBubble>{dict.aiConversation.composerLocked.prompt}</AssistantBubble>
            <div className="flex flex-wrap gap-2 ps-1">
              {composerLockedChips().map((chip, index) => (
                <Chip key={index} emphasized={chip.emphasized} onClick={chip.onClick}>
                  {chip.label}
                </Chip>
              ))}
            </div>
          </div>
        );
      }
      return null;
    }
    if (mode === "identify") {
      return (
        <GuidedCard>
          <IdentifyStep dict={dict} fullName={state.leadInfo.fullName} mobile={state.leadInfo.mobile} onSubmit={handleIdentifySubmit} />
        </GuidedCard>
      );
    }
    if (mode === "otp") {
      return (
        <GuidedCard key={otpAttemptId}>
          <PhoneVerificationStep
            dict={dict}
            locale={locale}
            purpose={pendingPurpose}
            initialMobile={state.leadInfo.mobile}
            onVerified={handleVerified}
            onCancel={handleVerificationCancel}
          />
        </GuidedCard>
      );
    }
    if (mode === "confirmation") {
      return (
        <GuidedCard>
          <ConfirmationStep
            dict={dict}
            serviceId={state.leadInfo.selectedService}
            displayLabel={state.appointment.displayLabel}
            canAskAnother={isVerified && questionsRemaining > 0}
            onClose={close}
            onViewCare={() => routeToStep("care_guidance")}
            onAskAnother={() => handleAskQuestionEntry()}
          />
        </GuidedCard>
      );
    }
    if (mode === "booking") {
      return (
        <div className="flex flex-col gap-2">
          <GuidedCard>{renderBookingCard()}</GuidedCard>
          {step !== "service_selection" ? (
            <button
              type="button"
              onClick={() => handleAskQuestionEntry(step)}
              className="self-start text-xs font-medium text-charcoal/50 underline decoration-dotted underline-offset-2 transition-colors duration-200 hover:text-gold"
            >
              {dict.contextualAsk.prompt} {dict.contextualAsk.cta}
            </button>
          ) : null}
        </div>
      );
    }
    return null;
  };

  const showBack = mode !== "menu";

  /**
   * Round 2026-07-22 (V2.2 — focused full-screen assistant, item 1/2/4):
   * `entries` (the full log) is NEVER rendered wholesale in the public
   * UI anymore, and it's never mutated/truncated either — DB persistence
   * (`askAssistantQuestion`/`logHandoffEvent`) and the internal
   * dashboard's `ConversationTranscript` read from the database
   * independently of this array, so both stay completely unaffected.
   *
   * The public render is derived from it in two pieces: `activeEntries`
   * (the current stage — everything from the last `choice`/`user` entry
   * onward, i.e. since the last thing the patient actually did) is the
   * ONLY thing shown expanded; `collapsedEntries` (everything before
   * that) is NOT rendered as a visible line-by-line log at all anymore —
   * it only feeds the one-line `contextSummaryLine` below and the
   * optional, collapsed-by-default "مشاهده خلاصه مسیر" detail. Each
   * meaningful interaction REPLACES the active stage (the old entry
   * simply falls out of `activeEntries` once a newer `choice`/`user`
   * lands) rather than appending forever — item 4's "replace, don't
   * append" requirement.
   */
  const activeTurnStart = (() => {
    for (let i = entries.length - 1; i >= 0; i--) {
      const kind = entries[i]!.kind;
      if (kind === "choice" || kind === "user") return i;
    }
    return 0;
  })();
  const collapsedEntries = entries.slice(0, activeTurnStart);
  const activeEntries = entries.slice(activeTurnStart);

  /**
   * Round 2026-07-22 (V2.2, item 7) — ONE compact, subtle line replacing
   * the old growing stack of "✓ …" recap rows entirely (e.g. "شماره
   * تأیید شده · جراحی فک و چانه · رابطه فک بالا و پایین"). Built from
   * structured facts (`isVerified`/`lastServiceId`/`activeConcern`), not
   * from `entries` — so it never grows unbounded and always reflects the
   * CURRENT state, not a history of past ones.
   */
  const contextSummaryLine = [
    isVerified ? dict.aiConversation.verifiedContextLabel : null,
    lastServiceId ? (dict.services.find((service) => service.id === lastServiceId)?.label ?? null) : null,
    activeConcern,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  /** Round 2026-07-22 (V2.2, item 3) — a composer stays "active" only while asking is genuinely still possible; once locked, its bar disappears entirely rather than sitting there disabled. */
  const isComposerActive = mode === "conversation" && !(isVerified && questionsRemaining <= 0);

  return (
    <AnimatePresence>
      {isOpen && (
        // Round 2026-07-22 (V2.2, item 1) — `h-[100dvh]` explicitly, not
        // just `inset-0` on `fixed` (which on mobile Safari can compute
        // against the LARGE viewport, leaving content under the browser
        // chrome) — the dynamic viewport unit tracks the real visible area.
        <div className="fixed inset-0 z-[60] h-[100dvh]" role="dialog" aria-modal="true" aria-label={localeDict.aiConcierge.eyebrow}>
          <motion.div
            aria-hidden
            onClick={close}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.25 }}
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            dir={LOCALE_DIRECTION[locale]}
            initial={shouldReduceMotion ? false : { x: isRtl ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? "100%" : "-100%" }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            // `overflow-hidden` here is what confines scrolling to the
            // stage region below (item 1 — "avoid body-level scrolling
            // inside assistant") — header and composer footer are `shrink-0`
            // flex children that never scroll, only the stage between them does.
            className={`absolute inset-y-0 start-0 flex h-full w-full flex-col overflow-hidden bg-warm-white sm:w-[420px] ${isRtl ? "shadow-[-20px_0_60px_rgba(0,0,0,0.25)]" : "shadow-[20px_0_60px_rgba(0,0,0,0.25)]"}`}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-warm-white/10 bg-gradient-to-br from-deep-navy to-[#1a2540] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-deep-navy/60">
                  <SparkMark className="h-4 w-4 text-gold" />
                </span>
                <div>
                  <p className="text-sm font-bold leading-tight text-warm-white">{localeDict.aiConcierge.eyebrow}</p>
                  <p className="mt-0.5 text-[11px] text-warm-white/50">{localeDict.aiConcierge.onlineStatus}</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label={dict.ui.closeButtonLabel}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-warm-white/60 transition-colors duration-200 hover:bg-warm-white/10 hover:text-warm-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-4 w-4">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Round 2026-07-22 (V2.2, item 1) — the STAGE: the only region that scrolls, and only if its own content overflows. */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div ref={contentRef}>
                {showBack ? (
                  <button
                    type="button"
                    onClick={handleBackToMenu}
                    className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-charcoal/45 transition-colors duration-200 hover:text-gold"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                    {dict.ui.backToMenu}
                  </button>
                ) : null}

                {/* Round 2026-07-22 (V2.2, item 7) — one subtle, compact context line instead of a growing "✓ …" stack. */}
                {contextSummaryLine ? <p className="mb-2 truncate text-xs text-charcoal/40">{contextSummaryLine}</p> : null}

                {/* Round 2026-07-22 (V2.2, item 2) — the full path is still reachable, just opt-in and collapsed by default; never rendered open. */}
                {collapsedEntries.length > 0 ? (
                  <details className="mb-3">
                    <summary className="cursor-pointer list-none text-xs font-medium text-charcoal/40 underline decoration-dotted underline-offset-2 marker:content-none hover:text-gold">
                      {dict.aiConversation.viewJourneySummaryCta}
                    </summary>
                    <div className="mt-2 flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg border border-charcoal/10 bg-charcoal/[0.02] p-3">
                      {collapsedEntries.map((entry) => (
                        <p key={entry.id} className="text-xs leading-6 text-charcoal/55">
                          {entry.text}
                        </p>
                      ))}
                    </div>
                  </details>
                ) : null}

                <div ref={activeTurnRef} className="flex flex-col gap-3">
                  {activeEntries.map((entry) => {
                    if (entry.kind === "user") return <UserBubble key={entry.id}>{entry.text}</UserBubble>;
                    if (entry.kind === "choice") return <ChoiceRecap key={entry.id}>{entry.text}</ChoiceRecap>;
                    if (entry.kind === "note") return <ChoiceRecap key={entry.id}>{entry.text}</ChoiceRecap>;
                    return (
                      <div key={entry.id} className="flex flex-col items-start gap-2">
                        <AssistantBubble>{entry.text}</AssistantBubble>
                        {entry.chips && entry.chips.length > 0 ? (
                          <div className="flex flex-wrap gap-2 ps-1">
                            {entry.chips.map((chip, index) => (
                              <Chip key={index} emphasized={chip.emphasized} onClick={chip.onClick}>
                                {chip.label}
                              </Chip>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {isAsking ? (
                    <div className="me-auto">
                      <TypingIndicator />
                    </div>
                  ) : null}

                  <div className="mt-1">{renderLiveArea()}</div>
                </div>
              </div>
              <div ref={bottomRef} />
            </div>

            {/* Round 2026-07-22 (V2.2, item 1/3) — the fixed bottom composer bar, OUTSIDE the scrolling stage, shown only while genuinely askable. */}
            {isComposerActive ? <div className="shrink-0 border-t border-charcoal/10 bg-warm-white px-5 py-3">{renderComposerBar()}</div> : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Same mark used by the homepage assistant card and the floating trigger's earlier gold version — kept for identity consistency. */
function SparkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c.7 3.8 2.9 6 6.7 6.7-3.8.7-6 2.9-6.7 6.7-.7-3.8-2.9-6-6.7-6.7C9.1 8.7 11.3 6.5 12 2Z" />
    </svg>
  );
}
