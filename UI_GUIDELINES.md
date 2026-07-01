# UI_GUIDELINES.md

> Component-level visual rules built on top of [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) tokens. Pair with [UX_GUIDELINES.md](./UX_GUIDELINES.md) for interaction behavior and [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md) for how components are structured in code.

## 1. Component Base

Build on **shadcn/ui + Radix primitives** (unstyled, accessible, composable) restyled with the DESIGN_SYSTEM tokens, rather than a heavy pre-styled UI kit (MUI/Ant class libraries) — this keeps visual output "custom Elite" rather than "recognizable template," matching Nextuply's explicit "no off-the-shelf templates" principle from its own business docs.

## 2. Buttons

- Primary: solid accent fill, used once per view for the single most important action (e.g. "Book Consultation").
- Secondary: outline/ghost, for supporting actions.
- Never more than one primary button visible at a time in a given viewport — avoids diluting the CTA, directly serving the "clear CTA" rule in VISION.md.
- Minimum touch target 44×44px (mobile-first accessibility).

## 3. Forms

- Labels always visible (no placeholder-as-label anti-pattern) — critical for medical/booking forms where clarity beats minimalism.
- Inline validation on blur, not on every keystroke.
- Persian numerals vs. Latin numerals handled consistently per locale (phone numbers, prices) — a specific i18n-UI rule, not just a translation rule.

## 4. Cards

- Service cards, doctor cards, testimonial cards share one base card primitive (see COMPONENT_GUIDE.md) with slots for image/title/meta/action — no bespoke one-off card markup per page.
- Elevation kept minimal (flat + hairline border by default; shadow only on hover/interactive cards).

## 5. Before/After Slider

The single highest-priority custom component in the system (per the client proposal). Requirements:

- Touch-friendly drag on mobile, mouse-drag on desktop, keyboard-operable (arrow keys) for accessibility.
- Lazy-loaded, responsive images with explicit width/height to avoid layout shift.
- Never auto-plays/auto-slides — the patient controls the reveal, which is both a trust signal and an accessibility requirement.

## 6. Navigation

- Public site: sticky top nav, collapses to a mobile drawer under a defined breakpoint; language switcher always visible and never buried in a settings menu.
- Portal/Dashboard: persistent sidebar on desktop, bottom-tab or drawer on mobile — these are a *different navigation pattern by design* because they serve returning, task-focused users, not first-time visitors.

## 7. Chat Widget (Closer AI)

- Docked bottom-corner on desktop, full-width bottom-sheet on mobile.
- Visually distinct "AI" indicator at all times (per UX_GUIDELINES.md's honesty requirement) — an icon/label, not a fake human avatar/name implying a real staff member.
- Must never cover the primary CTA or booking calendar when open on small viewports.

## 8. Responsive Breakpoints

Aligned to Tailwind defaults, extended only if a real need appears: `sm 375–639`, `md 640–1023`, `lg 1024–1279`, `xl 1280+`. Design and build mobile-first (`sm` styles are the base, larger breakpoints are additive overrides) — never the reverse.

## 9. Accessibility (WCAG AA minimum)

- Color contrast checked against DESIGN_SYSTEM tokens before shipping any new color combination.
- All interactive elements reachable and operable via keyboard.
- All images (especially before/after and doctor photos) require meaningful `alt` text — not decorative-empty by default, since medical imagery often carries information.

## 10. What Not To Do

- No parallax-heavy, animation-dense marketing-agency clichés — conflicts directly with the "calm confidence" principle in DESIGN_SYSTEM.md.
- No dark-pattern UI (pre-checked upsells, forced countdown timers on booking) — conflicts with Nextuply's transparency/accountability core value and with medical-ethics expectations for this vertical.
- No component styled inline/one-off when an equivalent already exists in COMPONENT_GUIDE.md — extend the shared component instead.
