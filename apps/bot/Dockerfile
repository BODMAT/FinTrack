FROM node:22-alpine AS base
WORKDIR /app

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
ENV HUSKY=0

COPY package.json package-lock.json turbo.json ./
COPY apps/bot/package.json apps/bot/package.json
COPY packages/types/package.json packages/types/package.json

RUN npm ci --include=dev --install-strategy=nested

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules           ./node_modules
COPY --from=deps /app/package.json           ./package.json
COPY --from=deps /app/package-lock.json      ./package-lock.json
COPY --from=deps /app/apps/bot/package.json  ./apps/bot/package.json
COPY --from=deps /app/apps/bot/node_modules  ./apps/bot/node_modules
COPY --from=deps /app/packages/types/package.json ./packages/types/package.json

COPY packages/types ./packages/types
COPY apps/bot       ./apps/bot

RUN npm --prefix packages/types run build
RUN npm --prefix apps/bot run build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S botuser -u 1001

COPY --from=deps /app/apps/bot/node_modules ./node_modules
COPY --from=builder /app/apps/bot/dist      ./dist
COPY --from=builder /app/apps/bot/package.json ./package.json

USER botuser

CMD ["node", "dist/bot.js"]