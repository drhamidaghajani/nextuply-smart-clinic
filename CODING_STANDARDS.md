# CODING_STANDARDS.md

> How code is written in this repo. Complements [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) (why it's structured this way) and [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) (where it goes).

## 1. Language & Tooling

- TypeScript in **strict mode**, no `any` without an inline comment justifying it (and preferably `unknown` + narrowing instead).
- ESLint + Prettier enforced via pre-commit hook; CI fails on lint/format violations — not a "best effort" convention.
- Path aliases (`@/modules/*`, `@/core/*`, `@/infrastructure/*`, `@/components/*`) mirror FOLDER_STRUCTURE.md exactly — no deep relative import chains (`../../../..`).

## 2. Naming

- Files: `kebab-case.ts` / `kebab-case.tsx`. Components: `PascalCase` export matching a `kebab-case` filename (e.g. `booking-calendar.tsx` exports `BookingCalendar`).
- Domain types/entities: `PascalCase` nouns (`Appointment`, `ClinicProfile`). Application use-cases: verb phrases (`createAppointment`, `cancelAppointment`).
- Booleans read as questions/predicates (`isConfirmed`, `hasDeposit`), not ambiguous nouns.
- No abbreviations that aren't domain-standard (`clinicId` not `cId`; `patient` not `pt`).

## 3. Module Boundaries (enforced, not just documented)

- ESLint import-boundary rules prevent `modules/*` from importing another module's internals (only its `index.ts`), and prevent `domain/` files from importing anything under `infrastructure/` or Next.js/React.
- `infrastructure/*` is the only place third-party SDKs (OpenAI, payment SDK, SMS SDK) may be imported directly.

## 4. Tenancy Discipline

Every Prisma query touching a tenant-owned table (see DATABASE_GUIDE.md) goes through the tenant-scoped client wrapper in `core/tenancy/`, never `prisma.<model>.findMany()` called raw from a module. This is checked in code review and, where feasible, via a lint rule — it is the single rule most responsible for keeping the multi-clinic future affordable.

## 5. Error Handling

- Expected/domain errors (e.g. "slot already booked") are modeled as typed results (`Result<T, DomainError>` or thrown typed error classes caught at the boundary) — not generic `throw new Error("something went wrong")`.
- Only validate at real boundaries (user input, external API responses, AI Gateway output) — per the project's own anti-over-engineering principle, internal function calls between trusted layers do not need redundant defensive checks.
- Every route handler / Server Action has a single, consistent error-to-response mapping (see API_GUIDELINES.md §Error Format).

## 6. AI Prompt Management

- System prompts/personas for Closer AI and Oracle AI live as versioned files (e.g. `modules/closer-ai/application/prompts/v1.ts`), never inline string literals scattered in request-handling code.
- Every prompt change is a reviewable diff, and material tone/behavior changes get a short ADR note — prompts are product surface, not implementation detail, given their direct effect on patient trust (see PROJECT_UNDERSTANDING.md §10).

## 7. Testing

- **Unit tests** required for all `domain/` logic (business rules — booking overlap, tenant scoping helpers, pricing) — this is the highest-value test investment and is non-negotiable.
- **Integration tests** for each adapter's contract (payment, SMS, AI Gateway) against a fake/mock implementation of the external system.
- **E2E tests** (Playwright) for the golden paths only (booking flow, Closer AI happy path) — not for every screen; broad shallow E2E coverage is not worth its maintenance cost at this stage.
- No PR merges with failing tests; no snapshot tests used as a substitute for real assertions.

## 8. Comments & Documentation

- Default to no comments; code should be self-explanatory through naming (per Nextuply's own "simplicity" value applied to code, not just product).
- A comment is justified only to explain a non-obvious *why* (a regulatory constraint, a workaround for a specific provider quirk, a tenancy edge case) — never to restate *what* the code does.
- Every module's `index.ts` has a one-line header comment stating its responsibility, since it is the module's public contract.

## 9. Internationalization in Code

- No hardcoded user-facing strings in components — all copy through the `i18n/` dictionaries (see FOLDER_STRUCTURE.md).
- No physical `left`/`right`/`ml-`/`mr-` Tailwind utilities in shared components — use logical properties (`ms-`/`me-`, `text-start`/`text-end`) per DESIGN_SYSTEM.md §7, so RTL/LTR is a data property, not a per-component patch.

## 10. Git & Review

- Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`) to keep CHANGELOG.md generation honest once that file exists.
- One feature/module per PR wherever practical; PRs touching `domain/` logic require the corresponding unit tests in the same PR, not a follow-up.
- PR description references the design note/ADR it implements (see PROJECT_GUIDE.md §1).

## 11. Explicitly Out of Scope (anti-over-engineering guardrails)

- No premature abstraction: don't build a generic "Booking Engine SDK" before there are two real consumers of it (the second clinic). One clinic today = concrete code with the *seams* (ports, tenancy column) left in place, not a speculative plugin system.
- No custom state-management library; React Server Components + Server Actions + minimal client state (React state/URL state) until a concrete need for something heavier (e.g. Zustand) appears.
- No GraphQL layer for the core app — REST/Server Actions are sufficient at this scale; GraphQL is only in play at the WordPress-content boundary if WordPress's own API is used that way.
