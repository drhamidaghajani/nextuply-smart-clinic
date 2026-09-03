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
 * Round 2026-08-27 (P0 production performance fix): `hero-doctor.mp4` was
 * 20.5MB and uncompressed. With no `poster`, the browser had NOTHING to
 * paint in this full-viewport `h-dvh` hero until enough of that 20.5MB had
 * downloaded and decoded — directly measured against production:
 * PageSpeed's mobile LCP was 3.2s (field) / this session's local
 * Lighthouse run against production hit 11.3s LCP with the video still
 * only 7MB into its download when the trace ended. A `poster` pointing at
 * `doctor-surgery.jpg` was added to close that gap, but reverted the next
 * day (2026-08-28, urgent visual rollback, per Hamid): it read as the
 * hero showing a still photo first and then "replacing" it with the
 * video, rather than the video-first feel the hero is meant to have.
 *
 * Round 2026-09-03 (real fix, per Hamid's ffmpeg authorization): the
 * actual LCP gap this was always meant to close. ffmpeg wasn't available
 * in this environment either round — installed this time as a contained,
 * local static binary (evermeet.cx's official macOS build, the same
 * source Homebrew's own ffmpeg formula uses) for this one task, not a
 * project dependency. `hero-doctor.mp4` re-encoded at 1920x1080/1.3Mbps
 * H.264 (no audio track — this video is always `muted`, so the original's
 * AAC audio was pure dead weight) drops from 20.5MB to ~5.2MB with no
 * visible quality loss at normal viewing size, even in the clip's darkest,
 * lowest-contrast operating-room shots (checked directly, frame-by-frame,
 * against the original). A VP9 WebM sibling at ~800kbps goes further
 * still for browsers that support it. Both are new files
 * (`hero-doctor.optimized.{mp4,webm}`) — the original `hero-doctor.mp4`
 * and `public/media/source/hero-doctor-source.mp4` are untouched, kept as
 * the source/backup, per standing "do not delete/overwrite" instruction.
 * `webmSrc` is optional so any other `HeroVideo` caller without an
 * optimized WebM sibling keeps working unchanged.
 */
export function HeroVideo({
  src,
  webmSrc,
  playbackRate = DEFAULT_PLAYBACK_RATE,
}: {
  src: string;
  webmSrc?: string;
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
      {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
      <source src={src} type="video/mp4" />
    </video>
  );
}
