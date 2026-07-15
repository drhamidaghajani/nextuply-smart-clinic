# DESIGN_SYSTEM.md

> Visual foundation shared by UI_GUIDELINES.md (component-level rules) and UX_GUIDELINES.md (interaction rules). Reflects Nextuply's brand DNA (formal, analytical, low visual noise) applied to a medical-aesthetic vertical, and VISION.md's design references (Apple, Stripe, Linear, Raycast, Notion, Vercel). Explicitly **not** benchmarked against Iranian medical/clinic sites — see §9.

## 1. Design Principles

1. **Visual Prestige over decoration.** Every surface should read as "world-class clinic," achieved through restraint (whitespace, typography, precise imagery) — not through busy gradients, stock icons, or heavy color.
2. **Calm confidence.** A patient researching a procedure is often anxious. The UI must never feel like a sales page; it should feel like a competent, calm professional.
3. **Mobile-first, always.** ~90% of aesthetic-medicine traffic is mobile (per the client proposal). Every token and component is designed for a 375px viewport first, then scaled up.
4. **One brand, many locales.** The same visual language must hold up in `fa` (RTL), `en` (LTR), and `ar` (RTL) without feeling translated.
5. **Editorial, cinematic pacing.** The homepage reads as a film narrative, not a stack of independent sections (see HOMEPAGE_STORYBOARD.md §1) — each section earns the next through emotional sequencing, not just visual variety.
6. **Every section passes a Creative Director self-check before it ships** (confirmed by Hamid, 2026-07-04). Before implementing any section — and again before considering it done — ask:
   - Is this section memorable? Is it unique to this clinic, or would it work on any clinic's site?
   - Does it create emotion, or just display information?
   - Would this be worth featuring on Awwwards — for craft and restraint, not for spectacle?
   - Is there a more elegant interaction than the first one that came to mind?
   - Can motion improve the storytelling here, or is it decoration?
   - Is there UI here that could be removed, replaced by typography/whitespace, or simplified?
   - Never ship the first obvious solution. If a section still reads as "a standard medical website," it goes back for another pass before code is written — see the process note at the end of §5.

## 2. Color

**Palette as implemented in `globals.css` (source of truth — synced 2026-07-04).** Two values below were adjusted from the original 2026-07-01 reference-image reading during live Hero/AiConcierge iteration; this table now matches shipped code rather than the original swatch reading.

