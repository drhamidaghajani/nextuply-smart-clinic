"use server";

import { sendAutomationEvent } from "@/modules/clinic-operations/server/automation-webhook";

import { createAssistantMessage } from "./conversation-repository";
import { findAssistantSession, findOrCreateDevBypassAssistantSession, updateAssistantSessionProfile } from "../otp/otp-repository";
import { extractDevBypassMobile, isDevBypassToken, isValidDevBypassToken } from "../otp/session-guard";

/**
 * Round 2026-07-21 (Smart Clinic Assistant V2, per Hamid — item 13,
 * "human handoff ready"): NOT a full handoff/ticketing system — just
 * records that a handoff was recommended and why, reusing the EXISTING
 * `AssistantMessage` log (a `role: "system"` row) rather than a new
 * table, so no Prisma migration is needed for this. Staff see it via
 * `conversation-transcript.tsx`'s existing per-session message list
 * (rendered as a distinct badge, not a raw log line — see that file).
 *
 * `reason` is a short, internal, staff-facing phrase (e.g. "درخواست
 * صریح کاربر برای صحبت با انسان") — describes WHY a handoff was
 * suggested, never a raw error, never a secret. `triggeringMessage`
 * (optional) is the patient's own message that triggered it (e.g. their
 * "صحبت با انسان" request) — logged as a normal `role: "user"` entry
 * BEFORE the system note, so staff see what was actually said, not just
 * the reason category. Without it, a handoff that fires on the very
 * first message of a session (no prior counted question) would leave
 * `AssistantSession.questionCount` at 0 and the internal transcript
 * summary hidden — see `conversation-transcript.tsx`'s doc-comment.
 *
 * Round 2026-07-24 (Internal Operations Lite, Part D) — `urgentDetails`
 * (optional) additionally fires the `urgent.requested` automation event
 * (fire-and-forget, no-ops if `N8N_WEBHOOK_URL` unset) once the session
 * lookup above resolves — which is exactly the "identified/verified
 * enough to contact" gate the brief asks for: no session, no `mobile`,
 * no event, same as the system-message log two lines below. Kept as an
 * extension of THIS function rather than a separate call site because
 * both need the exact same session lookup — no reason to do it twice.
 *
 * Round 2026-07-25 (Internal Operations Lite polish, Part D — ROOT CAUSE
 * of the "بیمار ناشناس" bug): `AssistantSession.fullName` is normally
 * filled in by `updateAssistantSessionProfile` inside
 * `ask-assistant-question.ts` — but the urgent router NEVER calls that
 * (it's a deterministic client-side short-circuit specifically so an
 * urgent message doesn't consume one of the patient's 3 questions), so a
 * patient's name — even one they'd already given via the identify/OTP
 * form — was never actually written to the session row for an
 * urgent-first message. `knownFullName` (optional) closes that gap:
 * passed from `assistant-drawer.tsx`'s urgent-flow call sites (which
 * already have `state.leadInfo.fullName` client-side), it's persisted
 * here the same "never overwrite an already-set value" way
 * `ask-assistant-question.ts` does it, so both the transcript AND the
 * dashboard's urgent panel (`listRecentUrgentHandoffs`) see a real name
 * going forward, not just via its own read-side fallback chain.
 */
export async function logHandoffEvent(
  sessionToken: string | null,
  reason: string,
  locale: string,
  triggeringMessage?: string,
  urgentDetails?: { activeService: string | null; activeTopic: string; userMessage: string; dashboardUrl: string },
  knownFullName?: string | null
): Promise<void> {
  if (!sessionToken) return;
  try {
    const session = isDevBypassToken(sessionToken)
      ? isValidDevBypassToken(sessionToken)
        ? await findOrCreateDevBypassAssistantSession({
            token: sessionToken,
            mobile: extractDevBypassMobile(sessionToken) ?? "",
            locale,
          })
        : null
      : await findAssistantSession(sessionToken);
    if (!session) return;
    if (triggeringMessage) {
      await createAssistantMessage({ sessionId: session.id, role: "user", content: triggeringMessage });
    }
    await createAssistantMessage({ sessionId: session.id, role: "system", content: `handoff: ${reason}` });

    let fullNameForEvent = session.fullName;
    if (knownFullName && !session.fullName) {
      await updateAssistantSessionProfile({ sessionId: session.id, fullName: knownFullName });
      fullNameForEvent = knownFullName;
    }

    if (urgentDetails) {
      void sendAutomationEvent({
        event: "urgent.requested",
        clinicId: session.clinicId,
        fullName: fullNameForEvent,
        mobile: session.mobile,
        activeService: urgentDetails.activeService ?? session.serviceSlug,
        activeTopic: urgentDetails.activeTopic,
        urgency: true,
        urgentReason: reason,
        userMessage: urgentDetails.userMessage,
        dashboardUrl: urgentDetails.dashboardUrl,
        transcriptSummary: null,
      });
    }
  } catch (error) {
    console.error("[log-handoff] failed", error instanceof Error ? error.message : "unknown error");
  }
}
