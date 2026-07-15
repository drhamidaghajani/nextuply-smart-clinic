import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";

/**
 * Image-led "related before/after" band — a real photo (when available)
 * with a dark scrim and overlaid heading/note/CTA, replacing the
 * previous plain text link. Deliberately does not render any actual
 * before/after comparison here (that lives on `/before-after` itself,
 * behind its own disclaimer) — this is a visually integrated doorway to
 * it, not a duplicate results display.
 */
export function ServiceBeforeAfterBand({
  photoSrc,
  photoAlt,
  heading,
  note,
  ctaLabel,
  href,
}: {
  photoSrc?: string;
  photoAlt: string;
  heading: string;
  note: string;
  ctaLabel: string;
  href: string;
}) {
  return (
    <section data-header-bg="#0f172a" className="relative overflow-hidden bg-deep-navy px-6 py-20 sm:px-8 sm:py-28">
      {photoSrc ? (
        <>
          <Image src={photoSrc} alt={photoAlt} fill sizes="100vw" className="object-cover opacity-40" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-deep-navy via-deep-navy/80 to-deep-navy/50" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-deep-navy to-[#1a2540]" />
      )}

      <Reveal className="relative mx-auto max-w-xl text-center">
        <h2 className="text-balance text-xl font-bold leading-tight text-warm-white sm:text-2xl lg:text-[28px]">{heading}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-warm-white/70 sm:text-base">{note}</p>
        <Link
          href={href}
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full border border-gold/60 px-8 py-3 text-sm font-medium text-warm-white transition-colors duration-200 hover:bg-gold/10"
        >
          {ctaLabel}
        </Link>
      </Reveal>
    </section>
  );
}
