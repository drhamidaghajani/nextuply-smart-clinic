# syntax=docker/dockerfile:1

# Production image for sadighi.nextuply.com — Next.js 15 + Prisma.
#
# Four-stage build:
#   1. deps       — full `npm ci` (incl. devDependencies), needed to run
#                    `next build` (TypeScript/Tailwind compile at build
#                    time) and `prisma generate`.
#   2. build      — runs `prisma generate` then `next build` against the
#                    deps stage's node_modules.
#   3. prod-deps  — a SEPARATE, production-only `npm ci --omit=dev`, kept
#                    apart from the `deps` stage specifically so the final
#                    image never carries typescript/eslint/tailwind/the
#                    `prisma` CLI package — "avoid unnecessary
#                    dependencies" per the deployment brief.
#   4. runner     — prod-only node_modules, PLUS the exact generated
#                    Prisma client copied over from the `build` stage
#                    (see the comment on that COPY below for why this
#                    isn't left to `@prisma/client`'s own postinstall).
#
# Build and runtime both use the same `node:22-alpine` base, so Prisma's
# auto-detected "native" query engine binary target matches between
# `prisma generate` (build stage) and actually running the app (runner
# stage) — no explicit `binaryTargets` needed in schema.prisma. Alpine
# needs `openssl`/`libc6-compat` for Prisma's engine and for Next.js's
# native image-optimization module (`sharp`) to work; installed below.
#
# No secrets are baked into this image at any stage — real env values are
# supplied at container-run time via `.env.production`/`.env.db` (see
# docker-compose.production.yml), never `COPY`'d or `ARG`'d here.

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production

# Run as a non-root user — standard container hardening, no functional
# reason to run this app as root.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=prod-deps /app/node_modules ./node_modules
# Overlay the ALREADY-generated Prisma client from the build stage on top
# of the prod-only node_modules above. Deliberately not relying on
# `@prisma/client`'s postinstall hook to regenerate correctly during the
# `--omit=dev` install (its exact behavior without the `prisma` CLI
# devDependency present wasn't something this pass could verify live) —
# copying the known-good, already-generated client guarantees the same
# artifact that was built and type-checked is exactly what runs.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
