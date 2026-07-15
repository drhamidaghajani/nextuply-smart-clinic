"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { MouseEvent as ReactMouseEvent } from "react";

import { getServiceHref, type ServiceTaxonomyItem } from "@/content/services";
import type { CaseGalleryDictionary } from "@/i18n/dictionary-types";
import { LOCALE_DIRECTION, type Locale } from "@/i18n/locales";

import { PHOTO_POSITION, REAL_PHOTOS } from "./gallery-photos";

/**
 * "Case Gallery" — a NEW homepage section (per Hamid's full brief,
 * 2026-07-05), separate from `FeaturedServicesSection` two sections
 * earlier on the same page. Same 6 specialties, different job: this one
 * is a visual, asymmetric masonry gallery where each box links to that
 * specialty's own case/portfolio page — `FeaturedServicesSection` stays
 * exactly as already refined (icons, navy hover, etc.), untouched here.
 *
 * Reads titles/icons straight from `dict.services.items` (passed in as
 * `items`) instead of duplicating that content under a new key — same 6
 * ids, so the two sections can't drift out of sync with each other.
 *
 * Layout reference: Hamid sent an actual screenshot for the masonry
 * geometry ("Real Patients. Real Results," a body-contouring/BBL
 * practice's Instagram-collage-style gallery). Per his own brief's
 * instruction ("شبیه نمونه... نه لزوماً عین همان"), only the GRID
 * GEOMETRY was taken from it — one large anchor box + a mixed medium/
 * small cluster + a bottom strip of two more boxes. Explicitly NOT
 * carried over: that reference's imagery (bikini/lingerie patient
 * photography), tone, or "Real Patients/Real Results" framing — none of
 * that fits a face/jaw/nose surgical practice's brand, flagged to Hamid
 * directly rather than quietly matched.
 *
 * Desktop grid (6 boxes, 4-col base, `auto-rows` fixed height per row):
 *   - jaw-surgery: 2 cols × 3 rows — the big anchor (his stated core
 *     specialty), spanning the full cluster height, left column.
 *   - rhinoplasty: 2 cols × 2 rows — wide-medium, bottom-right.
 *   - facial-cosmetic / facial-rejuvenation: 1 col × 1 row each — small,
 *     sitting above rhinoplasty on the right.
 *   - dental-implant / impacted-tooth: 2 cols × 1 row each — a top strip
 *     of two medium-wide boxes.
 * (CSS Grid auto-placement fills cells in DOM/`items` order — dental-
 * implant and impacted-tooth are `services.items`' first two entries, so
 * they land in the first available row, i.e. the top strip, not a
 * "bottom strip" as originally sketched before this was actually
 * rendered; this comment describes the real result, not the plan.)
 * Mobile collapses this to a plain 2-column grid (jaw-surgery spans both
 * columns at the top, the rest flow in uniform pairs below) — the
 * reference's exact asymmetry doesn't survive a narrow viewport cleanly,
 * so it's simplified rather than forced.
 *
 * Real photography: `REAL_PHOTOS` maps an item id to an actual photo
 * (path as supplied — filenames aren't forced to a single extension, see
 * `rhinoplasty.jpeg` vs `jaw-surgery.jpg`, but ARE lowercased to match
 * `services.items[].id` — Hamid's original upload was `Rhinoplasty.jpeg`,
 * renamed on disk, since production runs on a case-sensitive Linux VPS
 * where that mismatch would 404) once Hamid supplies one — `GalleryTile`
 * renders that as a real `next/image` covering the tile instead of the
 * icon placeholder.
 * - `jaw-surgery`: a real, named patient of Dr. Sadighi's, per Hamid's
 *   explicit confirmation — NOT a stock/unrelated photo; an earlier photo
 *   he sent in this same conversation for the same slot was declined for
 *   exactly that reason, before he clarified this one is genuinely her.
 *   Publishing an identifiable patient's photo tied to a specific
 *   procedure still needs her explicit consent for this public use
 *   specifically — flagged to Hamid, not confirmed back yet as of this
 *   write, so treat that as an open pre-launch item rather than assumed
 *   settled.
 * - `rhinoplasty`: added 2026-07-05, same-day follow-up.
 * - `facial-cosmetic`, `dental-implant`, `impacted-tooth`: added
 *   2026-07-05, later same day — `Implant.jpeg`/`ToothSurgery.jpeg` read
 *   as generic English-language stock/template dental graphics on first
 *   look (branded numbered-steps layout, English copy on a Persian site),
 *   flagged to Hamid rather than assumed; he confirmed explicitly all
 *   three are real work/patients of Dr. Sadighi's, not stock, so kept as
 *   supplied (English text included) rather than second-guessed further.
 *
 * Only `facial-rejuvenation` has no `REAL_PHOTOS` entry yet, so it still
 * keeps the placeholder treatment: a navy gradient surface with that
 * service's existing line-icon (from `public/icons/services/`) shown
 * large and low-opacity, NOT a stand-in stock photo of unrelated patients
 * — deliberately, since faking patient photography would be real-content
 * fabrication this project's rules reject.
 *
 * Hover (desktop): rebuilt per Hamid's reverse-engineered breakdown of the
 * reference site's real implementation (Salient theme's portfolio-tile
 * hover). Two techniques adopted, both deliberately toned down from the
 * reference's measured values to fit this brand's calmer, clinical bar
 * rather than copied 1:1 — see the top of this file:
 * - Mouse-tracked 3D tilt + lift: `GalleryTile`'s outer `<Link>` — the
 *   actual box each tile IS, not a layer inside it — tracks pointer
 *   position and rotates itself toward the cursor via
 *   `perspective(width*3) rotateX/rotateY translateZ(20px) scale(...)`
 *   (the reference's own measured formula, plus `translateZ` for a
 *   genuine "lifting toward the viewer" push). A hover `box-shadow`
 *   deepens at the same time, so the tile visually separates from the
 *   flat page instead of just its content shifting in place. This went
 *   through two corrections, both from Hamid catching the same class of
 *   bug from different angles:
 *     1. First version put the transform only on the image layer — the
 *        frame/label stayed static while just the photo moved inside them.
 *     2. Second version wrapped ALL visual layers in one inner div and
 *        transformed that — better, but that div was still a CHILD of the
 *        outer box, which kept its own `overflow-hidden` and never moved
 *        itself, so the tile could rotate its *contents* but never
 *        visually lift as a single object with a shadow ("تو باید روی
 *        باکس اصلی هر بخش اینو بذاری"). `overflow-hidden` now lives on an
 *        inner content wrapper (clips the photo to rounded corners); the
 *        outer `<Link>` itself is unclipped, owns the transform AND the
 *        hover shadow, and is what visually tilts/lifts.
 *   Reference used ~6° max rotation; this uses `MAX_TILT_DEG = 4` to stay
 *   restrained. Applied via inline `style.transform` on `event.currentTarget`
 *   (imperative, not React state) so it updates every `mousemove` frame
 *   without a re-render — the same reason the reference used vanilla JS
 *   instead of a CSS-only hover. Skipped entirely under `useReducedMotion()`.
 * - Gold frame: kept INSET from the tile edges (`inset-[9%]`, matching
 *   the reference's proportions) rather than flush with them, at
 *   `ring-[5px]` — started at 3px (this section's original brief asked
 *   for a subtle 2-3px stroke), widened once per Hamid's direct follow-up
 *   ("کمی پهن‌تر"); the reference itself measured ~14-20px, so 5px is
 *   still well short of that bolder look if he wants to go further. Same
 *   opacity-based ring technique as before (a `ring-inset` box-shadow,
 *   not an animated `border-width` — smoother, and confirmed working
 *   after an earlier bug where a flush, non-inset ring was clipped away
 *   entirely by this tile's own `overflow-hidden`, back when that lived
 *   on the same element as the frame).
 * The tilt transform and the entrance `motion.div`'s transform still
 * never share an element (same reasoning as always in this file).
 *
 * Mobile tap: NOT the brief's suggested "first tap previews hover,
 * second tap navigates" — proposing a different UX instead, per his own
 * "or suggest something else and explain clearly" allowance. Double-tap-
 * to-navigate is a real anti-pattern: on a first tap that only shows a
 * hover preview and swallows the navigation, many users read that as a
 * broken link and leave rather than tapping again. Standard mobile
 * behavior instead: a single tap always navigates immediately (real
 * `<Link>`, no tap-interception JS); the gold-ring/lift hover treatment
 * simply doesn't play on touch at all (there's no true "hover" state to
 * preview on a touchscreen anyway) — the label is always legible on
 * mobile regardless, so nothing is lost by skipping the preview step.
 *
 * Round 2026-07-13 (taxonomy correction, per Hamid — a real bug he
 * caught in the browser): links used to point to `/cases/<old-id>`, a
 * route that never existed anywhere in this repo — every tile was a dead
 * link. Now points to the real `/[locale]/services/[slug]` detail page
 * (`getServiceHref`, `src/content/services.ts`), the same canonical
 * taxonomy `FeaturedServicesSection` and the footer use.
 *
 * Placement: wired into `page.tsx` as the LAST section, after
 * `WhyDrSadighiSection` — confirmed explicitly by Hamid ("باید بره
 * اخرین سکشن قرار بگیره") after an initial wrong guess placed it right
 * after `FeaturedServicesSection` instead. Nothing before this section
 * was touched to make room for it.
 *
 * Carries `snap-section` (no `h-dvh`, same combination as
 * `FeaturedServicesSection`) so the page's mandatory scroll-snap
 * (globals.css) has a defined stop here — without it, scrolling past
 * `WhyDrSadighiSection` (the previous snap point) had nowhere snap-valid
 * to land and the page refused to scroll any further.
 */

