"use server";

import { isSupportedLocale, type Locale } from "@/i18n/locales";

import { detectFreeTextIntent, type FreeTextResult } from "./ai/intent-detector";
import { isSessionVerified } from "./otp/session-guard";

/**
 * The one entry point for the assistant's free-text input (`GeneralStep`
 * — see that file). Every other assistant interaction (buttons, service
 * cards, triage fields, appointment/payment forms) is handled entirely
 * client-side or via `submitBookingRequest`/`lead-repository.ts` and
 * never reaches this file or any AI code — see AI_USAGE_NOTES.md.
 *
 * Round 2026-07-14 (docs/adr/0007): requires a verified `sessionToken`.
 * The client (`AssistantDrawer`) already gates this call behind
 * verification, so in practice this should always receive a valid token
 * — the check here is defense-in-depth against a stale/tampered client
 * state, not the primary gate. On failure, returns `{ type: "unclear" }`
 * rather than a distinct error — the client never reaches this function
 * without already believing it's verified, so this is a genuine edge
 * case, not a path the UI needs to specially explain.
 *
 * Round 2026-07-14, same day (AI Gateway boundary pass): the real
 * `verified` boolean from `isSessionVerified` is now threaded into
 * `detectFreeTextIntent`, which threads it into `callAiGateway` — an
 * unverified session can never reach the gateway/OpenAI, checked at
 * three independent points (here, and again inside `callAiGateway`
 * itself), not just trusted once.
 */
export async function interpretFreeText(rawInput: { message: string; locale: string; sessionToken: string | null }): Promise<FreeTextResult> {
  const verified = await isSessionVerified(rawInput.sessionToken);
  if (!verified) {
    return { type: "unclear" };
  }

  const message = typeof rawInput.message === "string" ? rawInput.message.trim() : "";
  const locale: Locale = isSupportedLocale(rawInput.locale) ? rawInput.locale : "fa";

  if (!message) {
    return { type: "unclear" };
  }

  return detectFreeTextIntent(message, locale, verified);
}
