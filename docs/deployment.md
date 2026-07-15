# Deployment Guide

Practical deployment reference for the NEXTUPLY Smart Clinic platform (Dr. Sadighi). This is the "how to actually ship this" document — for architecture rationale, see `SYSTEM_ARCHITECTURE.md` and `DEPLOYMENT_GUIDE.md` (the pre-code design doc this file operationalizes). See `docs/database-setup.md` for the Postgres/Prisma specifics referenced below.

This document describes deployment readiness. It does not deploy anything itself — no hosting account, DNS, or server has been provisioned as part of this pass.

## 1. Server requirements

- Node.js 20+ (matches Next.js 15's minimum)
- PostgreSQL 14+ (confirmed architecture: dedicated Iranian VPS — see `CLAUDE.md`'s Confirmed Architecture Decisions)
- A process manager for `next start` (e.g. `pm2` or a systemd unit) — this repo does not include one; pick one at deploy time
- Outbound HTTPS access from the server, if `INTERNAL_AI_GATEWAY_URL` or (dev-only) `api.openai.com` needs to be reached
- No Docker dependency anywhere in this project (matches `docs/database-setup.md`'s existing "no Docker required" convention)

## 2. Environment variables

Copy `.env.example` to `.env` and fill in real values. Full list, grouped by what breaks if unset:

| Variable | Required for | If unset |
|---|---|---|
| `DATABASE_URL` | Any real persistence (leads, bookings, payments, OTP, appointments/gallery admin pages) | App runs in validate-and-log-only mode; every DB-backed feature degrades gracefully (see `submit-booking-request.ts`) — never crashes |
| `DEFAULT_CLINIC_ID` | Tenant-scoping every write | Falls back to `"dr-sadighi-clinic"` |
| `INTERNAL_ADMIN_TOKEN` | Access to `/{locale}/internal/*` | Production: routes 404 (fully inaccessible). Development: open with a console warning |
| `INTERNAL_AI_GATEWAY_URL` / `INTERNAL_AI_GATEWAY_TOKEN` | Production AI (free-text classification, lead summaries) | AI calls fail closed (`not-configured`) — deterministic fallback, never a crash. See `AI_USAGE_NOTES.md` |
| `ALLOW_DIRECT_OPENAI_IN_DEV` | Local-dev-only direct OpenAI testing | Defaults to `false`; **structurally ignored in production regardless of value** |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | The dev-only direct OpenAI fallback above | Fallback stays unreachable; no effect in production |
| `SMS_USERNAME` / `SMS_PASSWORD` / `SMS_OTP_PATTERN_ID` (or `SMS_TEMPLATE_ID`) | Real OTP delivery via Melipayamak (all three required together — see §5) | OTP falls back to the labeled dev bypass (non-production only) or an honest "SMS unavailable" message (production) |
| `SMS_BASE_URL` | Overriding Melipayamak's default endpoint | Falls back to the built-in default (`sms-provider.ts`) |
| `SMS_PROVIDER_NAME` / `SMS_SENDER_NUMBER` | Informational / reserved for future use | No effect — not read by any conditional branch today |
| `PAYMENT_PROVIDER_*` (placeholders — see §7) | Real payment processing | Payment step stays in `pending`/preparation state, never fabricates a `paid` status |

No secrets are stored anywhere in this repo — `.env` is gitignored (`.gitignore`'s `!.env.example` exception keeps only the placeholder file tracked).

## 3. Build, migrate, start

```bash
# Install
npm install

# Apply the committed migration to a real Postgres instance
npm run prisma:deploy      # `prisma migrate deploy` — production-safe, no interactive prompts
npm run prisma:generate    # regenerate the Prisma client (also runs automatically on `npm install` via Prisma's postinstall)

# Build
npm run build

# Start
npm run start              # `next start`, behind your process manager of choice
```

`npm run prisma:migrate` (`prisma migrate dev`) is a local development command only — never run it against a production database.

## 4. Verify staging DB persistence

Before trusting a staging environment, prove the full persistence chain actually round-trips against the real database — not just that `prisma migrate deploy` exited 0:

```bash
npm run verify:staging-db
```

Runs `scripts/verify-staging-db.ts`: connects with the real `DATABASE_URL`, creates one clearly-marked synthetic record chain (`Lead` → `TriageAnswer` → `BookingRequest` → `PaymentDraft` → `SmsEvent` — the same shape a real patient submission writes), reads it back through the relations, and prints an `ok`/`failed` summary with the created ids only (no PII, no OTP codes, never the test record's own placeholder name/mobile/notes). It never marks the booking `confirmed` or the payment `paid`, and never deletes anything — the test record stays in the database, identifiable by its `STAGING_VERIFICATION_SCRIPT` marker, safe to leave or remove manually. Requires `DATABASE_URL` to be set; exits with a clear error (not a crash) if it isn't.

## 5. SMS OTP delivery (Melipayamak)

Real integration exists in `src/modules/smart-clinic-assistant/server/otp/sms-provider.ts` — Melipayamak's pattern-based ("OTP by pattern"/`SendByBaseNumber`) REST endpoint, chosen over their simpler API-key "shared line" endpoint because pattern/template sends are what Melipayamak recommends for OTP codes specifically (reduces carrier spam-filtering risk).

**Required env vars** (all three needed together — partial config is treated as "not configured", never a partial/broken send attempt):
- `SMS_USERNAME` / `SMS_PASSWORD` — your Melipayamak panel login. Not an API key — flagged explicitly since this differs from the `SMS_API_KEY` shape one might expect; see `sms-provider.ts`'s doc-comment for why.
- `SMS_OTP_PATTERN_ID` (or `SMS_TEMPLATE_ID`, either name works) — the approved OTP pattern/template id from the Melipayamak panel. **Must be created and approved in the Melipayamak panel before this works** — that's outside this repo, a manual step on their dashboard.
- `SMS_BASE_URL` — optional, only needed if Melipayamak's documented endpoint has changed from the default baked into `sms-provider.ts`.

**⚠️ Endpoint verification caveat**: the endpoint URL and request/response shape were implemented from Melipayamak's publicly documented pattern-based REST API from training knowledge, without live access to re-confirm their current docs. **Re-verify against Melipayamak's own current documentation (or support) before the first real staging send.**

**Verify on staging:**
```bash
# Config presence only — never sends SMS, safe to run anytime
npm run verify:sms-config

# Real send test — costs real provider credit, requires an explicit number
# (never hardcoded anywhere in this repo — supply your own test mobile)
npm run verify:sms-config -- --send 09123456789
```

**Failure behavior**: if any of the three required vars is unset, `requestOtp`/`verifyOtp` never claim a code was sent — production shows the honest "connecting to SMS system, contact us directly" message; non-production falls back to the labeled dev bypass (fixed code `000000`, no database write, never reachable in production regardless of this config). If the provider is configured but the send itself fails (network error, non-2xx, or a non-positive response code), `requestOtp` returns `{ status: "unavailable" }` — never a fake `"sent"`.

**Production security rules** (already enforced in code, not just convention):
- The OTP code is never logged, in `sms-provider.ts` or anywhere else in the OTP module.
- `SMS_USERNAME`/`SMS_PASSWORD` are never logged — only HTTP status codes and the provider's own numeric response code on failure.
- The dev bypass (`000000`) is structurally unreachable when `NODE_ENV === "production"`, checked independently on both the issuing (`requestOtp`) and checking (`verifyOtp`/`session-guard.ts`) sides.

## 6. AI Gateway — endpoint contract & production readiness

The internal AI Gateway (SYSTEM_ARCHITECTURE.md §6/§8's separate n8n+gateway service) **does not exist anywhere yet** — this repo only contains the client boundary that will call it once it's deployed. This is a real blocker before doctor review if AI features (free-text Q&A, lead summaries) are wanted live — see §8's checklist.

**Required env vars:**
- `INTERNAL_AI_GATEWAY_URL` — the gateway's HTTP endpoint.
- `INTERNAL_AI_GATEWAY_TOKEN` — bearer token sent as `Authorization: Bearer <token>`.

Both must be set together; if either is missing, every AI call fails closed (`{ ok: false, reason: "not-configured" }`) — the app degrades gracefully (deterministic menu / no lead summary), it never crashes and never silently falls back to calling OpenAI directly in production (structurally blocked — see `ai/config.ts`).

**Endpoint contract the gateway service must implement** (see `src/modules/smart-clinic-assistant/ai/ai-gateway-client.ts` and `ai/types.ts` for the source of truth):

| | |
|---|---|
| Method | `POST` |
| URL | `INTERNAL_AI_GATEWAY_URL`, exactly as configured (no path appended by the client) |
| Headers | `Content-Type: application/json`, `Authorization: Bearer <INTERNAL_AI_GATEWAY_TOKEN>` |
| Request body | `{ "task": "classify_assistant_message" \| "generate_lead_summary", "input": <task-specific shape, see AI_USAGE_NOTES.md §5> }` |
| Success response | `200` with JSON body `{ "output": <task-specific output shape, see AI_USAGE_NOTES.md §5> }` — any other 2xx body shape (missing `output`) is treated as `invalid-response`, not a fake success |
| Failure response | Any non-2xx status — the client logs the status code only (never the request/response body) and returns `{ ok: false, reason: "http-error" }` |
| Timeout | Client aborts at **5000ms** and treats it as `{ ok: false, reason: "timeout" }` — the gateway should respond well within this |

**Dev-only variables** (never used in production, structurally blocked regardless of value — see `ai/config.ts`):
- `ALLOW_DIRECT_OPENAI_IN_DEV` — must be exact string `"true"` to enable.
- `OPENAI_API_KEY` / `OPENAI_MODEL` — only consulted when the flag above is on, in non-production.

**What is sent / never sent**: see `AI_USAGE_NOTES.md` §7–8 for the full field-by-field list — no mobile number, full name, city, OTP data, raw dictionaries, or page content ever reach the gateway; every payload is hand-built field-by-field, never a raw object spread.

**Verify on staging:**
```bash
npm run verify:ai-gateway
```
Runs `scripts/verify-ai-gateway.ts`: sends one minimal synthetic (non-patient) test message through the real `callAiGateway` function, confirms the gateway is reachable, authenticated, and returns the expected response shape. Never prints the token. Exits non-zero (with the specific `reason`) if the gateway isn't configured or the call fails — never fakes a pass.

## 7. Payment provider — open item

No payment gateway is chosen yet (`PROJECT_UNDERSTANDING.md` §13's open question, unchanged). `PaymentDraft.paymentProvider` defaults to the literal string `"placeholder"` and `paymentStatus` never leaves `pending` anywhere in this codebase. `.env.example` reserves `PAYMENT_PROVIDER_API_KEY`/`PAYMENT_PROVIDER_MERCHANT_ID` as name-only placeholders for whichever gateway is chosen — wiring a real provider is a separate, explicitly-scoped follow-up (new ADR required per `CLAUDE.md`'s major-change rule, since it's a new external dependency).

## 8. Doctor review blockers checklist

**Required before the first doctor review:**
- [ ] `DATABASE_URL` set to a real staging Postgres instance
- [ ] `npm run prisma:deploy` executed without error
- [ ] `npm run verify:staging-db` passes (§4)
- [ ] `INTERNAL_ADMIN_TOKEN` set
- [ ] SMS provider configured (`SMS_USERNAME`/`SMS_PASSWORD`/`SMS_OTP_PATTERN_ID` all set — §5)
- [ ] Real OTP SMS verified (`npm run verify:sms-config -- --send <your test number>` passes, and a real phone actually receives the code)
- [ ] `INTERNAL_AI_GATEWAY_URL` set
- [ ] `INTERNAL_AI_GATEWAY_TOKEN` set
- [ ] `npm run verify:ai-gateway` passes (§6)
- [ ] `npm run build` passes

**Not required before the first doctor review, unless explicitly decided otherwise:**
- Real payment gateway (§7)
- Real calendar/availability backend (`/internal/availability` remains a documented placeholder)
- Oracle (reputation/content-strategy engine — not part of this pass)
- Full CRM (the internal admin pages are deliberately read-only listings, not a CRM — see their own doc-comments)
- Patient panel (no patient-facing account/portal exists or is in scope here)

## 9. Staging checklist

- [ ] `DATABASE_URL` points at a real, reachable staging Postgres instance
- [ ] `npm run prisma:deploy` completed without error
- [ ] `npm run verify:staging-db` prints `ok` (§4) — proves the persistence chain works against the real database, not just that migrations applied
- [ ] `INTERNAL_ADMIN_TOKEN` set to a long random value (`openssl rand -hex 32`) — verify `/fa/internal/assistant-leads` requires it (see §10)
- [ ] `npm run build` completes cleanly (see §10)
- [ ] All three locales (`/fa`, `/en`, `/ar`) load and render with correct `dir`
- [ ] Smart Clinic Assistant: OTP flow reachable — `npm run verify:sms-config` reports configured, and a real test send (§5) actually arrives
- [ ] A full booking flow (service → triage → contact → appointment → payment step → confirmation) completes and appears in `/internal/assistant-leads` and `/internal/appointments`
- [ ] `npm run verify:ai-gateway` passes, or AI Gateway vars are left unset intentionally to confirm graceful degradation

## 10. Production checklist

- [ ] `NODE_ENV=production` (set automatically by `next start`)
- [ ] `INTERNAL_ADMIN_TOKEN` set (unset ⇒ `/internal/*` 404s entirely — confirm this is the intended state before go-live, not an oversight)
- [ ] `/robots.txt` disallows `/*/internal/` and each internal page's own metadata sets `robots: noindex` (`src/app/robots.ts` + each `/internal/*/page.tsx`) — belt-and-suspenders on top of the token gate
- [ ] `ALLOW_DIRECT_OPENAI_IN_DEV` absent or `false` — confirmed structurally unreachable in production regardless (`ai/config.ts`)
- [ ] `INTERNAL_AI_GATEWAY_URL`/`TOKEN` set if AI features are wanted live; if intentionally deferred, confirm the deterministic fallback is acceptable for launch
- [ ] `DATABASE_URL` points at the real production Postgres instance, not staging
- [ ] `SMS_USERNAME`/`SMS_PASSWORD`/`SMS_OTP_PATTERN_ID` set if real OTP delivery is required at launch — otherwise patients see the honest "connecting to SMS system, contact us directly" message (never a fake-success dev bypass, which is structurally blocked in production)
- [ ] TLS/HTTPS terminated in front of the app (reverse proxy — nginx/Caddy, not specified by this repo)
- [ ] Process manager configured to restart `next start` on crash and on server reboot
- [ ] `npm run build && npm run start` smoke-tested against production env vars before DNS cutover

## 11. What is explicitly NOT part of this deployment pass

- No hosting account, server provisioning, or DNS configuration — this document prepares for that, it doesn't perform it
- No payment gateway integration (§7)
- No real online calendar/availability backend (`/internal/availability` documents the planned data model only — see that page)
- No asset upload/storage service (`/internal/gallery` is read-only; new photos are still added directly to `public/media/gallery/` per docs/adr/0003)
- No AI Gateway service deployment — the client boundary/contract exists (§6) but the gateway itself is not part of this repo

## 12. Docker staging deployment — sadighi.nextuply.com

This app runs on the shared Nextuply server as its own fully isolated stack — `sadighi-app` + `sadighi-postgres`, its own Docker network, its own data volume. It shares only the `nextuply-net` network with other apps on the same host (so Nginx Proxy Manager can reach it) and nothing else.

**⚠️ This app is completely separate from PetYar/PetAI.** Never reference, start, stop, or modify `petyar-canis-app`, `petyar-postgres`, `app.petai.ir`, `/opt/nextuply/apps/petyar-canis`, or `/opt/nextuply/data/postgres/petyar` while working on this deployment. Do not connect `sadighi-app` to `petyar-postgres` under any circumstance — each app owns its own database.

### 12.1 DNS

Create an **A record** for `sadighi.nextuply.com` pointing at the Nextuply server's IP, before configuring Nginx Proxy Manager (§12.6) — NPM's Let's Encrypt/SSL step will fail otherwise.

### 12.2 Shared Docker network

`nextuply-net` is shared across apps on this host — check it exists before assuming so; create it only if it's genuinely missing (do **not** recreate it if it already exists, that would disrupt every other app already attached to it, PetYar/PetAI included):

```bash
sudo docker network inspect nextuply-net || sudo docker network create nextuply-net
```

### 12.3 Folder structure on the server

```bash
sudo mkdir -p /opt/nextuply/apps/sadighi
sudo mkdir -p /opt/nextuply/data/postgres/sadighi
```

Deploy this repo's contents into `/opt/nextuply/apps/sadighi` (`git clone`/`git pull`, or your existing deploy mechanism — not specified by this repo). `/opt/nextuply/data/postgres/sadighi` is the Postgres data volume (§ compose file's `sadighi-postgres` service) — it must exist and be writable by Docker before first `up`, but its contents are managed entirely by the `postgres:16-alpine` container itself from then on; never hand-edit files inside it.

### 12.4 Env files

From `/opt/nextuply/apps/sadighi`:

```bash
cp .env.production.example .env.production
cp .env.db.example .env.db
```

Fill in real values in both (see §2's table and §12.9's required-secrets list below) — **never** commit either real file (`.gitignore` already excludes every `.env*` except the `.example` files). `DATABASE_URL` in `.env.production` and `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` in `.env.db` must describe the **same** database — the compose file wires `sadighi-app` to reach Postgres at the hostname `sadighi-postgres` (the container name, resolved via Docker's internal DNS on the `sadighi-internal` network), not `localhost`.

Lock both files down — they contain real secrets:

```bash
chmod 600 .env.production .env.db
```

### 12.5 Build, migrate, verify, start

```bash
cd /opt/nextuply/apps/sadighi

# Build the app image (Dockerfile — see its own comments for the multi-stage reasoning)
sudo docker compose -f docker-compose.production.yml build

# Start Postgres first, alone — the app's migration/verification steps below need it running
sudo docker compose -f docker-compose.production.yml up -d sadighi-postgres

# Apply the committed Prisma migrations to the real database
sudo docker compose -f docker-compose.production.yml run --rm sadighi-app npm run prisma:deploy

# Prove the persistence chain actually round-trips (§4) — not just that migrations applied
sudo docker compose -f docker-compose.production.yml run --rm sadighi-app npm run verify:staging-db

# Now start the app itself
sudo docker compose -f docker-compose.production.yml up -d sadighi-app

# Watch startup logs
sudo docker compose -f docker-compose.production.yml logs --tail=100 sadighi-app
```

### 12.6 Verify SMS + AI Gateway (once their env vars are filled in)

```bash
sudo docker compose -f docker-compose.production.yml run --rm sadighi-app npm run verify:sms-config
sudo docker compose -f docker-compose.production.yml run --rm sadighi-app npm run verify:ai-gateway
```

Both exit non-zero and print a clear reason if unconfigured or unreachable — never a fake pass (see §5/§6). For a real end-to-end SMS test with an actual phone number: `sudo docker compose -f docker-compose.production.yml run --rm sadighi-app npm run verify:sms-config -- --send <your test number>` (no number is hardcoded anywhere in this repo — supply your own).

### 12.7 Nginx Proxy Manager

Add a new Proxy Host in NPM:

- **Domain**: `sadighi.nextuply.com`
- **Forward Hostname/IP**: `sadighi-app` (the container name — reachable because NPM and `sadighi-app` share the `nextuply-net` network)
- **Forward Port**: `3000`
- **Scheme**: `http` (TLS terminates at NPM, not at the Next.js container)
- Enable **Block Common Exploits**
- **SSL tab**: request a new Let's Encrypt certificate for `sadighi.nextuply.com`, force SSL

### 12.8 Final verification

```bash
curl -I https://sadighi.nextuply.com/fa
curl -I https://sadighi.nextuply.com/en
curl -I https://sadighi.nextuply.com/ar
curl -s https://sadighi.nextuply.com/robots.txt
```

All three locale roots should return `200`. Then confirm `/fa/internal/assistant-leads` requires `INTERNAL_ADMIN_TOKEN` (§7/production checklist), and run through a real booking flow end-to-end per §9's staging checklist.

### 12.9 Required real secrets for this deployment

Everything below must be a real, freshly-generated value in `.env.production`/`.env.db` on the server — none of them exist anywhere in this repo or its git history:

- `DATABASE_URL` (must match `.env.db`'s credentials exactly)
- `POSTGRES_PASSWORD` (`.env.db`)
- `INTERNAL_ADMIN_TOKEN` (`openssl rand -hex 32`)
- `SMS_USERNAME` / `SMS_PASSWORD` / `SMS_OTP_PATTERN_ID` (Melipayamak — §5)
- `INTERNAL_AI_GATEWAY_URL` / `INTERNAL_AI_GATEWAY_TOKEN` (§6, once the gateway service is deployed)

### 12.10 Rollback

```bash
# Stop just this app's containers (never touches any other app's containers/networks)
sudo docker compose -f docker-compose.production.yml down

# Roll back to a previous image if the new build is bad — rebuild from a
# known-good git ref, then repeat §12.5's build/up steps
git checkout <previous-good-ref>
sudo docker compose -f docker-compose.production.yml build
sudo docker compose -f docker-compose.production.yml up -d sadighi-app
```

`sadighi-postgres` and its volume (`/opt/nextuply/data/postgres/sadighi`) are untouched by `down` unless you also pass `-v` (**do not** — that deletes the database volume). A bad app deploy is always recoverable without touching data; treat any command that includes `-v`, `docker volume rm`, or deletes `/opt/nextuply/data/postgres/sadighi` as destructive and requiring explicit confirmation first, same as this project's standing rule against unprompted destructive operations.
