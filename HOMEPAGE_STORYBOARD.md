# HOMEPAGE_STORYBOARD.md

> The pre-code homepage deliverable Hamid's design brief explicitly asks for: User Journey / Emotion Flow, section-by-section storyboard, and a motion timeline — produced before any homepage component is built, per PROJECT_GUIDE.md's design-before-code workflow. Implements the tokens in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) and the component tiers in [COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md). Scope: **`fa` locale only for this build** (see `docs/adr/0002-fa-first-locale-scope.md`).
>
> **Structure rewritten 2026-07-04, replacing the earlier 11-section version (Hero / Brand Intro / Doctor Story / Before-After / AI Experience / Services / Patient Journey / Statistics / Testimonials / Final CTA / Footer).** Hamid's newest brief specifies an exact 9-section homepage with a different order and different section identities — most notably, the AI/assistant section now comes immediately after Hero (not mid-page), and a dedicated "Knowledge Center" section is new. Confirmed with Hamid before this rewrite: the new structure fully replaces the old one, not merges with it. Sections currently live in code (`Hero`, `AiConcierge`) map directly onto 01 and 02 below; 03–09 are documentation only until each one's reference/prompt arrives per CLAUDE.md's section-by-section process.

## 1. Emotion Flow

The entire homepage is sequenced as one deliberate emotional arc — a film narrative, not a stack of independent sections (per Hamid's 2026-07-04 brief and DESIGN_SYSTEM.md §1's "editorial, cinematic pacing" principle):

```
Trust → Interaction → Doctor        → Service     → Viewing  → Treatment Process → Final Trust               → Consultation
         (first)                     Recognition    Recognition  Results   Familiarity     (reinforced twice)          Booking
(Hero)  (Smart Clinic Assistant)    (Why Dr.        (Featured   (Before/  (Treatment       (Patient Stories +          (Final CTA)
                                     Sadighi)         Services)   After)    Journey)         Knowledge Center)
```

Every section below states which point on this arc it serves — a section that doesn't clearly serve the arc doesn't ship, per DESIGN_SYSTEM.md §1's "Visual Prestige over decoration" principle. Before any section is implemented, it must also pass the Creative Director self-check in DESIGN_SYSTEM.md §1.6 — memorable, unique to this clinic, emotionally resonant, and not "the first obvious solution."

## 2. Section-by-Section Storyboard

### 01 — Hero

**LOCKED 2026-07-02 against Hamid's reference (drwilliammiami.com) — implemented in `src/components/sections/hero.tsx`.**

- **Arc position**: Trust (first signal)
- **Goal**: the "10 seconds = international medical brand" test happens entirely here.
- **Content**: full-bleed real video (Dr. Sadighi's supplied clip, `public/media/video/hero-doctor.mp4`). Centered title ("معماری زیبایی، با دقت یک جراح و نگاه یک هنرمند") animating word-by-word, + a "Dr. Name | Specialty" line beneath it. A looping scroll-down chevron sits at the bottom of the viewport. **No CTA button in the Hero** (Hamid's standing instruction) — the brief's small CTA idea ("شروع مشاوره" / "گفتگو با دستیار") is deferred to a future round; not yet reconciled with the no-CTA rule — flagged here rather than silently added or silently dropped.
- **Overlay/Color**: flat `deep-navy` (`#0F172A`, see DESIGN_SYSTEM.md §2) wash over the video for text legibility.
- **Header constraint**: no navigation/header may be visible while the Hero video is playing — not yet built.
- **Motion**: Text Reveal (word-by-word flip-up) on load; Smooth Scroll snap into section 02; `.hero-exit-fade` (view-timeline) as Hero exits — see DESIGN_SYSTEM.md §5's motion vocabulary.

### 02 — Smart Clinic Assistant

