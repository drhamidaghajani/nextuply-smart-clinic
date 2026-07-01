# 0003. Media assets are not committed to git

Status: Accepted
Date: 2026-07-01

## Context

Hamid supplied the real Hero video (`public/media/source/hero-doctor-source.mp4`, ~20MB, 1920×1080, 33s). More videos and before/after photo sets are coming per CONTENT_INVENTORY.md §8. This is the first real binary media asset to land in the repo, so the storage strategy needs to be decided before it becomes a habit.

## Decision

Large media binaries (video, and eventually the before/after photo sets) are **not committed to git**. `.gitignore` excludes media file types under `public/media/` (keeping `.gitkeep` placeholders tracked so the folder structure itself stays visible in the repo). Rationale:

- Git is a poor fit for large binaries: every version bloats `.git` permanently (unlike text files, old blobs aren't meaningfully diffed/compressed away), and this repo will accumulate many video/photo revisions over its life as a flagship + future SaaS product.
- No CDN/object storage adapter exists yet (that's a real SYSTEM_ARCHITECTURE.md-level decision for later, likely alongside the payment/SMS provider ADRs).
- The interim need is simple: get real assets rendering locally and on the deployed server without a repo full of video files.

## Consequences

- Anyone pulling the repo fresh will **not** get the media files — `public/media/` needs to be populated separately (for now: manually copied; later: synced from wherever assets end up being stored — object storage, a CDN, or at minimum a documented server directory).
- This is explicitly a placeholder decision, not a final one: once DEPLOYMENT_GUIDE.md's hosting topology is fleshed out further, media storage should move to a proper solution (e.g. an S3-compatible bucket or the Iranian VPS's own storage synced via the deploy pipeline) rather than "whoever has the files copies them by hand." Tracked as a follow-up, not solved by this ADR.
- Compression/transcoding is still owed separately (see the note in `src/components/sections/hero.tsx`) — this ADR only covers *where* assets live, not their final encoding.
