# UX_GUIDELINES.md

> Interaction and flow-level rules. Pairs with [UI_GUIDELINES.md](./UI_GUIDELINES.md) (visual rules) and [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) (tokens).

## 1. Core UX Values (from VISION.md, applied concretely)

| VISION.md rule | Concrete meaning here |
|---|---|
| Fast | Every primary flow (browse → book, ask Closer AI a question) completes in the fewest possible steps and screens. |
| Simple | No flow should require the patient to understand clinic-internal concepts (departments, doctor codes). They think in terms of "what procedure, what date." |
| Emotional | Visual/content pacing (before/after reveals, real testimonials) builds confidence — without resorting to manipulative urgency tactics. |
| Smooth animations | See DESIGN_SYSTEM.md §5 — motion supports comprehension, never delays task completion. |
| Clear CTA | One primary action per screen, always. |
| Consistent components | Reuse over recreate — see COMPONENT_GUIDE.md. |

## 2. Golden Path: Booking Flow

Target: **3 steps, under 90 seconds**, from a cold visitor landing on a service page to a confirmed, deposit-paid appointment.

1. **Select service** (pre-filled if arriving from a specific service page).
2. **Select date/time** from real doctor availability (no "we'll call you back" dead-ends).
3. **Confirm + pay deposit** (or request-consult if no deposit required for that service).

Any additional data collection (medical history intake, etc.) happens *after* the slot is secured, never before — removing friction from the commitment moment is the single highest-leverage UX decision in this product, per the client proposal's framing of "closing the deal ⁄24."

## 3. Golden Path: Closer AI Conversation

- Opens with a warm, brief greeting — never a wall of menu options.
- Triage questions are asked one at a time, conversationally, not as a form disguised as chat.
- Every conversation has an explicit, reachable "talk to a human" escape hatch.
- If the AI is not confident in a medical/pricing answer, it says so and offers the booking/consult path rather than guessing — this is a trust requirement, not just a UX nicety, given the vertical.
- The bot must disclose it is an AI assistant on first contact of every session — no impersonation of clinic staff.

## 4. Trust-Building Patterns

- Before/after gallery and real testimonials placed as close as possible to every conversion point (service page CTA, chat widget first response), not buried in a separate "about us" page.
- Doctor credentials/certifications surfaced prominently on every service page — a High-Ticket medical purchase decision leans heavily on perceived authority (consistent with Nextuply's own "Authority" cultural-trend finding).
- Real, dated case studies over generic marketing claims wherever content allows.

## 5. Multilingual UX

- Locale is detected once (browser/geo) and persisted per session, but always manually switchable via a visible control — never silently forced.
- `en`/`ar` visitors default into the medical-tourism content track (visa/hotel/transfer info) rather than a literal translation of the domestic Persian journey — different intents need different flows, not just different strings.
- RTL (`fa`, `ar`) and LTR (`en`) layouts are full mirror-flips, verified per component — see UI_GUIDELINES.md §8/DESIGN_SYSTEM.md §7 for the token-level mechanism.

## 6. Empty, Loading & Error States

- Every async view (available slots, AI response, dashboard reports) has a designed loading state (skeletons, not blank screens or spinners-only) and a designed empty state (e.g. "no slots this week" must suggest an alternative action, not dead-end).
- Payment/booking errors are written in plain, reassuring language and always offer a fallback (e.g. WhatsApp/phone contact) — a failed booking must never feel like a dead end for an anxious patient.

## 7. Performance-Perceived UX

- Optimistic UI for low-risk actions (e.g. selecting a time slot shows as selected instantly, confirmed async).
- Skeleton loaders matching final layout dimensions to avoid layout shift, tying back to the <3s load / Core Web Vitals requirement in SYSTEM_ARCHITECTURE.md §10.

## 8. Accessibility as UX (not just compliance)

- Flows must be completable by keyboard-only and screen-reader users, not just visually functional — this is explicitly listed as a VISION.md Core Principle ("Accessibility"), not an optional nice-to-have.
- Motion-sensitive users are respected via `prefers-reduced-motion` at the flow level (e.g. the before/after slider's default reveal state), not just individual animations.

## 9. What Not To Do

- No multi-page "funnel" tricks (fake scarcity countdowns, forced multi-step lead forms before showing pricing) — directly conflicts with Nextuply's transparency value and this vertical's ethics.
- No auto-playing audio/video with sound.
- No dead-end screens: every screen has a next action, even error screens.
