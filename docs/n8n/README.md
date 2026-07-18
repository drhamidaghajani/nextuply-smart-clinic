# n8n notifications — Sadighi Clinic

Round 2026-07-24 (Internal Operations Lite, Part C, per Hamid). This app sends a small set of **outbound, fire-and-forget events** to an n8n instance you own and run — the app never talks to Melipayamak (or any SMS provider) for these staff notifications itself; n8n does, using the workflow in this folder.

The app-side sender is `src/modules/clinic-operations/server/automation-webhook.ts` (`sendAutomationEvent`). It is a single, narrow POST — not a notification system built into this repo. No reminders, no retry queue, no scheduling live in the app; all of that, if you ever want it, belongs in the n8n workflow, not here.

> **Round 2026-07-26 update, per Hamid — real execution failure:** the workflow previously used `{{$env.VAR_NAME}}` expressions inside the "Build ... SMS text" Set nodes to inject the dashboard base URL and recipient numbers. Some n8n deployments **block `$env` access inside node expressions** (`N8N_BLOCK_ENV_ACCESS_IN_NODE`), which failed with `access to env vars denied`. The workflow no longer uses `$env` anywhere — Build nodes now read only from the incoming webhook payload, and recipient numbers / Melipayamak credentials are configured directly on the HTTP Request nodes instead. §4 below covers the new setup. If you specifically want the old `$env`-based style back, §4.3 covers that as an explicitly optional, non-default path.

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

## 2. Environment variables to set in the app

Set these wherever the app's own env vars live (`.env.production` / your deployment's secret store):

| Variable | Purpose |
|---|---|
| `N8N_WEBHOOK_URL` | The Webhook node's Production URL from n8n (see §1.3). If unset, `sendAutomationEvent` no-ops silently — no events are sent, nothing breaks. |
| `N8N_WEBHOOK_TOKEN` | Must match the Header Auth credential's value in n8n (see §1.2) — sent as `Authorization: Bearer <token>`. If unset, requests are sent WITHOUT an Authorization header (only safe if your n8n webhook doesn't require it — not recommended for anything internet-reachable). |

Neither variable is required for the app to function — every booking/urgent/status-change flow already works today with `N8N_WEBHOOK_URL` unset (this has been true since the original 2026-07-16 round); these variables only turn ON the staff-notification side-channel.

n8n itself needs no environment variables for this workflow anymore — see §4.

## 3. How the workflow is structured

**Webhook → Switch: event → Build \<event\> SMS text (Set) → Melipayamak HTTP Request(s).**

The three "Build ... SMS text" Set nodes read only from `{{$json.body.*}}` (the webhook payload — see §5's field list) and produce a single output field, `smsText`. They never reference `$env` and never touch recipient numbers or credentials — that split is deliberate, so the text-building logic can't accidentally leak or depend on secrets.

Each Melipayamak HTTP Request node then sends `smsText` on to Melipayamak's own `SendSMS` API, whose own field for the message body happens to also be called `text` — don't confuse the two: n8n's `smsText` (this workflow's field) is mapped onto Melipayamak's `text` (their API's field) via `"text": "={{$json.smsText}}"` in each HTTP node's body parameters.

## 4. Configuring recipients and Melipayamak credentials

### 4.1 Recipient mobile numbers (required, either option)

Each HTTP Request node's body parameters include a static `to` field — open the node and replace the placeholder with the real number:

| Node | Placeholder to replace |
|---|---|
| Melipayamak: send booking SMS | `REPLACE_WITH_SECRETARY_MOBILE` |
| Melipayamak: send urgent SMS (secretary) | `REPLACE_WITH_SECRETARY_MOBILE` |
| Melipayamak: send urgent SMS (owner) | `REPLACE_WITH_OWNER_MOBILE` |
| Melipayamak: send status-change SMS (disabled by default) | `REPLACE_WITH_SECRETARY_MOBILE` |

Urgent requests deliberately notify **both** the secretary and the owner — a genuinely urgent/safety case is over-notified on purpose rather than risk being missed.

### 4.2 Melipayamak credentials — recommended, secure option

