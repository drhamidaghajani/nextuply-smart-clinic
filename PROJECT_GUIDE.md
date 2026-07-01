# PROJECT_GUIDE.md

> How this project actually runs day-to-day: process, glossary, and the design-before-code discipline Hamid has mandated. For *what* we're building see [PROJECT_UNDERSTANDING.md](./PROJECT_UNDERSTANDING.md); for *how it's structured* see [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) and [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md).

## 1. Non-Negotiable Workflow

No feature is implemented until it has, in this order:

1. **A short design note** — what it does, which module it lives in, which ports/adapters (if any) it touches.
2. **A folder-structure note** — new files/folders it introduces, mapped against FOLDER_STRUCTURE.md's rules.
3. **An ADR** (Architecture Decision Record) if it introduces a new pattern, a new dependency, or a non-obvious tradeoff. Trivial CRUD screens that follow an already-decided pattern do **not** need a new ADR — re-litigating a decided pattern every time is the over-engineering this project explicitly avoids.

Only after steps 1–3 are written down (even briefly) does implementation start. This mirrors [[feedback-dev-workflow]] from Hamid: design/approval checkpoints before code, every time.

### ADR format

Stored in `docs/adr/NNNN-short-title.md`:

```md
# NNNN. Short title

Status: Proposed | Accepted | Superseded by NNNN
Date: YYYY-MM-DD

## Context
What forces make this decision necessary.

## Decision
What we're doing.

## Consequences
What gets easier, what gets harder, what we're explicitly not doing.
```

First ADRs to write before any code lands (suggested numbering):

- `0001-tenancy-strategy.md` (shared schema + clinicId — already decided, needs to be written down)
- `0002-ai-provider-gateway.md` (proxy pattern for sanction risk — already decided)
- `0003-payment-gateway-choice.md` (pending — see open question in PROJECT_UNDERSTANDING.md)
- `0004-sms-provider-choice.md` (pending)
- `0005-patient-auth-strategy.md` (pending)

## 2. Glossary

| Term | Meaning in this repo |
|---|---|
| Clinic / Tenant | A single medical practice using the platform. Today: exactly one (Dr. Sadighi). Data model treats it as N. |
| Closer AI | Patient-facing concierge chatbot (triage, booking, deposit). Domain-specific persona, not the company-level "Closer" sales product. |
| Oracle AI | Clinic-owner-facing reputation/competitor/trend engine. Domain-specific persona, not the company-level "Oracle" strategy product. |
| Sentinel | Company-level operational-monitoring product. **Not yet scoped into this repo** — open question, see PROJECT_UNDERSTANDING.md §13. |
| Flagship Project | Nextuply's internal term (from its 5 Bold Steps roadmap) for this exact repo: the first full, real, production build proving the Nextuply model in one vertical. |
| Wizard of Oz | Shipping a feature that looks automated to the user but is run manually behind the scenes at first, to validate demand before investing in full automation. Applies to Closer AI's early rollout. |
| Port / Adapter | An interface (port) plus its concrete implementation (adapter) for an external dependency — see SYSTEM_ARCHITECTURE.md §6. |

## 3. Environments

| Env | Purpose | Data |
|---|---|---|
| `local` | Developer machines | Seeded fake data, no real patient data ever |
| `staging` | Pre-production validation on the same Iranian VPS estate | Sanitized/synthetic data |
| `production` | Live for Dr. Sadighi's clinic | Real patient data — highest security posture |

Full provisioning/CI details live in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## 4. Definition of Done (per feature)

A feature is done when:

- It matches its design note / ADR (or the note was updated to match reality, with the reason noted).
- It respects tenancy rules (§5 of SYSTEM_ARCHITECTURE.md) even if only one tenant exists today.
- It follows CODING_STANDARDS.md and, if it touches UI, DESIGN_SYSTEM.md / UI_GUIDELINES.md / UX_GUIDELINES.md.
- It has at least the minimum test coverage defined in CODING_STANDARDS.md §Testing.
- Documentation files affected by the change (this list of `.md` files) are updated in the same change, not "later."

## 5. Document Map

| Question | Document |
|---|---|
| What are we building and why? | PROJECT_UNDERSTANDING.md |
| How is the system architected? | SYSTEM_ARCHITECTURE.md |
| Where does code go? | FOLDER_STRUCTURE.md |
| What does it look like? | DESIGN_SYSTEM.md, UI_GUIDELINES.md |
| How should it feel to use? | UX_GUIDELINES.md |
| How do we write code? | CODING_STANDARDS.md |
| How do routes/endpoints behave? | API_GUIDELINES.md |
| How is data modeled? | DATABASE_GUIDE.md |
| How are components built/reused? | COMPONENT_GUIDE.md |
| How do we ship it? | DEPLOYMENT_GUIDE.md |
| What should Claude always know about this repo? | CLAUDE.md |
