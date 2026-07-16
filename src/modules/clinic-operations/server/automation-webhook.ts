/**
 * Round 2026-07-16 (contract-alignment pass, per Hamid): a single, narrow
 * outbound hook into an external n8n workflow — explicitly NOT a
 * notification system built into this site (no reminders, no SMS
 * scheduling, no retry queue live here). This is the one place that
 * fires two safe, minimal event payloads so an n8n workflow (owned and
 * run outside this repo) can decide what to do with them — e.g. notify
 * staff, queue a reminder, sync a spreadsheet.
 *
 * New top-level module (`clinic-operations`, distinct from
 * `smart-clinic-assistant`) because this is clinic-operations
 * infrastructure, not assistant-flow logic — the assistant and the
 * internal dashboard both call into it.
 *
 * Contract for this file:
 * - No-ops gracefully (resolves, never throws) if `N8N_WEBHOOK_URL` is
 *   unset — most environments will never configure this.
 * - POSTs a small, explicitly-typed JSON payload per event. Never the
 *   full Lead/BookingRequest row, never OTP codes, never AI raw output.
 *   Mobile/full name are deliberately NOT included — see each payload
 *   type's own doc-comment. If a future integration needs them, n8n can
 *   fetch by `leadId`/`bookingRequestId` through a real, separately
 *   authenticated lookup — not by widening this payload.
 * - Adds `Authorization: Bearer <N8N_WEBHOOK_TOKEN>` only if that env var
 *   is also set.
 * - Short timeout (`AbortController`), matching this codebase's existing
 *   outbound-call convention (`ai-gateway-client.ts` 5000ms,
 *   `sms-provider.ts` 8000ms) — this one is lower because it's telemetry,
 *   not a user-facing send.
 * - Never throws back to its caller and never blocks the response the
 *   caller is building — callers fire this with `void sendAutomationEvent(...)`
 *   rather than `await`, exactly so a slow/unreachable n8n instance can
 *   never add latency to a patient-facing booking submission or a
 *   secretary's status-change click.
 * - Logs only safe, minimal text on failure (status code / "timeout" /
 *   generic error name) — never the payload, never the token.
 */

const WEBHOOK_TIMEOUT_MS = 4000;

export type BookingRequestedEvent = {
  event: "booking.requested";
  bookingRequestId: string;
  leadId: string;
  serviceId: string | null;
  /** ISO date-only string, or null when no specific date was set (manual-preferred-time fallback). */
  appointmentDate: string | null;
  selectedSlotId: string | null;
  preferredDate: string | null;
  preferredTimeRange: string | null;
  appointmentStatus: string;
  paymentStatus: string;
  /** ISO datetime string. */
  createdAt: string;
};

export type AppointmentStatusChangedEvent = {
  event: "appointment.status_changed";
  bookingRequestId: string;
  leadId: string;
  oldStatus: string;
  newStatus: string;
  appointmentDate: string | null;
  selectedSlotId: string | null;
  /** ISO datetime string. */
  updatedAt: string;
};

export type AutomationEvent = BookingRequestedEvent | AppointmentStatusChangedEvent;

function isConfigured(): boolean {
  return Boolean(process.env.N8N_WEBHOOK_URL);
}

/**
 * Fire-and-forget by design (see doc-comment above) — callers should call
 * this without `await` (`void sendAutomationEvent(...)`). It is still
 * safe to `await` if a caller ever needs to (e.g. in a test), since every
 * failure path resolves rather than rejects.
 */
export async function sendAutomationEvent(event: AutomationEvent): Promise<void> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;

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