`username`/`password`/`from` are **not** in the workflow JSON at all (no placeholders, no `$env` — nothing to leak). Instead, each HTTP Request node has `genericAuthType: httpCustomAuth` and expects an n8n **Custom Auth** credential attached, named `Melipayamak Credentials` in the JSON (re-select it after import, same as the Webhook node's Header Auth credential):

1. In n8n: **Credentials → New → Custom Auth**.
2. Set its JSON body to:
   ```json
   {
     "body": {
       "username": "your-melipayamak-username",
       "password": "your-melipayamak-password-or-api-key",
       "from": "your-approved-sender-number"
     }
   }
   ```
3. Save it, name it `Melipayamak Credentials`, and attach it to all four `Melipayamak: send ...` HTTP Request nodes (booking, urgent ×2, status-change).

n8n merges the credential's `body` object into each request's form-urlencoded body at send time — the secret values live encrypted in n8n's own credential store, never in the workflow JSON, and this path doesn't touch `$env` at all so it works even when `N8N_BLOCK_ENV_ACCESS_IN_NODE` is on.

> The Melipayamak `SendSMS` free-text endpoint used by the HTTP Request nodes was **not independently re-verified against a live account** — only the app's own OTP endpoint (`BaseServiceNumber`, pattern-based, a different Melipayamak API) has been confirmed working in production. Check the exact field names/response shape in your Melipayamak panel/docs before relying on this for real notifications, and adjust the HTTP Request nodes if they differ.

### 4.3 Optional advanced option — using `$env` instead

If your n8n instance does **not** block environment access and you'd rather manage secrets as env vars than as an n8n credential, that's fine — it is explicitly optional, and the shipped workflow does not require it:

1. In your n8n deployment's own environment, set `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` (and, if your n8n version supports it, `N8N_ENV_ACCESS_ALLOWLIST` to restrict which variable names are readable from expressions).
2. Set the actual variables in that same environment (e.g. `MELIPAYAMAK_USERNAME`, `MELIPAYAMAK_API_KEY`, `MELIPAYAMAK_SENDER_NUMBER`, `SECRETARY_NOTIFY_MOBILE`, `OWNER_NOTIFY_MOBILE`).
3. Manually edit each HTTP Request node's `to`/`username`/`password`/`from` fields to `={{$env.VAR_NAME}}` expressions instead of the static placeholders.

This is a manual, self-serve change to your own copy of the imported workflow — the checked-in JSON in this repo intentionally does not ship a dual-mode workaround, since a workflow with `$env` expressions in it is exactly what fails on env-access-blocked instances (the bug this round fixed).

### 4.4 Dashboard link base URL

`dashboardUrl` arrives from the app as a relative path (e.g. `/fa/internal/appointments#booking-test-booking`). Each "Build ... SMS text" Set node prefixes it with a literal placeholder domain — open the three Set nodes and replace `REPLACE_WITH_CLINIC_DOMAIN` in each node's expression with your real domain (e.g. `sadighi.nextuply.com`). This is a plain static string, not a secret, so it's fine directly in the node.

## 5. Events sent

| Event | Fired from | When |
|---|---|---|
| `booking.requested` | `submit-booking-request.ts` | A patient's booking request is successfully persisted. |
| `urgent.requested` | `log-handoff.ts` (called from the assistant's Urgency & Safety Router, `assistant-drawer.tsx`) | The assistant detects an urgent/safety/trauma message AND the patient has a verified session (a `mobile` to actually call back) — see the 2026-07-23 "Urgency & Safety Router" round. Never fires for an unverified urgent message; there's nothing to notify staff with yet. |
| `appointment.status_changed` | `admin-actions.ts`'s `updateAppointmentStatusAction` | A secretary/owner changes a booking's status from `/internal/appointments`, and the status actually changed. Its Build/HTTP node pair is **disabled by default** in the imported workflow — enable both if you want this branch live. |

Every event shares `eventId` (a UUID, for de-duplicating a retried delivery on the n8n side if you ever add retries), `createdAt` (ISO datetime), and `clinicId`. See `automation-webhook.ts`'s exported types (`BookingRequestedEvent`, `UrgentRequestedEvent`, `AppointmentStatusChangedEvent`) for the exact field list of each — the workflow's field references (`{{$json.body.fieldName}}`) match those types exactly.

**Privacy**: no OTP code, no password/session token, no raw AI provider error, and no full database row is ever included — only the specific fields each event type declares. `transcriptSummary`, when present, is a short staff-facing AI-generated summary (see `ai/lead-summary.ts`), never the raw conversation transcript.

## 6. Test with curl

Once `N8N_WEBHOOK_URL`/`N8N_WEBHOOK_TOKEN` are set and the workflow is active (with §4's placeholders replaced), you can fire a synthetic event directly at n8n without going through the app at all.

**`booking.requested`:**

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

**`urgent.requested`:**

```bash
curl -X POST "$N8N_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $N8N_WEBHOOK_TOKEN" \
  -d '{
    "event": "urgent.requested",
    "eventId": "test-2",
    "createdAt": "2026-07-24T10:00:00.000Z",
    "clinicId": "dr-sadighi-clinic",
    "leadId": "test-lead",
    "urgentReason": "درد شدید و تورم پس از عمل",
    "fullName": "بیمار تست",
    "mobile": "09120000000",
    "transcriptSummary": null,
    "dashboardUrl": "/fa/internal/assistant-leads#lead-test-lead"
  }'
```

A successful call returns `{"ok":true}` immediately (the workflow's `responseMode` is `onReceived` — it doesn't wait for the SMS send to finish before responding, matching the app's own fire-and-forget philosophy). Check n8n's execution log to confirm the Build node produced the expected `smsText` and the HTTP node returned a success response from Melipayamak.

To test the real app → n8n path end-to-end, submit a real booking request through the Smart Clinic Assistant on a deployment with both env vars set, then check n8n's execution log.
