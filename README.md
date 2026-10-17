# Slipperze: Enterprise-Level E-Commerce Monorepo

Slipperze is a personal e-commerce project built using Clean Architecture and Domain-Driven Design (DDD) patterns. The monorepo contains a storefront, an administration portal, shared packages, and a modular backend server. Backend verification is in progress; production readiness has not been established. See the [backend audit plan](docs/reviews/backend-audit-plan.md) and [current review status](docs/reviews/backend-audit-plan.md#11-current-review-status-and-retained-evidence).

---

## 1. Project Structure

```text
tasheen-monorepo/
├── .github/workflows/
│   └── ci-cd.yml                # CI/CD pipeline on GitHub Actions
├── apps/
│   ├── api/                     # Backend Fastify REST API Server & Dockerfile
│   ├── admin/                   # Administrative Inventory & Operations Dashboard (Next.js)
│   └── web/                     # Public Storefront Web Application (Next.js)
├── modules/                     # Domain-Driven Backend Business Modules
│   ├── cart/                    # Cart Management & Inventory Holds
│   ├── customer-care/           # Support tickets & user assistance
│   ├── engagement/              # Wishlists, reviews, restock alerts, newsletters
│   ├── fulfillment/             # Logistics, packaging & warehouse processing
│   ├── inventory-management/    # Physical stock tracking, POs, and supplier management
│   ├── loyalty/                 # Loyalty accounts, point accruals, tier configurations
│   ├── order-management/        # Standard orders, preorders, backorders, and shipments
│   ├── payment/                 # Stripe payments, gift cards, and promotion codes
│   ├── product-catalog/         # Products, categories, attributes, and search
│   └── user-management/         # Authentication, authorization, 2FA, sessions
├── packages/                    # Shared Workspace Code & Libraries
│   ├── core/                    # Base DDD aggregates, command/query handlers, event buses
│   ├── types/                   # Unified TypeScript type definitions
│   └── validation/              # Shared Zod validation schemas
├── prisma/                      # Database Schema & Migrations (PostgreSQL)
├── docker-compose.yml           # Local multi-container development environment
├── vitest.config.ts             # Global testing configurations
└── vitest.setup.ts              # Global test setup (database connection and cascade truncations)
```

---

## 2. Technology Stack

- **Core Runtime:** Node.js (v20)
- **Monorepo Manager:** `pnpm` workspaces (v9) & Turborepo
- **Database & Persistence:** PostgreSQL, Prisma Client, and schema migrations
- **Backend API:** Fastify, TypeScript, CQRS Command/Query Handlers, and Zod validator schemas
- **Frontend Applications:** Next.js (App Router), React, and TailwindCSS
- **Testing Engine:** Vitest (sequential execution for database stability)
- **Containerization & Deployment:** Multi-stage Dockerfile, Docker Compose, and GitHub Actions CI/CD

---

## 3. Core Modules & Business Domain Rules

- **User Management:** Secure token-based session auth, role-based access control (Admin, Staff, Customer), Google OAuth, and optional Two-Factor Authentication (2FA).
- **Product Catalog:** Category hierarchies, variants, substring-based catalog search, and publication scheduling code.
- **Cart Holds:** Time-limited cart reservations and checkout expiry. Duration, release behavior and concurrent stock allocation remain subject to the cart and inventory reviews.
- **Order Management:** Coordinates orders, pre-order queues (converting to active orders on releases), back-orders, and shipment creation (integrated with shipping carrier adapters like FedEx).
- **Payment & Promotion:** Stripe webhook integrations authorizing and capturing payments, custom gift card balance redemptions, and active promotion code discount bounds.
- **Loyalty Program:** Automatically awards signup bonuses, tracks purchase multipliers based on loyalty tiers (Style Lover, Fashion Fan, Style Insider, VIP Stylist), processes redemptions, and manages admin points adjustments.
- **Engagement telemetry:** User reviews with ratings validation and moderator approvals, restock alerts notifying email/sms channels when product items are replenished, and wishlists.

---

## 4. Getting Started

### Prerequisites
- Node.js (v20 or higher)
- `pnpm` 9.12.0, as pinned by `packageManager` in the root manifest.
- Docker & Docker Compose (optional, for containerized local environments)

### Local Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Tasheen2002/Enterprise-level-E-Commerce-application.git
   cd Enterprise-level-E-Commerce-application
   ```

2. **Configure Environment Variables:**
   Copy the example environment settings to `.env` and `.env.test` at the root and fill in database connections, JWT secrets, and external API tokens:
   - Root: `.env`
   - Test settings: `.env.test`

3. **Install dependencies:**
   ```bash
   pnpm install --frozen-lockfile
   ```

4. **Initialize a disposable local development database:**
   Confirm `DATABASE_URL` points to the intended local development database before synchronizing the schema:
   ```bash
   npx prisma db push
   ```
   This synchronizes the Prisma schema; it does not apply or verify migration history. Migration deployment and replay are separate checks in audit phase P02. Do not use the scripts in `scratch/` as installation or test setup; several contain hardcoded database destinations and destructive operations.

5. **Start Local Development Servers:**
   Start the storefront and admin portal through workspace development tasks:
   ```bash
   pnpm run dev
   ```
   Start the API separately in another terminal (`apps/api` has no workspace package manifest, so Turbo does not start it):
   ```bash
   pnpm run dev:api
   ```

---

## 5. Running Tests

The test suites are divided into Unit, Database Integration, and Fastify HTTP E2E tests.

### Running unit tests
The default command excludes the integration and E2E test directories:
```bash
pnpm run test
```

### Running a specific module's tests
For isolated unit feedback, target a module's unit directory:
```bash
npx vitest run modules/loyalty/test/unit/
```

### Testing Constraints & Isolation
- Database integration and E2E tests require `TEST_DATABASE_URL`, `ALLOW_DATABASE_TEST_CLEANUP=1`, and an allowed test database name and host. The global [vitest.setup.ts](vitest.setup.ts) hook truncates tables in its allowlisted application schemas before each database test. Cleanup is destructive; use a dedicated disposable database. See [test environment evidence](docs/reviews/backend-audit-plan.md#11-current-review-status-and-retained-evidence) before running `pnpm run test:vitest` (the full suite).
- Ensure that integration tests seed any parent model dependencies (e.g., creating a `User` record) inside local `beforeEach` blocks before saving child aggregates.

### Dependency and verification policy

Use pnpm and `pnpm-lock.yaml` for installs and dependency changes. The stale `package-lock.json` has been removed. Do not create another lockfile with npm; use pnpm for dependency changes.

`pnpm run type-check` runs backend, tooling/test-infrastructure and workspace compiler tasks. `pnpm run lint` runs backend, tooling/utility and available workspace lint tasks. `pnpm run format:check` checks selected shared foundation directories plus reviewed tooling, test infrastructure and updated utilities; it is not repository-wide. A passing command does not establish complete backend verification; see [file-level check scope](docs/reviews/p00-check-scope.json).

The reviewed clear/create/drop/admin/catalog seed utilities in `scratch/` now operate only on an explicitly selected disposable test database. They require `NODE_ENV=test`, `TEST_DATABASE_URL`, `ALLOW_DATABASE_TEST_CLEANUP=1` and `ALLOW_OPERATIONAL_DATABASE_WRITES=1`; create/drop additionally require `TEST_DATABASE_ADMIN_URL` for the same server's `postgres` maintenance database. The admin seed requires `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD` (at least 12 characters) and refuses an existing email. These variables must be set explicitly; the utilities do not automatically load the ignored audit environment. The two restock probes create isolated fixtures and roll them back or remove them; dispatcher verification blocks email and checks simulated state only. Other scratch utilities remain under review. See [operational verification and limitations](docs/reviews/backend-audit-plan.md#11-current-review-status-and-retained-evidence).

---

## 6. Docker & CI/CD Pipeline

- **API Docker container:** The multi-stage image currently copies dependencies and TypeScript sources and runs the API with `tsx`; a compiled, pruned runtime and production container behavior have not been verified. Build locally with:
  ```bash
  docker build -f apps/api/Dockerfile -t slipperze-api:latest .
  ```
- **Local Composition:** Bring up PostgreSQL and the API server together in a unified network:
  ```bash
  docker compose up --build
  ```
- **CI/CD Pipeline:** The [workflow](.github/workflows/ci-cd.yml) is configured for all branch pushes and pull requests targeting `main` or `develop`. It runs lint, selected formatting, type checks, schema synchronization with `db push`, tests and unit coverage. The image publish job is limited to pushes to `main` after the validation job succeeds. This describes configuration; a successful hosted run, migration replay and deployed behavior remain unverified in the current audit.
