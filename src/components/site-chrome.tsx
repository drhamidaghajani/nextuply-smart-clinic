"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import type { FooterDictionary, HeaderDictionary } from "@/i18n/dictionary-types";
import type { Locale } from "@/i18n/locales";
import { FloatingAssistantTrigger } from "@/modules/smart-clinic-assistant";

import { SiteFooter } from "./sections/site-footer";
import { SiteHeader } from "./site-header";

/**
 * Round 2026-09-03 (P1 mobile TBT audit): `AssistantDrawer` is a 1,823-
 * line, always-mounted client component (see this file's own 2026-07-24
 * comment below — it was already known to be "large" and "stateful"),
 * unconditionally rendered on EVERY non-internal route regardless of
 * whether the drawer is ever opened. Imported here via `next/dynamic`
 * from its specific submodule path (`.../ui/assistant-drawer`, not the
 * `@/modules/smart-clinic-assistant` barrel `FloatingAssistantTrigger`
 * still uses below) so its code is guaranteed to land in its own chunk —
 * importing it through the barrel instead risks webpack merging it back
 * into whatever chunk the barrel's other, eagerly-used exports already
 * belong to, silently undoing the split.
 *
 * `ssr: false`: `AssistantDrawer` is a client-only overlay (no content
 * that needs to be crawled or present in the initial HTML) and reads all
 * of its state from `useAssistant()` context, not props — so there is
 * nothing here for the server to usefully render anyway, and skipping
 * SSR for it is a strictly safe choice, not a behavior change.
 *
 * `FloatingAssistantTrigger` is deliberately left as a normal static
 * import, unchanged: it must stay immediately visible and clickable from
 * first paint, not deferred.
 */
const AssistantDrawer = dynamic(() => import("@/modules/smart-clinic-assistant/ui/assistant-drawer").then((m) => m.AssistantDrawer), { ssr: false });

/**
 * Round 2026-07-24 (Internal Operations Lite, Part A — production crash
 * fix, per Hamid: "Application error: a client-side exception has
 * occurred" on `/internal/login`): root cause was that `[locale]/layout.tsx`
 * mounted the ENTIRE patient-facing chrome — `SiteHeader` (Framer Motion +
 * an `IntersectionObserver` scroll-spy expecting homepage `[data-header-bg]`
 * sections), `SiteFooter`, `FloatingAssistantTrigger`, and `AssistantDrawer`
 * (a large, stateful client component with its own effects/refs) —
 * unconditionally on EVERY route under `[locale]`, including `/internal/*`.
 * `FloatingAssistantTrigger` already special-cased itself out of `/internal/*`
 * (see its own doc-comment) but nothing else did, so the admin login/
 * dashboard pages — themselves plain, null-safe Server Components with
 * zero client JS of their own (verified: `/internal/login`, `/internal/
 * dashboard`, `/internal/assistant-leads`, `/internal/appointments` were
 * all audited and have no client code) — were still rendering this entire
 * homepage-oriented client subsystem around them. This component is the
 * single gate: `/internal/*` gets NONE of it, matching the one exclusion
 * `FloatingAssistantTrigger` already had, applied consistently everywhere
 * this chrome is decided.
 *
 * A "use client" wrapper (not a server-side pathname check) because
 * `usePathname()` is the only reliable way to know the FULL current path
 * from here — `[locale]/layout.tsx` only receives the `locale` route
 * param, not the rest of the URL. Kept intentionally tiny: no logic
 * beyond the route match, mirroring `FloatingAssistantTrigger`'s own
 * regex exactly so the two can never drift apart on what counts as
 * "internal."
 *
 * Takes narrow `headerDict`/`footerDict` slices (not the full
 * dictionary) deliberately — a Client Component's props are serialized
 * into the RSC payload regardless of whether they end up rendered, so
 * passing the WHOLE dictionary here would still ship the entire
 * `assistantFlow`/`aiConcierge` content (a genuinely large object) to
 * every `/internal/*` page's payload even though this component chooses
 * not to render anything that uses it on those routes. `AssistantDrawer`
 * doesn't need a prop for this at all — it already calls
 * `getDictionary(locale)` itself internally.
 */
const INTERNAL_ROUTE_PATTERN = /^\/[a-z]{2}\/internal(\/|$)/;

export function SiteChrome({
  headerDict,
  footerDict,
  locale,
  children,
}: {
  headerDict: HeaderDictionary;
  footerDict: FooterDictionary;
  locale: Locale;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isInternal = INTERNAL_ROUTE_PATTERN.test(pathname);

  if (isInternal) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader dict={headerDict} locale={locale} />
      {children}
      <SiteFooter dict={footerDict} locale={locale} />
      <FloatingAssistantTrigger />
      <AssistantDrawer />
    </>
  );
}
