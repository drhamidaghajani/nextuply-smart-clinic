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
