"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Shared Framer Motion entrance wrapper — DESIGN_SYSTEM.md §5's "Framer Motion
 * for component-level transitions" tier. Sections using GSAP ScrollTrigger
 * choreography (per HOMEPAGE_STORYBOARD.md §3) are a follow-up pass, not this
 * component — this covers the simple fade/slide-on-scroll-into-view case only.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
