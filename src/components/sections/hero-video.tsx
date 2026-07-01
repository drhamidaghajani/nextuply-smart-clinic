"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Leaf client component so the rest of Hero (headline, CTA) stays a Server
 * Component per COMPONENT_GUIDE.md §2. Respects prefers-reduced-motion
 * (DESIGN_SYSTEM.md §5) — autoplaying <video> isn't covered by the CSS-only
 * reduced-motion rule in globals.css, so it's handled here in JS.
 */
export function HeroVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const listener = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    if (reducedMotion) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {
        // Autoplay can be blocked by the browser — the static first frame
        // (no poster set yet, see CONTENT_INVENTORY.md §8) is an acceptable fallback.
      });
    }
  }, [reducedMotion]);

  return (
    <video
      ref={videoRef}
      aria-hidden
      muted
      loop
      playsInline
      preload="auto"
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
