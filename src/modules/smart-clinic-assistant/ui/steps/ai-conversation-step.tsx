"use client";

import { useRef, useState } from "react";

import type { AssistantFlowDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";

import { askAssistantQuestion } from "../../server/ai/ask-assistant-question";
import type { AssistantStep, ServiceId } from "../../application/types";
import { Chip, SafetyNotice, StepHeading, TypingIndicator } from "../drawer-controls";

type TranscriptEntry = { role: "user" | "assistant"; content: string };

/**
 * Round 2026-07-17 (Smart Assistant product redesign, per Hamid): the
 * post-OTP, up-to-3-question AI conversation panel — the ONLY place in
 * this whole flow a patient can type a free-text question, and only
 * after they're verified (`sessionToken` is required, not optional).
 * Calls `askAssistantQuestion` (a caller of the existing AI Gateway
 * boundary, not a new one — see that file). `questionsRemaining` is
 * seeded by the drawer from the OTP-verification result and kept in sync
 * with each server response — the server enforces the real limit; this
 * component only mirrors it for display and to disable the input early.
 *
 * Not a generic chat transcript UI: no avatars, no timestamps, no
 * infinite scroll — a short, calm stack of at most 3 question/answer
 * pairs, plus one persistent safety notice and a small follow-up-chips
 * row after each answer (never a giant composer sitting open by default,
 * per Hamid's explicit brief).
 */
export function AiConversationStep({
  dict,
  locale,
  sessionToken,
  fullName,
  selectedService,
  questionsRemaining,
  onQuestionsRemainingChange,
  onNavigate,
  onNavigateToSuggested,
  canReturnToBooking,
  onReturnToBooking,
  onClose,
}: {
  dict: AssistantFlowDictionary;
  locale: Locale;
  sessionToken: string;
  fullName: string;
  selectedService: ServiceId | null;
  questionsRemaining: number;
  onQuestionsRemainingChange: (n: number) => void;
  onNavigate: (step: AssistantStep) => void;
  /** Round 2026-07-17 fix: routes an AI-suggested step through `handleServiceSelect` when a service was identified, instead of trusting the raw step name — see `AskAssistantQuestionResult`'s doc-comment. */
  onNavigateToSuggested: (step: AssistantStep, serviceId: ServiceId | null) => void;
  canReturnToBooking: boolean;
  onReturnToBooking: () => void;
  onClose: () => void;
}) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [message, setMessage] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [lastSuggested, setLastSuggested] = useState<{ step: AssistantStep; serviceId: ServiceId | null } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const limitReached = questionsRemaining <= 0;
  const remainingLabel = dict.aiConversation.questionsRemainingLabels[String(questionsRemaining) as "1" | "2" | "3"];
  const consultationBookingLabel = dict.mainActions.find((action) => action.id === "consultation_booking")?.label ?? dict.ui.consultationBookingEyebrow;

  const handleAsk = () => {
    const trimmed = message.trim();
    if (!trimmed || isAsking || limitReached) return;
    setUnavailable(false);
    setIsAsking(true);
    setTranscript((prev) => [...prev, { role: "user", content: trimmed }]);
    setMessage("");
    void (async () => {
      const result = await askAssistantQuestion({
        sessionToken,
        message: trimmed,
        locale,
        currentStep: "ai_conversation",
        fullName: fullName || null,
        serviceSlug: selectedService,
      });
      setIsAsking(false);

      if (result.type === "unavailable") {
        // Nothing was persisted server-side for this turn — remove the
        // optimistic user bubble too, so the transcript never shows a
        // question with no answer sitting under it.
        setTranscript((prev) => prev.slice(0, -1));
        setUnavailable(true);
        return;
      }
      if (result.type === "not_verified" || result.type === "limit_reached") {
        onQuestionsRemainingChange(0);
        return;
      }
      if (result.type === "unclear") {
        setTranscript((prev) => [...prev, { role: "assistant", content: dict.ui.freeTextUnclearMessage }]);
        setLastSuggested(null);
        onQuestionsRemainingChange(result.questionsRemaining);
        return;
      }
      setTranscript((prev) => [...prev, { role: "assistant", content: result.answer }]);
      setLastSuggested(result.suggestedStep ? { step: result.suggestedStep, serviceId: result.suggestedServiceId } : null);
      onQuestionsRemainingChange(result.questionsRemaining);
    })();
  };

  const handleAskAnother = () => {
    setLastSuggested(null);
    inputRef.current?.focus();
  };

  return (
    <div>
      {transcript.length === 0 ? (
        <>
          <StepHeading eyebrow={dict.phoneVerification.eyebrow} title={dict.phoneVerification.eyebrow} />
          <p className="text-sm leading-7 text-charcoal/75">{dict.aiConversation.verifiedIntro}</p>
        </>
      ) : null}

      {!limitReached ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-gold">{remainingLabel}</p>
      ) : null}

      {transcript.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {transcript.map((entry, index) => (
            <div
              key={index}
              className={
                entry.role === "user"
                  ? "ms-auto max-w-[85%] rounded-2xl rounded-ee-sm bg-gold/10 px-3.5 py-2.5 text-sm leading-6 text-charcoal"
                  : "me-auto max-w-[90%] rounded-2xl rounded-ss-sm border border-charcoal/10 bg-white px-3.5 py-2.5 text-sm leading-6 text-charcoal/85"
              }
            >
              {entry.content}
            </div>
          ))}
          {isAsking ? (
            <div className="me-auto">
              <TypingIndicator />
            </div>
          ) : null}
        </div>
      ) : null}

      {unavailable ? <p className="mt-3 text-xs leading-6 text-charcoal/55">{dict.ui.freeTextUnavailableMessage}</p> : null}

      {limitReached ? (
        <>
          <p className="mt-4 text-sm leading-7 text-charcoal/75">{dict.aiConversation.limitReachedNotice}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {canReturnToBooking ? <Chip emphasized onClick={onReturnToBooking}>{dict.aiConversation.continueBookingCta}</Chip> : null}
            <Chip onClick={() => onNavigate("consultation_booking")}>{consultationBookingLabel}</Chip>
            <Chip onClick={() => onNavigate("service_selection")}>{dict.ui.serviceSelectionTitle}</Chip>
            <Chip onClick={onClose}>{dict.ui.closeCta}</Chip>
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAsk();
                }
              }}
              placeholder={dict.ui.freeTextPlaceholder}
              disabled={isAsking}
              className="w-full flex-1 rounded-xl border border-charcoal/15 bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
            />
            <button
              type="button"
              onClick={handleAsk}
              disabled={isAsking || !message.trim()}
              className="shrink-0 rounded-full bg-gradient-to-b from-gold to-gold-hover px-4 py-2.5 text-sm font-semibold text-deep-navy transition-[filter] duration-200 hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
            >
              {isAsking ? dict.ui.freeTextThinkingLabel : dict.ui.freeTextSubmitCta}
            </button>
          </div>

          {transcript.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {lastSuggested ? (
                <Chip emphasized onClick={() => onNavigateToSuggested(lastSuggested.step, lastSuggested.serviceId)}>
                  {dict.aiConversation.viewSuggestedStepCta}
                </Chip>
              ) : null}
              {canReturnToBooking ? <Chip onClick={onReturnToBooking}>{dict.aiConversation.continueBookingCta}</Chip> : null}
              <Chip onClick={() => onNavigate("consultation_booking")}>{consultationBookingLabel}</Chip>
              <Chip onClick={() => onNavigate("service_selection")}>{dict.ui.serviceSelectionTitle}</Chip>
              <Chip onClick={() => onNavigate("care_guidance")}>{dict.aiConversation.relatedCareCta}</Chip>
              <Chip onClick={handleAskAnother}>{dict.aiConversation.askAnotherCta}</Chip>
            </div>
          ) : null}

          <SafetyNotice>{dict.aiConversation.safetyNotice}</SafetyNotice>
        </>
      )}
    </div>
  );
}
