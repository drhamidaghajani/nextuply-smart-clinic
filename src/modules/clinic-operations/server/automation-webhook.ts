import { randomUUID } from "node:crypto";

/**
 * Round 2026-07-16 (contract-alignment pass, per Hamid): a single, narrow
 * outbound hook into an external n8n workflow — explicitly NOT a
 * notification system built into this site (no reminders, no SMS
 * scheduling, no retry queue live here). This is the one place that
 * fires safe, minimal event payloads so an n8n workflow (owned and run
 * outside this repo) can decide what to do with them — e.g. notify
 * staff, queue a reminder, sync a spreadsheet. Import-ready workflow:
 * `docs/n8n/sadighi-clinic-notifications.workflow.json` (see
 * `docs/n8n/README.md`).
 *
 * Round 2026-07-24 (Internal Operations Lite, Part C/D, per Hamid's
 * exact payload spec): adds `urgent.requested` and restructures
 * `booking.requested` to the fields his brief lists explicitly —
 * `fullName`/`mobile`/`serviceLabel`/`selectedTimeLabel`/`dashboardUrl`
 * are now INCLUDED. This reverses this file's OWN previous stance
 * ("Mobile/full name are deliberately NOT included") — flagged here
 * rather than silently changed: the earlier decision was a privacy
 * default with no concrete consumer; this round's explicit requirement
 * is a real one (n8n's SMS templates need a name/number to notify staff
 * usefully), and the payload still only ever reaches YOUR OWN n8n
 * instance over HTTPS with a bearer token — not a third party. If that
 * instance is ever NOT fully trusted/controlled, this is the file to
 * revisit.
 *
 * Contract for this file (unchanged from the original round):
 * - No-ops gracefully (resolves, never throws) if `N8N_WEBHOOK_URL` is
 *   unset — most environments will never configure this.
 * - POSTs a small, explicitly-typed JSON payload per event. Never an OTP
 *   code, never a secret, never raw AI provider errors, never the full
 *   Lead/BookingRequest row — see each payload type below for the exact
 *   field list.
 * - Adds `Authorization: Bearer <N8N_WEBHOOK_TOKEN>` only if that env var
 *   is also set.
 * - Short timeout (`AbortController`), matching this codebase's existing
 *   outbound-call convention (`ai-gateway-client.ts` 5000ms,
 *   `sms-provider.ts` 8000ms) — this one is lower because it's telemetry,
 *   not a user-facing send.
 * - Never throws back to its caller and never blocks the response the
 *   caller is building — callers fire this with `void sendAutomationEvent(...)`
 *   rather than `await`, exactly so a slow/unreachable n8n instance can
 *   never add latency to a patient-facing booking submission, an urgent
 *   safety response, or a secretary's status-change click.
 * - Logs only safe, minimal text on failure (status code / "timeout" /
 *   generic error name) — never the payload, never the token.
 */

const WEBHOOK_TIMEOUT_MS = 4000;

/** Every event carries these — `eventId` (idempotency on the n8n side, e.g. dedup a retried delivery) and `clinicId` are new in this round, added to every event uniformly rather than per-type. */
interface AutomationEventBase {
  eventId: string;
  createdAt: string;
  clinicId: string;
}

/**
 * `dashboardUrl` is a RELATIVE path (e.g. `/fa/internal/appointments#booking-<id>`),
 * never an absolute URL — the app doesn't know its own public origin
 * reliably in every deployment, and doesn't need to: the n8n workflow
 * prefixes it with its OWN `INTERNAL_DASHBOARD_BASE_URL` environment
 * variable when building the SMS text (see `docs/n8n/README.md`).
 */
export type BookingRequestedEvent = AutomationEventBase & {
  event: "booking.requested";
  bookingRequestId: string;
  leadId: string;
  serviceSlug: string | null;
  serviceLabel: string | null;
  fullName: string;
  mobile: string;
  selectedTimeLabel: string | null;
  status: string;
  urgency: false;
  /** Short staff-facing AI summary, when one was generated for this lead — see `ai/lead-summary.ts`. Never the raw conversation. */
  transcriptSummary: string | null;
  dashboardUrl: string;
};

/**
 * Round 2026-07-24 (Urgency & Safety Router follow-up) — fired when the
 * assistant's deterministic urgency route (see `assistant-drawer.tsx`'s
 * `isUrgencyPhrase`) is triggered AND the patient is identified/verified
 * enough to actually contact (a verified `AssistantSession` exists — see
 * `log-handoff.ts`'s call site). Never fired for an unverified urgent
 * message, since there's no `mobile` to notify staff with yet.
 */
export type UrgentRequestedEvent = AutomationEventBase & {
  event: "urgent.requested";
  fullName: string | null;
  mobile: string;
  activeService: string | null;
  activeTopic: string;
  urgency: true;
  urgentReason: string;
  userMessage: string;
  dashboardUrl: string;
  transcriptSummary: string | null;
};

export type AppointmentStatusChangedEvent = AutomationEventBase & {
  event: "appointment.status_changed";
  bookingRequestId: string;
  leadId: string;
  fullName: string | null;
  oldStatus: string;
  newStatus: string;
  dashboardUrl: string;
};

export type AutomationEvent = BookingRequestedEvent | UrgentRequestedEvent | AppointmentStatusChangedEvent;

/** Callers build the event without `eventId`/`createdAt` — this file stamps both uniformly so every call site can't drift on format. */
export type AutomationEventInput =
  | Omit<BookingRequestedEvent, "eventId" | "createdAt">
  | Omit<UrgentRequestedEvent, "eventId" | "createdAt">
  | Omit<AppointmentStatusChangedEvent, "eventId" | "createdAt">;

function isConfigured(): boolean {
  return Boolean(process.env.N8N_WEBHOOK_URL);
}

/**
 * Fire-and-forget by design (see doc-comment above) — callers should call
 * this without `await` (`void sendAutomationEvent(...)`). It is still
 * safe to `await` if a caller ever needs to (e.g. in a test), since every
 * failure path resolves rather than rejects.
 */
export async function sendAutomationEvent(input: AutomationEventInput): Promise<void> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;

  const event: AutomationEvent = { ...input, eventId: randomUUID(), createdAt: new Date().toISOString() } as AutomationEvent;

  const token = process.env.N8N_WEBHOOK_TOKEN || undefined;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(event),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("[automation-webhook] non-2xx response", response.status, event.event);
    }
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    console.error("[automation-webhook] request failed", isAbort ? "timeout" : "error", event.event);
  } finally {
    clearTimeout(timeoutId);
  }
}

export { isConfigured as isAutomationWebhookConfigured };
