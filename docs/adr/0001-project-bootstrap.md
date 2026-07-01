# 0001. Project bootstrap & tooling

Status: Accepted
Date: 2026-07-01

## Context

All architecture/design documentation (SYSTEM_ARCHITECTURE.md, FOLDER_STRUCTURE.md, DESIGN_SYSTEM.md, CODING_STANDARDS.md, etc.) was written before any code existed. Hamid has now explicitly approved starting implementation ("کارت رو استارت بزن") with a confirmed homepage storyboard and finalized color direction. This ADR records the concrete toolchain choices needed to scaffold the repo, so they don't get silently decided inside a shell command.

## Decision

- **Framework**: Next.js 15, App Router, TypeScript strict mode, `src/` directory — per FOLDER_STRUCTURE.md.
- **Styling**: Tailwind CSS, theme extended with DESIGN_SYSTEM.md's tokens (no separate CSS-in-JS library).
- **Motion**: `framer-motion` (component-level/micro-interactions) + `gsap` (`ScrollTrigger` plugin, for cinematic scroll storytelling) — both installed from day one since the Hero/Homepage Storyboard requires them immediately, not deferred.
- **Package manager**: npm (no project-specific reason to prefer pnpm/yarn; npm is the zero-setup default).
- **Linting/formatting**: ESLint (Next.js core-web-vitals config) + Prettier, per CODING_STANDARDS.md §1.
- **Validation**: Zod added now since Server Actions for the booking/contact forms are imminent (API_GUIDELINES.md §2).
- **Fonts**: `next/font` for self-hosted Latin + Persian webfonts (no external font CDN calls, for both performance and the Offline-First principle in VISION.md).
- Directory skeleton created to match FOLDER_STRUCTURE.md exactly (`modules/`, `core/`, `infrastructure/`, `components/`, `config/`, `styles/`, `i18n/`, `types/`) with placeholder `index.ts`/`README` files where a folder would otherwise be empty in git.

## Consequences

- Gets a running `npm run dev` app immediately, matching ROADMAP.md Phase 1 ("Project setup, Next.js, Tailwind, Design System, Homepage, Core pages, PWA, SEO foundation").
- Prisma/PostgreSQL, n8n, and the AI Gateway are **not** part of this bootstrap — those land with their own ADRs once the payment/SMS/auth open questions (PROJECT_UNDERSTANDING.md §13) are resolved, since the homepage build (the immediate priority per Hamid's latest request) doesn't need them yet.
- `fa` is the only locale with real content for now (see docs/adr/0002-fa-first-locale-scope.md); the `[locale]` routing segment is scaffolded per SYSTEM_ARCHITECTURE.md §9 so `en`/`ar` are additive later, not a rewrite.
