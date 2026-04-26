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

RUN npm run build -w @fintrack/types
RUN npm run prisma:generate -w fintrack-api
RUN npm run build -w fintrack-api

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S apiuser -u 1001
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# All root node_modules (contains effect, fast-check, pure-rand, etc. for prisma CLI)
COPY --from=builder /app/node_modules ./node_modules

# Floor — api-specific node_modules
COPY --from=deps /app/apps/api/node_modules ./node_modules

# Generated Prisma Client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# FIX: copy the compiled @fintrack/types as a regular package
COPY --from=builder /app/packages/types/dist     ./node_modules/@fintrack/types/dist
COPY --from=builder /app/packages/types/package.json ./node_modules/@fintrack/types/package.json

# Built output
COPY --from=builder /app/apps/api/dist  ./dist

# Copy Swagger definitions
COPY --from=builder /app/apps/api/src/docs/definitions ./dist/docs/definitions

# Prisma schema
COPY --from=builder /app/apps/api/prisma ./prisma

# package.json needed by Prisma CLI
COPY --from=builder /app/apps/api/package.json ./package.json

USER apiuser
EXPOSE 8000

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma && node dist/server.js"]
