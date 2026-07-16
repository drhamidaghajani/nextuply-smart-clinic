"use server";

import { getDictionary } from "@/i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "@/i18n/locales";
import { isDatabaseConfigured } from "@/infrastructure/db/client";

import type { AssistantStep, ServiceId } from "../../application/types";
import { interpretFreeText } from "../interpret-free-text";
import { createAssistantMessage } from "./conversation-repository";
import {
  findAssistantSession,
  findOrCreateDevBypassAssistantSession,
  incrementAssistantSessionQuestionCount,
  updateAssistantSessionProfile,
} from "../otp/otp-repository";
import { extractDevBypassMobile, isDevBypassToken, isValidDevBypassToken } from "../otp/session-guard";

/**
 * Round 2026-07-17 (Smart Assistant product redesign, per Hamid): the one
 * entry point for the post-OTP, up-to-3-question AI conversation
 * (`AiConversationStep` — see that file). Reuses `interpretFreeText`
 * unchanged (does NOT touch `ai-gateway-client.ts`/`ai/config.ts`) — this
 * file is a caller of the existing AI boundary, not a new one.
 *
 * The 3-question limit is enforced here, server-side, against
 * `AssistantSession.questionCount`/`questionLimit` — the authoritative
 * check; the client only mirrors it for display. A transport failure
 * (`"unavailable"`) never consumes a question — that's this system's
 * fault, not the patient using up their 3 questions. An ambiguous/
 * low-confidence answer (`"unclear"`) DOES consume one — the assistant
 * genuinely attempted an answer.
 *
 * Every question and every answer shown to the patient is persisted via
 * `createAssistantMessage` — best-effort (wrapped so a logging failure
 * never blocks the actual answer from reaching the patient), same
 * "never crash a patient-facing flow over internal persistence" rule
 * this codebase applies everywhere else (see `submit-booking-request.ts`).
 */

export type AskAssistantQuestionResult =
  /** `suggestedServiceId` — round 2026-07-17 fix: when the intent classification (local keyword match or AI) resolved to a specific service, the "مشاهده" chip must go through the SAME service-selection path a manual click would (`handleServiceSelect`, which picks the correct step — `triage` vs `appointment_selection` — itself), never trust `suggestedStep` blindly when a service is known. */
  | { type: "answer"; answer: string; suggestedStep: AssistantStep | null; suggestedStepLabel: string | null; suggestedServiceId: ServiceId | null; questionsRemaining: number }
  | { type: "unclear"; questionsRemaining: number }
  | { type: "unavailable" }
  | { type: "limit_reached" }
  | { type: "not_verified" };

const STEP_LABEL_KEYS: Partial<Record<AssistantStep, (dict: ReturnType<typeof getDictionary>) => string>> = {
  consultation_booking: (dict) => dict.assistantFlow.ui.consultationBookingEyebrow,
  service_selection: (dict) => dict.assistantFlow.ui.serviceSelectionTitle,
  cost_question: (dict) => dict.assistantFlow.ui.costQuestionTitle,
  before_after: (dict) => dict.assistantFlow.ui.beforeAfterTitle,
  articles: (dict) => dict.assistantFlow.ui.articlesTitle,
  care_guidance: (dict) => dict.assistantFlow.ui.careGuidanceTitle,
};

async function logMessageSafely(args: { sessionId: string; role: "user" | "assistant"; content: string }): Promise<void> {
  try {
    await createAssistantMessage(args);
  } catch (error) {
    console.error("[ask-assistant-question] failed to log message", error instanceof Error ? error.message : "unknown error");
  }
}

export async function askAssistantQuestion(rawInput: {
  sessionToken: string | null;
  message: string;
  locale: string;
  currentStep?: string;
  fullName?: string | null;
  serviceSlug?: string | null;
}): Promise<AskAssistantQuestionResult> {
  if (!rawInput.sessionToken || !isDatabaseConfigured()) return { type: "not_verified" };

  const locale: Locale = isSupportedLocale(rawInput.locale) ? rawInput.locale : "fa";

  const session = isDevBypassToken(rawInput.sessionToken)
    ? isValidDevBypassToken(rawInput.sessionToken)
      ? await findOrCreateDevBypassAssistantSession({
          token: rawInput.sessionToken,
          mobile: extractDevBypassMobile(rawInput.sessionToken) ?? "",
          locale,
        })
      : null
    : await findAssistantSession(rawInput.sessionToken);
  if (!session) return { type: "not_verified" };

  const remainingBefore = session.questionLimit - session.questionCount;
  if (remainingBefore <= 0) return { type: "limit_reached" };

  if ((rawInput.fullName && !session.fullName) || (rawInput.serviceSlug && !session.serviceSlug)) {
    try {
      await updateAssistantSessionProfile({ sessionId: session.id, fullName: rawInput.fullName, serviceSlug: rawInput.serviceSlug });
    } catch (error) {
      console.error("[ask-assistant-question] failed to update session profile", error instanceof Error ? error.message : "unknown error");
    }
  }

  const message = typeof rawInput.message === "string" ? rawInput.message.trim() : "";
  if (!message) return { type: "unclear", questionsRemaining: remainingBefore };

  const result = await interpretFreeText({
    message,
    locale,
    sessionToken: rawInput.sessionToken,
    currentStep: rawInput.currentStep ?? "ai_conversation",
    selectedService: rawInput.serviceSlug ?? session.serviceSlug ?? null,
  });

  if (result.type === "unavailable") {
    return { type: "unavailable" };
  }

  await logMessageSafely({ sessionId: session.id, role: "user", content: message });

  const dict = getDictionary(locale);

  if (result.type === "qa") {
    await logMessageSafely({ sessionId: session.id, role: "assistant", content: result.answer });
    const updated = await incrementAssistantSessionQuestionCount(session.id);
    return {
      type: "answer",
      answer: result.answer,
      suggestedStep: null,
      suggestedStepLabel: null,
      suggestedServiceId: null,
      questionsRemaining: Math.max(0, updated.questionLimit - updated.questionCount),
    };
  }

  if (result.type === "intent") {
    const serviceLabel = result.serviceId ? dict.assistantFlow.services.find((service) => service.id === result.serviceId)?.label ?? null : null;
    const labelFn = STEP_LABEL_KEYS[result.step];
    const label = serviceLabel ?? (labelFn ? labelFn(dict) : null);
    const answer = result.responseText ?? label ?? dict.assistantFlow.ui.freeTextUnclearMessage;
    await logMessageSafely({ sessionId: session.id, role: "assistant", content: answer });
    const updated = await incrementAssistantSessionQuestionCount(session.id);
    return {
      type: "answer",
      answer,
      suggestedStep: result.step,
      suggestedStepLabel: label,
      suggestedServiceId: result.serviceId,
      questionsRemaining: Math.max(0, updated.questionLimit - updated.questionCount),
    };
  }

  // "unclear"
  await logMessageSafely({ sessionId: session.id, role: "assistant", content: dict.assistantFlow.ui.freeTextUnclearMessage });
  const updated = await incrementAssistantSessionQuestionCount(session.id);
  return { type: "unclear", questionsRemaining: Math.max(0, updated.questionLimit - updated.questionCount) };
}
