"use client";

import { useEffect, useState } from "react";

/**
 * Thin fixed progress indicator for long-form Knowledge Center articles
 * (2026-08-25 redesign) — tracks whole-document scroll progress (0 at
 * the top, 1 at the bottom of the page), the same convention as most
 * editorial reading experiences. Plain scroll-driven `width` on a
 * logically-positioned (`inset-inline-start-0`) fill bar — no transform/
 * translate, which is the documented RTL gotcha elsewhere in this
 * codebase (see `patient-journey-section.tsx`'s own note on
 * `-translate-x-1/2` not flipping under `dir="rtl"`): a percentage
 * `width` growing from the logical start edge is direction-correct in
 * both `ltr` and `rtl` with zero branching.
 *
 * `z-50` — one above the fixed header's `z-40` (`site-header.tsx`) — so
 * the bar stays visible as a thin line right at the very top of the
 * viewport regardless of the header's own show/hide state. Plain scroll
 * listener + `requestAnimationFrame` throttling, no library: this is a
 * direct reflection of scroll position, not a decorative animation, so
 * it updates instantly rather than easing — nothing here to gate behind
 * `prefers-reduced-motion`.
 */
export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      setProgress(Math.min(1, Math.max(0, ratio)));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[3px] bg-charcoal/5">
      <div className="h-full bg-gold" style={{ width: `${progress * 100}%` }} />
    </div>
  );
}
