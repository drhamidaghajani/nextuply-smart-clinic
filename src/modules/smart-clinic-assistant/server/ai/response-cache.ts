/**
 * Best-effort, in-process cache for AI intent/Q&A results — per "Cache
 * or reuse AI results where reasonable." A single clinic assistant at
 * this traffic scale doesn't justify a real cache infrastructure
 * (Redis, etc. — none exists in this repo, and adding one here would be
 * exactly the over-engineering CODING_STANDARDS.md §11 rejects); a plain
 * module-scoped `Map` is enough to dedupe the realistic case (several
 * visitors asking the same common question, e.g. "how much does
 * rhinoplasty cost") within a single server process's lifetime. Resets
 * on redeploy/restart — that's an accepted trade-off, not a bug.
 *
 * Capped at `MAX_ENTRIES` with simple FIFO eviction (delete-then-reinsert
 * on hit acts as a cheap LRU) so this can never grow unbounded.
 */
const MAX_ENTRIES = 200;
const TTL_MS = 1000 * 60 * 60 * 6; // 6h — long enough to dedupe real repeat traffic, short enough that stale answers don't linger indefinitely.

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function cacheKey(parts: (string | null | undefined)[]): string {
  return parts.map((part) => (part ?? "").trim().toLowerCase()).join("::");
}

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  // Refresh recency by reinserting (Map iteration order = insertion order).
  cache.delete(key);
  cache.set(key, entry);
  return entry.value as T;
}

export function setCached<T>(key: string, value: T): void {
  if (cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
}
