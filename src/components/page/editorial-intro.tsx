import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/**
 * A generous editorial lead-in, used right after a `PageHero` on
 * index-style pages (Services, Knowledge, Health Tourism, About) —
 * deliberately just large, centered type and nothing else on the
 * surface. Exists so those pages don't jump straight from hero into a
 * card grid/list with no breathing room. Accepts either a single string
 * or multiple paragraph elements (`ReactNode`) for pages with a 2-part
 * opening statement (e.g. About).
 */
export function EditorialIntro({ children, tone = "cream" }: { children: ReactNode; tone?: "cream" | "warm-white" }) {
  return (
    <section className={`px-6 py-16 sm:px-8 sm:py-20 ${tone === "cream" ? "bg-cream" : "bg-warm-white"}`}>
      <Reveal className="mx-auto max-w-2xl space-y-4 text-center text-balance text-lg leading-9 text-charcoal/75 sm:text-xl sm:leading-10">
        {children}
      </Reveal>
    </section>
  );
}
