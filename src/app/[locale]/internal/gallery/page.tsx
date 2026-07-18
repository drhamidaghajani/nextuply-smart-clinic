import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { InternalNav } from "@/components/internal/internal-nav";
import { REAL_PHOTOS } from "@/components/sections/gallery-photos";
import { SERVICES } from "@/content/services";
import { isSupportedLocale } from "@/i18n/locales";
import { requireInternalActor } from "@/modules/internal-ops/server/internal-auth";

/** Staff-only tooling — must never be indexed, even though the middleware token gate + robots.ts's Disallow already keep it out of normal crawling. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Internal operational prototype (Hamid's 2026-07-13 delivery-mode
 * brief): "prepare management view for before/after assets; if no
 * upload/storage exists, do not implement upload; show existing assets
 * or empty state; document that upload/storage integration is pending."
 *
 * No upload/storage backend exists (assets are checked into
 * `public/media/gallery/` directly per docs/adr/0003-media-assets-not-
 * in-git.md's convention). This page is a read-only inventory of the
 * real assets currently wired into `REAL_PHOTOS`
 * (`gallery-photos.ts`) — no upload form, no delete button, nothing that
 * would imply a working asset pipeline that doesn't exist yet.
 */
export default async function GalleryAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const actor = await requireInternalActor(locale);

  const serviceLabels = Object.fromEntries(SERVICES.map((service) => [service.galleryCategory, service.title.fa]));
  const entries = Object.entries(REAL_PHOTOS) as [string, string][];

  return (
    <main dir="rtl" className="min-h-dvh bg-warm-white text-charcoal">
      <InternalNav locale={locale} active="gallery" actor={actor} />
      <div className="mx-auto max-w-7xl px-6 py-6 sm:px-8">
        <h1 className="text-xl font-bold text-deep-navy">گالری قبل و بعد</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/70">این بخش تصاویر قبل و بعد فعال در سایت را نمایش می‌دهد.</p>

        <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">
          افزودن یا حذف تصویر از این صفحه هنوز فعال نیست — برای تغییر تصاویر با تیم فنی هماهنگ کنید.
        </div>

        {entries.length === 0 ? (
          <div className="mt-6 rounded-lg border border-charcoal/10 bg-charcoal/[0.03] px-4 py-3 text-sm text-charcoal/60">
            هیچ تصویر واقعی‌ای هنوز ثبت نشده است.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {entries.map(([id, src]) => (
              <div key={id} className="overflow-hidden rounded-lg border border-charcoal/10 bg-cream">
                <div className="relative aspect-square">
                  <Image src={src} alt={serviceLabels[id] ?? id} fill sizes="200px" className="object-cover" />
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-medium text-charcoal">{serviceLabels[id] ?? id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
