"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

/**
 * Editorial FAQ accordion for internal pages — a continuous hairline-
 * divided column, not a stack of separate bordered boxes (per the
 * service-page premium redesign brief's explicit "not generic form-style
 * boxes" direction). Only consumed by service detail pages, so free to
 * restyle without affecting any other page.
 */
export function PageFaq({ items }: { items: readonly { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="border-t border-charcoal/10">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question} className="border-b border-charcoal/10">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 py-5 text-start sm:py-6"
            >
              <span className={`text-sm font-semibold leading-snug transition-colors duration-300 ease-out sm:text-base ${isOpen ? "text-gold" : "text-charcoal"}`}>
                {item.question}
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors duration-300 ease-out ${
                  isOpen ? "border-gold text-gold" : "border-charcoal/20 text-charcoal/40"
                }`}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-6 text-sm leading-7 text-charcoal/65 sm:pb-7">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
