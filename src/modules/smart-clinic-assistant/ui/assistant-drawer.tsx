"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getDictionary } from "@/i18n/get-dictionary";
import { LOCALE_DIRECTION } from "@/i18n/locales";

import type { LeadInfo, PaymentCurrency, ServiceId, TriageAnswer } from "../application/types";
import type { FreeTextResult } from "../server/ai/intent-detector";
import { interpretFreeText } from "../server/interpret-free-text";
import type { OtpPurpose } from "../server/request-otp";
import { submitBookingRequest } from "../server/submit-booking-request";
import { useAssistant } from "./assistant-provider";
import { AppointmentSelectionStep, type AppointmentSelectionResult } from "./steps/appointment-selection-step";
import { ConfirmationStep } from "./steps/confirmation-step";
import { ContactCaptureStep } from "./steps/contact-capture-step";
import { GeneralStep } from "./steps/general-step";
import { InfoStep } from "./steps/info-step";
import { PaymentPreparationStep } from "./steps/payment-preparation-step";
import { PhoneVerificationStep } from "./steps/phone-verification-step";
import { ServiceSelectionStep } from "./steps/service-selection-step";
import { TriageStep } from "./steps/triage-step";
import { useAssistantFlow } from "./use-assistant-flow";

/**
 * The real assistant panel this module's earlier `TODO(assistant)` was
 * pointing at (see `assistant-provider.tsx`) — built per Hamid's
 * 2026-07-12 contract-driven brief. A structured, editorial multi-step
 * flow (each step replaces the last, wizard-style), not a chat-bubble
 * transcript — his explicit "no generic chatbot UI, no blue plugin
 * style" ruled out the obvious default.
 *
 * Docks to `start-0` (logical) — under this site's `dir="rtl"` that's
 * the physical right edge, satisfying his literal "opens from right"
 * without hardcoding a physical side (same reasoning already applied to
 * the floating trigger and Header CTA elsewhere in this project). Slides
 * in via a physical `translateX` (transform has no logical form), from
 * further right (off-screen) to resting position.
 *
 * Focus management: focuses the close button on open, restores nothing
 * elaborate on close (no prior-trigger-ref tracking — kept to the
 * minimal real requirement: trap Tab within the panel, Escape closes,
 * body scroll locked while open — same pattern already established in
 * `mobile-menu.tsx`, not a new mechanism).
 *
 * Session data (lead info, triage answers, appointment/payment drafts)
 * lives in `useAssistantFlow`'s local reducer, reset each time this
 * component mounts — see that file's doc-comment for why it isn't in
 * the global `AssistantProvider`.
 *
 * Round 2026-07-13 (docs/adr/0006): locale-aware. `dict` now comes from
 * `getDictionary(locale).assistantFlow` (`locale` read off
 * `useAssistant()`, set once at `AssistantProvider` mount time in
 * `layout.tsx`) instead of always `fa.assistantFlow`. `dir`, the slide-in
 * direction, and the drop shadow's side were all hardcoded for a
 * right-docked RTL panel — under `en` (LTR) the panel docks to the
 * visual LEFT instead (via the existing logical `start-0`), so the slide
 * animation and shadow now flip with it rather than sliding the full
 * width of the screen to reach the wrong-looking rest position.
 *
 * Round 2026-07-14 (docs/adr/0007, mobile-verification pass): actions
 * gated behind a verified mobile via `runGated`, the one chokepoint: if
 * `sessionToken` is already set, the action runs immediately; otherwise
 * it's stashed in `pendingActionRef` and `PhoneVerificationStep` is
 * shown, resuming the EXACT stashed action (called with the freshly-
 * issued token, never a stale closure-captured one) on success —
 * "resume the previous action," never a flow restart.
 *
 * Round 2026-07-16 (contract-alignment pass, per Hamid — real UX bug:
 * "many assistant paths ask for mobile verification too early"):
 * completing triage and choosing "general consultation" are NO LONGER
 * gated — verified against his explicit brief, OTP must only block (a)
 * the final booking submit and (b) free-text AI questions, never
 * service selection, triage, cost/care guidance, or seeing availability
 * options. The booking flow's step ORDER also changed to match his
 * literal spec: triage → appointment/time selection → contact capture
 * (name/mobile) → payment prep → OTP (only now, at final submit) →
 * submit. Previously contact capture came BEFORE appointment selection
 * and was itself gated — both reversed here. Since name/mobile is
 * collected in `ContactCaptureStep` before OTP is ever shown,
 * `PhoneVerificationStep` now receives that mobile as a pre-fill
 * (`initialMobile`) instead of the old reverse direction ("the verified
 * mobile pre-fills leadInfo.mobile").
 */
