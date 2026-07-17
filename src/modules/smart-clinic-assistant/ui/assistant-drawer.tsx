"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getDictionary } from "@/i18n/get-dictionary";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

import { ACTION_STEP_MAP } from "../application/action-step-map";
import type { AssistantIntent, AssistantStep, LeadInfo, PaymentCurrency, ServiceId, TriageAnswer } from "../application/types";
import { askAssistantQuestion } from "../server/ai/ask-assistant-question";
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
const DISSATISFACTION_KEYWORDS: Record<Locale, string[]> = {
  fa: ["این جواب من نیست", "جواب سوالم", "متوجه نشدی", "بی‌ربط", "نه منظورم", "درست جواب نده", "جوابمو ندادی", "جواب درست نبود"],
  en: ["that's not my answer", "answer my question", "you didn't understand", "not relevant", "that's not what i meant", "wrong answer"],
  ar: ["هذا ليس جوابي", "أجب عن سؤالي", "لم تفهم", "غير ذي صلة", "لم أقصد ذلك", "إجابة خاطئة"],
};

type AssistantMode = "menu" | "conversation" | "booking" | "identify" | "otp" | "confirmation";

interface ChipAction {
  label: string;
  onClick: () => void;
  emphasized?: boolean;
}

type ConversationEntry =
  /** An assistant-authored line, optionally with follow-up quick replies. */
  | { id: string; kind: "assistant"; text: string; chips?: ChipAction[] }
  /** A patient-typed free-text question. */
  | { id: string; kind: "user"; text: string }
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
  /** Round 2026-07-20 (item 8) — the growing content wrapper, observed by `ResizeObserver` so ANY height change (a new entry, a booking card swapping in, an async-loaded option list, a timer label appearing) re-scrolls — not just the specific state changes a deps array would need enumerating. */
  const contentRef = useRef<HTMLDivElement>(null);
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

  // On mobile, the on-screen keyboard opening resizes the visual
  // viewport (not the document) — re-anchor to the bottom so the
  // composer/active card stays visible instead of sliding under the
  // keyboard. Instant, not smooth — this is a viewport correction, not a
  // content-arrival animation.
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const handleViewportResize = () => {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
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

  const handleAskQuestionEntry = (fromStep?: AssistantStep) => {
    if (fromStep) setReturnStep(fromStep);
    if (sessionToken && questionsRemaining > 0) {
      enterConversationMode();
      return;
    }
    setMode("identify");
  };

  const handleIdentifySubmit = (values: { fullName: string; mobile: string }) => {
    dispatch({ type: "SET_LEAD_INFO", leadInfo: values });
    pushEntry({ kind: "choice", text: `${values.fullName} · ${values.mobile}` });
    runGated(() => enterConversationMode(), "assistant_access");
  };

  const handleReturnToBooking = () => {
    if (!returnStep) return;
    pushEntry({ kind: "choice", text: dict.aiConversation.continueBookingCta });
    setMode("booking");
    setStep(returnStep);
    setReturnStep(null);
  };

  const handleChangeService = () => {
    setReturnStep(null);
    pushEntry({ kind: "choice", text: dict.aiConversation.changeServiceCta });
    setMode("booking");
    setStep("service_selection");
  };

  const nextQuestionChip = (): ChipAction =>
    sessionToken && questionsRemaining > 0
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
   */
  const implantAwareChips = (serviceId: ServiceId): ChipAction[] => {
    const short = dict.serviceShortLabels[serviceId] ?? dict.services.find((service) => service.id === serviceId)?.label ?? "";
    return [
      { label: dict.aiConversation.bookServiceTemplate.replace("{service}", short), onClick: () => handleServiceSelect(serviceId), emphasized: true },
      { label: dict.aiConversation.hasXrayCta, onClick: () => acknowledgeXrayAnswer(true, serviceId) },
      { label: dict.aiConversation.noXrayCta, onClick: () => acknowledgeXrayAnswer(false, serviceId) },
      { label: dict.aiConversation.careForServiceTemplate.replace("{service}", short), onClick: () => routeToStep("care_guidance") },
      nextQuestionChip(),
    ];
  };

  /** Deterministic, free (no server call, no question consumed) — a chip click acknowledging whether the patient already has imaging, then re-offers the standard next steps. */
  const acknowledgeXrayAnswer = (hasXray: boolean, serviceId: ServiceId) => {
    pushEntry({ kind: "choice", text: hasXray ? dict.aiConversation.hasXrayCta : dict.aiConversation.noXrayCta });
    pushEntry({
      kind: "assistant",
      text: hasXray ? dict.aiConversation.hasXrayReply : dict.aiConversation.noXrayReply,
      chips: serviceAwareChips(serviceId),
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

  const fallbackChips = (): ChipAction[] => [
    { label: dict.aiConversation.fallbackChips.cost, onClick: () => routeToStep("cost_question") },
    { label: dict.aiConversation.fallbackChips.service, onClick: () => routeToStep("service_selection") },
    { label: dict.aiConversation.fallbackChips.care, onClick: () => routeToStep("care_guidance") },
    { label: dict.aiConversation.fallbackChips.booking, onClick: () => routeToStep("consultation_booking") },
  ];

  const limitReachedChips = (): ChipAction[] => {
    const chips: ChipAction[] = [];
    if (returnStep) chips.push({ label: dict.aiConversation.continueBookingCta, onClick: handleReturnToBooking, emphasized: true });
    chips.push({ label: mainActionLabel("consultation_booking"), onClick: () => routeToStep("consultation_booking") });
    chips.push({ label: mainActionLabel("service_selection"), onClick: () => routeToStep("service_selection") });
    chips.push({ label: dict.ui.closeCta, onClick: close });
    return chips;
  };

  const resumeChips = (): ChipAction[] => [
    { label: dict.aiConversation.continueBookingCta, onClick: handleReturnToBooking, emphasized: true },
    { label: dict.aiConversation.askAnotherCta, onClick: focusComposer },
    { label: dict.aiConversation.changeServiceCta, onClick: handleChangeService },
    { label: dict.ui.closeCta, onClick: close },
  ];

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
    const label = dict.services.find((service) => service.id === serviceId)?.label ?? serviceId;
    pushEntry({ kind: "choice", text: label });
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
    pushEntry({ kind: "choice", text: result.displayLabel });
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
    pushEntry({ kind: "user", text: trimmed });
    setComposerMessage("");

    const contextServiceId = state.leadInfo.selectedService ?? lastServiceId;

    // Round 2026-07-20 (production UX fix, item 4 — "when the user says
    // the answer was not helpful, the assistant does not correct
    // itself"): a recognized dissatisfaction phrase, WITH a remembered
    // topic to retry, is answered entirely client-side — deterministic,
    // free, no server round-trip, so it can never consume one of the
    // patient's 3 questions (matches item 4's explicit "do not consume
    // another question" requirement) — see `showServiceGuidance`.
    if (isDissatisfactionPhrase(trimmed) && contextServiceId) {
      setIsAsking(true);
      setTimeout(() => {
        setIsAsking(false);
        pushEntry({ kind: "assistant", text: dict.aiConversation.correctionAcknowledgement });
        showServiceGuidance(contextServiceId);
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
        pushEntry({ kind: "assistant", text: dict.aiConversation.limitReachedNotice, chips: limitReachedChips() });
        return;
      }
      if (result.type === "unclear") {
        pushEntry({ kind: "assistant", text: dict.aiConversation.fallbackPrompt, chips: returnStep ? undefined : fallbackChips() });
        setQuestionsRemaining(result.questionsRemaining);
        if (returnStep) {
          pushEntry({ kind: "assistant", text: dict.aiConversation.resumeBookingPrompt, chips: resumeChips() });
        } else if (result.questionsRemaining > 0) {
          pushEntry({ kind: "note", text: dict.aiConversation.questionsRemainingLabels[String(result.questionsRemaining) as "1" | "2" | "3"] });
        }
        return;
      }
      // "answer"
      if (result.suggestedServiceId) setLastServiceId(result.suggestedServiceId);
      pushEntry({ kind: "assistant", text: result.answer, chips: returnStep ? undefined : answerChips(result.suggestedStep, result.suggestedServiceId) });
      setQuestionsRemaining(result.questionsRemaining);
      if (returnStep) {
        pushEntry({ kind: "assistant", text: dict.aiConversation.resumeBookingPrompt, chips: resumeChips() });
      } else if (result.questionsRemaining > 0) {
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

  const renderLiveArea = () => {
    if (mode === "conversation") {
      return (
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
            canAskAnother={Boolean(sessionToken) && questionsRemaining > 0}
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={localeDict.aiConcierge.eyebrow}>
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
            className={`absolute inset-y-0 start-0 flex w-full flex-col bg-warm-white sm:w-[420px] ${isRtl ? "shadow-[-20px_0_60px_rgba(0,0,0,0.25)]" : "shadow-[20px_0_60px_rgba(0,0,0,0.25)]"}`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-warm-white/10 bg-gradient-to-br from-deep-navy to-[#1a2540] px-5 py-4">
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

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div ref={contentRef}>
                {showBack ? (
                  <button
                    type="button"
                    onClick={handleBackToMenu}
                    className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-charcoal/45 transition-colors duration-200 hover:text-gold"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                    {dict.ui.backToMenu}
                  </button>
                ) : null}

                <div className="flex flex-col gap-3">
                  {entries.map((entry) => {
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
                </div>

                <div className="mt-4">{renderLiveArea()}</div>
              </div>
              <div ref={bottomRef} />
            </div>
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
