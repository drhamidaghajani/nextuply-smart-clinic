# DESIGN_SYSTEM.md

> Visual foundation shared by UI_GUIDELINES.md (component-level rules) and UX_GUIDELINES.md (interaction rules). Reflects Nextuply's brand DNA (formal, analytical, low visual noise) applied to a medical-aesthetic vertical, and VISION.md's design references (Apple, Stripe, Linear, Raycast, Vercel).

## 1. Design Principles

1. **Visual Prestige over decoration.** Every surface should read as "world-class clinic," achieved through restraint (whitespace, typography, precise imagery) — not through busy gradients, stock icons, or heavy color.
2. **Calm confidence.** A patient researching a procedure is often anxious. The UI must never feel like a sales page; it should feel like a competent, calm professional.
3. **Mobile-first, always.** ~90% of aesthetic-medicine traffic is mobile (per the client proposal). Every token and component is designed for a 375px viewport first, then scaled up.
4. **One brand, many locales.** The same visual language must hold up in `fa` (RTL), `en` (LTR), and `ar` (RTL) without feeling translated.

## 2. Color

**FINAL palette confirmed by Hamid (2026-07-01), superseding the earlier Royal Clinic/Badrutt's-Palace brown/burgundy placeholder.** Hamid supplied a reference image with the exact swatches; hex values below are read off that reference and should be treated as accurate to intent, but re-verified against the original design file (Figma/exported swatches) before being hardcoded into `tailwind.config` — flag if any value below looks off once the source file is available.

| Token | Approx. hex | Role |
|---|---|---|
| `color.cream` (champagne base) | `#F3ECDC` | Primary page background — warm, not clinical white |
| `color.warm-white` | `#FAF7F1` | Card/surface background, one step lighter than the page base |
| `color.gold` (accent) | `#C9A15A` | Primary accent: CTAs, active states, key highlights, icon accents — used sparingly per §1's restraint principle |
| `color.charcoal` (text) | `#2A2A28` | Primary text color — warm-dark, not pure black |
| `color.deep-navy` (dark underlay) | `#0B1120` | Dark-section background (used for high-contrast emphasis blocks — e.g. the AI Experience section — and the Hero video overlay). **Exact value confirmed by Hamid 2026-07-02** (given directly as a hex code for the Hero overlay), superseding the earlier eyeballed `#12141C`. |

Rules:
- **Neutral base is cream/champagne**, not clinical pure-white or cold gray — this is what makes the site read as hospitality-luxury rather than hospital.
- **Gold is the only accent color** — used for CTAs, active states, and key numbers/highlights. Never more than one gold element competing for attention per viewport.
- The **deep-navy dark underlay** is reserved for a small number of high-impact full-bleed sections (per the Homepage Storyboard's "AI Experience" and "Statistics" sections) to create rhythm/contrast against the cream base — it is not an alternate "dark mode," it's a deliberate section-level device.
- **Semantic colors** (success/warning/error/info) kept desaturated relative to typical SaaS defaults — an "error" state in a medical booking flow should read as "please check this," not alarm-red.
- No more than **2 colors** visible in a single fold beyond neutrals (cream/warm-white/charcoal) + one accent (gold), in line with Nextuply's "visual noise 2/10" DNA rating.

## 3. Typography

**FINAL font pairing confirmed by Hamid (2026-07-02), superseding the earlier "single Persian family for everything" assumption:**

- **Headings/titles (fa)**: **Vazirmatn** — applies by *role*, not just tag: any text functioning as a title/headline gets Vazirmatn, even if it's markup as a `<p>` (e.g. the Hero's "Dr. Name | Specialty" line). `h1`–`h6` get it automatically via a global CSS rule; a title-like element that isn't a heading tag needs the `font-heading` utility applied explicitly (confirmed 2026-07-02 after that exact gap surfaced in the Hero).
- **Body text (fa)**: **IranSans** — used for paragraphs, UI labels, form text, captions. Hamid has the font files and will supply them; see CONTENT_INVENTORY.md §9 for the intake spec (where to put them, which weights).
- **Latin**: a modern, geometric-humanist sans (Inter-class) for `en` content and numerals — unchanged.
- **Arabic**: shares the Persian heading/body split where glyph coverage allows, falling back to a dedicated Arabic-optimized font only if quality suffers — unchanged, still pending real `ar` content per docs/adr/0002.
- **Scale**: a single modular type scale (e.g. 1.25 ratio) shared across locales; line-height increased for Persian/Arabic body text (~1.7–1.8) versus Latin (~1.5) to account for script density.
- Headings are restrained in size relative to typical marketing sites — prestige comes from spacing and material quality, not oversized display type.

