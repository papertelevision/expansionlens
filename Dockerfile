# syntax=docker/dockerfile:1.7
# Production Dockerfile — multi-stage build producing a small standalone image.
# Separate from Dockerfile.dev, which is optimized for hot reload.

# ─── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install full deps so prisma generate has what it needs at build time.
RUN npm ci

# ─── Stage 2: build the app ──────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build the Next app. Sentry source map upload
# only runs when SENTRY_AUTH_TOKEN is present at build time.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: runtime image ──────────────────────────────────────────────────
FROM node:20-alpine AS runner
# Prisma's query engine dynamically links libssl at runtime. Without the
# openssl package (and libc6-compat for glibc shims), the engine fails to
# load on Alpine 3.19+ with the opaque error "Could not parse schema engine
# response: SyntaxError: Unexpected token 'E'..." — which is really Prisma
# trying to JSON.parse a dynamic-linker error message.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user for runtime.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone output bundles only what's needed to run the server.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma needs its schema + migrations and generated client at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
# Copy the entire @prisma/ scope so @prisma/engines can resolve its
# transitive deps (@prisma/debug, @prisma/fetch-engine, @prisma/get-platform)
# when `prisma migrate deploy` runs at container start. Cherry-picking
# individual @prisma/* packages breaks on those transitive requires.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# The Prisma CLI is needed to run `prisma migrate deploy` at container start.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

USER nextjs

EXPOSE 3000

# Entrypoint: run pending migrations, then start the standalone server.
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
