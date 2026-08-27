"use client";

import { useEffect, useRef, useState } from "react";

/** Default slow-motion rate per Hamid's Hero reference: "سرعت ویدیو کم بشه طوری که تو ذوق نزنه". */
const DEFAULT_PLAYBACK_RATE = 0.6;

/**
 * Leaf client component so the rest of Hero (headline, CTA) stays a Server
 * Component per COMPONENT_GUIDE.md §2. Respects prefers-reduced-motion
 * (DESIGN_SYSTEM.md §5) — autoplaying <video> isn't covered by the CSS-only
 * reduced-motion rule in globals.css, so it's handled here in JS.
 *
 * Round 2026-08-27 (P0 production performance fix): `hero-doctor.mp4` is
 * 20.5MB and still not compressed (no ffmpeg in this environment — see
 * this file's own long-standing note, unchanged, and SYSTEM_ARCHITECTURE.md
 * §10 for the outstanding requirement to actually re-encode it). With no
 * `poster`, the browser had NOTHING to paint in this full-viewport `h-dvh`
 * hero until enough of that 20.5MB had downloaded and decoded — directly
 * measured against production: PageSpeed's mobile LCP was 3.2s (field) /
 * this session's local Lighthouse run against production hit 11.3s LCP
 * with the video still only 7MB into its download when the trace ended.
 * `poster` now points at `doctor-surgery.jpg` (119KB, already a real,
 * approved asset used elsewhere — not a new image) so the browser paints
 * a real, relevant frame immediately while the video streams in behind
 * it. This does not fix the video's own size — that still needs a real
 * compression pass — but it removes the "nothing renders at all" gap.
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
      poster="/media/doctor-surgery.jpg"
      className="hero-video-zoom absolute inset-0 h-full w-full object-cover"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
