import { callAiGateway } from "../../ai/ai-gateway-client";
import type { ClassifyAssistantMessageOutput } from "../../ai/types";
import type { Locale } from "@/i18n/locales";

import type { AssistantStep, ServiceId } from "../../application/types";
import { SERVICE_IDS } from "../../application/types";
import { matchLocally } from "./local-intent-matcher";
import { cacheKey, getCached, setCached } from "./response-cache";

export type FreeTextResult =
  | { type: "intent"; step: AssistantStep; serviceId: ServiceId | null }
  | { type: "qa"; answer: string }
  | { type: "unclear" };

/** Below this, treat the model's classification as too uncertain to route on — falls back to `"unclear"` (the safe, deterministic-menu direction) rather than acting on a low-confidence guess. */
const MIN_CONFIDENCE = 0.4;

function isKnownServiceId(value: unknown): value is ServiceId {
  return typeof value === "string" && (SERVICE_IDS as readonly string[]).includes(value);
}

function toFreeTextResult(output: ClassifyAssistantMessageOutput): FreeTextResult {
  // Round 2026-07-14 (AI Gateway boundary pass): a `safetyFlag` or
  // low-confidence result both route to the safe deterministic menu
  // rather than acting on an uncertain or clinically-sensitive
  // classification — same "err toward a human glance, not an AI guess"
  // principle `lead-status.ts`'s risk-keyword heuristic already follows.
  if (output.safetyFlag || output.confidence < MIN_CONFIDENCE) {
    return { type: "unclear" };
  }
  if (output.intent === "qa") {
    return output.responseText?.trim() ? { type: "qa", answer: output.responseText.trim() } : { type: "unclear" };
  }
  if (output.intent === "unclear") {
    return { type: "unclear" };
  }
  return {
    type: "intent",
    step: output.intent,
    serviceId: isKnownServiceId(output.selectedService) ? output.selectedService : null,
  };
}

/**
 * Local-first, AI-fallback — see `local-intent-matcher.ts` and
 * AI_USAGE_NOTES.md for the full policy. This is the ONLY function in
 * this module that may reach the AI Gateway for a patient-facing
 * interaction; every other assistant step (validation, service-selection
 * buttons, appointment/payment/confirmation, OTP request/verify) never
 * reaches this file at all.
 *
 * `sessionVerified` is threaded through (not re-derived here) — the
 * caller (`interpret-free-text.ts`) already did the real
 * `isSessionVerified` lookup; `callAiGateway` re-checks the boolean
 * itself too (belt-and-suspenders, see that file).
 */
export async function detectFreeTextIntent(message: string, locale: Locale, sessionVerified: boolean): Promise<FreeTextResult> {
  const localMatch = matchLocally(message, locale);
  if (localMatch) {
    return { type: "intent", step: localMatch.step, serviceId: localMatch.serviceId };
  }

  if (!sessionVerified) {
    return { type: "unclear" };
  }

  const key = cacheKey(["intent", locale, message]);
  const cached = getCached<FreeTextResult>(key);
  if (cached) return cached;

  const cappedMessage = message.slice(0, 500); // hard cap — this is a short-question UI, not a chat transcript; also bounds worst-case token cost.
  const result = await callAiGateway(
    "classify_assistant_message",
    {
      locale,
      currentStep: "general", // free-text input only exists on the landing screen — see `general-step.tsx`.
      selectedService: null,
      userMessage: cappedMessage,
      verified: true,
    },
    { sessionVerified }
  );

  if (!result.ok) {
    return { type: "unclear" };
  }

  const finalResult = toFreeTextResult(result.data);
  setCached(key, finalResult);
  return finalResult;
}