## 4. Spacing & Layout

- 8px base spacing unit; all component padding/margin values are multiples of it.
- Generous whitespace between sections (Nextuply's "visual perfectionism" principle) — sections should never feel cramped even on mobile.
- Max content width capped for readability on public pages; full-bleed only for hero imagery/video and the before/after gallery.

## 5. Motion

**Tier confirmed by Hamid (2026-07-01): "Royal Clinic / Badrutt's Palace" tier** — cinematic scroll-storytelling with restrained, purposeful accents. Explicitly **not** Awwwards-flagship/Site-of-the-Year tier (e.g. full interactive 3D scenes, WebGL "planet" experiences) — that register optimizes for spectacle/portfolio delight, which actively undermines trust for an anxious medical patient. Concretely:

- Framer Motion for component-level transitions (page/section entrances, modal/drawer open-close, chat widget expand).
- GSAP for scroll-driven storytelling on the Hero and service pages — full-bleed photo/video sequences revealed on scroll, in the spirit of Badrutt's Palace's "A Perfect Day" storytelling sections — not used for routine UI micro-interactions, to avoid animation sprawl.
- **WebGL: one accent only, in the Hero, nowhere else.** E.g. a subtle animated gradient/shader background behind the Hero headline. No interactive 3D objects, no physics, no "drive/scroll through a 3D world" mechanics — those belong to portfolio/experimental sites, not a medical practice. Any WebGL use is reviewed against "does this make the first 10 seconds feel more like an international premium clinic, or does it feel like a tech demo" — if the latter, it's cut.
- Motion duration defaults: 150–250ms for UI feedback, 400–600ms for section/page-level entrances. Nothing decorative loops indefinitely except deliberate ambient hero video/loops.
- Respect `prefers-reduced-motion` everywhere, no exceptions.
- **Glassmorphism**: allowed only as a light, functional touch (e.g. a translucent sticky nav bar or a floating CTA card over the Hero video) — never as a dominant visual style across the site. If a frosted-glass panel doesn't sit directly over moving imagery/video, it doesn't need the effect.

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

## 9. Reference Benchmarks (reviewed 2026-07-01)

Real sites reviewed to calibrate the direction above — not to be copied, but to define "what tier are we aiming for" concretely.

**Adopt patterns from:**

| Site | What to take |
|---|---|
| [Royal Clinic](https://royalclinic.pl/) | Warm brown/cream palette, calm luxurious pacing — closest color/tone match to our confirmed direction |
| [Badrutt's Palace Hotel](https://badruttspalace.com/en/winter/) | Full-bleed photo/video storytelling sections, heritage-meets-contemporary balance, restrained CSS/GSAP motion (no heavy WebGL) — the clearest model for "international premium brand in 10 seconds" |
| [Aesthetics Clinic](http://www.aesthetics-ge.ch) | Radical typographic/whitespace discipline — reference for restraint even though its monochrome palette isn't our chosen direction |
| Apple / Stripe / Vercel | Micro-interaction precision and interface-level polish, not visual style |

**Explicitly avoid patterns from:**

| Site | What to avoid, and why |
|---|---|
| [Demophorius](https://demophorius.com/) | Colorful gradients/blur effects — directly conflicts with Nextuply's low-visual-noise brand DNA |
| [dralirezasadighi.com](https://dralirezasadighi.com/) (current live site) | The exact baseline we are replacing: dated teal accents, generic clinic-template layout, no premium micro-interaction or visual hierarchy — see CONTENT_INVENTORY.md §6 |
| [drwilliammiami.com](https://www.drwilliammiami.com/) | Sophisticated content strategy undermined by placeholder/missing portfolio photography and an external, non-integrated consultation widget — confirms that real photography and a fully integrated booking flow (not a redirect) are non-negotiable, not optional polish |
| Awwwards Site-of-the-Year-tier WebGL spectacles (e.g. interactive 3D/physics-driven sites) | Right craft level, wrong emotional register for a medical-trust context — see §5's WebGL rule |

`https://template-kit.evonicmedia.com/layout41/` (an Evonic Media "template kit" layout Hamid also flagged as an inspiration source) could not be reviewed — it returned an HTTP 403 to automated fetching. Generically, Evonic Media sells pre-built, mass-produced med-spa template layouts; by definition a template product is a floor to clear, not a ceiling to aim for, since the same layout is sold to many unrelated practices. If a closer look is wanted, a screenshot or PDF export would let this get the same treatment as the other references.
