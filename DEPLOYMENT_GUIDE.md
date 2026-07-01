# DEPLOYMENT_GUIDE.md

> Hosting, environments, and release process, implementing the Iranian-VPS + AI-gateway decisions from [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md).

## 1. Hosting Topology

| Service | Where | Why |
|---|---|---|
| Next.js app | Iranian VPS (self-managed, e.g. via PM2/Docker + reverse proxy) | Confirmed decision: avoid dependency on foreign PaaS (Vercel etc.) that carries sanction/payment-access risk for an Iranian business. |
| PostgreSQL | Same VPS estate (separate instance/container from the app) | Confirmed decision (see [[project-smart-clinic-scope]]) |
| n8n | Same VPS estate, isolated process/container | Keeps AI/automation workflows independently restartable without redeploying the app |
| AI Gateway | Same VPS estate, isolated small service | Sole egress point to OpenAI/Anthropic — see SYSTEM_ARCHITECTURE.md §6/§8 |
| WordPress (blog) | Can be same VPS or separate low-cost hosting | Isolated on purpose — a WordPress compromise or outage must never take down the booking/patient-portal app |

Exact VPS provider/specs are an infrastructure-procurement decision, not an architecture one — tracked as its own ADR once provisioned, not hardcoded into this document.

## 2. Environments

| Environment | Trigger | Notes |
|---|---|---|
| `local` | Developer machine | Docker Compose for Postgres + n8n locally; seeded fake data only |
| `staging` | Push/merge to `develop` (or equivalent) branch | Mirrors production topology at smaller scale; sanitized data |
| `production` | Manual promotion after staging sign-off | Real patient/clinic data; highest change-control discipline |

## 3. CI/CD Pipeline (conceptual — exact tool, e.g. GitHub Actions, finalized in its own ADR)

1. Lint + typecheck + unit/integration tests (CODING_STANDARDS.md §7) on every PR.
2. Build the Next.js app and run Prisma `migrate deploy --dry-run`/diff check against staging schema.
3. On merge to the deployment branch: build → run migrations → deploy app → smoke-test golden paths (home page loads, booking flow reachable, Closer AI widget responds) before marking the release healthy.
4. Automatic rollback path if the smoke test fails (redeploy previous known-good build); database migrations are written to be backward-compatible for at least one release wherever feasible, to make rollback safe.

## 4. Secrets Management

- No secrets in the repository, ever — `.env` files are git-ignored, and production secrets (DB credentials, AI Gateway keys, payment/SMS provider keys) are injected via the deployment environment/secret manager, not committed placeholder values.
- AI provider keys live only inside the AI Gateway service's environment — the Next.js app itself never holds an OpenAI/Anthropic key, reinforcing the Adapter boundary from SYSTEM_ARCHITECTURE.md §6.

## 5. Domain, SSL & Performance

- SSL via automated certificate renewal (Let's Encrypt or equivalent) — no manually-managed certificates that can silently expire.
- CDN/edge caching for static assets and images where compatible with Iranian-infrastructure constraints, to help meet the <3s load target (SYSTEM_ARCHITECTURE.md §10) despite self-hosting.

## 6. Backups & Disaster Recovery

- Daily automated PostgreSQL backups (per DATABASE_GUIDE.md §6), stored on infrastructure physically/logically separate from the primary VPS (a second provider or at minimum a separate disk/region) so a single VPS failure cannot destroy both the live database and its backups.
- A documented, periodically-tested **restore drill**: restoring the latest backup into a scratch environment and verifying data integrity — a backup that has never been restored is not a verified backup.
- Recovery Point Objective (RPO) target: ≤24h (matches daily backup cadence) until transaction volume justifies more frequent incremental backups.

## 7. Monitoring

- Uptime/health checks on the public site, booking flow, and AI Gateway endpoint — this is the natural home for a future "Sentinel"-style capability once that open question (PROJECT_UNDERSTANDING.md §13) is resolved; until then, minimal external uptime monitoring (e.g. a simple ping/health-check service) is the v1 baseline.
- Structured application logs (see CODING_STANDARDS.md's `core/logging/`) shipped somewhere queryable, with PII redaction applied before logs leave the app process.

## 8. Release Cadence & Change Control

- `staging` is always deployable; `production` deploys are deliberate, not continuous, given real patient data and a single live clinic — a bad deploy has immediate real-world consequences for Dr. Sadighi's practice.
- Any migration touching a tenant-owned table (DATABASE_GUIDE.md) is reviewed with explicit attention to backward compatibility, since production cannot be paused for a lengthy migration during clinic operating hours.

## 9. WordPress Deployment

Deployed and updated independently of the main app's release cycle; core/plugin updates follow their own (lighter-weight) patch process, since a WordPress security patch should never be blocked waiting on a Next.js app release, and vice versa — this operational independence is the payoff for isolating it architecturally in SYSTEM_ARCHITECTURE.md §4.
