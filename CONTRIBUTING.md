# Contributing to FinTrack

First off, thank you for considering contributing to FinTrack! This guide covers everything you need to get the project running from scratch and understand the development workflow.

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing. To report a security vulnerability, see [SECURITY.md](./SECURITY.md) instead of opening a public issue.

## Project Overview

FinTrack is a monorepo managed by [Turborepo](https://turbo.build/).

- `apps/api`: Node.js/Express backend with Prisma.
- `apps/web`: Next.js/React frontend with Tailwind CSS.
- `apps/bot`: Telegram bot for quick transaction entry.
- `packages/types`: Shared TypeScript definitions and Zod schemas.

---

## Getting Started

**Prerequisites:** Node.js 20+, PostgreSQL 15, npm 10+, Docker & Docker Compose.

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

---

## Database Management

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

## Running Individual Apps

### API

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

### Web App

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

### Shared Types Package

```bash
# build before running any app
npm run build -w @fintrack/types
```

---

## Extending the Project

### Adding an API Module (`apps/api`)

Each feature domain lives under `apps/api/src/modules/<name>/` and consists of three files:

```
apps/api/src/modules/<name>/
  service.ts     ← Prisma queries and business logic
  controller.ts  ← HTTP handlers: parse request, validate with Zod, call service, send response
  route.ts       ← Express Router: wire middleware (auth, rate-limit) + controllers
```

After creating the three files, register the router in `apps/api/src/routes/apiRoutes.ts`:

```ts
import { myRouter } from "../modules/<name>/route.js";
apiRouter.use("/<name>", myRouter);
```

If the module introduces new request/response shapes, add Zod schemas to `packages/types` first — both the API and the web app import from there.

If it requires a new database model, add it to `apps/api/prisma/schema.prisma` and run:

```bash
npx prisma migrate dev --name <name> # inside apps/api
```

---

### Adding a Web Page / Feature (`apps/web`)

Each protected page follows this structure:

```
apps/web/src/
  api/<name>.ts                               ← typed API functions (Axios + Zod via handleRequest)
  app/(protected)/<name>/
    page.tsx                                  ← async Server Component: prefetch + Suspense wrapper
    <Name>Client.tsx                          ← "use client": TanStack Query hooks + UI
    _components/                              ← page-scoped sub-components
  store/<name>.ts                             ← Zustand store (only if state is truly global)
```

**`src/api/<name>.ts`** — call `handleRequest(api.get/post/..., zodSchema)` for automatic validation:

```ts
import { handleRequest } from "@/utils/api";
import api from "./api";
import { myResponseSchema, type MyResponse } from "@fintrack/types";

export const getMyData = async (): Promise<MyResponse> =>
  handleRequest(api.get("/my-endpoint"), myResponseSchema);
```

**`page.tsx`** — async server component, wraps client in `<Suspense>`:

```tsx
import { Suspense } from "react";
import { MyClient } from "./MyClient";
import { prefetchProtected } from "@/lib/server/prefetchProtected";

export default async function MyPage() {
  const initialData = await prefetchProtected();
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <MyClient initialData={initialData} />
    </Suspense>
  );
}
```

**`MyClient.tsx`** — client component with TanStack Query:

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { getMyData } from "@/api/<name>";

export function MyClient({ initialData }: { initialData: … }) {
  const { data } = useQuery({ queryKey: ["my-data"], queryFn: getMyData });
  // render UI
}
```

---

### Adding a Bot Command (`apps/bot`)

The bot currently lives in a single file `apps/bot/src/bot.ts`. Add new commands directly there:

```ts
bot.command("mycommand", async (ctx) => {
  await ctx.reply("Hello from mycommand");
});
```

When the number of commands grows, extract handlers into separate files and import them into `bot.ts`.

---

## Development Workflow

### Branch Naming

Use the same type prefix as commits, followed by a short kebab-case description:

```
<type>/<short-description>
```

Examples:

- `feat/monobank-import`
- `fix/refresh-token-expiry`
- `chore/update-deps`

### Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.  
Common scopes: `api`, `web`, `bot`, `types`, `ci`, `docker`.

Examples:

- `feat(web): add dark mode toggle`
- `fix(api): handle expired refresh token`
- `chore(ci): update trivy scan action`

For simple changes the subject line alone is enough. Add a body when the **why** is non-obvious, the change is large, or there is a breaking change:

```
fix(api): revoke all sessions on password change

Previously only the current session was invalidated, leaving other
active sessions valid after a password reset — a security gap.
Closes #38
```

Body rules:

- Separate from subject with a blank line
- Explain **why**, not what (the diff already shows what)
- Wrap lines at ~72 characters
- Reference issues with `Fixes #N` or `Closes #N` (auto-closes on merge)

### Quality Gates

| Gate           | Trigger               | What runs                                            |
| -------------- | --------------------- | ---------------------------------------------------- |
| **pre-commit** | `git commit`          | ESLint + Prettier on staged files only (lint-staged) |
| **pre-push**   | `git push`            | TypeScript type-check across the full monorepo       |
| **CI**         | PR / push to `master` | Full integration tests, security audit, Docker build |

> Integration tests (`npm run test`) require a live PostgreSQL instance — run them manually via `npm run test:api` when working on API changes, or let CI handle them.

### Useful Commands

- `npm run test`: Run tests across the monorepo.
- `npm run tidy`: Run ESLint and Prettier fixers.
- `npm run build`: Build all packages and apps.

### Database Changes

1. Modify `apps/api/prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name your_change` in `apps/api`.
3. Update `packages/types` if data structures changed.

## Pull Request Process

### Contribution Flow

The standard cycle for any change — bug fix, feature, or chore:

1. **Open an issue** using the appropriate template (bug / feature / chore). Describe the problem or goal clearly before writing any code.
2. **Create a branch** from `master` following the [Branch Naming](#branch-naming) convention. Optionally prefix with the issue number for traceability: `feat/42-csv-export`, `fix/17-refresh-token`.
3. **Make your changes** — commit incrementally following [Commit Conventions](#commit-conventions).
4. Quality checks run automatically — lint + format on `git commit`, type-check on `git push`. See [Quality Gates](#quality-gates) for the full breakdown.
5. **Open a PR** targeting `master`. Reference the issue in the description with `Closes #N` (GitHub will auto-close the issue on merge). Fill in the PR template fully.
6. **After merge** — delete the branch.

### Merge Strategy

**PRs into `master`** are merged via **squash commit** — all branch commits collapse into one, keeping the main history clean and linear.

**Stacked branches** (a branch based off another feature branch, not `master`) are merged into their parent via a regular **merge commit** to preserve the intermediate history:

```
master
  └── feat/payment-system        ← squash-merged into master when ready
        └── feat/payment-webhook ← regular-merged into feat/payment-system
```

Once the parent branch is squash-merged into `master`, rebase any surviving child branches onto `master` before continuing.

**Delete branches after merging** — once a branch is merged into `master`, delete it to keep the repository clean. GitHub preserves all deleted branches and their commits, so they can be restored at any time if needed.

## Questions?

Reach out via [fintrack.community@gmail.com](mailto:fintrack.community@gmail.com).
