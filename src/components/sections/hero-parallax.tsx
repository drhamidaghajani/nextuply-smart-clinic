"use client";

import { useEffect, useRef } from "react";

/**
 * Very limited mouse parallax on the Hero's text/CTA block, per Hamid's
 * 2026-07-04 Awwwards-tier brief ("Mouse Parallax بسیار محدود"). Max offset
 * is deliberately small (8px) — this is a texture, not a "content follows
 * cursor" gimmick. Leaf client component so the rest of Hero (headline
 * text, CTAs) stays a Server Component per COMPONENT_GUIDE.md §2, same
 * pattern as hero-video.tsx.
 *
 * Skipped entirely on touch/coarse-pointer devices (no mouse to track) and
 * under prefers-reduced-motion.
 */
const MAX_OFFSET_PX = 8;

export function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const node = ref.current;
    if (!node) return;

    const handleMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      node.style.transform = `translate3d(${x * MAX_OFFSET_PX}px, ${y * MAX_OFFSET_PX}px, 0)`;
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div ref={ref} className="transition-transform duration-300 ease-out will-change-transform">
      {children}
    </div>
  );
}
