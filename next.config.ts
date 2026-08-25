import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Added 2026-08-23 (WordPress → Knowledge Center phase-1 migration).
   * Without this, Next's own built-in trailing-slash normalization
   * redirects a request BEFORE `src/middleware.ts` ever sees it — verified
   * directly against a production build: `/contact/` (every legacy
   * WordPress URL has a trailing slash) got a 308 to `/contact` from Next
   * itself, THEN a second 301 from middleware to `/fa/contact` — a 2-hop
   * chain, directly against this migration's explicit "avoid redirect
   * chains where possible" requirement. `skipTrailingSlashRedirect` hands
   * that normalization to middleware instead, which already strips the
   * trailing slash itself (`normalizeLegacyPath`) before its one single
   * redirect — restoring the intended single hop.
   */
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
