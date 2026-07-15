# AI Usage Notes

Where and why the Smart Clinic Assistant calls AI, and — more importantly — everywhere it deliberately doesn't. Originally written per Hamid's 2026-07-14 cost/token-discipline brief; updated the same day for the AI Gateway boundary + mobile-verification gating rounds. Read this before adding any new AI call anywhere in this module.

## 0. Two gates, both required, checked independently

Every AI call in this module requires **both**:

1. **A verified mobile session** (docs/adr/0007) — `server/otp/session-guard.ts`'s `isSessionVerified`. Anonymous/unverified traffic cannot reach AI at all, not even to trigger the local-match-fails fallback.
2. **A configured transport** (this round) — either the internal AI Gateway or, in local dev only, a direct OpenAI fallback behind an explicit flag. If neither is configured, AI calls short-circuit before any network attempt.

Both are checked at multiple independent points, not trusted once — see §6.

## 1. Architecture — the direct-OpenAI conflict is now resolved

`SYSTEM_ARCHITECTURE.md` §6/§8 is a **confirmed, non-negotiable** decision: this app must never call OpenAI/Anthropic directly from Iran-hosted production infrastructure — always through the internal AI Gateway. That gateway service still doesn't exist anywhere outside this repo, but the repo's own code no longer conflicts with the rule:

- `src/modules/smart-clinic-assistant/ai/ai-gateway-client.ts` is the **single boundary** every AI call in this module goes through. Nothing else in the module (`intent-detector.ts`, `lead-summary.ts`, any future caller) knows whether it's talking to a real gateway or a dev fallback.
- **Production**: if `INTERNAL_AI_GATEWAY_URL`/`INTERNAL_AI_GATEWAY_TOKEN` are set, calls go to that gateway. If they're **not** set, the call fails closed (`{ok:false, reason:"not-configured"}`) — there is no direct-OpenAI fallback in production, structurally, not just by convention. `ai/config.ts`'s `isDirectOpenAiDevAllowed()` checks `process.env.NODE_ENV === "production"` **first** and returns `false` unconditionally before it even looks at the dev flag's value.
- **Local dev only**: if the gateway isn't configured AND `ALLOW_DIRECT_OPENAI_IN_DEV=true` AND `OPENAI_API_KEY` is set, `src/modules/smart-clinic-assistant/ai/dev-openai-fallback.ts` calls `api.openai.com` directly. This is the **only file in the entire module that knows OpenAI exists** — it's not imported by anything except `ai-gateway-client.ts`.
- Swapping in the real gateway once it's built is a **one-file, zero-call-site change**: point `INTERNAL_AI_GATEWAY_URL`/`TOKEN` at the real service. `intent-detector.ts`, `lead-summary.ts`, and every UI component are already written against the gateway contract and need no changes.

## 2. Exactly which user actions trigger an AI call

| Action | Calls AI? |
|---|---|
| Typing a free-text question in the assistant's landing screen (`GeneralStep`) and submitting it | **Maybe** — only if local keyword matching can't confidently route it, AND the session is verified, AND a transport is configured (see §4) |
| That same free-text message, when it's an open general question rather than a routable request | **Yes** — one call also answers it (Q&A), same call as intent classification |
| Completing a full booking (final submit on the payment step) | **Yes, at most once** — internal staff-only lead-summary generation, after validation and verification succeed |

## 3. Which actions never trigger an AI call

This is the explicit no-AI list — none of these import anything from `ai/` or `server/ai/`:

