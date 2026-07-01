# COMPONENT_GUIDE.md

> How components are organized and built, implementing [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) and [UI_GUIDELINES.md](./UI_GUIDELINES.md) tokens/rules in code, placed per [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md).

## 1. Three Component Tiers

1. **Primitives** (`src/components/ui/`) — shadcn/ui-derived building blocks restyled with our tokens: Button, Input, Card, Dialog, Sheet, Tooltip, etc. Pure presentation, zero business logic, zero data fetching.
2. **Shared composites** (`src/components/`) — feature-agnostic but domain-aware compositions used by more than one module: e.g. `BeforeAfterSlider`, `LanguageSwitcher`, `TrustBadgeRow`, `EmptyState`, `LoadingSkeleton`. Still no data fetching — they receive data via props.
3. **Feature components** (`src/modules/*/ui/`) — module-owned, may fetch/mutate through their module's `application`/`server` layer: `BookingCalendar`, `ChatWidget`, `PatientIntakeForm`.

Rule: if a component is used by two or more modules, it graduates from a module's `ui/` folder to `src/components/` — never copy-pasted between modules (per CODING_STANDARDS.md's reuse principle).

## 2. Component File Contract

Every non-trivial component file:

```tsx
// booking-calendar.tsx
export interface BookingCalendarProps {
  clinicId: string;
  availableSlots: TimeSlot[];
  onSelect: (slot: TimeSlot) => void;
}

export function BookingCalendar(props: BookingCalendarProps) { ... }
```

- Props interface exported and named `<Component>Props` — enables reuse/testing without digging into implementation.
- No default exports (named exports only) — keeps refactors/renames traceable across the codebase.
- Server vs. Client Component boundary explicit: a component is a Server Component unless it needs interactivity/state/browser APIs, in which case `"use client"` is declared at the top of that specific leaf component, not hoisted unnecessarily high in the tree.

## 3. Key Domain Components (first ones to design/build)

| Component | Tier | Notes |
|---|---|---|
| `BeforeAfterSlider` | Shared composite | See UI_GUIDELINES.md §5 — highest-priority custom build |
| `BookingCalendar` + `BookingConfirmation` | Feature (`booking`) | Implements the 3-step golden path in UX_GUIDELINES.md §2 |
| `ChatWidget` (Closer AI) | Feature (`closer-ai`) | AI-disclosure indicator mandatory (UI_GUIDELINES.md §7) |
| `WeeklyReportCard` | Feature (`oracle-ai`) | Dashboard surface for Oracle AI's async reports |
| `ServiceCard`, `DoctorCard`, `TestimonialCard` | Shared composite | One base `Card` primitive, distinct content slots |
| `LanguageSwitcher` | Shared composite | Drives the `fa`/`en`/`ar` + RTL/LTR switch (DESIGN_SYSTEM.md §7) |
| `TrustBadgeRow` | Shared composite | Credentials/certifications placement per UX_GUIDELINES.md §4 |

## 4. Styling Rules

- Tailwind utility classes only, composed via the DESIGN_SYSTEM.md token-based theme — no ad-hoc inline `style={}` except for truly dynamic values (e.g. a computed slider position) that cannot be expressed as a class.
- Use `class-variance-authority` (or equivalent) for components with visual variants (Button's primary/secondary, Card's elevated/flat) instead of prop-driven conditional class strings scattered inline.
- Logical spacing/alignment utilities only (`ms-*`, `me-*`, `text-start`), never physical (`ml-*`, `text-left`) in any shared or feature component, per CODING_STANDARDS.md §9.

## 5. Accessibility Contract

Every interactive shared/primitive component ships with: correct semantic HTML or ARIA role, keyboard operability, and visible focus states — verified once at the primitive level so feature components inherit it for free rather than re-implementing accessibility per screen.

## 6. Documentation Per Component

Non-trivial shared composites and feature components (not trivial primitives) get a short block comment above their export stating: purpose, and any non-obvious constraint (e.g. "must not exceed 200KB decoded image weight — see DESIGN_SYSTEM.md load budget"). No prop-by-prop restating of the TypeScript interface — the types are the reference for *what*, the comment is only for *why*, consistent with CODING_STANDARDS.md §8.

## 7. Testing

- Primitives: visual/interaction tests only where genuinely reusable logic exists (e.g. a custom `Slider`'s drag math) — not for pure styling wrappers around Radix.
- Feature components with business logic embedded in event handlers (e.g. `BookingCalendar`'s slot-selection validation) get unit tests at the `application` layer they call into, not by re-testing the same rule at the component level (per CODING_STANDARDS.md §7's domain-first testing priority).
