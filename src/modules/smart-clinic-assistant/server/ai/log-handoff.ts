"use server";

import { createAssistantMessage } from "./conversation-repository";
import { findAssistantSession, findOrCreateDevBypassAssistantSession } from "../otp/otp-repository";
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
 */
export async function logHandoffEvent(sessionToken: string | null, reason: string, locale: string, triggeringMessage?: string): Promise<void> {
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
  } catch (error) {
    console.error("[log-handoff] failed", error instanceof Error ? error.message : "unknown error");
  }
}
