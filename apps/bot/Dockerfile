FROM node:24-alpine AS base
WORKDIR /app
COPY package.json /tmp/package.json
RUN corepack enable && \
    PNPM_VERSION=$(node -e "process.stdout.write(require('/tmp/package.json').packageManager.split('@')[1])") && \
    corepack prepare "pnpm@${PNPM_VERSION}" --activate

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json ./
COPY apps/bot/package.json apps/bot/
COPY packages/types/package.json packages/types/

RUN pnpm install --frozen-lockfile

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app ./
COPY apps/bot ./apps/bot

RUN pnpm --filter fintrack-bot build

# ── deploy ────────────────────────────────────────────────────────────────────
FROM base AS deploy

COPY --from=builder /app ./
RUN pnpm --filter fintrack-bot deploy --prod /deploy

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S botuser -u 1001

COPY --from=deploy /deploy ./

USER botuser

CMD ["node", "dist/bot.js"]
