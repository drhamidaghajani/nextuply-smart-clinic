# NEXTUPLY Smart Clinic

Production-grade clinic platform — the flagship implementation (Dr. Sadighi's clinic) and future core of a multi-clinic Nextuply Smart Clinic SaaS product. Not a one-off client website; see [PROJECT_UNDERSTANDING.md](./PROJECT_UNDERSTANDING.md) for the full product framing.

## Status

Pre-implementation. Full architecture and standards are documented below and must be read before any code is written or changed, per [PROJECT_GUIDE.md](./PROJECT_GUIDE.md)'s design → ADR → code workflow.

## Documentation

| Doc | Purpose |
|---|---|
| [VISION.md](./VISION.md) | Product vision, principles, tech stack, module list |
| [ROADMAP.md](./ROADMAP.md) | Phased delivery plan |
| [PROJECT_UNDERSTANDING.md](./PROJECT_UNDERSTANDING.md) | Full product analysis: goals, architecture summary, risks, recommendations, open questions |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | System design, tenancy strategy, AI layer, adapters |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Concrete repo layout |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Visual tokens, principles |
| [UI_GUIDELINES.md](./UI_GUIDELINES.md) | Component-level visual rules |
| [UX_GUIDELINES.md](./UX_GUIDELINES.md) | Interaction/flow rules |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Engineering conventions |
| [API_GUIDELINES.md](./API_GUIDELINES.md) | Server Actions, route handlers, AI Gateway contract |
| [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) | Prisma/Postgres conventions, tenancy model |
| [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md) | Component tiers and contracts |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Hosting, CI/CD, backups |
| [CLAUDE.md](./CLAUDE.md) | Standing directives for AI-assisted development in this repo |
| [CHANGELOG.md](./CHANGELOG.md) | Notable changes |

## Design Quality Bar

Every UI surface is benchmarked against Apple, Stripe, Linear, Vercel, and Raycast — not against typical local-market clinic sites. See DESIGN_SYSTEM.md and UI_GUIDELINES.md.

## Getting Started

Not yet applicable — no application code exists. First implementation step is writing the ADRs listed in PROJECT_GUIDE.md §1, starting with tenancy and AI-gateway decisions.
