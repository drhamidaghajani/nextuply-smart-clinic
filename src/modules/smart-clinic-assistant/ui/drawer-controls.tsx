"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

/**
 * Small shared building blocks for the drawer's step components — kept
 * local to this module (not `src/components/ui/`) since their visual
 * language (cream form fields inside a navy-headed drawer) is specific
 * to this flow, not a site-wide primitive. `src/components/ui/button.tsx`
 * is a `Link`-based navigation CTA and doesn't fit real form/flow actions
 * (onClick, `type="submit"`, `disabled`), so these are separate rather
 * than forced through it.
 */

export function StepHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-5">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">{eyebrow}</p> : null}
      <h3 className="mt-1.5 text-lg font-bold leading-snug text-charcoal">{title}</h3>
    </div>
  );
}

export function PrimaryButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex w-full items-center justify-center rounded-full bg-gradient-to-b from-gold to-gold-hover px-6 py-3 text-sm font-semibold text-deep-navy transition-[filter] duration-200 hover:brightness-105 disabled:pointer-events-none disabled:opacity-50 ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function OutlineButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex w-full items-center justify-center rounded-full border border-charcoal/20 px-6 py-3 text-sm font-semibold text-charcoal transition-colors duration-200 hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-50 ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextField({ label, error, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-charcoal/70">{label}</span>
      <input
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-1 ${
          error ? "border-red-300 focus:ring-red-300" : "border-charcoal/15 focus:border-gold focus:ring-gold/40"
        } ${className ?? ""}`}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function TextAreaField({ label, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-charcoal/70">{label}</span>
      <textarea
        className={`w-full resize-none rounded-xl border border-charcoal/15 bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40 ${className ?? ""}`}
        {...props}
      />
    </label>
  );
}

export function SelectField({
  label,
  children,
  className,
  ...props
}: InputHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-charcoal/70">{label}</span>
      <select
        className={`w-full rounded-xl border border-charcoal/15 bg-white px-3.5 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40 ${className ?? ""}`}
        {...(props as object)}
      >
        {children}
      </select>
    </label>
  );
}

export function SafetyNotice({ children }: { children: ReactNode }) {
  return <p className="mt-4 rounded-xl bg-charcoal/[0.04] px-3.5 py-3 text-xs leading-6 text-charcoal/55">{children}</p>;
}

/**
 * Round 2026-07-17 (Smart Assistant product redesign): a small pill
 * follow-up action — deliberately smaller/quieter than `PrimaryButton`/
 * `OutlineButton` (which are always full-width) so a row of 2-4 can sit
 * side by side after an AI answer without reading as another full form
 * step. `emphasized` marks the one chip (if any) tied to the AI's own
 * suggested next step, per Hamid's "calm, subtle" brief — a slightly
 * bolder border/text, still not a solid fill.
 */
export function Chip({ children, emphasized, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; emphasized?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full border px-3.5 py-2 text-xs font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 ${
        emphasized ? "border-gold/60 text-gold hover:bg-gold/10" : "border-charcoal/15 text-charcoal/70 hover:border-gold hover:text-gold"
      } ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Three-dot "assistant is thinking" indicator — the only motion in the AI conversation panel, and only while an answer is actually in flight. Respects the site-wide reduced-motion handling done at the drawer level (this itself is a lightweight CSS animation, not a Framer Motion sequence, so it's cheap to leave running). */
export function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 px-1 py-2" aria-hidden="true">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-charcoal/30 [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-charcoal/30 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-charcoal/30" />
    </span>
  );
}

/**
 * Round 2026-07-18 (conversation-first UX pass, per Hamid — "it still
 * feels like a form with a chat attached to it"): the assistant's
 * bubble/card vocabulary for a single continuous transcript. Every
 * interaction (opening message, quick actions, questions, answers,
 * guided booking steps, OTP, confirmation) renders as one of these
 * inside `AssistantDrawer`'s scrolling feed, instead of the drawer
 * swapping between separate full-screen "form" views.
 */

/** An assistant-authored line — left-aligned (logical `me-auto`, so it's the visual left under RTL and right under LTR — matches this drawer's existing RTL-safe convention). */
export function AssistantBubble({ children }: { children: ReactNode }) {
  return <div className="me-auto max-w-[90%] rounded-2xl rounded-ss-sm border border-charcoal/10 bg-white px-3.5 py-2.5 text-sm leading-6 text-charcoal/85">{children}</div>;
}

/** A patient-authored line — the mirror of `AssistantBubble`. */
export function UserBubble({ children }: { children: ReactNode }) {
  return <div className="ms-auto max-w-[85%] rounded-2xl rounded-ee-sm bg-gold/10 px-3.5 py-2.5 text-sm leading-6 text-charcoal">{children}</div>;
}

/**
 * A compact, centered recap of a completed guided step (e.g. "✓ ایمپلنت
 * دندان پیشرفته انتخاب شد") — deliberately NOT another paired assistant/
 * user bubble: the guided card itself already showed the question, so a
 * full bubble pair here would just repeat it. This is what lets a
 * multi-step booking collapse into a short, scannable history instead of
 * a wall of repeated prompts.
 */
export function ChoiceRecap({ children }: { children: ReactNode }) {
  return <p className="mx-auto max-w-[85%] text-center text-xs leading-6 text-charcoal/45">{children}</p>;
}

/**
 * Wraps an existing step component (`ServiceSelectionStep`, `TriageStep`,
 * etc. — unchanged internally) so it reads as a card inside the
 * conversation rather than a screen that replaces it. This is the whole
 * mechanism behind "refactor carefully, don't throw away the existing
 * implementation" — every guided step keeps its own validation/props/
 * server calls exactly as before; only its container changed.
 */
export function GuidedCard({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">{children}</div>;
}
