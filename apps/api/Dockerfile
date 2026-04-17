FROM node:22-alpine AS base
WORKDIR /app

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
ENV HUSKY=0

COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json

RUN npm ci --include=dev --install-strategy=nested

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules           ./node_modules
COPY --from=deps /app/package.json           ./package.json
COPY --from=deps /app/package-lock.json      ./package-lock.json
COPY --from=deps /app/apps/api/package.json  ./apps/api/package.json
COPY --from=deps /app/apps/api/node_modules  ./apps/api/node_modules
COPY --from=deps /app/packages/types/package.json ./packages/types/package.json

COPY packages/types ./packages/types
COPY apps/api       ./apps/api

RUN npm --prefix packages/types run build
RUN npm --prefix apps/api run build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S apiuser -u 1001

# Runtime dependencies only
COPY --from=deps /app/apps/api/node_modules  ./node_modules

# Built output
COPY --from=builder /app/apps/api/dist       ./dist

# Prisma client + schema (needed at runtime for migrations and client generation)
COPY --from=builder /app/apps/api/prisma     ./prisma
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api/node_modules/@prisma ./node_modules/@prisma

# package.json is needed by Prisma CLI
COPY --from=builder /app/apps/api/package.json ./package.json

USER apiuser
EXPOSE 8000

CMD ["node", "dist/server.js"]