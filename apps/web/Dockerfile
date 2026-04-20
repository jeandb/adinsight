FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# ── Layer 1: install deps ─────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc .pnpmfile.cjs ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# ── Layer 2: build ────────────────────────────────────────────────────────────
FROM deps AS builder
# VITE_* vars must be set at build time — they are baked into the static bundle
ARG VITE_API_URL=https://adinsightapi.jaquemendes.com
ENV VITE_API_URL=${VITE_API_URL}
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/web/ ./apps/web/
RUN pnpm --filter @adinsight/shared-types build
RUN pnpm --filter @adinsight/web build

# ── Layer 3: production image (nginx) ─────────────────────────────────────────
FROM nginx:alpine AS production
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
