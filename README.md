# FinTrack

> **Personal Finance Tracker** — a full-stack monorepo for tracking income and expenses, with AI-powered analytics, Monobank integration, multi-currency support, and a donation system.

[![CI](https://github.com/BODMAT/FinTrack/actions/workflows/ci.yml/badge.svg)](https://github.com/BODMAT/FinTrack/actions)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Node](https://img.shields.io/badge/node-22-green)]()
[![Next.js](https://img.shields.io/badge/Next.js-16-black)]()

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Backend](#backend)
  - [Architecture](#backend-architecture)
  - [Database Schema](#database-schema)
  - [API Modules](#api-modules)
  - [Security](#security)
  - [Running the API](#running-the-api)
- [Frontend](#frontend)
  - [Architecture](#frontend-architecture)
  - [Pages & Features](#pages--features)
  - [State Management](#state-management)
  - [Running the Web App](#running-the-web-app)
- [Shared Types Package](#shared-types-package)
- [CI/CD](#cicd)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [License](#license)

---

## Overview

FinTrack is a monorepo (Turborepo) personal finance application that allows users to manually track transactions or import them directly from **Monobank** via its public API. The app provides a visual dashboard, AI-powered financial analysis using LLM models (Groq / Gemini), a donation leaderboard backed by **Stripe**, and a full admin panel for user and error management.

**Core capabilities:**

- Manual transaction management (CRUD) with location tagging (Leaflet map)
- Monobank read-only integration — fetch accounts and import statement transactions
- AI chat analytics powered by Groq / Gemini with user-provided API key support
- Multi-currency support: USD, UAH, EUR
- Dashboard with income/expense summaries and interactive charts
- Google OAuth + email/password authentication with session hardening
- Internationalization: English, Ukrainian, German
- Admin panel — user management, error log review, system stats
- Donation system with Stripe Checkout and public leaderboard
- Dark / light theme, fully responsive

---

## Screenshots

| Dashboard                               | Transactions                                  | Analytics                               |
| --------------------------------------- | --------------------------------------------- | --------------------------------------- |
| ![Dashboard](screenshots/dashboard.png) | ![Transactions](screenshots/transactions.png) | ![Analytics](screenshots/analytics.png) |

| Monobank Import                              | Admin Panel                           | Donation                              |
| -------------------------------------------- | ------------------------------------- | ------------------------------------- |
| ![Monobank Import](screenshots/monobank.png) | ![Admin Panel](screenshots/admin.png) | ![Donation](screenshots/donation.png) |

---

## Tech Stack

### Backend (`apps/api`)

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Runtime    | Node.js 20+, TypeScript 5.9                            |
| Framework  | Express 4                                              |
| ORM / DB   | Prisma 6 + PostgreSQL 15                               |
| Auth       | JWT (access + session tokens), bcrypt, Google OAuth    |
| Validation | Zod 4                                                  |
| AI         | OpenAI SDK (`openai`) → Groq & Gemini compatible       |
| Payments   | Stripe                                                 |
| Docs       | Swagger / OpenAPI (swagger-jsdoc + swagger-ui-express) |
| Testing    | Jest + Supertest (integration tests)                   |
| Security   | Helmet, CORS, CSRF middleware, express-rate-limit      |

### Frontend (`apps/web`)

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router), React 19, TypeScript 5.8 |
| Styling        | Tailwind CSS 4                                    |
| State          | Zustand 5                                         |
| Server state   | TanStack Query 5                                  |
| Auth bridge    | NextAuth 4 + `@auth/prisma-adapter`               |
| Charts         | Chart.js 4 + react-chartjs-2                      |
| Maps           | Leaflet + react-leaflet                           |
| Animations     | Framer Motion 12                                  |
| i18n           | i18next + react-i18next (EN / UK / DE)            |
| Forms / select | react-select 5                                    |
| HTTP client    | Axios 1.15                                        |

### Monorepo

| Tool                | Purpose                                 |
| ------------------- | --------------------------------------- |
| Turborepo 2         | Task orchestration and pipeline caching |
| `packages/types`    | Shared Zod schemas and TypeScript types |
| Husky + lint-staged | Pre-commit hooks                        |
| Prettier + ESLint   | Formatting and linting                  |
| Docker / Dockerfile | Production containerisation (web app)   |
| GitHub Actions      | CI pipeline                             |

---

## Project Structure

```
FinTrack/
├── apps/
│   ├── api/                  # Express REST API
│   │   ├── prisma/           # Schema, migrations, seed
│   │   └── src/
│   │       ├── config/       # Env validation (Zod)
│   │       ├── docs/         # OpenAPI YAML definitions
│   │       ├── middleware/   # Auth, CSRF, rate-limit, error handler
│   │       ├── modules/      # Feature modules (auth, transaction, ai, ...)
│   │       ├── prisma/       # Prisma client singleton + seed
│   │       └── routes/       # Root router
│   │
│   └── web/                  # Next.js 16 App Router
│       └── src/
│           ├── api/          # Axios API layer (typed per domain)
│           ├── app/          # Next.js routes & layouts
│           │   └── protected/
│           │       ├── admin/
│           │       ├── analytics/
│           │       ├── dashboard/
│           │       ├── donation/
│           │       ├── monobank/
│           │       └── transactions/
│           ├── components/   # Shared UI: header, auth, portals, layout
│           ├── hooks/        # Custom React hooks
│           ├── lib/          # NextAuth config, error capture, OAuth bridge
│           ├── server/       # Server-side prefetch helpers
│           ├── shared/i18n/  # i18next setup + locale JSONs (en/uk/de)
│           ├── store/        # Zustand stores
│           ├── styles/       # Global CSS + Tailwind entry
│           ├── types/        # App-level TypeScript types
│           └── utils/        # Helpers per domain
│
├── packages/
│   └── types/                # Shared Zod schemas exported as @fintrack/types
│
├── scripts/                  # codebase-dump, db-dump, db-restore helpers
├── turbo.json
└── package.json
```

---

## Backend

### Backend Architecture

The API follows a **module-based architecture** — each feature domain (`auth`, `transaction`, `ai`, `user`, `summary`, `monobank`, `donation`, `admin`, `user-api-key`) exposes its own `controller.ts`, `service.ts`, and `route.ts`. Business logic lives in services; controllers handle HTTP and delegate to services; routes wire up middleware and controllers.

All incoming request bodies and query parameters are validated with **Zod** schemas sourced from the shared `packages/types` package, keeping the frontend and backend in sync.

### Database Schema

The database uses **PostgreSQL 15** managed via Prisma migrations. Key models:

| Model             | Description                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `User`            | Core user profile; roles: `USER`, `ADMIN`; `isVerified` flag                                     |
| `AuthMethod`      | Polymorphic auth: `EMAIL`, `TELEGRAM`, `GOOGLE` per user                                         |
| `Session`         | Hardened session store with token hash, family ID, IP, user-agent, revocation                    |
| `Transaction`     | Income/expense record; supports `MANUAL` and `MONOBANK` sources; currencies: `USD`, `UAH`, `EUR` |
| `Location`        | Optional lat/lng attached to a transaction (1:1)                                                 |
| `Message`         | AI conversation history per user                                                                 |
| `UserApiKey`      | Encrypted user-provided API keys for `GROQ` or `GEMINI`                                          |
| `ErrorLog`        | Client-reported errors; admin-reviewable with `OPEN` / `RESOLVED` status                         |
| `DonationPayment` | Stripe payment records: `PENDING`, `SUCCEEDED`, `CANCELED`, `FAILED`                             |

### API Modules

| Module                   | Route prefix               | Highlights                                                                         |
| ------------------------ | -------------------------- | ---------------------------------------------------------------------------------- |
| `auth`                   | `/auth`                    | Login, register, token refresh, Google OAuth exchange, logout, session list/revoke |
| `user`                   | `/users`                   | Get/update/delete profile, manage auth methods                                     |
| `user-api-key`           | `/user-api-keys`           | CRUD for user AI provider keys (AES-encrypted at rest)                             |
| `transaction`            | `/transactions`            | Full CRUD with pagination, search, date range filtering                            |
| `transaction (monobank)` | `/transactions/monobank/*` | Fetch accounts, preview transactions, import, delete imported                      |
| `summary`                | `/summary`                 | Aggregated totals and chart time-series data                                       |
| `ai`                     | `/ai`                      | Send prompt + transaction data to LLM, retrieve history, check limits              |
| `donation`               | `/donations`               | Create Stripe Checkout session, webhook handler, leaderboard                       |
| `admin`                  | `/admin`                   | User list, role update, session revocation, error log management, stats            |

Interactive Swagger docs are available at `/api-docs` (`ENABLE_SWAGGER_IN_PROD=true` or in dev mode).

### Security

- **Session hardening** — sessions store a bcrypt-hashed token, family ID for rotation detection, IP, user-agent, and a `revokedAt` timestamp.
- **CSRF middleware** on all state-mutating routes.
- **Rate limiting** via `express-rate-limit`, configurable per route group.
- **Helmet** for HTTP security headers.
- **API key encryption** — user AI provider keys stored AES-encrypted (`utils/crypto.ts`).
- **CORS** restricted to configured origins via `CORS_ORIGINS` env var.
- **Role-based access** — `ADMIN` role gates the `/admin` namespace via `authz` middleware.

### Running the API

```bash
cd apps/api

cp .env.example .env
# fill in DATABASE_URL, ACCESS_TOKEN_SECRET, GROQ_API_KEY_1, STRIPE_*, GOOGLE_CLIENT_ID ...

npm run prisma:migrate:dev   # apply migrations
npm run prisma:seed          # optional seed data
npm run dev                  # tsc -w + nodemon
```

**Tests:**

```bash
npm run test          # integration tests (Jest + Supertest)
npm run test:watch    # watch mode
```

---

## Frontend

### Frontend Architecture

The web app uses **Next.js 16 App Router** with a clear separation between server components (data prefetching via `server/prefetchProtected.ts`) and client components. All protected routes are nested under `app/protected/` and gated by `ProtectedClientGate`.

API communication is split into typed modules under `src/api/` (one file per domain), all built on a shared Axios instance (`api.ts`) with a 401-interceptor for transparent token refresh. Every response is validated against Zod schemas from `@fintrack/types`.

### Pages & Features

#### Dashboard (`/dashboard`)

- Summary cards: total balance, income, expenses, savings
- Income vs. expense chart (Chart.js) with animated transitions
- Period selector: week / month / year / custom range
- Source filter: all / manual / Monobank

#### Transactions (`/transactions`)

- Paginated, searchable transaction list
- Add / edit / delete via popup forms with full validation
- Location picker (Leaflet map) for geo-tagging a transaction
- Multi-currency: USD, UAH, EUR
- Monobank-sourced transactions displayed with source badge

#### Monobank Integration (`/monobank`)

- Token input with validation (minimum 20 characters)
- Account selector popup (masked PAN, type, ISO currency code)
- Preview fetched transactions before importing
- Import selected transactions into the user account
- Statistics overview and per-account stored transaction list
- Cooldown timer that respects Monobank API rate limits

#### Analytics (`/analytics`)

- AI chat panel — sends transaction data + free-text prompt to LLM
- Model selector (Groq llama-3.1-8b-instant and others)
- Typing text animation for streamed responses
- History list of previous AI conversations
- Custom API key management popup (Groq / Gemini)
- Usage indicator and donor-unlocked elevated limits

#### Donation (`/donation`)

- Stripe Checkout integration for one-time or permanent support
- Donation result popup (success / cancel states)
- Public leaderboard showing donor names and contribution totals

#### Admin Panel (`/admin`) — `ADMIN` role only

- Overview stats: users, admins, verified accounts, active sessions, open errors
- Insight charts for growth and activity trends
- User table with role toggle and session revocation per user
- Error log table: filter by `OPEN` / `RESOLVED`, resolve with admin notes

### State Management

| Zustand store      | Responsibility                                       |
| ------------------ | ---------------------------------------------------- |
| `useAuthStore`     | Authenticated user object and `isAuthenticated` flag |
| `theme`            | Light / dark theme preference                        |
| `period`           | Global date range used by dashboard and summary      |
| `popup`            | Global popup open/close state                        |
| `burger`           | Mobile navigation menu state                         |
| `monobankCooldown` | Monobank fetch cooldown countdown                    |

TanStack Query manages all server state with `staleTime: 5 min` and `gcTime: 30 min`. Mutations trigger targeted query invalidations.

### Running the Web App

```bash
cd apps/web

cp .env.example .env
# set NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

npm run dev    # http://localhost:5173/FinTrack
```

**Production (Docker):**

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://your-api.example.com \
  -t fintrack-web \
  apps/web

docker run -p 5173:5173 fintrack-web
```

---

## Shared Types Package

`packages/types` is a private TypeScript package (`@fintrack/types`) that exports all **Zod schemas and inferred TypeScript types** shared between the API and the web app. Both apps import from this package at compile time, guaranteeing type safety across the full stack.

Domains covered: `auth`, `user`, `transaction`, `summary`, `ai`, `monobank`, `admin`, `donation`.

```bash
# build before running any app
npm --prefix packages/types run build
```

---

## CI/CD

GitHub Actions runs the following checks on every pull request to `master`:

1. **Format check** — `prettier --check`
2. **Lint** — ESLint
3. **Type check** — `tsc --noEmit`
4. **Prisma generate + migrate** — against a PostgreSQL 15 service container
5. **API integration tests** — Jest + Supertest

See [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) for the full configuration.

---

## Environment Variables

### `apps/api/.env`

```env
NODE_ENV=development
ENABLE_SWAGGER_IN_PROD=false

HOST=localhost
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

DATABASE_URL=postgresql://user:password@localhost:5432/yourdb?schema=yourschema

ACCESS_TOKEN_SECRET=your-jwt-access-token-secret-here

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

GROQ_API_KEY_1=your-groq-api-key
API_KEY_ENCRYPTION_SECRET=your-32-char-secret-here

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_DONATION_PRICE_ID=price_xxx
STRIPE_DONATION_AMOUNT=300
STRIPE_DONATION_CURRENCY=usd
STRIPE_DONATION_SUCCESS_URL=http://localhost:5173/FinTrack/donation?state=success
STRIPE_DONATION_CANCEL_URL=http://localhost:5173/FinTrack/donation?state=cancel
STRIPE_DONATION_DURATION_DAYS=0
```

### `apps/web/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:5173/FinTrack
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## Getting Started

**Prerequisites:** Node.js 20+, PostgreSQL 15, npm 10+

```bash
# 1. Clone the repository
git clone https://github.com/BODMAT/FinTrack.git
cd FinTrack

# 2. Install all dependencies
npm ci

# 3. Build the shared types package
npm --prefix packages/types run build

# 4. Configure and migrate the API
cp apps/api/.env.example apps/api/.env
# → edit apps/api/.env

npm run api:prisma:migrate:deploy

# 5. (Optional) Seed the database
npm run api:prisma:seed

# 6. Configure the web app
cp apps/web/.env.example apps/web/.env
# → edit apps/web/.env

# 7. Start both apps via Turborepo
npx turbo run dev
```

API: `http://localhost:8000`  
Web: `http://localhost:5173/FinTrack`

---

## License

[MIT](./LICENSE) © Makar Dzhehur, Bohdan Matula
