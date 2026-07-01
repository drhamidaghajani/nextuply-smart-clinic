# HOMEPAGE_STORYBOARD.md

> The pre-code homepage deliverable Hamid's design brief (2026-07-01 reference image) explicitly asked for: User Journey / Emotion Flow, section-by-section storyboard, and a motion timeline — produced before any homepage component is built, per PROJECT_GUIDE.md's design-before-code workflow. Implements the tokens in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) and the component tiers in [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md). Scope: **`fa` locale only for this build** (see `docs/adr/0002-fa-first-locale-scope.md`).

## 1. Emotion Flow

The entire homepage is sequenced around one deliberate emotional arc, not a list of independent sections:

```
Curiosity → Trust → Luxury → Technology → Proof → Transformation → Action
(Hero)     (Brand   (Doctor   (AI          (Before/  (Patient      (Final CTA)
            Intro)   Story)    Experience)  After +   Journey +
                                             Services) Statistics +
                                                        Testimonials)
```

Every section below states which point on this arc it serves — a section that doesn't clearly serve the arc doesn't ship, per DESIGN_SYSTEM.md §1's "Visual Prestige over decoration" principle.

## 2. Section-by-Section Storyboard

### 01 — Hero

- **Arc position**: Curiosity → first Trust signal
- **Goal**: the "10 seconds = international medical brand" test happens entirely here.
- **Content**: full-bleed cinematic video or photo of the clinic/doctor/space (Dr. Sadighi's supplied video is the primary candidate — see CONTENT_INVENTORY.md §8 for intake spec), oversized typography headline, floating CTA.
- **CTA**: "رزرو مشاوره" (Book a consultation)
- **Motion**: GSAP-driven entrance (headline/CTA fade-and-rise on load), subtle parallax on the background video/image on scroll start. One optional restrained WebGL accent (DESIGN_SYSTEM.md §5) — e.g. a soft animated gold-tinted gradient layer behind the headline, never a full 3D scene.
- **Color**: cream/warm-white text-safe overlay on video if needed for contrast; gold used only in the CTA button and one accent word/underline in the headline.

### 02 — Brand Intro

- **Arc position**: Trust
- **Goal**: introduce Nextuply's "digital growth architecture" positioning and frame Dr. Sadighi's practice as a forward-looking, internationally-minded brand — not a sales pitch.
- **Content**: short manifesto-style copy (2–3 short paragraphs, per Nextuply's brand-tone DNA: formal, analytical, restrained — no hype language), one still image or looping micro-video.
- **CTA**: "مشاهده بیشتر" (See more) → scrolls to Doctor Story.
- **Motion**: Framer Motion fade/slide-in on scroll-into-view, no looping animation.

### 03 — Doctor Story

- **Arc position**: Trust (deep)
- **Goal**: human connection — the doctor's story, not a dry CV. Content source: CONTENT_INVENTORY.md §1 (credentials, two-location practice) rewritten in narrative form, not a bullet list of degrees.
- **Content**: short video (if a second doctor-story-specific clip exists beyond the Hero video) or a photo + narrative copy; optional short list of credentials presented visually (badges/marks), not as a resume table.
- **CTA**: "درباره دکتر" (About the doctor) → full bio page.
- **Motion**: GSAP scroll-triggered reveal (image and text enter independently, slight stagger) — this is the first "cinematic storytelling" moment beyond the Hero.

### 04 — Before/After Gallery

- **Arc position**: Proof (first pass)
- **Goal**: prove result quality — per UI_GUIDELINES.md §5, this is the single highest-priority custom component in the whole site.
- **Content**: horizontal-scroll gallery of Before/After Slider instances, filterable by procedure (rhinoplasty, blepharoplasty, facelift, etc. — from CONTENT_INVENTORY.md §2). Minimum photo count and file specs: see CONTENT_INVENTORY.md §8.
- **CTA**: "مشاهده نتایج بیشتر" (See more results) → full gallery page.
- **Motion**: horizontal scroll/snap with light momentum easing; the slider drag itself is the main interaction (UI_GUIDELINES.md §5 — patient-controlled, never auto-playing).

### 05 — AI Experience

- **Arc position**: Technology
- **Goal**: signal innovation — introduce Closer AI / Oracle AI / Patient Assistant conceptually (not a technical explanation) as "this practice is ahead of the curve."
- **Content**: three short concept cards or a single scroll-driven sequence, plain-language framing (e.g. "دستیار هوشمند پذیرش شما را ۲۴ ساعته پاسخ می‌دهد" rather than naming internal product architecture).
- **CTA**: "کشف AI کلینیک" (Discover the clinic's AI) → could deep-link to opening the Closer AI chat widget directly.
- **Color**: this is the section that uses the **deep-navy dark underlay** (DESIGN_SYSTEM.md §2) for contrast — the one deliberate "dark mode moment" on the page.
- **Motion**: GSAP scroll-pinned sequence acceptable here (brief, 1–2 viewport-heights max) — this is the section where a *subtle* WebGL or shader accent, if used at all beyond the Hero, would be most justified (still must pass the "premium clinic vs. tech demo" test in DESIGN_SYSTEM.md §5).

### 06 — Services

- **Arc position**: (returns to) Trust/Information, in service of the Action arc
- **Goal**: clear, scannable service catalog.
- **Content**: card grid (COMPONENT_GUIDE.md's `ServiceCard`), one icon/image + short description + link per procedure family (aesthetic vs. maxillofacial — see CONTENT_INVENTORY.md §2's two-family distinction).
- **CTA**: "مشاهده همه خدمات" (See all services) → full services page.
- **Motion**: Framer Motion staggered card entrance on scroll-into-view only — no per-card looping motion.

### 07 — Patient Journey

- **Arc position**: Trust → Action (removes friction ahead of the CTA)
- **Goal**: make the process (first contact → treatment → result) feel transparent and simple, directly implementing UX_GUIDELINES.md §2's 3-step golden path.
- **Content**: horizontal or vertical timeline (4 steps: message/consult → visit → procedure → result/support).
- **CTA**: "شروع مسیر من" (Start my journey) → opens Closer AI or the booking flow.
- **Motion**: GSAP scroll-scrubbed timeline (progress line fills as user scrolls) — a good, purposeful use of scroll-linked animation.

### 08 — Statistics

- **Arc position**: Proof
- **Goal**: hard-number credibility (case count, years of experience, satisfaction rate). All numbers must be real — see CONTENT_INVENTORY.md; do not fabricate placeholder statistics.
- **Content**: 3–4 large animated counters + one short supporting line each.
- **CTA**: "مشاهده جزئیات" (See details), optional — this section can also be CTA-less if it flows directly into Testimonials.
- **Motion**: counters animate once on scroll-into-view (Framer Motion or a small counter library), never re-triggering on every scroll pass.

### 09 — Testimonials

- **Arc position**: Proof (final, most personal)
- **Goal**: final trust confirmation before the ask. Content source: CONTENT_INVENTORY.md §4's existing 4+ testimonials, ideally supplemented with video testimonials if available.
- **Content**: carousel or grid of quotes/videos with patient first name + procedure (with consent).
- **CTA**: "خواندن بیشتر" (Read more) → dedicated testimonials page.
- **Motion**: simple crossfade/slide carousel, manually and auto-advanced with a long, unobtrusive interval; pauses on hover/focus and respects `prefers-reduced-motion`.

### 10 — Final CTA

- **Arc position**: Action
- **Goal**: the conversion moment — per UX_GUIDELINES.md §2, this must not introduce new friction after nine sections of trust-building.
- **Content**: one clear headline, one primary CTA ("رزرو نوبت" / book now), one secondary path (WhatsApp / free consultation) — never more than two options, per UI_GUIDELINES.md §2's "one primary CTA" rule.
- **Motion**: understated — this section earns attention through copy and offer clarity, not additional animation.

### 11 — Footer (Premium)

- **Arc position**: closes the arc — reassurance and access.
- **Content**: clinic contact info per location (Tehran + Tabriz — see DATABASE_GUIDE.md's `Location` entity), hours, social links, trust marks (credentials/certifications), sitemap.
- **Motion**: none beyond standard hover states — a footer should feel calm and stable, not another animated moment.

## 3. Motion Timeline Summary (per DESIGN_SYSTEM.md §5)

| Section | Primary tool | Motion type |
|---|---|---|
| Hero | GSAP + optional WebGL accent | Entrance + parallax |
| Brand Intro | Framer Motion | Scroll fade/slide |
| Doctor Story | GSAP (ScrollTrigger) | Staggered scroll reveal |
| Before/After Gallery | Native scroll/drag + Framer Motion | Horizontal scroll-snap, slider drag |
| AI Experience | GSAP (ScrollTrigger, pinned) | Short pinned sequence, dark section |
| Services | Framer Motion | Staggered card entrance |
| Patient Journey | GSAP (ScrollTrigger, scrubbed) | Scroll-scrubbed timeline fill |
| Statistics | Framer Motion | Count-up on view |
| Testimonials | Framer Motion | Carousel crossfade |
| Final CTA | Framer Motion | Simple entrance only |
| Footer | — | None (static) |

## 4. What This Storyboard Deliberately Excludes

Per Hamid's own "نکات بسیار مهم" and DESIGN_SYSTEM.md's anti-decoration principle: no autoplay-with-sound, no forced-scroll-hijacking beyond the two explicitly scoped ScrollTrigger moments (Doctor Story, Patient Journey, AI Experience), no stock medical photography, no more than one dark-background section, no WebGL outside the Hero/AI Experience accents defined above.

## 5. Next Deliverables (per Hamid's requested Stage-1 output list)

This document covers the "Homepage Storyboard" and "Motion Timeline" items. Still open before pixel-level build: **low-fidelity wireframe** and **Figma-level high-fidelity UI** — those are visual-design-tool deliverables outside what can be produced as Markdown/code and are the natural next step once real photography/video assets (CONTENT_INVENTORY.md §8) are in hand.
