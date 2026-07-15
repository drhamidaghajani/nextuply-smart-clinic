"use client";

import { useEffect, useRef, useState } from "react";

/** Default slow-motion rate per Hamid's Hero reference: "سرعت ویدیو کم بشه طوری که تو ذوق نزنه". */
const DEFAULT_PLAYBACK_RATE = 0.6;

/**
 * Leaf client component so the rest of Hero (headline, CTA) stays a Server
 * Component per COMPONENT_GUIDE.md §2. Respects prefers-reduced-motion
 * (DESIGN_SYSTEM.md §5) — autoplaying <video> isn't covered by the CSS-only
 * reduced-motion rule in globals.css, so it's handled here in JS.
 */
export function HeroVideo({
  src,
  playbackRate = DEFAULT_PLAYBACK_RATE,
}: {
  src: string;
  playbackRate?: number;
}) {
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
    videoRef.current.playbackRate = playbackRate;
    if (reducedMotion) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {
        // Autoplay can be blocked by the browser — the static first frame
        // (no poster set yet, see CONTENT_INVENTORY.md §8) is an acceptable fallback.
      });
    }
  }, [reducedMotion, playbackRate]);

  return (
    <video
      ref={videoRef}
      aria-hidden
      muted
      loop
      playsInline
      preload="auto"
      className="hero-video-zoom absolute inset-0 h-full w-full object-cover"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
