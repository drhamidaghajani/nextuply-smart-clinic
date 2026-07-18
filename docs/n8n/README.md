# n8n notifications — Sadighi Clinic

Round 2026-07-24 (Internal Operations Lite, Part C, per Hamid). This app sends a small set of **outbound, fire-and-forget events** to an n8n instance you own and run — the app never talks to Melipayamak (or any SMS provider) for these staff notifications itself; n8n does, using the workflow in this folder.

The app-side sender is `src/modules/clinic-operations/server/automation-webhook.ts` (`sendAutomationEvent`). It is a single, narrow POST — not a notification system built into this repo. No reminders, no retry queue, no scheduling live in the app; all of that, if you ever want it, belongs in the n8n workflow, not here.

## What is intentionally out of scope

- No delivery-status tracking back into the app (n8n/Melipayamak failures are only visible in n8n's own execution log).
- No retry/backoff on the app side — one attempt, 4s timeout, then it gives up silently (logs a safe, minimal error line and moves on).
- No templating engine, no multi-language SMS — the workflow's message text is the exact Persian copy from the brief, not locale-driven.
- No queue — if n8n is down when an event fires, that specific notification is lost (the booking/urgent request itself is still saved in the app's own database regardless — this is a courtesy notification, not the system of record).

## 1. Import the workflow

1. In n8n: **Workflows → Import from File**, pick `docs/n8n/sadighi-clinic-notifications.workflow.json`.
2. Open the **Webhook** node. Create a **Header Auth** credential (n8n's built-in credential type):
   - Name: `Authorization`
   - Value: `Bearer <your N8N_WEBHOOK_TOKEN>` — pick any long random string, put the SAME value in the app's `N8N_WEBHOOK_TOKEN` env var (see §3).
   - Attach that credential to the Webhook node (it's referenced by a placeholder id in the JSON — you must re-select it after import; n8n never stores credential secrets inside workflow JSON, so this step can't be automated by the file alone).
3. Activate the workflow. Copy the Webhook node's **Production URL** — that's your app's `N8N_WEBHOOK_URL`.

## 2. Environment variables to set in n8n

Set these in n8n's own environment (Settings → Environment Variables, or however your n8n deployment injects env vars) — **never inside the workflow JSON itself**:

| Variable | Purpose |
|---|---|
| `MELIPAYAMAK_USERNAME` | Melipayamak panel username, used by the HTTP Request nodes. |
| `MELIPAYAMAK_API_KEY` | Melipayamak panel password/API key. |
| `MELIPAYAMAK_SENDER_NUMBER` | Your approved Melipayamak line number (the SMS "from" number). |
| `SECRETARY_NOTIFY_MOBILE` | Mobile number that receives `booking.requested` and (optionally) `appointment.status_changed` texts. |
| `OWNER_NOTIFY_MOBILE` | Mobile number that additionally receives `urgent.requested` texts (urgent cases notify BOTH the secretary and the owner). |
| `INTERNAL_DASHBOARD_BASE_URL` | Your site's origin, e.g. `https://sadighi.nextuply.com` — the app sends `dashboardUrl` as a RELATIVE path (`/fa/internal/appointments#booking-...`); the workflow prefixes it with this variable to build a clickable link in the SMS text. |

> The Melipayamak `SendSMS` free-text endpoint used by the HTTP Request nodes was **not independently re-verified against a live account in this round** — only the app's own OTP endpoint (`BaseServiceNumber`, pattern-based, a different Melipayamak API) has been confirmed working in production. Check the exact field names/response shape in your Melipayamak panel/docs before relying on this for real notifications, and adjust the HTTP Request nodes if they differ.

## 3. Environment variables to set in the app

Set these wherever the app's own env vars live (`.env.production` / your deployment's secret store):

| Variable | Purpose |
|---|---|
| `N8N_WEBHOOK_URL` | The Webhook node's Production URL from n8n (see §1.3). If unset, `sendAutomationEvent` no-ops silently — no events are sent, nothing breaks. |
| `N8N_WEBHOOK_TOKEN` | Must match the Header Auth credential's value in n8n (see §1.2) — sent as `Authorization: Bearer <token>`. If unset, requests are sent WITHOUT an Authorization header (only safe if your n8n webhook doesn't require it — not recommended for anything internet-reachable). |

Neither variable is required for the app to function — every booking/urgent/status-change flow already works today with `N8N_WEBHOOK_URL` unset (this has been true since the original 2026-07-16 round); these variables only turn ON the staff-notification side-channel.

## 4. Events sent

| Event | Fired from | When |
|---|---|---|
| `booking.requested` | `submit-booking-request.ts` | A patient's booking request is successfully persisted. |
| `urgent.requested` | `log-handoff.ts` (called from the assistant's Urgency & Safety Router, `assistant-drawer.tsx`) | The assistant detects an urgent/safety/trauma message AND the patient has a verified session (a `mobile` to actually call back) — see the 2026-07-23 "Urgency & Safety Router" round. Never fires for an unverified urgent message; there's nothing to notify staff with yet. |
| `appointment.status_changed` | `admin-actions.ts`'s `updateAppointmentStatusAction` | A secretary/owner changes a booking's status from `/internal/appointments`, and the status actually changed. |

Every event shares `eventId` (a UUID, for de-duplicating a retried delivery on the n8n side if you ever add retries), `createdAt` (ISO datetime), and `clinicId`. See `automation-webhook.ts`'s exported types (`BookingRequestedEvent`, `UrgentRequestedEvent`, `AppointmentStatusChangedEvent`) for the exact field list of each — the workflow's field references (`{{$json.body.fieldName}}`) match those types exactly.

**Privacy**: no OTP code, no password/session token, no raw AI provider error, and no full database row is ever included — only the specific fields each event type declares. `transcriptSummary`, when present, is a short staff-facing AI-generated summary (see `ai/lead-summary.ts`), never the raw conversation transcript.

## 5. Test with curl

Once `N8N_WEBHOOK_URL`/`N8N_WEBHOOK_TOKEN` are set and the workflow is active, you can fire a synthetic event directly at n8n without going through the app at all:

```bash
curl -X POST "$N8N_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $N8N_WEBHOOK_TOKEN" \
  -d '{
    "event": "booking.requested",
    "eventId": "test-1",
    "createdAt": "2026-07-24T10:00:00.000Z",
    "clinicId": "dr-sadighi-clinic",
    "bookingRequestId": "test-booking",
    "leadId": "test-lead",
    "serviceSlug": "advanced-dental-implant",
    "serviceLabel": "ایمپلنت دندان پیشرفته",
    "fullName": "بیمار تست",
    "mobile": "09120000000",
    "selectedTimeLabel": "شنبه، ۹ تا ۱۳",
    "status": "requested",
    "urgency": false,
    "transcriptSummary": null,
    "dashboardUrl": "/fa/internal/appointments#booking-test-booking"
  }'
```

Swap `"event"` for `"urgent.requested"` or `"appointment.status_changed"` (with that event's own fields — see the table above) to test the other two branches. A successful call returns `{"ok":true}` immediately (the workflow's `responseMode` is `onReceived` — it doesn't wait for the SMS send to finish before responding, matching the app's own fire-and-forget philosophy).

To test the real app → n8n path end-to-end, submit a real booking request through the Smart Clinic Assistant on a deployment with both env vars set, then check n8n's execution log.
