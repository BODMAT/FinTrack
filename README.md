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
- [Getting Started](#getting-started)
- [Backend](#backend)
  - [Architecture](#backend-architecture)
  - [Database Schema](#database-schema)
  - [API Modules](#api-modules)
  - [Security](#security)
- [Frontend](#frontend)
  - [Architecture](#frontend-architecture)
  - [Pages & Features](#pages--features)
  - [State Management](#state-management)
- [Deployment Topology](#deployment-topology)
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

## Getting Started

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full setup guide, environment variables, and development workflow.

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

---

## Deployment Topology

Production deployment flow:

- **Vercel** -> `apps/web` (Next.js)
- **Render** -> `apps/api` (Express + Prisma)
- **Supabase** -> PostgreSQL

Database migrations are applied automatically from GitHub Actions on pushes to `master` when Prisma schema or migrations change.

---

## CI/CD

GitHub Actions runs the following checks on every pull request and push to `master`:

1.  **Format & Lint** — `prettier` and `eslint`.
2.  **Type check** — `tsc --noEmit` across the monorepo.
3.  **Migration Drift** — ensures `schema.prisma` is in sync with migrations.
4.  **Security Audit** — `pnpm audit` and dependency review.
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
