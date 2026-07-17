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
 * entry point for the post-OTP, up-to-3-question AI conversation. Reuses
 * `interpretFreeText` unchanged (does NOT touch `ai-gateway-client.ts`/
 * `ai/config.ts`) — this file is a caller of the existing AI boundary,
 * not a new one.
 *
 * Round 2026-07-18 (conversation-first UX pass, per Hamid — free-text
 * answers were falling back to weak generic copy like "use the buttons
 * above" even for obvious questions): `buildGroundedAnswer` below now
 * answers deterministic-content intents (cost, care, before/after,
 * articles, consultation intro) with the REAL grounded copy from the
 * dictionary instead of a bare step title — this is content lookup, not
 * reasoning, so it doesn't need (and doesn't use) the AI Gateway. Cost
 * questions specifically are tailored per service (item 9) when a
 * service was recognized (either by the local keyword matcher or the AI
 * classification) — see `local-intent-matcher.ts`'s doc-comment for why
 * the old matcher lost that service context.
 *
 * The 3-question limit is enforced here, server-side, against
 * `AssistantSession.questionCount`/`questionLimit` — the authoritative
 * check; the client only mirrors it for display. A transport failure
 * (`"unavailable"`) never consumes a question — that's this system's
 * fault, not the patient using up their 3 questions. An ambiguous/
 * low-confidence answer (`"unclear"`) DOES consume one — the assistant
 * genuinely attempted an answer, now with a real clarifying fallback
 * (item 8) instead of a dead end.
 *
 * Every question and every answer shown to the patient is persisted via
 * `createAssistantMessage` — best-effort (wrapped so a logging failure
 * never blocks the actual answer from reaching the patient), same
 * "never crash a patient-facing flow over internal persistence" rule
 * this codebase applies everywhere else (see `submit-booking-request.ts`).
 */

export type AskAssistantQuestionResult =
  | { type: "answer"; answer: string; suggestedStep: AssistantStep | null; suggestedServiceId: ServiceId | null; questionsRemaining: number }
  | { type: "unclear"; questionsRemaining: number }
  | { type: "unavailable" }
  | { type: "limit_reached" }
  | { type: "not_verified" };

/**
 * Steps that resolve to a real, content-grounded ANSWER (no AI-authored
 * `responseText` needed) rather than a structured card the client should
 * navigate to.
 *
 * Round 2026-07-20 (production UX fix, per Hamid — bug: "the assistant
 * gives irrelevant fallback answers to clear implant questions"):
 * `triage`/`contact_capture` used to fall straight through to `null` here
 * (the doc-comment used to say they mean "start booking," handled by the
 * client's `onNavigateToSuggested` instead) — but `local-intent-
 * matcher.ts` returns exactly these two steps for ANY free-text service
 * mention ("ایمپلنت برای من مناسبه؟", "برای ایمپلنت باید چی کار کنم؟"),
 * which is virtually always a QUESTION, not a request to jump straight
 * into a booking card. Answering `null` there meant every plain implant
 * question fell all the way through to the generic fallback prompt —
 * the actual bug. Now answered with `serviceGuidance` (a real, non-
 * diagnostic "what does this involve" explanation, item 3) when curated
 * content exists for that service, falling back to `costGuidance` (still
 * genuinely useful — it explains the same variables) rather than the
 * unrelated fallback prompt.
 */
function buildGroundedAnswer(step: AssistantStep, serviceId: ServiceId | null, dict: ReturnType<typeof getDictionary>): string | null {
  const flow = dict.assistantFlow;
  switch (step) {
    case "cost_question":
      return (serviceId && flow.costGuidance.byService[serviceId]) || flow.costGuidance.generic;
    case "triage":
    case "contact_capture":
      if (!serviceId) return null;
      return flow.serviceGuidance.byService[serviceId] || flow.costGuidance.byService[serviceId] || flow.costGuidance.generic;
    case "care_guidance":
      return flow.steps.careGuidance.body;
    case "before_after":
      return flow.steps.beforeAfter.body;
    case "articles":
      return flow.steps.articles.body;
    case "consultation_booking":
      return flow.steps.consultationBooking.intro;
    case "image_upload_future":
      return flow.steps.imageUploadFuture.notice;
    default:
      return null;
  }
}

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
    currentStep: rawInput.currentStep ?? "conversation",
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
      suggestedServiceId: null,
      questionsRemaining: Math.max(0, updated.questionLimit - updated.questionCount),
    };
  }

  if (result.type === "intent") {
    const grounded = buildGroundedAnswer(result.step, result.serviceId, dict);
    // A "triage"/"contact_capture"/"service_selection" suggestion has no
    // grounded text by design (see `buildGroundedAnswer`'s doc-comment) —
    // give the patient a short, honest transition line instead of
    // silence, and let the client's "مشاهده"/service chip do the actual
    // navigation into that booking step.
    const answer = grounded ?? result.responseText ?? dict.assistantFlow.aiConversation.fallbackPrompt;
    await logMessageSafely({ sessionId: session.id, role: "assistant", content: answer });
    const updated = await incrementAssistantSessionQuestionCount(session.id);
    return {
      type: "answer",
      answer,
      suggestedStep: result.step,
      suggestedServiceId: result.serviceId,
      questionsRemaining: Math.max(0, updated.questionLimit - updated.questionCount),
    };
  }

  // "unclear" — item 8: a real clarifying fallback, not a dead end.
  await logMessageSafely({ sessionId: session.id, role: "assistant", content: dict.assistantFlow.aiConversation.fallbackPrompt });
  const updated = await incrementAssistantSessionQuestionCount(session.id);
  return { type: "unclear", questionsRemaining: Math.max(0, updated.questionLimit - updated.questionCount) };
}
