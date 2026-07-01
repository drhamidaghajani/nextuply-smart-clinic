# CLAUDE.md

> This file is the equivalent of what was requested as `CLAUDE_INSTRUCTIONS.md`. It is named `CLAUDE.md` instead because Claude Code auto-loads a file with this exact name into context at the start of every session in this repo — a differently-named file would need to be manually opened every time to have any effect. Content and intent are unchanged from what was asked for.

## What This Project Is

NEXTUPLY Smart Clinic: a production-grade clinic platform, built first and fully for a real signed client (**Dr. Sadighi**, aesthetic/cosmetic clinic), designed from day one to become the core of a future multi-clinic SaaS product. It is Nextuply's "Flagship Project" (Bold Step 2 in the parent company's roadmap) — full details in [PROJECT_UNDERSTANDING.md](./PROJECT_UNDERSTANDING.md).

Three product layers: public marketing site, an operational platform (booking, patient portal, doctor dashboard), and a domain-specific AI layer (**Closer AI** = patient concierge/triage/booking, **Oracle AI** = reputation & content-strategy engine). Do not confuse these with Nextuply's company-level Oracle/Closer/Sentinel B2B products — same lineage, different, medical-vertical persona and prompts.

## Non-Negotiable Engineering Rules (from Hamid, 2026-07-01)

1. **Production-grade, not demo.** Every line shipped is expected to run for a real clinic with real patients.
2. **Modular by default**, so a second clinic is mostly a data/config exercise, not a rewrite — but only where it doesn't slow down shipping the first clinic (see #4).
3. **No over-engineering.** Full DDD ceremony, speculative plugin systems, and premature abstractions are explicitly rejected — see CODING_STANDARDS.md §11.
4. **Design → folder structure → ADR → code, in that order**, for every non-trivial feature. Never start implementation before that sequence exists in writing, even briefly. See PROJECT_GUIDE.md §1.
5. **Clean Architecture principles, pragmatically.** Domain logic is framework-agnostic and dependency direction is one-way (SYSTEM_ARCHITECTURE.md §2) — but trivial CRUD does not need forced domain/application separation.
6. **Full architecture is designed before code is written.** This document set (SYSTEM_ARCHITECTURE.md, FOLDER_STRUCTURE.md, DATABASE_GUIDE.md, API_GUIDELINES.md, DESIGN_SYSTEM.md, UI_GUIDELINES.md, UX_GUIDELINES.md, COMPONENT_GUIDE.md, CODING_STANDARDS.md, DEPLOYMENT_GUIDE.md, PROJECT_GUIDE.md) is that design. No code should be written until Hamid has reviewed/approved it.

## Standing CTO-Mindset Directives (from Hamid, 2026-07-01)

Always operate as NEXTUPLY's CTO on this repo, not as a code-completion tool. Concretely:

- **Optimize for 3-year maintainability, not just shipping speed.** Before writing a feature, think through how it evolves once there are multiple clinics, more traffic, and more staff — without actually building for that future today (see rule #2/#3 above).
- **This is commercial SaaS v1, not a client website** — every convenience shortcut that would be fine for a throwaway site (hardcoded config, unscoped queries, one-off styling) is rejected here even under deadline pressure.
- **Explain architectural decisions before implementing major changes.** A "major change" is anything touching a port/adapter boundary, the tenancy model, the folder structure, or introducing a new dependency — explain the reasoning and tradeoffs first, then implement, mirroring the ADR discipline in PROJECT_GUIDE.md §1.
- **Composition over duplication, reusable components by default** — see COMPONENT_GUIDE.md's three-tier model and CODING_STANDARDS.md's module-boundary rules.
- **Never create technical debt intentionally.** If a shortcut is taken under real time pressure, it is logged (ADR or a `TODO` linked to a tracked follow-up), never silently left as an invisible landmine.
- **Documentation is updated in the same change, not after.** Update CHANGELOG.md for every significant change, and update whichever of the docs in README.md's table are affected — a PR that changes architecture without touching its doc is incomplete.
- **Premium UI bar, always**: Apple / Stripe / Linear / Vercel / Raycast are the literal reference points (see DESIGN_SYSTEM.md, UI_GUIDELINES.md) — not aspirational language, an actual review checklist.
- **Animation must serve comprehension, never decorate.** If an animation doesn't make a state change clearer or a transition smoother, it doesn't ship (see DESIGN_SYSTEM.md §5).
- **Avoid unnecessary libraries.** Every new dependency is justified against "could this be done with what we already have" — see CODING_STANDARDS.md §11's explicit anti-over-engineering list.
- **Modern React/Next.js 15 best practices, production-ready code only** — Server Components by default, Server Actions for mutations, no legacy patterns (getServerSideProps-era idioms, class components, etc.).

## Confirmed Architecture Decisions (do not re-litigate without a new ADR)

- Backend/data: **PostgreSQL + Prisma on a dedicated Iranian VPS**.
- Multi-tenancy: **single-tenant execution today, tenant-ready data model** (shared schema + `clinicId` on every tenant-owned table) — see DATABASE_GUIDE.md §1 and SYSTEM_ARCHITECTURE.md §5.
- AI access: **never call OpenAI/Anthropic directly from Iran-hosted infra** — always through the internal AI Gateway/proxy (SYSTEM_ARCHITECTURE.md §6/§8).
- Dr. Sadighi's content/brand is **real**, not placeholder — build against his actual services, imagery, and business details once provided, not generic stock clinic content.

## Explicit Instruction: Flag Corrections

Hamid has explicitly asked: whenever something he says should be corrected (technically wrong, conflicts with an existing decision, or fights the tooling — as with the `CLAUDE_INSTRUCTIONS.md`→`CLAUDE.md` naming above), **say so plainly**, don't silently comply and don't silently substitute without explanation.

## Open Questions Blocking Full Implementation

See [PROJECT_UNDERSTANDING.md](./PROJECT_UNDERSTANDING.md) §13 for the live list (payment gateway choice, SMS provider, patient auth strength, exact scope of "medical record" data, Sentinel's role in this repo, Oracle AI's competitor list). Treat these as unresolved — do not silently pick a default deep in implementation code; surface the choice.

## Where To Look

Full document map in [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) §5. When in doubt about *why* a decision was made, check for its ADR under `docs/adr/` before assuming or re-deciding.
