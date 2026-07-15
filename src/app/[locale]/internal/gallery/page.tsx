import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { InternalNav } from "@/components/internal/internal-nav";
import { REAL_PHOTOS } from "@/components/sections/gallery-photos";
import { SERVICES } from "@/content/services";
import { isSupportedLocale } from "@/i18n/locales";

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

  const serviceLabels = Object.fromEntries(SERVICES.map((service) => [service.galleryCategory, service.title.fa]));
  const entries = Object.entries(REAL_PHOTOS) as [string, string][];

  return (
    <main dir="rtl" className="min-h-dvh bg-warm-white text-charcoal">
      <div className="pt-[68px] lg:pt-[88px]">
        <InternalNav locale={locale} active="gallery" />
      </div>
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <h1 className="text-xl font-bold text-deep-navy">مدیریت تصاویر گالری قبل و بعد (داخلی)</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/70">
          فهرست فقط‌خواندنی تصاویر واقعی فعال در سایت. آپلود یا حذف تصویر از این صفحه هنوز پیاده‌سازی نشده — تا اتصال یک سرویس ذخیره‌سازی
          واقعی، تصاویر جدید باید مستقیماً در پوشه <code className="font-mono">public/media/gallery/</code> قرار گیرند (مطابق
          docs/adr/0003).
        </p>

        <div className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-charcoal/80">
          آپلود/حذف تصویر از این پنل، در انتظار اتصال یک سرویس ذخیره‌سازی واقعی است (وضعیت باز — هنوز انتخاب نشده).
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
                  <p className="truncate text-[10px] text-charcoal/50" dir="ltr">
                    {src}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