| Token | Hex (live) | Role |
|---|---|---|
| `color.cream` (champagne base) | `#FCFBF4` | Primary page background — warm, not clinical white |
| `color.warm-white` | `#FAF7F1` | Card/surface background, one step lighter than the page base |
| `color.gold` (accent) | `#C9A15A` | Primary accent: CTAs, active states, key highlights, icon accents — used sparingly per §1's restraint principle |
| `color.gold-hover` | `#B78E46` | Hover/active state for gold-accented controls |
| `color.charcoal` (text) | `#2A2A28` | Primary text color — warm-dark, not pure black |
| `color.deep-navy` (dark underlay) | `#0F172A` | Dark-section background (Hero video overlay, AiConcierge's assistant card, and future high-contrast emphasis blocks). Adjusted from `#0B1120` on 2026-07-11 (per Hamid, live in code) — the original value read darker than intended across every surface using it. |

Rules:
- **Neutral base is cream/champagne**, not clinical pure-white or cold gray — this is what makes the site read as hospitality-luxury rather than hospital.
- **Gold is the only accent color** — used for CTAs, active states, and key numbers/highlights. Never more than one gold element competing for attention per viewport.
- The **deep-navy dark underlay** is reserved for a small number of high-impact full-bleed sections (per the Homepage Storyboard's "AI Experience" and "Statistics" sections) to create rhythm/contrast against the cream base — it is not an alternate "dark mode," it's a deliberate section-level device.
- **Semantic colors** (success/warning/error/info) kept desaturated relative to typical SaaS defaults — an "error" state in a medical booking flow should read as "please check this," not alarm-red.
- No more than **2 colors** visible in a single fold beyond neutrals (cream/warm-white/charcoal) + one accent (gold), in line with Nextuply's "visual noise 2/10" DNA rating.

## 3. Typography

**Current live setting (2026-07-11, per Hamid, supersedes the 2026-07-02 heading/body split below):** **Vazirmatn for everything** — headings and body text both. IranSans is still loaded (`layout.tsx`) but not applied anywhere by default; it's kept available rather than removed, in case a future section calls for the contrast of a second family. If that split is reinstated, it should read as an explicit design decision for a specific section, not a silent global default.

Superseded 2026-07-02 pairing, kept here for reference in case the split is revisited:

- **Headings/titles (fa)**: Vazirmatn — applies by *role*, not just tag: any text functioning as a title/headline gets Vazirmatn, even if it's markup as a `<p>` (e.g. the Hero's "Dr. Name | Specialty" line).
- **Body text (fa)**: IranSans — used for paragraphs, UI labels, form text, captions.
- **Latin**: a modern, geometric-humanist sans (Inter-class) for `en` content and numerals — unchanged.
- **Arabic**: shares the Persian heading/body split where glyph coverage allows, falling back to a dedicated Arabic-optimized font only if quality suffers — unchanged, still pending real `ar` content per docs/adr/0002.
- **Scale**: a single modular type scale (e.g. 1.25 ratio) shared across locales; line-height increased for Persian/Arabic body text (~1.7–1.8) versus Latin (~1.5) to account for script density.
- **Headings can be large — editorial-large, in the Stripe/Linear sense** (big, confident, generously spaced) — but never loud. "Restrained" means no oversized display type used *for effect*, not that headings must stay small: size should come from wanting the words to breathe, with whitespace and line-height doing as much work as the font-size itself.
- **Standing rule, locked 2026-07-06 (per Hamid, after correcting several homepage sections one-by-one for this): every homepage section's heading is a flat `30px` and its subheading (when the section has one) is a flat `22px`, at desktop (`lg`) and up.** This is a fixed desktop size, not a responsive top-of-scale value — mobile/tablet steps below `lg` still scale up normally (mobile-first, per PROJECT_GUIDE.md), they just top out at 30px/22px at `lg` instead of continuing to grow toward a larger `xl`/`2xl` value. In Tailwind terms: `lg:text-[30px]` on the heading, `lg:text-[22px]` on the subheading — not `lg:text-4xl`/`lg:text-5xl` or similar scale-token classes, which read larger. Apply this to every section's heading/subheading pair going forward as sections are built or revisited, rather than waiting for Hamid to flag each one individually — sections already corrected under this rule: Smart Clinic Assistant, Featured Services, Why Dr. Sadighi, Patient Journey, Case Gallery, Patient Stories, Knowledge Center.

## 4. Spacing & Layout

- 8px base spacing unit; all component padding/margin values are multiples of it.
- Generous whitespace between sections (Nextuply's "visual perfectionism" principle) — sections should never feel cramped even on mobile.
- Max content width capped for readability on public pages; full-bleed only for hero imagery/video and the before/after gallery.

## 5. Motion

**Tier, revised 2026-07-04 (supersedes the 2026-07-01 "not Awwwards tier" framing below — see the note at the end of this section for why).** Target register: cinematic, editorial scroll-storytelling with restrained, purposeful accents — craft-level ambition matching Awwwards-caliber sites, but from the *restrained/typography-led* end of that spectrum (think Linear, Vercel, or an Awwwards-winning editorial/portfolio site), not the WebGL-spectacle end. Concretely:

- Framer Motion for component-level transitions (page/section entrances, modal/drawer open-close, chat widget expand, micro-interactions).
- GSAP for scroll-driven storytelling on the Hero and service pages — full-bleed photo/video sequences revealed on scroll — not used for routine UI micro-interactions, to avoid animation sprawl.
- **Named motion vocabulary — every motion choice in a section should map to one of these, named explicitly in its component doc-comment (confirmed by Hamid, 2026-07-04):**
  - **Reveal / Mask Reveal** — content emerges from behind a mask/clip edge, not a plain fade — used for section entrances, image reveals.
  - **Fade** — simple opacity transition, for the lowest-emphasis state changes only.
  - **Scale** — subtle scale-in/out (hover elevation, image reveal on hover) — never used for full-section entrances (too playful at that scale).
  - **Parallax** — very limited use; at most one parallax layer per section, and only where it reinforces depth (e.g. Hero video vs. foreground text), never as a default entrance effect.
  - **Light Sweep** — a soft light/gradient sweep across a surface, reserved for a single "hero moment" per page (e.g. gold accent catching light on a CTA or card edge).
  - **Micro Interaction** — small state-change feedback (button press, input focus, chip select) — always under 200ms.
  - **Hover Elevation** — shadow/scale lift on hover for cards/CTAs, signaling interactivity without color noise.
  - **Image Reveal** — clip-path or mask-based reveal for photography (Before/After, Doctor Story, Services) instead of a plain fade-in.
  - **Text Reveal** — word/line-level entrance (e.g. Hero's `.animate-word-flip-up`) — reserved for a page's most important 1-2 headline moments, not applied to every heading site-wide.
  - **Smooth Scroll** — eased scroll behavior / scroll-snap (see globals.css `.snap-section`) for section-to-section transitions.
- **WebGL: one accent only, in the Hero, nowhere else.** E.g. a subtle animated gradient/shader background behind the Hero headline. No interactive 3D objects, no physics, no "drive/scroll through a 3D world" mechanics. Any WebGL use is reviewed against "does this make the first 10 seconds feel more like an international premium clinic, or does it feel like a tech demo" — if the latter, it's cut.
- Motion duration defaults: 150–250ms for UI feedback/micro-interactions, 400–600ms for section/page-level entrances. Nothing decorative loops indefinitely except deliberate ambient hero video/loops.
- Respect `prefers-reduced-motion` everywhere, no exceptions.
- **Glassmorphism**: allowed only as a light, functional touch (e.g. a translucent sticky nav bar or a floating CTA card over the Hero video) — never as a dominant visual style across the site.
- **Process gate (confirmed by Hamid, 2026-07-04):** before implementing a section's motion, run the §1 Creative Director self-check first — "is this the first obvious solution, or the most elegant one?" A section doesn't move to code until that question has actually been asked and answered, not rubber-stamped.

**Why the tier framing changed:** the 2026-07-01 language explicitly rejected "Awwwards-flagship/Site-of-the-Year tier" as wrong for a medical-trust context, associating "Awwwards" with WebGL spectacle. Hamid's 2026-07-04 brief explicitly asks for Awwwards-caliber craft ("Would this section be featured on Awwwards?" as a design test) and cites Awwwards Winners as a positive reference alongside Apple/Linear/Stripe. These aren't actually opposed — Awwwards recognizes plenty of restrained, typography-led, editorial work, not only spectacle sites — so this section now targets that craft bar explicitly, while keeping every original restraint rule (no WebGL outside the Hero, no gimmicks, `prefers-reduced-motion` always respected) intact. Flagging this explicitly per CLAUDE.md rather than quietly rewriting the framing.

See [HOMEPAGE_STORYBOARD.md](./HOMEPAGE_STORYBOARD.md) for the section-by-section motion timeline this maps to.

## 6. Imagery

- Before/After photography is the single most important visual asset — must be color-consistent, high-resolution, and served through Next.js Image with strict compression budgets (ties to the <3s load requirement in SYSTEM_ARCHITECTURE.md §10).
- No generic stock medical photography (needles, gloves-close-up clichés). Every image either is Dr. Sadighi's real clinic/work or is abstract/textural brand material.

## 7. RTL/LTR Tokens

Design tokens are logical, not physical: `spacing-inline-start/end`, `text-align: start/end`, never hardcoded `left`/`right` in component styles. This is enforced in CODING_STANDARDS.md and is what makes the `fa`/`ar` (RTL) vs `en` (LTR) switch a layout-level flip rather than a per-component fix.

## 8. Design Tokens (initial set — implemented as Tailwind theme extension)

```
color.bg.base / bg.raised / bg.inverted
color.text.primary / text.secondary / text.muted / text.inverted
color.accent.default / accent.hover / accent.muted
color.semantic.success / warning / error / info
space.1 … space.12          (8px increments)
radius.sm / md / lg / pill
shadow.sm / md / lg         (used sparingly — flat design bias)
font.family.latin / persian / arabic
font.size.xs … 5xl
motion.duration.fast / base / slow
```

Exact values are finalized in the first "Design System implementation" ADR, once real brand assets from Dr. Sadighi's clinic are available — this document defines the *shape* of the system, not final hex/px values, to avoid inventing a brand identity that then gets discarded.

## 9. Reference Benchmarks (reviewed 2026-07-01, expanded 2026-07-04)

Real sites reviewed to calibrate the direction above — not to be copied, but to define "what tier are we aiming for" concretely.

**Adopt patterns from:**

| Site | What to take |
|---|---|
| Apple | Restraint, product photography treatment, scroll-triggered reveals that always serve comprehension |
| Stripe | Typography-led information hierarchy, confident whitespace, motion that clarifies state changes |
| Linear | Editorial-large headings, dark-mode-adjacent contrast handling, precise micro-interactions |
| Raycast | Elegant, minimal component chrome; motion as feedback, never as decoration |
| Notion | Calm, content-first layout discipline; how a content-heavy product still feels uncluttered |
| Vercel | Interface-level polish, spacing discipline, restrained use of gradient/glow accents |
| Awwwards Winners (restrained/editorial category, not spectacle category) | Proof that "featured-on-Awwwards" craft is compatible with a calm, trust-first register — the bar to hold sections to per §1/§5's Creative Director self-check |
| [Royal Clinic](https://royalclinic.pl/) | Warm brown/cream palette, calm luxurious pacing — closest color/tone match to our confirmed direction |
| [Badrutt's Palace Hotel](https://badruttspalace.com/en/winter/) | Full-bleed photo/video storytelling sections, heritage-meets-contemporary balance, restrained CSS/GSAP motion (no heavy WebGL) — the clearest model for "international premium brand in 10 seconds" |
| [Aesthetics Clinic](http://www.aesthetics-ge.ch) | Radical typographic/whitespace discipline — reference for restraint even though its monochrome palette isn't our chosen direction |

**Explicitly avoid patterns from:**

| Site | What to avoid, and why |
|---|---|
| Iranian medical/clinic sites generally (confirmed by Hamid, 2026-07-04) | Not a reference point at all for this project — the explicit goal is to read as a world-class international brand, not to compete within the local category's visual conventions |
| [Demophorius](https://demophorius.com/) | Colorful gradients/blur effects — directly conflicts with Nextuply's low-visual-noise brand DNA |
| [dralirezasadighi.com](https://dralirezasadighi.com/) (current live site) | The exact baseline we are replacing: dated teal accents, generic clinic-template layout, no premium micro-interaction or visual hierarchy — see CONTENT_INVENTORY.md §6 |
| [drwilliammiami.com](https://www.drwilliammiami.com/) | Sophisticated content strategy undermined by placeholder/missing portfolio photography and an external, non-integrated consultation widget — confirms that real photography and a fully integrated booking flow (not a redirect) are non-negotiable, not optional polish |
| Awwwards Site-of-the-Year-tier WebGL spectacles (e.g. interactive 3D/physics-driven sites) | Right craft level, wrong emotional register for a medical-trust context — see §5's WebGL rule. Distinct from "Awwwards Winners" above: the craft bar is the target, the spectacle register is not. |

`https://template-kit.evonicmedia.com/layout41/` (an Evonic Media "template kit" layout Hamid also flagged as an inspiration source) could not be reviewed — it returned an HTTP 403 to automated fetching. Generically, Evonic Media sells pre-built, mass-produced med-spa template layouts; by definition a template product is a floor to clear, not a ceiling to aim for, since the same layout is sold to many unrelated practices. If a closer look is wanted, a screenshot or PDF export would let this get the same treatment as the other references.
