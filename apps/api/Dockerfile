FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# ── Layer 1: install deps (cached unless lockfile changes) ────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc .pnpmfile.cjs ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# ── Layer 2: build ────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/api/ ./apps/api/
RUN pnpm --filter @adinsight/shared-types build
RUN pnpm --filter @adinsight/api build
# Copy SQL migrations to dist (tsc only compiles .ts files)
RUN cp -r apps/api/src/shared/database/migrations apps/api/dist/shared/database/migrations
# pnpm deploy creates a self-contained dir with prod deps + built output
RUN pnpm --filter @adinsight/api deploy --prod --legacy /deploy

# ── Layer 3: production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /deploy .
EXPOSE 3000
USER node
CMD ["node", "dist/app.js"]
