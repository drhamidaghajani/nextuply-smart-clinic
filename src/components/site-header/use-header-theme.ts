"use client";

import { useEffect, useState } from "react";

/**
 * Drives the header's scroll-linked behavior. Detection:
 * `IntersectionObserver` watching every `[data-header-bg]` element (see
 * each section file) with a thin trigger band pinned near the viewport
 * top (`rootMargin`) — standard "scrollspy" technique, chosen over a raw
 * scroll-position handler because it's event-driven (no per-frame work
 * while nothing crosses the band) and because this project has a
 * documented history of fragile custom scroll-driven JS (see globals.css's
 * scroll-snap comments) that a scroll-loop approach would have repeated.
 *
 * Round 2026-07-09, correction #2 (per Hamid — reverses his own
 * immediately-prior brief, flagging rather than silently swapping): the
 * header no longer shows on Hero at all; it fades in only once the user
 * has scrolled into the next section. Hero's section tag carries a
 * `data-header-hero` marker (boolean attribute, no value needed) so this
 * hook can tell "currently on Hero" apart from "currently on some other
 * dark section that happens to share Hero's color" (Why Dr. Sadighi,
 * Smart Clinic Assistant, Patient Stories, and Video Hub are all also
 * `#0f172a` — color alone can't distinguish Hero from those). Since the
 * header is now never visible while sized for the hero-integrated look,
 * the previous scroll-based shrink (two height tiers) is gone too — one
 * fixed compact height is enough now that there's nothing to shrink from.
 */

const DEFAULT_BACKGROUND = "#0f172a"; // Hero's own bg-deep-navy — correct color for first paint, before the observer's first callback fires.

interface HeaderTheme {
  background: string;
  isDark: boolean;
  isOnHero: boolean;
}

function relativeLuminance(hex: string): number {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.replace(/(.)/g, "$1$1") : normalized;
  const intVal = parseInt(value, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function useHeaderTheme(): HeaderTheme {
  const [background, setBackground] = useState(DEFAULT_BACKGROUND);
  const [isOnHero, setIsOnHero] = useState(true);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-header-bg]"));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // `entry.intersectionRatio > 0` is a deliberate extra guard, not
        // redundant with `isIntersecting`: verified in testing that
        // Chromium can report `isIntersecting: true` for an element with
        // `intersectionRatio: 0` (a stale/inconsistent callback, seen here
        // for Hero well after it had actually scrolled out of view) —
        // trusting `isIntersecting` alone let that spurious callback
        // overwrite the correct state right after it had updated.
        const intersecting = entries.filter((entry) => entry.isIntersecting && entry.intersectionRatio > 0);
        if (intersecting.length === 0) return;
        // If more than one section's trigger band is active at once (brief
        // overlap during a scroll-snap transition), prefer whichever one's
        // top edge is closest to the viewport top — the one actually behind
        // the header.
        const closest = intersecting.reduce((a, b) =>
          Math.abs(a.boundingClientRect.top) < Math.abs(b.boundingClientRect.top) ? a : b
        );
        const bg = closest.target.getAttribute("data-header-bg");
        if (bg) setBackground(bg);
        setIsOnHero(closest.target.hasAttribute("data-header-hero"));
      },
      { rootMargin: "0px 0px -85% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return { background, isDark: relativeLuminance(background) < 0.5, isOnHero };
}
