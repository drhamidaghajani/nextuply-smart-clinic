# 0007. OTP mobile verification gates AI access and booking submission

Status: Accepted
Date: 2026-07-14

## Context

Hamid's brief: the Smart Clinic Assistant must not let anonymous traffic consume OpenAI tokens or generate low-quality leads. Free-text AI conversation, completing triage into contact capture, requesting a consultation, and submitting a booking request must all require a verified mobile number first — via a real OTP flow, not a login wall. No SMS provider exists in this repo yet (confirmed: `application/sms-events.ts` is a pure no-op, no SMS env var anywhere).

This extends, not replaces, `docs/adr/0004-assistant-persistence-schema.md`'s persistence approach and `docs/adr/0006`'s AI cost-control gate — this ADR is the layer that sits in front of both.

## Decision

- **Two new tenant-owned Prisma models**: `OtpCode` (mobile, `codeHash` — never the raw code, `purpose`, `expiresAt`, `consumedAt`, `attempts`) and `AssistantSession` (mobile, `verifiedAt`, `locale`). Same tenancy convention as every other model (`clinicId` + index), same offline-safe verification approach as ADR-0004 (`prisma validate`/`generate`/`migrate diff`, no live DB in this environment).
- **No in-memory store as a production fallback**, per explicit instruction. If `DATABASE_URL` isn't configured, OTP verification is honestly **unavailable** (shows the required fallback message) — it does not silently downgrade to a fake in-process store that would reset on every deploy and can't work across multiple server instances.
- **A narrow, explicitly-labeled dev bypass** is the one exception: when `NODE_ENV !== "production"` AND no SMS provider is configured, `requestOtp`/`verifyOtp` accept a fixed dev code without touching the database at all — this is how the flow is verified in this sandbox (no live DB, no real SMS provider, no way to receive a real code). It is structurally incapable of activating in production (hard `NODE_ENV` check) and the UI labels it visibly ("🔧 dev mode"), never claims a real SMS was sent.
- **Session enforcement is server-side, not just a UI gate.** `verifyOtp` returns an opaque `sessionToken` (the `AssistantSession` row's own id — no JWT/signing library added, matching this project's "avoid unnecessary dependencies" rule). Every gated Server Action (`interpretFreeText`, `submitBookingRequest`) re-validates that token server-side before doing anything AI-related or persisting a submission. A client that fakes "I'm verified" in its own React state gets nothing — the server never trusts client-asserted verification.
- **OTP hashing uses Node's built-in `crypto` (`scrypt`)**, not a new dependency (bcrypt/argon2) — justified because OTP codes are short-lived (5 min), numeric, and attempt-limited (5 tries), which is the standard real-world OTP threat model; a slow KDF's main benefit (resisting offline brute-force of a stolen hash database) matters less here than it would for a login password, and `scrypt` is already in Node's standard library, so nothing new is added.
- **Four gate points**, chosen to match "start the flow freely, verify before it becomes a real lead," not to gate every click: (1) submitting the free-text input, (2) completing triage → moving into contact capture, (3) choosing "general consultation" → moving directly into contact capture, (4) the actual booking submission (defense-in-depth — by the time this is reached, 2/3 should have already gated it, but it's re-checked server-side regardless of how the client got here). Viewing/starting triage, viewing service cards, and the informational steps (cost/before-after/articles) all remain fully open, per the explicit allow-list.
- **Verification interrupts, never restarts, the flow.** The drawer stores the exact pending action (a closure) when a gate blocks it, shows `PhoneVerificationStep`, and re-invokes that exact closure on success — already-selected service/triage answers are untouched (they live in `useAssistantFlow`'s reducer, which this feature never resets).
- **The OTP-verified mobile number pre-fills (not force-locks) the contact-capture form's mobile field** — avoids asking for the same number twice while still allowing a correction; noted as a real, deliberate judgment call (a corrected number wouldn't itself be OTP-verified) rather than silently assumed ideal.

## Consequences

- Until a real SMS provider is chosen and connected, this feature is **not usable in production** — it will honestly show the required fallback message ("در حال اتصال به سامانه پیامک است...") rather than pretend to work. This is the intended, honest behavior, not a bug to silently patch around.
- `AssistantSession` has no hard expiry in this pass (a verified session stays valid once created) — flagged as a real, revisitable choice; a TTL is trivial to add once real usage patterns exist to tune it against.
- The dev-bypass code path must be deleted or hard-disabled before this ever reaches a production build with `NODE_ENV=production` unset/misconfigured — it already can't activate under `NODE_ENV=production`, but this is called out explicitly as a pre-launch checklist item, not assumed self-evident.
