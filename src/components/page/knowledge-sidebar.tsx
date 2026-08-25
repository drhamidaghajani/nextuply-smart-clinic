/**
 * Sticky desktop rail for the Knowledge Center article detail page
 * (2026-08-25 redesign). Deliberately a thin wrapper, not a fixed-shape
 * component owning TOC/latest-articles/related-service/CTA props —
 * those blocks are page-specific composition, not a reusable contract,
 * so the page passes them in as `children` and this component owns only
 * the one thing that's actually shared: the sticky positioning + vertical
 * rhythm between blocks.
 *
 * `lg:sticky` (not a bare `sticky`) means this is `position: static` on
 * mobile — the aside simply flows in normal document order there, which
 * is exactly "sidebar content moves below the article" on small screens
 * with zero extra markup, since the page places this element as the
 * second item in a `grid-cols-1` (mobile) / `lg:grid-cols-[1fr_320px]`
 * (desktop) grid. `lg:top-28` clears the fixed header (88px tall at
 * `lg:`, see `site-header.tsx`) with breathing room, matching the
 * `top-24` sticky offset already established in `patient-journey-
 * section.tsx`.
 */
export function KnowledgeArticleSidebar({ children }: { children: React.ReactNode }) {
  return <aside className="space-y-10 lg:sticky lg:top-28">{children}</aside>;
}
