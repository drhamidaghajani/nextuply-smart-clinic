import { PrismaClient } from "@prisma/client";

/**
 * Standard Next.js dev-hot-reload-safe Prisma singleton — without the
 * `globalThis` cache, every Fast Refresh in dev would open a new
 * connection pool, quickly exhausting Postgres's connection limit.
 * `isDatabaseConfigured()` is the one thing callers should check before
 * using `prisma` at all — see `submit-booking-request.ts` for why (no
 * live DATABASE_URL exists in this environment; every real query must
 * degrade gracefully, never crash the patient-facing assistant flow).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
