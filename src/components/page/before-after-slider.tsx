"use client";

import Image from "next/image";
import { useId, useState } from "react";

/**
 * Lightweight before/after comparison slider — no new dependency. The
 * "drag" interaction is a native `<input type="range">`, stretched
 * invisibly over the whole frame: this gets pointer drag, touch drag,
 * and keyboard (arrow-key) support for free, correctly, without hand-
 * rolled `pointermove` listeners or a motion library. Reveal itself is
 * a plain CSS `clip-path` update on every `onChange` tick — no
 * animation/easing, matching the "no heavy animation" brief; the only
 * motion is the 1:1 response to the user's own drag.
 *
 * Deliberately uses PHYSICAL left/right throughout (not logical
 * start/end) — this project's own documented convention is logical
 * properties for text flow, but a photo comparison widget has no
 * "reading direction": before-on-the-left/after-on-the-right is the
 * universal convention for this exact UI pattern regardless of the
 * page's own `dir`, so flipping it under RTL would be a real
 * inconsistency with every other before/after slider a user has seen,
 * not a correctness fix.
 */
export function BeforeAfterSlider({
  before,
  after,
  beforeAlt,
  afterAlt,
  beforeLabel,
  afterLabel,
  ariaLabel,
}: {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel: string;
  afterLabel: string;
  ariaLabel: string;
}) {
  const [position, setPosition] = useState(50);
  const id = useId();

  return (
    <div className="relative aspect-square w-full select-none overflow-hidden rounded-2xl bg-charcoal/5">
      <Image src={after} alt={afterAlt} fill sizes="(min-width: 1024px) 33vw, 90vw" className="pointer-events-none object-cover" />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image src={before} alt={beforeAlt} fill sizes="(min-width: 1024px) 33vw, 90vw" className="object-cover" />
      </div>

      <div aria-hidden className="pointer-events-none absolute top-3 left-3 rounded-full bg-charcoal/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-warm-white">
        {beforeLabel}
      </div>
      <div aria-hidden className="pointer-events-none absolute top-3 right-3 rounded-full bg-gold/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-deep-navy">
        {afterLabel}
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-y-0 w-[2px] bg-warm-white/90" style={{ left: `${position}%` }} />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-warm-white shadow-[0_4px_16px_rgba(15,23,42,0.35)]"
        style={{ left: `${position}%` }}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-charcoal" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
        </svg>
      </div>

      <label htmlFor={id} className="sr-only">
        {ariaLabel}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
