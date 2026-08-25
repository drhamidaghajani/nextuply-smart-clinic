/**
 * Aparat video embed for Knowledge Center articles whose source content
 * depended on a video (has_aparat = True in the WordPress export — see
 * docs/migration/sadighi-wordpress-seo-audit/). None of the 25 phase-1
 * articles need this today, but it's part of the required article
 * template per Hamid's Track 2 brief, so it's built now rather than as a
 * gap the first video-bearing article (a later phase) would otherwise hit.
 *
 * Plain `<iframe>` on Aparat's own embed URL contract — no video SDK/
 * dependency. Same rounded-frame/shadow treatment as `ServiceVisualPanel`
 * so a video block reads as the same visual family as the hero image, not
 * a bolted-on widget.
 */
export function AparatEmbed({ videoHash, title }: { videoHash: string; title: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-charcoal shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:rounded-[28px]">
      <iframe
        src={`https://www.aparat.com/video/video/embed/videohash/${videoHash}/vt/frame`}
        title={title}
        allowFullScreen
        className="absolute inset-0 h-full w-full"
        loading="lazy"
      />
    </div>
  );
}