type GalleryItem = ServiceTaxonomyItem;

// Mobile: uniform 2-col grid, all 6 items as plain 1x1 cells (3 clean
// rows). Round 2026-07-12 (real bug, per Hamid: "یکیش زیر افتاده و خیلی
// زشته" — one card fell below, very ugly): jaw-surgery used to span a 2x2
// block on mobile too, same as desktop's masonry — but 1 double-size card
// (4 cells) + 5 single cells = 9 cells in a 2-column grid, which never
// tiles evenly and always strands the last card alone with an empty gap
// beside it. Desktop (`lg`) keeps the full asymmetric masonry plan from
// the doc-comment above — only the mobile spans changed.
// Round 2026-07-13 (taxonomy correction): keys renamed to the new
// canonical `SERVICE_TAXONOMY_IDS` (`src/content/services.ts`) — same
// 6 specialties, same layout assignment, just the id strings updated.
const BOX_LAYOUT: Record<string, string> = {
  "orthognathic-surgery": "col-span-1 row-span-1 lg:col-span-2 lg:row-span-3",
  rhinoplasty: "col-span-1 row-span-1 lg:col-span-2 lg:row-span-2",
  "facial-cosmetic-surgery": "col-span-1 row-span-1",
  "facial-rejuvenation": "col-span-1 row-span-1",
  "advanced-dental-implant": "col-span-1 row-span-1 lg:col-span-2 lg:row-span-1",
  "impacted-tooth-surgery": "col-span-1 row-span-1 lg:col-span-2 lg:row-span-1",
};

