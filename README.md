# FinTrack

> **Personal Finance Tracker** — a full-stack monorepo for tracking income and expenses, with AI-powered analytics, Monobank integration, multi-currency support, and a donation system.

[![CI](https://github.com/BODMAT/FinTrack/actions/workflows/ci.yml/badge.svg)](https://github.com/BODMAT/FinTrack/actions)
[![Docker Images](https://img.shields.io/badge/GHCR-Images-blue?logo=docker)](https://github.com/BODMAT/FinTrack/packages)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Node](https://img.shields.io/badge/node-22-green)]()
[![Next.js](https://img.shields.io/badge/Next.js-16-black)]()

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Deployment Topology](#deployment-topology)
- [Getting Started](#getting-started)
- [Database Management](#4-database-management--initial-data)
- [Environment Variables](#environment-variables)
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

| Tool                | Purpose                                   |
| ------------------- | ----------------------------------------- |
| Turborepo 2         | Task orchestration and pipeline caching   |
| `dx` (CLI)          | Project-agnostic Docker Executioner       |
| `packages/types`    | Shared Zod schemas and TypeScript types   |
| Husky + lint-staged | Pre-commit hooks                          |
| Prettier + ESLint   | Formatting and linting                    |
| Docker              | Production & Development containerization |
| GitHub Actions      | CI/CD pipeline + GHCR + Trivy Scan        |

---

## Deployment Topology

Production deployment flow:

- **Vercel** -> `apps/web` (Next.js)
- **Render** -> `apps/api` (Express + Prisma)
- **Supabase** -> PostgreSQL

Database migrations are applied automatically from GitHub Actions on pushes to `master` when Prisma schema or migrations change.

---

## Getting Started

**Prerequisites:** Node.js 20+, PostgreSQL 15, npm 10+.

### 1. Preparation

Regardless of the installation method, start by setting up your environment variables:

```bash
git clone https://github.com/BODMAT/FinTrack.git
cd FinTrack

# Use the dx CLI to create all necessary .env files from examples
bash dx setup
# → Edit .env for local run or .env.docker for Docker setup (DATABASE_URL host difference).
```

### 2. Docker (Recommended)

The `dx` script is a project-agnostic Docker Executioner CLI that wraps `docker compose` commands. Run `bash dx help` to see all available commands.

#### Development Mode

Each service is accessible directly on its own port for easier debugging.

**Commands:**

- `bash dx dev` — Start all containers in detached mode.
- `bash dx ps` — List containers with their current status and health (`init` service with `Exited` status is normal in dev mode).
- `bash dx logs` — Follow logs for all services (or `bash dx logs api` for a specific service).
- `bash dx api` — Open a shell inside the API container (shortcut for `bash dx shell api`).
- `bash dx run api:prisma:studio:dx` — Start Prisma Studio inside the API container.
- `bash dx run db:setup:dx` — Full database initialization inside Docker (migrate + seed).
- `bash dx run test:dx` — Run all integration tests inside Docker.
- `bash dx restart api` — Restart a service after changing its `.env` file.
- `bash dx down` — Stop and remove containers.

**Access Points:**

- **Web App:** http://localhost:5173
- **API:** http://localhost:8000/api
- **Swagger Docs:** http://localhost:8000/api-docs
- **Prisma Studio:** http://localhost:5555 (only after running `bash dx run api:prisma:studio:dx`)
- **pgAdmin:** http://localhost:5050 (Login: `admin@fintrack.dev` / `admin`)
  - _Setup:_ Right-click Servers → Register → Server.
  - _Connection:_ Host: `postgres`, Port: `5432`, Database: `fintrack`, Username: `fintrack`, Password: `fintrack`.

#### Production Mode

All services are proxied behind Nginx. Only port `8080` is exposed externally — Nginx routes requests to the appropriate service internally.

**Commands:**

- `bash dx pbuild` — Build all production images (required before first run).
- `bash dx prod` — Start the production stack.
- `bash dx plogs` — Follow production logs (or `bash dx plogs api` for a specific service).
- `bash dx pshell api` — Open a shell inside a running production container.
- `bash dx pdown` — Stop and remove production containers (requires confirmation).

**Access Points:**

- **Web App:** http://localhost:8080/FinTrack
- **API:** http://localhost:8080/api
- **Swagger Docs:** http://localhost:8080/api-docs
- _Prisma Studio and pgAdmin are disabled in production by default for security reasons._

### 3. Local Installation

For those who prefer running dependencies (Node, Postgres etc.) manually.

```bash
# Install dependencies
npm i

# Build shared packages and generate Prisma client
npm run setup

# Configure and migrate the API
npm run api:prisma:migrate:deploy
npm run api:prisma:seed # Optional

# Start all apps via Turborepo
npm run dev
```

**Access Points:**

- **Web App:** http://localhost:5173/FinTrack
- **API:** http://localhost:8000/api
- **Swagger Docs:** http://localhost:8000/api-docs
- **Prisma Studio:** http://localhost:5555 (only after running `npm run api:prisma:studio`)
- **pgAdmin (locally installed app or via browser):**
  - **Desktop App:** Use your natively installed pgAdmin 4 application.
    - _Setup:_ Right-click Servers → Register → Server.
    - _Connection:_ Host: `localhost`, Port: `5432`, Database/Username/Password: (your local Postgres credentials).
  - **Web Interface (via Docker):** Run only the tool: `bash dx dev pgadmin`.
    - _Access:_ http://localhost:5050 (Login: `admin@fintrack.dev` / `admin`).
    - _Setup:_ Right-click Servers → Register → Server.
    - _Connection to local DB:_ Use Host: `host.docker.internal` (Win/Mac) or `172.17.0.1` (Linux).

### 4. Database Management & Initial Data

After applying migrations, you can populate your database using one of the following methods:

#### Option A: Automatic Setup (Fastest)

The easiest way to get a fully working environment with migrations applied and rich test data populated.

- **Docker:** `bash dx run db:setup:dx`
- **Local:** `npm run db:setup`

#### Option B: Reset & Refresh

Wipes the database schema and re-initializes it with fresh seed data. Useful for development resets.

- **Docker:** `bash dx run db:reset:dx`
- **Local:** `npm run db:reset`

#### Option C: Seed Data (Manual)

Best for a fresh install to get basic test accounts and system defaults.

- **Docker:** `bash dx run api:prisma:seed:dx`
- **Local:** `npm run api:prisma:seed`

#### Option D: Database Dump (Team sync)

Best for working with realistic data or sharing progress with the team.

**1. Create a Dump (Export)**
To share your data with a colleague:

- **Docker:** `bash dx run dump:db:dx`
- **Local:** `npm run dump:db`
- _The dump file will be created in the `dumps/db/` directory._

**2. Restore (Append Mode)**
Adds data from a `.sql` file in `dumps/db/` to your existing records without deleting anything.

- **Docker:** `bash dx run restore:db:dx`
- **Local:** `npm run restore:db`

**3. Restore (Wipe & Sync Mode)**
Clears your current schema and restores the dump exactly. Best for a full sync.

- **Docker:** `bash dx run restore:db:reset:dx`
- **Local:** `npm run restore:db:reset`

> **Note:** You can combine them! For example, run **Seed** to get admin users, then **Restore (Append)** a dump with specific transactions. If you use **Wipe & Sync**, it will remove any previously seeded data.

---

## Environment Variables

### `apps/api/.env`

```env
NODE_ENV=development
ENABLE_SWAGGER_IN_PROD=false

HOST=localhost
PORT=8000
SWAGGER_SERVER_URL=http://localhost:8000/api
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

DATABASE_URL=postgresql://user:password@localhost:5432/yourdb?schema=yourschema
DIRECT_URL=postgresql://user:password@localhost:5432/yourdb?schema=yourschema

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

GitHub Actions runs the following checks on every pull request and push to `master`:

1.  **Format & Lint** — `prettier` and `eslint`.
2.  **Type check** — `tsc --noEmit` across the monorepo.
3.  **Migration Drift** — ensures `schema.prisma` is in sync with migrations.
4.  **Security Audit** — `npm audit` and dependency review.
5.  **Integration Tests** — Jest + Supertest tests against a real PostgreSQL container.
6.  **Automated Releases** — builds and pushes images to **GHCR**.
7.  **Security Scanning** — **Trivy** scans every Docker image for vulnerabilities (CRITICAL, HIGH).
8.  **Prisma Auto-Migrate (`master`)** — applies `apps/api` migrations to Supabase after schema/migration changes.

### Auto Migration Secrets (GitHub)

1. Open GitHub repository -> `Settings` -> `Secrets and variables` -> `Actions`.
2. Add secret `SUPABASE_DATABASE_URL` (pooled connection string for app/runtime).
3. Add secret `SUPABASE_DIRECT_URL` (direct connection string for Prisma Migrate).
4. Push migration changes to `master` and verify workflow `Prisma Migrate Deploy (master)` in Actions tab.

### Docker Images (GHCR)

| Component | Image Path                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------- |
| **API**   | [`ghcr.io/bodmat/fintrack-api`](https://github.com/BODMAT/FinTrack/pkgs/container/fintrack-api) |
| **Web**   | [`ghcr.io/bodmat/fintrack-web`](https://github.com/BODMAT/FinTrack/pkgs/container/fintrack-web) |
| **Bot**   | [`ghcr.io/bodmat/fintrack-bot`](https://github.com/BODMAT/FinTrack/pkgs/container/fintrack-bot) |

See [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) for the full configuration.

---

## License

[MIT](./LICENSE) © Makar Dzhehur, Bohdan Matula