**Implemented in `src/components/sections/ai-concierge.tsx` (currently named `AiConcierge` in code; consider renaming to match this brief's terminology in a future pass — not renamed yet to avoid unrelated churn).**

- **Arc position**: Interaction (first active engagement, not passive viewing)
- **Goal**: this is the single most important section per Hamid's brief. It must read as *the clinic's own dedicated digital reception* — explicitly not a chatbot, not a generic form, not "ChatGPT embedded in a page." UI/UX only in this phase: every control (textarea, quick-action chips, both CTAs) is intentionally inert, prepared for future backend wiring (see CLAUDE.md's AI-layer separation and VISION.md's One Assistant Principle — this is the single surface all future AI modules operate behind).
- **Content**: one large conversational input (not a multi-field form), Quick Action chips with icons (booking, services, gallery, articles, image upload, cost estimate), primary + secondary CTA, paired with a content half (headline + description).
- **Color**: uses the `deep-navy` dark card against the `cream` page background — the site's one deliberate high-contrast card treatment at this point in the page.
- **Motion**: Micro Interaction on chip/button hover and textarea focus; Hover Elevation on the assistant card. No message bubbles, no fake typed conversation — see code doc-comment for the full rationale.
- **Open item**: this section has been through several rounds of layout iteration (plain grid → overlapping-card → reverted to plain grid) without a locked visual reference from Hamid; per CLAUDE.md's section-by-section rule, the current layout is a working baseline, not a final design — still open to a fresh reference/prompt under the new Creative Director bar.

### 03 — چرا دکتر صدیقی (Why Dr. Sadighi)

**Implemented 2026-07-04 in `why-dr-sadighi-section.tsx`**, against Hamid's editorial-story brief.

- **Arc position**: Doctor Recognition
- **Goal**: not a résumé, not a long biography — brand values and editorial design. Establishes *who* is behind the clinic in a way that feels personal and premium, not a CV page.
- **Content**: one dominant headline ("جراحی فک و صورت با نگاه زیبایی‌شناسی"), a facts strip (fellowship, university, two-city practice — real, confirmed facts, not the brief's suggested placeholder numeric stats), and a 3-item principles list. A milestone timeline was in the original brief but deliberately cut (no real dates exist, and a 4th block would dilute the headline).
- **CTA**: "درباره دکتر" → full bio page (still unconfirmed as a real route).
- **Motion**: Image Reveal (scale/fade, not clip-path — see the component's doc-comment for why), very limited scroll Parallax on the portrait only, staggered Text Reveal per block. No counter-animation — there are no real numeric stats to count up.
- **Open item**: no real doctor portrait exists yet (checked CONTENT_INVENTORY.md — only a Hero video intake path is specified); the portrait area is an abstract placeholder pending real photography, per DESIGN_SYSTEM.md §6.

### 04 — خدمات منتخب (Featured Services)

**Implemented 2026-07-04 in `featured-services-section.tsx`.** Order note: Hamid explicitly placed this section BEFORE section 03 ("Why Dr. Sadighi") in the actual live page (`page.tsx`) — the arc numbering below still reflects this document's original sequencing (kept for narrative-arc bookkeeping), but the real, live section order is now: 01 Hero → 02 Smart Clinic Assistant → **04 Featured Services** → **03 Why Dr. Sadighi** → 05 onward. Flagging the inversion here rather than silently renumbering everything.

- **Arc position**: Service Recognition
- **Goal**: a real icon-card grid (not the large-imagery editorial redesign this doc originally called for) — Hamid's actual brief for this round asked for a straightforward 2-row × 3-column icon-card grid, white background, full-screen height. Superseded the earlier "large cards, large imagery" goal below rather than reconciling it — noted, not deleted, in case large-format service imagery becomes the direction again later.
- **Content**: all 6 real services from CONTENT_INVENTORY.md §2 (not a curated subset) — ایمپلنت دندانی پیشرفته، جراحی دندان نهفته، جوان‌سازی صورت، جراحی‌های زیبایی صورت، جراحی فک و چانه، جراحی زیبایی بینی. Real PNG line-icons supplied by Hamid this round, expected at `public/icons/services/<id>.png`.
- **CTA**: "مشاهده همه خدمات" → full services page (still unconfirmed as a real route — `/services` 404s until built).
- **Motion**: staggered card fade-up on scroll-into-view; Hover Elevation (translateY lift + shadow increase) per card — not Image Reveal, since these are icon cards, not photography.
- **Open item**: the 6 icon files supplied this round read as very light/near-white line art in preview — real risk of low contrast against this section's cream background even with the gold-tinted circle badge behind each one; worth Hamid confirming once the files are actually in place.

### 05 — Before/After

- **Arc position**: Viewing Results
- **Goal**: per Hamid's brief, the most important section after Hero. Full width, drag slider, image reveal, professional motion — per UI_GUIDELINES.md §5, already the highest-priority custom component in the site.
- **Content**: full-width Before/After Slider instances, filterable by procedure (rhinoplasty, blepharoplasty, facelift, etc. — CONTENT_INVENTORY.md §2). Photo specs: CONTENT_INVENTORY.md §8.
- **CTA**: likely "مشاهده نتایج بیشتر" → full gallery page (unconfirmed).
- **Motion**: drag-driven Image Reveal is the primary interaction (patient-controlled, never auto-playing, per UI_GUIDELINES.md §5); light momentum easing on the slider itself.
- **Open item**: blocked on real case photography (CONTENT_INVENTORY.md §8) and Hamid's design reference.

### 06 — Treatment Journey (مسیر درمان)

**Implemented 2026-07-05/06 in `patient-journey-section.tsx`, per Hamid's full scrollytelling brief — updates this entry from placeholder to built.** Live at the end of the homepage (`page.tsx`), after Case Gallery — not in this document's original 06 slot, same kind of live-vs-documented-order note as section 04's.

- **Arc position**: Treatment Process Familiarity
- **Goal**: a luxury two-column scrollytelling experience (not a classic timeline) — removes friction ahead of the final CTA by making the process feel transparent, per UX_GUIDELINES.md §2's golden-path principle.
- **Content**: 5 real stages with Hamid's own final title+body copy (`patientJourney.steps` in `fa.ts`) — مشاوره تخصصی و ارزیابی اولیه، طراحی شخصی‌سازی‌شده درمان، انجام جراحی با استانداردهای روز دنیا، مراقبت و ریکاوری پس از عمل، پیگیری منظم و ارزیابی نتیجه نهایی. Left column: a delicately-curved SVG path with 5 anchor points, each stage's icon/title/body. Right column (desktop only): one large sticky media panel that crossfades between placeholder art per stage (no real per-stage photo/video supplied yet — same real-content rule as everywhere else).
- **CTA**: "شروع مسیر من" (`patientJourney.cta`).
- **Motion**: GSAP ScrollTrigger — path stroke draws top-to-bottom and a glow particle travels it, both continuously scrubbed to scroll position; which stage reads "active" (icon/title emphasis + right-panel crossfade) is a discrete state change on a per-stage ScrollTrigger, not scrubbed. Right panel uses plain CSS `position: sticky`, not a JS scroll-hijack — see the component's doc-comment for why (a JS-driven pin was tried and reverted for the Hero earlier in this project for the same reason: fighting the page's mandatory CSS scroll-snap).
- **Open item**: real per-stage photography/video still pending; mobile drops the sticky panel in favor of a small inline media block per stage.

### 07 — روایت‌های واقعی بیماران (Real Patient Stories / Documentary)

**Finalized 2026-07-06 — second, Persian-native, RTL-explicit pass from Hamid, superseding the first English-mockup-style brief this entry originally held. Design/layout only, per his explicit request ("خروجی مورد انتظار: توضیح کامل UI و Layout — نه کد") — nothing in this entry has been implemented; it's the design-before-code deliverable this project's process requires (PROJECT_GUIDE.md §1). This pass resolved both open items the first draft had flagged: the headline is now a single final choice (not two options), and the Hero's column mapping is now explicitly stated in RTL terms instead of an ambiguous LTR-mockup "left/right."**

- **Arc position**: Final Trust (first pass) — but deliberately NOT a classic testimonial carousel. Brief is explicit: this must read as a "luxury medical documentary" (Netflix-documentary tone — dark, deep, glassy, softly lit), building trust through real evidence (video, Google Reviews, Instagram, patient photos), not through ad copy.
- **Goal**: the most emotionally-loaded section on the page. Success test (Hamid's own words, unchanged from the first pass): a skeptical Iranian visitor should think *"اینها واقعاً به اعتماد من فکر کرده‌اند؛ اینها بیماران واقعی‌اند، تبلیغ خشک نیست"* ("they've genuinely thought about my trust; these are real patients, not dry advertising").

#### Structure overview

Fullscreen section (100vh), two stacked layers on one dark background:
1. **Hero** — the main two-column layer (video + text).
2. **Emotional Evidence Grid** — an irregular masonry grid of glass "evidence" cards, sitting below (or slightly overlapping) the hero layer.

**Background**: charcoal/deep-navy base, very soft gradients (navy → black), extremely subtle light streaks for a modern cinematic feel — the overall impression should be "a private documentary screening room." Consistent with this project's existing `deep-navy`/`gold` dark-surface language (DESIGN_SYSTEM.md §2), not a new palette.

#### Hero layer

- **Layout, now explicit and RTL-native**: **right column = the main documentary video**, **left column = text/trust content**. This happens to be the simple case for this site's `dir="rtl"` — video first in DOM, text second, with NO `dir="ltr"` override needed (under natural RTL flow, the first DOM item lands visually on the right) — exactly the bug class flagged and fixed once already this cycle in `case-gallery-section.tsx`/`patient-journey-section.tsx`, avoided here from the start since the brief itself is now RTL-native.
- **Right column — video frame**:
  - 16:9 frame styled as a "documentary poster." Glassmorphism: semi-transparent light surface over the dark background, noticeable `backdrop-blur`, a very thin light border (leaning gold), soft border-radius (~12–14px), deep but soft shadow.
  - Centered Play button: circular, minimal, thin gold/white ring, plain white triangle inside. Hover: scale ~1.05 + a soft (not exaggerated) glow around it.
  - Small label on/under the frame — still two phrasing options, not picked between: «مستند واقعی – بدون بازیگر» or «Real Patient Story – Rhinoplasty Journey» (exact wording TBD per which real documentary airs first).
- **Left column — text**:
  - **Hero title, now final** (replaces the previous draft's two-option choice): «روایت‌های واقعی بیماران» — bold, large, highly legible Farsi.
  - **Subtitle, refined wording** (supersedes the first pass's draft): «در کلینیک دکتر علیرضا صدیقی، هر جراحی فقط یک «عمل» نیست؛ آغاز یک فصل تازه در زندگی یک انسان است. در این بخش، مستندهای کوتاه، ویدئوهای واقعی، نظرهای ثبت‌شده در Google و لحظه‌های ثبت‌شده در Instagram را می‌بینید؛ بدون بازیگر، بدون اغراق، با داستان‌های واقعی بیماران.»
  - Small trust-badge row beneath: Google icon + «بیش از X نظر ۵‌ستاره در Google», then Instagram icon + «ده‌ها داستان قبل و بعد در Instagram» — minimal, no visual clutter. **X is a real number that doesn't exist in this project yet** — same "no fabricated stats" rule followed everywhere else (see §03's real-facts-only note); ships once Hamid supplies the real current count, not invented.

#### Emotional Evidence Grid

Masonry-style, 4–6 glass cards of varying size/ratio (deliberately uneven, not a rigid 3-column grid) — reads as a "living documentary wall." Four card types to mix:

1. **Video Story card** — 10–15s patient video thumbnail (e.g. a moment of speaking post-op, or a smile in the mirror), small Play icon in a corner, short caption at the bottom ("ترس قبل از عمل بینی", "اولین نگاه به چهره جدید" — real moment labels, TBD per actual footage). Hover: image brightens slightly, card scales ~1.02, caption fades in from the bottom.
2. **Google Review card** — patient first name + age (e.g. «مریم، ۳۲ ساله»), a minimal 5-star gold row, 1–2 lines of the real review text, a small "Verified on Google" badge + small Google icon. Entrance: stars light up off→on with a small 0.05s stagger between them. Hover: blur reduces (card reads as coming closer/into focus), shadow deepens. **Needs real reviews from the clinic's actual Google Business listing** — none exist in this codebase yet.
3. **Instagram Moment card** — thumbnail from a real Reel or before/after post, **explicitly 9:16 vertical** inside the card, small, minimally-colored Instagram icon in a corner, short caption below ("Before / After – Nose Surgery", "Day 7 – Real Recovery Story"). Click → opens the real Instagram post in a new tab (external link, not an embed). **Needs real, permission-cleared post URLs.**
4. **Photo Story card** — an emotional real patient portrait post-result (smiling, calm gaze, soft light), a short real Farsi quote beneath it (e.g. «بعد از سال‌ها، دوباره با آرامش جلوی دوربین می‌ایستم.») over a soft gradient overlay, quote text in white/pale-gold.

**Card style (all types), exact ranges from this pass**: background white/gray at ~10–20% opacity; `backdrop-filter: blur(16–24px)`; border very thin and light, with a slight gold tint; border-radius 12–18px depending on card type. Card titles semi-bold; body text regular weight with comfortable line-height for reading on a dark background.

#### Motion (design-level, not code)

- **Section entrance**: fade-in + a small upward move (~20px) for the whole section.
- **Hero video entrance**: opacity 0→1, scale 0.96→1.0.
- **Evidence cards entrance**: staggered 0.1–0.15s apart, each a fade + small slide up from below.
- **Spotlight/dimming hover-focus (new this pass, section-wide)**: when the cursor is over the hero video OR any grid card, every *other* card/text block dims to roughly 40% opacity, while the hovered element becomes clearer, brighter, and slightly larger — a deliberate "spotlight" effect across the whole section, not just a per-card hover state.
- **Play button**: a very subtle idle pulse (scale 1→1.03, slow loop) — explicitly **only while idle, not during hover** (hover has its own scale+glow state instead, per the Hero video spec above).
- All motion: soft physics, professional easing, slow/calm pacing — "luxury," not "game-like," matching this project's existing motion vocabulary (DESIGN_SYSTEM.md §5).

#### Implementation notes (architecture-level, for when this moves to code)

- **Component**: a standalone `<PatientStoriesSection />`, matching this project's one-component-per-homepage-section convention.
- **Dynamic data shape**: the evidence grid should be driven by one typed array of "evidence items," each carrying a `type` discriminator (`"video" | "google-review" | "instagram" | "photo"`) plus per-type fields (video: src/poster/caption; review: name, age, rating, quote; instagram: thumbnail, postUrl, caption; photo: src, quote) — the same "one typed items array → mapped cards with per-type rendering" pattern already used in this codebase for `case-gallery-section.tsx` and `featured-services-section.tsx`, not a new data convention.
- **Animation library split**: Framer Motion for entrance transforms and the staggered card reveal (matches this project's established convention — Framer Motion owns entrance, plain CSS/`group-hover` owns hover — used consistently across every section built this cycle). The section-wide spotlight/dimming effect is the one piece worth a second look at implementation time: it needs one hovered-item id shared across sibling cards, which is easiest as a small piece of React state at the section level toggling each card's dimmed/active class, not a per-card-isolated CSS `:hover` (siblings can't react to each other's hover in pure CSS without a `:has()`-based selector, which is an option too, worth evaluating for browser-support fit at build time). GSAP (already a dependency, used in `patient-journey-section.tsx`) isn't obviously needed here — nothing in this brief is scroll-scrubbed the way the Patient Journey path/particle is.
- The masonry evidence grid can reuse the same asymmetric CSS Grid + `col-span`/`row-span` per-card-type technique already built and proven in `case-gallery-section.tsx`, rather than a new grid system.
- Glassmorphism cards: `backdrop-blur` + low-opacity background + hairline border — same visual family as this project's existing glass-chip language (Smart Clinic Assistant's floating highlight cards, per that component's doc-comment), not a new pattern to invent from scratch.

#### Open items / content blockers (nothing here ships as placeholder-fabricated content, per this project's standing rule)

- Real documentary video (the hero video + the 10–15s story snippets) — not supplied yet.
- Real, current Google Reviews (names/ages, star counts, actual quoted text) and a real aggregate review count for the trust-badge row.
- Real Instagram post URLs (with permission to link) and a real aggregate before/after count.
- Real emotional patient photos + real quotes for the Photo Story card(s) — same explicit-consent requirement already flagged and resolved once this cycle for the Case Gallery's jaw-surgery photo; each new identifiable patient asset here needs the same check, not assumed clear by precedent.
- Hero video label wording — still two options, not picked between.

### 08 — Knowledge Center (مرکز دانش)

**New section — did not exist in the previous 11-section storyboard.**

**Round 2026-07-07: split into three standalone sections.** Originally spec'd as one section (3 articles + 3 videos + FAQ accordion together). Hamid asked explicitly, for both the video block and the FAQ block, that they become their own sections rather than living inside Knowledge Center ("این سکشن باید... نه زیرمجموعه Knowledge Center"). Implemented as `KnowledgeCenterSection` (editorial articles only), `VideoHubSection`, and `FaqSection` — 08a/08b/08c below, kept in this relative order on the page since he didn't ask for a different sequence.

#### 08a — Knowledge Center: Editorial Highlight (`knowledge-center-section.tsx`)

- **Arc position**: Final Trust (reinforced) — credibility through expertise, immediately before the ask.
- **Content**: 1 feature article + 3 side articles (flat editorial list, no cards/shadows — thin dividers only), from the WordPress-headless blog per VISION.md's stack.
- **CTA**: "ادامه مطالعه" per article; no full-blog link yet (unconfirmed).
- **Motion**: Reveal on scroll-into-view, staggered across the feature/side split.
- **Layout**: `h-dvh` single-viewport fit (2026-07-07, per Hamid's "در یک صفحه نمایش دیده بشه") — compact mobile-first spacing, `line-clamp` safety nets on side-article titles/summaries so 3 items always fit without pushing past the viewport.

#### 08b — Video Hub (`video-hub-section.tsx`)

- **Arc position**: same as 08a — authority/credibility, cinematic documentary tone (dark `bg-deep-navy`, distinct from the cream editorial block).
- **Content (2026-07-08 layout)**: header → big featured video + caption alongside 2 small "up next" thumbnails (the category's other 2 videos) → category tabs below. Each category has exactly 3 videos = 1 big + 2 small, so nothing was dropped when the earlier separate below-the-fold carousel row was removed.
- **Layout (2026-07-08)**: replaced the original featured-block-then-3-video-carousel structure (two full video-height rows) after Hamid flagged the section still didn't fit one viewport. Desktop: big video visually LEFT, small thumbnails visually RIGHT — his literal left/right spec, achieved via `grid-template-columns` track order (small column first = rightmost under this page's `dir="rtl"`, big column second = leftmost), not a `dir="ltr"` override. Mobile collapses to one column with `order-*` putting the big video first regardless of source order. `h-dvh` applied for the "one-scroll-per-section" principle.
- **Interaction fixed (2026-07-08)**: the featured video's play button used to be decorative (did nothing on click). It now actually plays: unmutes, shows native controls, hides the overlay — see `FeaturedVideo` in the component.
- **Placeholder video (2026-07-07, explicitly temporary — "فعلا")**: no real per-video footage exists yet, so every video box (featured + both thumbnails) plays the real Hero video file (`/media/video/hero-doctor.mp4`, muted/looped ambient preview until clicked) so the boxes aren't empty during review. Swap for real footage once it exists.
- **Bug fixed (2026-07-07)**: tab switching used to visibly reflow (a video briefly appeared on the wrong side before settling) — caused by the featured video and its caption text each animating inside their own top-level `AnimatePresence`, which briefly mounts both the exiting and entering element as direct grid children. Fixed by giving each side a fixed grid cell and crossfading inside it via `absolute inset-0` (video) / `mode="wait"` (text) instead of at the grid level.
- **Motion**: video crossfade on featured change; category switch resets the featured video to that category's first item.

#### 08c — FAQ (`faq-section.tsx`)

- **Arc position**: same as 08a/08b — final objection-handling before the booking ask.
- **Content**: category tabs (matching the real specialties: رینوپلاستی / ایمپلنت دندانی / جراحی فک و صورت), 2–3 column card grid, 6 questions per category (18 total; expanded from 2/category on 2026-07-07 per Hamid's ask). Each card expands independently — not a single shared accordion.
- **Layout**: `h-dvh` single-viewport fit (2026-07-07). Question text is deliberately short-authored in `fa.ts` *and* backed by a `line-clamp-1` safety net so it can never wrap to 2 lines regardless of content length, per Hamid's explicit ask.
- **Bug fixed (2026-07-07)**: opening one card used to grow its same-row sibling too — CSS Grid's default `align-items: stretch` was forcing every card in a row to match the tallest one. Fixed with `items-start` on the grid container.
- **Motion**: category switch fades/slides the filtered grid; each card's answer expands via height animation (Micro Interaction).

### 09 — Final CTA

- **Arc position**: Consultation Booking (Action)
- **Goal**: the conversion moment — book consultation, contact, or view services. Per UX_GUIDELINES.md §2, must not introduce new friction after eight sections of trust-building.
- **Content**: one clear headline, one primary CTA ("رزرو نوبت"), one secondary path (WhatsApp / view services) — never more than two options, per UI_GUIDELINES.md §2's "one primary CTA" rule. Existing `finalCta` draft in `fa.ts` is a reasonable starting point.
- **Motion**: understated — Fade/simple entrance only. This section earns attention through copy and offer clarity, not additional animation.

### Footer (not one of the 9 narrative sections)

- Kept as a structural necessity below section 09, not part of the emotional arc per Hamid's brief.
- **Content**: clinic contact info per location (Tehran + Tabriz — DATABASE_GUIDE.md's `Location` entity), hours, social links, trust marks, sitemap.
- **Motion**: none beyond standard hover states.

## 3. Motion Timeline Summary (per DESIGN_SYSTEM.md §5)

| Section | Primary tool | Motion type |
|---|---|---|
| 01 Hero | CSS (Text Reveal) + view-timeline | Word-by-word reveal, exit fade |
| 02 Smart Clinic Assistant | Framer Motion / CSS | Micro Interaction, Hover Elevation |
| 03 چرا دکتر صدیقی | TBD | Text Reveal, Image Reveal (pending reference) |
| 04 خدمات منتخب | Framer Motion | Staggered Reveal, Hover Elevation, Image Reveal |
| 05 Before/After | Native drag + Framer Motion | Drag-driven Image Reveal |
| 06 Treatment Journey | GSAP (ScrollTrigger, scrubbed) | Smooth-Scroll–scrubbed timeline fill |
| 07 روایت‌های واقعی بیماران | Framer Motion (entrance/stagger) + small shared hover state | Documentary hero (scale+fade+glow) + staggered glass-card grid + section-wide spotlight/dimming on hover |
| 08a Knowledge Center (editorial) | Framer Motion | Staggered Reveal |
| 08b Video Hub | Framer Motion | Featured-video crossfade, tab-driven carousel |
| 08c FAQ | Framer Motion | Category filter fade/slide, per-card expand (Micro Interaction) |
| 09 Final CTA | Framer Motion | Simple entrance (Fade) only |
| Footer | — | None (static) |

## 4. What This Storyboard Deliberately Excludes

Per Hamid's "نکات بسیار مهم" and DESIGN_SYSTEM.md's anti-decoration principle: no autoplay-with-sound, no forced-scroll-hijacking beyond explicitly scoped ScrollTrigger moments, no stock medical photography, no more than one dark-background section at a time, no WebGL outside the Hero accent defined in DESIGN_SYSTEM.md §5, no off-the-shelf/generic components — every section is custom-designed against a real reference, per CLAUDE.md's section-by-section rule.

## 5. Next Deliverables

Sections 01, 02, 03, 04, 06, 07, 08a, 08b, 08c are implemented in code (not all fully locked — see each entry's own open items). Sections 05, 09 remain documentation placeholders: each needs Hamid's concrete reference/prompt before any visual design work begins, per CLAUDE.md's explicit section-by-section rule. Real photography/video assets (CONTENT_INVENTORY.md §8) remain a blocker for sections 04 and 05 regardless of design-reference status; 08b's video boxes are explicitly running a temporary placeholder (the Hero video file in every slot) pending real footage. A `CaseGallerySection` and `PatientJourneySection` also exist in code, live between 04 and 07 — neither is one of this document's original 9 numbered sections (each added later per Hamid's own separate brief; see each component's doc-comment for placement reasoning).