// Toned down from the reference site's measured values (~6deg tilt,
// ~1.013 scale) — see doc-comment above.
const MAX_TILT_DEG = 4;
const HOVER_SCALE = 1.02;

// See doc-comment above: real photos land here as Hamid supplies them.
// Items with no entry keep the icon-on-gradient placeholder.
//
// Round 2026-07-14 (per Hamid): `facial-rejuvenation` was the one item
// still on the placeholder — real photo supplied as `Rejuvenation.jpeg`,
// renamed on disk to `facial-rejuvenation.jpeg` (lowercase, matching this
// item's own id) for the same case-sensitive-Linux-VPS reason documented
// above for the other real photos. One data-driven entry serves all
// three locales — this component's `items` prop only carries `id`/
// `title`/`titleEn`/`subtitle` per locale, never per-locale image paths.
function GalleryTile({ item, locale, shouldReduceMotion }: { item: GalleryItem; locale: Locale; shouldReduceMotion: boolean }) {
  const photoSrc = REAL_PHOTOS[item.galleryCategory];
  const photoPosition = PHOTO_POSITION[item.galleryCategory] ?? "center";

  const handleMouseMove = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (shouldReduceMotion) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    const perspective = Math.round(rect.width * 3);
    const rotateX = (-py * MAX_TILT_DEG).toFixed(2);
    const rotateY = (px * MAX_TILT_DEG).toFixed(2);
    el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px) scale(${HOVER_SCALE})`;
  };

  const handleMouseLeave = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.transform = "";
  };

  return (
    <Link
      href={getServiceHref(locale, item.slug)}
      // The transform + shadow live on THIS element — the actual box each
      // tile is (its shape, its edges) — not on a clipped inner layer. Per
      // Hamid's correction ("تو باید روی باکس اصلی هر بخش اینو بذاری"):
      // an earlier version put the tilt on a child `absolute inset-0` div
      // while this outer box (with its own `overflow-hidden`) stayed flat
      // and clipped the tilted content to a static rectangle — so nothing
      // could ever look like it lifted off the page, no matter how the
      // child moved inside it. `overflow-hidden` moved to the inner
      // content wrapper below instead, so THIS box is free to rotate and
      // cast a shadow beyond its own resting bounds.
      className="group relative block h-full w-full rounded-2xl transition-[transform,box-shadow] duration-150 ease-out will-change-transform hover:shadow-[0_35px_90px_-12px_rgba(15,23,42,0.5)]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {/* Fallback surface — shows behind the real photo while it loads,
            or as the placeholder background when there is no real photo
            yet (see doc-comment). */}
        <div className="absolute inset-0 bg-gradient-to-br from-deep-navy to-[#1a2540]" />

        {photoSrc ? (
          <Image
            src={photoSrc}
            alt={item.title[locale]}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            style={{ objectPosition: photoPosition }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              aria-hidden
              className="block h-12 w-12 bg-warm-white/15 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
              style={{
                WebkitMaskImage: `url(/icons/services/${item.iconKey}.png)`,
                maskImage: `url(/icons/services/${item.iconKey}.png)`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
          </div>
        )}

        {/* Gold frame — inset from the tile edges (not flush), desktop
            hover only (no touch equivalent, see doc-comment on the
            mobile-tap decision). Widened from 3px to 5px per Hamid. */}
        <div className="pointer-events-none absolute inset-[9%] rounded-xl ring-[5px] ring-inset ring-gold opacity-0 transition-opacity duration-250 ease-out group-hover:opacity-100" />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2.5 sm:p-4">
          <p className="text-balance text-[11px] font-semibold text-warm-white sm:text-sm lg:text-base">{item.title[locale]}</p>
          <p className="text-[9px] uppercase tracking-wide text-warm-white/60 sm:text-[11px]">{item.englishLabel}</p>
        </div>
      </div>
    </Link>
  );
}

export function CaseGallerySection({
  dict,
  items,
  locale,
}: {
  dict: CaseGalleryDictionary;
  items: readonly GalleryItem[];
  locale: Locale;
}) {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = (delay: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 16 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: shouldReduceMotion ? 0.01 : 0.5, delay: shouldReduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      id="before-after"
      data-header-bg="#fcfbf4"
      dir={LOCALE_DIRECTION[locale]}
      className="snap-section relative overflow-hidden bg-cream px-4 py-10 sm:px-8 sm:py-14 lg:py-20"
    >
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <motion.h2 {...fadeUp(0)} className="text-balance text-xl font-bold leading-tight text-charcoal sm:text-3xl lg:text-[30px]">
            {dict.heading}
          </motion.h2>
          <motion.p
            {...fadeUp(shouldReduceMotion ? 0 : 0.08)}
            className="mx-auto mt-2 max-w-2xl text-xs leading-6 text-charcoal/60 sm:mt-3 sm:text-base lg:text-[22px] lg:leading-8"
          >
            {dict.subheading}
          </motion.p>
        </div>

        <div className="mt-6 grid auto-rows-[120px] grid-cols-2 gap-2.5 sm:mt-10 sm:auto-rows-[130px] sm:gap-3 lg:grid-cols-4 lg:auto-rows-[150px] lg:gap-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              {...fadeUp(shouldReduceMotion ? 0 : 0.12 + index * 0.07)}
              className={BOX_LAYOUT[item.id] ?? "col-span-1 row-span-1"}
            >
              <GalleryTile item={item} locale={locale} shouldReduceMotion={Boolean(shouldReduceMotion)} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
