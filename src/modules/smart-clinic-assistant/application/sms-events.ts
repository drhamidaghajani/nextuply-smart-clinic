import type { SmsEvent } from "./types";

/**
 * SMS integration points — real call sites wired into the flow (see
 * `submit-booking-request.ts` and `confirmation-step.tsx`), but a no-op
 * until docs/adr's pending SMS-provider decision (PROJECT_UNDERSTANDING.md
 * §13) lands. Logs server-side in dev so the integration points are
 * visibly exercised, never sends anything.
 */
export function triggerSmsEvent(event: SmsEvent, context: Record<string, string>): void {
  // TODO(sms-provider): replace with a real call once a provider is
  // chosen — see SYSTEM_ARCHITECTURE.md §6's SMS/Notification Port.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[sms:noop] ${event}`, context);
  }
}
