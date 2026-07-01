# API_GUIDELINES.md

> Conventions for anything that crosses a network boundary: Server Actions, Route Handlers, webhooks, and the internal AI Gateway contract. Built on [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) §4/§6.

## 1. Server Actions vs. Route Handlers vs. External REST

| Use case | Mechanism |
|---|---|
| Form submission / mutation from within the Next.js app (booking, patient intake, dashboard edits) | **Server Actions** |
| Reads for Server Components | Direct data-access-layer calls (no self-fetch over HTTP) |
| Inbound webhooks (payment gateway, SMS delivery receipts, n8n callbacks) | **Route Handlers** under `app/api/webhooks/*` |
| Future external/partner API (SaaS phase, third-party integrations) | **Route Handlers** under `app/api/v1/*`, versioned from day one even before external consumers exist, so the pattern doesn't need to be retrofitted |

We do not build a REST API for internal app-to-app communication that already has a perfectly good Server Action path — this is the concrete "no over-engineering" call for this layer.

## 2. Request/Response Conventions

- All request bodies validated with **Zod** schemas colocated with the Server Action / Route Handler; the inferred type is the single source of truth (no hand-written duplicate DTO types).
- Successful responses return the resource/result directly; no unnecessary envelope (`{ data: ... }`) for Server Actions. Route Handlers *do* use a small consistent envelope (`{ data }` or `{ error }`) since they may be consumed by non-Next.js clients (n8n, mobile app later).

## 3. Error Format (Route Handlers)

```json
{
  "error": {
    "code": "SLOT_ALREADY_BOOKED",
    "message": "This time slot is no longer available.",
    "details": {}
  }
}
```

- `code` is a stable, machine-readable string (used by the client for UX branching, e.g. offering alternate slots) — never rely on parsing `message`.
- HTTP status codes used conventionally (400 validation, 401/403 auth, 404 not found, 409 conflict for booking overlaps, 422 domain-rule violation, 5xx unexpected).

## 4. Authentication & Authorization

- Session-based auth (see DATABASE_GUIDE.md for the session/user model); every Route Handler and Server Action resolves the current session and, for tenant-owned resources, the current `clinicId` before touching data — see SYSTEM_ARCHITECTURE.md §5.
- Role checks (patient / reception / doctor / clinic-admin) happen in the `application` layer of the owning module, not scattered in route handlers, so authorization rules are testable in isolation.
- Webhook endpoints (payment, SMS) verify provider signatures — no webhook is trusted purely because it hit the right URL.

## 5. The AI Gateway Contract

Internal service, not a public API in v1. Contract (conceptual, exact schema finalized in its own ADR):

```
POST /gateway/complete
{
  "persona": "closer-ai" | "oracle-ai",
  "clinicId": "uuid",
  "context": { ... conversation/report context, PII-minimized ... },
  "promptVersion": "v1"
}

→ {
  "reply": "string",
  "confidence": 0.0-1.0,
  "suggestedAction": null | { "type": "book_slot" | "escalate_to_human", "payload": {...} }
}
```

- The Gateway — not the calling module — owns provider selection (OpenAI/Anthropic), retry/timeout policy, and PII-minimization before the request leaves Iranian infrastructure (see SYSTEM_ARCHITECTURE.md §6/§8).
- Callers (Closer AI, Oracle AI modules) depend only on this contract, never on an OpenAI/Anthropic SDK type directly — this is what makes the provider swappable per SYSTEM_ARCHITECTURE.md's Adapter Port principle.

## 6. n8n Integration

- n8n calls into the app via authenticated Route Handlers (`app/api/webhooks/n8n/*`) using a shared secret, never an open/unauthenticated endpoint.
- The app calls out to n8n webhooks for triggering workflows (e.g. "new appointment created → send confirmation SMS") using signed requests with a short timeout and no blocking of the user-facing response — workflow triggers are fire-and-forget from the request/response perspective, with retries handled inside n8n.
- All n8n workflow definitions are exported and committed under `n8n/` (see FOLDER_STRUCTURE.md) so they are versioned like code, not only stored in the n8n UI.

## 7. Rate Limiting & Abuse Protection

- Closer AI's public chat endpoint is rate-limited per session/IP to prevent cost abuse of the AI Gateway — this is a cost-control requirement given per-message LLM cost, not just a security nicety.
- Booking endpoints are rate-limited to prevent slot-hoarding/spam bookings.

## 8. Versioning

- Internal Route Handlers used only by this app are not versioned (`app/api/webhooks/*`).
- Any endpoint intended for future external consumption (SaaS phase, partner integrations, mobile app) is versioned from creation (`app/api/v1/*`) even though there is exactly one consumer today — retrofitting versioning later is the kind of rewrite this project is explicitly trying to avoid.
