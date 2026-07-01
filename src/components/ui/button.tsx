import Link from "next/link";
import type { ReactNode } from "react";

export interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}

/**
 * Primitive CTA button — UI_GUIDELINES.md §2: one primary button per view,
 * secondary is outline/ghost. Gold is the only accent color (DESIGN_SYSTEM.md §2).
 */
export function Button({ href, children, variant = "primary" }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-medium transition-colors duration-200 min-h-11";
  // Secondary uses `border-current`/`text-inherit` on purpose: it must read
  // correctly both on light sections (charcoal text) and the dark Hero/AI
  // Experience/Final-CTA sections (warm-white text) without a separate prop.
  const styles =
    variant === "primary"
      ? "bg-gold text-warm-white hover:bg-gold-hover"
      : "border border-current/30 text-inherit hover:border-gold hover:text-gold";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}