- Opening or closing the assistant drawer
- Clicking any of the 5 main-menu buttons (consultation booking, service selection, triage, cost question, follow-up)
- Language switching
- Selecting a service card
- Answering triage questions (fixed per-service question sets — routing doesn't need AI to know the next question)
- Contact-form validation (client- or server-side)
- Choosing an appointment day/time preference
- Payment-preparation UI / choosing a currency
- Reaching the confirmation screen
- Requesting an OTP code
- Verifying an OTP code

## 4. How the fallback and transport selection work

Tiered, cheapest-and-most-deterministic-first, every tier degrades safely to the next rather than failing:

1. **Local keyword matching** (`server/ai/local-intent-matcher.ts`) — a small, literal fa/en/ar keyword list (cost, before/after, consultation, articles) plus a direct match against the 9 real service names. Zero network calls, zero tokens, no verification needed. Most real questions match here and never reach the verification gate or AI at all.
2. **Session verification gate** — if local matching misses, the caller must have a verified `AssistantSession`. Unverified → `{ type: "unclear" }`, no cache lookup, no gateway call attempted.
3. **In-memory cache** (`server/ai/response-cache.ts`) — keyed by normalized message + locale, 6h TTL, capped at 200 entries. A second visitor asking an identical already-seen question costs zero additional tokens or gateway calls.
4. **Transport selection** (`ai/ai-gateway-client.ts`'s `callAiGateway`) — in order: gateway configured → call it (5s timeout); else dev-OpenAI-fallback allowed → call it (5s timeout, dev only); else → `{ok:false, reason:"not-configured"}`, no network attempt at all.
5. **Deterministic UI fallback** — any failure at step 4 (not configured, timeout, non-2xx, unparseable output) becomes `{ type: "unclear" }` for free-text, or `null` for the lead summary. `GeneralStep` shows a short inline "couldn't quite understand that" message with the 5 menu buttons still available; `submitBookingRequest` completes the booking normally regardless. The assistant is never blocked, never crashes, never shows a raw error to a patient.

## 5. Gateway request/response contract

Two task types, defined in `ai/types.ts`:

**`classify_assistant_message`**
- Input: `{ locale, currentStep, selectedService, userMessage (capped 500 chars), verified: true }`
- Output: `{ intent, selectedService, confidence, shouldAskFollowup, suggestedNextStep, safetyFlag, responseText? }`
- A `safetyFlag` or `confidence < 0.4` both route to the safe deterministic menu (`{ type: "unclear" }`) rather than acting on an uncertain or clinically-sensitive classification.

**`generate_lead_summary`**
- Input: `{ selectedService, triageAnswers, ageRange, preferredContactMethod, leadStatus, appointmentPreference: { preferredDay, preferredTimeRange }, locale }`
- Output: `{ shortSummary, patientIntent, selectedService, riskNotes, suggestedFollowUp, leadPriority: "low"|"medium"|"high" }`

Both request/response envelopes are `{ task, input }` → `{ output }` over plain `fetch`, `Authorization: Bearer <INTERNAL_AI_GATEWAY_TOKEN>`, 5s `AbortController` timeout. No SDK dependency added for either the gateway client or the dev-OpenAI fallback.

**Full endpoint contract** (what a real gateway service must implement — see `docs/deployment.md` §6 for the deployment-facing version of this same table):

| | |
|---|---|
| Method | `POST` to `INTERNAL_AI_GATEWAY_URL` exactly as configured |
| Headers | `Content-Type: application/json`, `Authorization: Bearer <INTERNAL_AI_GATEWAY_TOKEN>` |
| Success | `200` + `{ "output": <shape above> }` — a 2xx with no `output` field is treated as `invalid-response`, never assumed successful |
| Failure | Any non-2xx → `{ ok: false, reason: "http-error" }`, status code logged, body never logged |
| Timeout | 5000ms → `{ ok: false, reason: "timeout" }` |

**Status: the gateway service itself does not exist anywhere yet** (SYSTEM_ARCHITECTURE.md §6/§8 describes it as a separate n8n+gateway service — not code in this repo). This is a real blocker before doctor review if live AI features are wanted at launch — see `docs/deployment.md` §8. Verify a real deployed gateway with `npm run verify:ai-gateway` (`scripts/verify-ai-gateway.ts`) — sends one minimal synthetic, non-patient test message through the actual `callAiGateway` function and reports pass/fail; never fakes a pass if unconfigured or unreachable.

## 6. How session verification gates AI, concretely

Checked at **three independent points**, not trusted once:

1. **Client** (`AssistantDrawer`'s `runGated`) — the UI itself won't let an unverified user reach the free-text ask, triage completion, general-consultation path, or final submit without first completing OTP verification.
2. **Server entry points** (`interpret-free-text.ts`, `submit-booking-request.ts`) — each independently calls `isSessionVerified(sessionToken)` against the real `AssistantSession` table before doing anything else, including before touching the local keyword matcher. A stale or tampered client can't skip this.
3. **`callAiGateway` itself** — takes `{ sessionVerified: boolean }` as an explicit, passed-through parameter (never re-derived, never assumed) and returns `{ ok: false, reason: "not-verified" }` immediately if it's `false` — before checking transport configuration, before any network attempt.

## 7. What data IS sent to AI

**Intent classification / Q&A call** (`intent-detector.ts`):
- The free-text message itself (capped at 500 characters)
- The route locale (`fa`/`en`/`ar`)
- The current step key (always `"general"` — free-text only exists on the landing screen)
- A bare `selectedService` key when one is already selected (e.g. `rhinoplasty`), not a translated label

**Lead-summary call** (`lead-summary.ts`), sent at most once per completed booking:
- `selectedService` (a bare key, e.g. `"rhinoplasty"`)
- Triage question ids + the patient's own free-text answers
- `ageRange` (a range string the patient typed, e.g. "25–35")
- `preferredContactMethod` **type only** (`"phone"` / `"whatsapp"` / `"instagram"` — a category, not a value)
- The already locally-computed `leadStatus`
- Appointment day/time preference
- The locale

## 8. What is intentionally NEVER sent

- **Mobile number** — never, to either call.
- **Full name** — never sent to either call.
- **City** — not sent to the lead-summary call.
- **OTP code or OTP hash** — never sent anywhere; AI never sees verification internals, only the boolean fact that verification passed.
- **`AssistantSession` raw internals** beyond what's needed for the server-side `isSessionVerified` check itself — the session token never leaves the server, and never becomes part of any AI payload.
- **`notes`** (the patient's own free-text notes field) — deliberately excluded from the lead-summary payload; it's patient-authored free text that could incidentally contain a name or number the patient typed themselves.
- The full `fa.ts`/`en.ts`/`ar.ts` dictionaries — never sent anywhere. Only bare keys/ids.
- Full page/homepage content — never sent.
- Admin/internal route data (`/internal/assistant-leads` and its underlying queries) — entirely separate code path, never touches `ai/`.

## 9. Estimated max AI calls per completed booking flow

**Zero, in the common case.** A patient who clicks through the 5-button menu → picks a service → answers triage → fills contact info → picks a time → picks a currency → submits: that's the entire deterministic path, and it makes **zero** AI calls until the very last step (and even then, only if a transport is configured).

**+1** if they type a free-text question first, local keyword matching can't confidently route it, and it isn't already cached — one call, which either routes them into the same deterministic path above or answers their question directly. Requires a verified session; unverified users never reach this call.

**+1** at final submit, attempted at most once (lead summary) — fails silently and safely if unconfigured/unavailable/unverified, never retried, never repeated.

**Worst realistic case: 2 AI calls for one completed booking.** No retries, no polling, no per-keystroke calls, no streaming.

## 10. Privacy safeguards summary

- No AI call is possible without a server-validated verified session (§6).
- No AI call is possible without a configured transport, and production can never silently fall back to direct OpenAI (§1, §4).
- Every payload is hand-built field-by-field (§7) — never a raw object spread of form/session data — so a new field added elsewhere in the app can't accidentally leak into an AI payload.
- No secrets (API keys, gateway tokens) are ever logged — only HTTP status codes on failure (e.g. `[dev-openai-fallback] non-2xx response 401`).