export function AssistantDrawer() {
  const { isOpen, step, setStep, close, source, locale } = useAssistant();
  const router = useRouter();
  const localeDict = getDictionary(locale);
  const dict = localeDict.assistantFlow;
  const isRtl = LOCALE_DIRECTION[locale] === "rtl";
  const { state, dispatch } = useAssistantFlow();
  const shouldReduceMotion = useReducedMotion();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // --- Mobile verification (docs/adr/0007) ---
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [pendingPurpose, setPendingPurpose] = useState<OtpPurpose>("assistant_access");
  const pendingActionRef = useRef<((token: string) => void) | null>(null);
  const [freeTextMessage, setFreeTextMessage] = useState("");
  const [isAskingFreeText, setIsAskingFreeText] = useState(false);
  const [freeTextUnclear, setFreeTextUnclear] = useState(false);
  /** Distinct from `freeTextUnclear` — AI transport failure/not-configured, not an ambiguous question. See `intent-detector.ts`'s `FreeTextResult` doc-comment. */
  const [freeTextUnavailable, setFreeTextUnavailable] = useState(false);

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
   * The one gate. `action` receives the verified session token directly
   * as a parameter (never reads `sessionToken` from closure scope) so a
   * pending action created BEFORE verification still gets the FRESH
   * token when it's replayed after — a plain closure over the `useState`
   * value would otherwise capture the pre-verification `null`.
   */
  const runGated = (action: (token: string) => void, purpose: OtpPurpose = "assistant_access") => {
    if (sessionToken) {
      action(sessionToken);
      return;
    }
    setPendingPurpose(purpose);
    pendingActionRef.current = action;
    setStep("phone_verification");
  };

  const handleVerified = (token: string, mobile: string) => {
    setSessionToken(token);
    dispatch({ type: "SET_LEAD_INFO", leadInfo: { mobile } });
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) {
      action(token);
    } else {
      setStep("general");
    }
  };

  const handleVerificationCancel = () => {
    pendingActionRef.current = null;
    setStep("general");
  };

  const handleServiceSelect = (serviceId: ServiceId) => {
    dispatch({ type: "SET_SERVICE", serviceId });
    if (serviceId === "general_consultation") {
      // No per-service triage questions for a general consultation — goes
      // straight to real availability, same as every other service does
      // once its triage is done. Ungated, per the contract: OTP only
      // gates the final submit.
      setStep("appointment_selection");
    } else {
      setStep("triage");
    }
  };

  /** Routes `interpretFreeText`'s result — see `general-step.tsx`'s doc-comment. */
  const handleFreeTextResult = (result: FreeTextResult) => {
    if (result.type === "intent") {
      if (result.serviceId) {
        handleServiceSelect(result.serviceId);
        return;
      }
      setStep(result.step);
      return;
    }
    if (result.type === "qa") {
      setQaAnswer(result.answer);
      setStep("qa_response");
    }
  };

  const handleAskFreeText = () => {
    const trimmed = freeTextMessage.trim();
    if (!trimmed || isAskingFreeText) return;
    runGated((token) => {
      void (async () => {
        setIsAskingFreeText(true);
        setFreeTextUnclear(false);
        setFreeTextUnavailable(false);
        const result = await interpretFreeText({ message: trimmed, locale, sessionToken: token });
        setIsAskingFreeText(false);
        if (result.type === "unclear") {
          setFreeTextUnclear(true);
          return;
        }
        if (result.type === "unavailable") {
          setFreeTextUnavailable(true);
          return;
        }
        setFreeTextMessage("");
        handleFreeTextResult(result);
      })();
    }, "assistant_access");
  };

  const handleTriageComplete = (answers: TriageAnswer[]) => {
    dispatch({ type: "SET_TRIAGE_ANSWERS", answers });
    dispatch({ type: "COMPLETE_TRIAGE" });
    // Ungated — availability is not patient-specific data, showing real
    // open time options requires no verified mobile.
    setStep("appointment_selection");
  };

  const handleAppointmentSubmit = (result: AppointmentSelectionResult) => {
    dispatch({
      type: "SET_APPOINTMENT_PREFERENCE",
      preferredDay: result.preferredDay,
      preferredTimeRange: result.preferredTimeRange,
      selectedSlotId: result.selectedSlotId,
      appointmentDate: result.appointmentDate,
    });
    // Name/mobile is asked only now, AFTER a time preference exists —
    // per the contract's explicit step order. Still ungated: OTP happens
    // once, at the final submit below, not here.
    setStep("contact_capture");
  };

  const handleContactSubmit = (leadInfo: LeadInfo) => {
    dispatch({ type: "SET_LEAD_INFO", leadInfo });
    setStep("payment_preparation");
  };

  const handleFinalSubmit = () => {
    const serviceId = state.leadInfo.selectedService;
    if (!serviceId) return;
    runGated((token) => {
      void (async () => {
        setIsSubmitting(true);
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
        setIsSubmitting(false);
        if (result.ok) {
          dispatch({ type: "SUBMITTED", requestId: result.leadId ?? result.request.requestedAt });
          setStep("confirmation");
        } else {
          setSubmitError(result.error);
        }
      })();
    }, "booking_request");
  };

  const showBack = step !== "general" && step !== "confirmation";

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
              {showBack ? (
                <button
                  type="button"
                  onClick={() => setStep("general")}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-charcoal/45 transition-colors duration-200 hover:text-gold"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                  {dict.ui.backToMenu}
                </button>
              ) : null}

              {step === "general" && (
                <GeneralStep
                  dict={dict}
                  onNavigate={setStep}
                  message={freeTextMessage}
                  onMessageChange={setFreeTextMessage}
                  isAsking={isAskingFreeText}
                  unclearMessage={freeTextUnclear}
                  unavailableMessage={freeTextUnavailable}
                  onAsk={handleAskFreeText}
                />
              )}

              {step === "consultation_booking" && (
                <InfoStep
                  eyebrow={dict.ui.consultationBookingEyebrow}
                  title={dict.ui.consultationBookingEyebrow}
                  body={<p>{dict.steps.consultationBooking.intro}</p>}
                  primaryAction={{ label: dict.ui.chooseServiceCta, onClick: () => setStep("service_selection") }}
                />
              )}

              {step === "service_selection" && <ServiceSelectionStep dict={dict} onSelect={handleServiceSelect} />}

              {step === "triage" &&
                (state.leadInfo.selectedService ? (
                  <TriageStep dict={dict} serviceId={state.leadInfo.selectedService} onComplete={handleTriageComplete} />
                ) : (
                  <ServiceSelectionStep dict={dict} onSelect={handleServiceSelect} />
                ))}

              {step === "contact_capture" && <ContactCaptureStep dict={dict} leadInfo={state.leadInfo} onSubmit={handleContactSubmit} />}

              {step === "appointment_selection" && <AppointmentSelectionStep dict={dict} locale={locale} onSubmit={handleAppointmentSubmit} />}

              {step === "payment_preparation" && (
                <>
                  <PaymentPreparationStep
                    dict={dict}
                    payment={state.payment}
                    onCurrencyChange={(currency: PaymentCurrency) => dispatch({ type: "SET_PAYMENT", payment: { currency } })}
                    onSubmit={handleFinalSubmit}
                    isSubmitting={isSubmitting}
                  />
                  {submitError ? <p className="mt-3 text-xs text-red-600">{submitError}</p> : null}
                </>
              )}

              {step === "confirmation" && <ConfirmationStep dict={dict} onClose={close} />}

              {step === "cost_question" && (
                <InfoStep
                  eyebrow={dict.ui.costQuestionEyebrow}
                  title={dict.ui.costQuestionTitle}
                  body={<p>{dict.steps.costQuestion.intro}</p>}
                  primaryAction={{ label: dict.ui.chooseServiceCta, onClick: () => setStep("service_selection") }}
                />
              )}

              {step === "before_after" && (
                <InfoStep
                  title={dict.ui.beforeAfterTitle}
                  body={<p>{dict.steps.beforeAfter.body}</p>}
                  primaryAction={{
                    label: dict.steps.beforeAfter.cta,
                    onClick: () => {
                      close();
                      document.getElementById("before-after")?.scrollIntoView({ behavior: "smooth" });
                    },
                  }}
                />
              )}

              {step === "articles" && (
                <InfoStep
                  title={dict.ui.articlesTitle}
                  body={<p>{dict.steps.articles.body}</p>}
                  primaryAction={{
                    label: dict.steps.articles.cta,
                    onClick: () => {
                      close();
                      document.getElementById("knowledge-center")?.scrollIntoView({ behavior: "smooth" });
                    },
                  }}
                />
              )}

              {/* Round 2026-07-13 (patient-care hub) — deterministic, no
                  AI call, same pattern as `before_after`/`articles`
                  above: a short message + a CTA that routes to a real
                  page. Uses `router.push` (not `scrollIntoView`) since
                  the care hub is its own route, not a homepage anchor. */}
              {step === "care_guidance" && (
                <InfoStep
                  title={dict.ui.careGuidanceTitle}
                  body={<p>{dict.steps.careGuidance.body}</p>}
                  primaryAction={{
                    label: dict.steps.careGuidance.cta,
                    onClick: () => {
                      close();
                      router.push(`/${locale}/care-instructions`);
                    },
                  }}
                />
              )}

              {step === "image_upload_future" && (
                <InfoStep
                  title={dict.ui.imageUploadTitle}
                  body={<p>{dict.steps.imageUploadFuture.notice}</p>}
                  primaryAction={{ label: dict.ui.chooseServiceCta, onClick: () => setStep("service_selection") }}
                />
              )}

              {/* Reached only from `GeneralStep`'s free-text input when the
                  message is classified as an open Q&A rather than one of
                  the deterministic app screens — see AI_USAGE_NOTES.md.
                  Reuses `InfoStep` (no new step component needed). */}
              {step === "qa_response" && (
                <InfoStep
                  eyebrow={dict.ui.qaAnswerEyebrow}
                  title={dict.ui.qaAnswerEyebrow}
                  body={<p>{qaAnswer}</p>}
                  primaryAction={{ label: dict.ui.chooseServiceCta, onClick: () => setStep("service_selection") }}
                  secondaryAction={{ label: dict.ui.backToMenu, onClick: () => setStep("general") }}
                />
              )}

              {/* docs/adr/0007 — see this file's own doc-comment for the
                  gating/resume mechanism. */}
              {step === "phone_verification" && (
                <PhoneVerificationStep
                  dict={dict}
                  locale={locale}
                  purpose={pendingPurpose}
                  initialMobile={state.leadInfo.mobile}
                  onVerified={handleVerified}
                  onCancel={handleVerificationCancel}
                />
              )}
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
