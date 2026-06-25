# Slipperze: Enterprise-Level E-Commerce Monorepo

Slipperze is a production-grade, enterprise-scale e-commerce platform built using Clean Architecture and Domain-Driven Design (DDD) principles. The codebase is organized as a monorepo containing frontend applications, administrative dashboards, shared core packages, and a modular backend server.

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
- **Product Catalog:** Advanced categorization tree, attribute variations, full-text catalog search, and scheduled future publications.
- **Cart Holds:** Elegant shopping cart reservation system enforcing a 15-minute hold timer. Holds block other customers from reserving the same stock, releasing inventory automatically if reservations expire without checkout.
- **Order Management:** Coordinates orders, pre-order queues (converting to active orders on releases), back-orders, and shipment creation (integrated with shipping carrier adapters like FedEx).
- **Payment & Promotion:** Stripe webhook integrations authorizing and capturing payments, custom gift card balance redemptions, and active promotion code discount bounds.
- **Loyalty Program:** Automatically awards signup bonuses, tracks purchase multipliers based on loyalty tiers (Style Lover, Fashion Fan, Style Insider, VIP Stylist), processes redemptions, and manages admin points adjustments.
- **Engagement telemetry:** User reviews with ratings validation and moderator approvals, restock alerts notifying email/sms channels when product items are replenished, and wishlists.

---

## 4. Getting Started

### Prerequisites
- Node.js (v20 or higher)
- `pnpm` installed globally: `npm install -g pnpm`
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

4. **Initialize the Database:**
   Deploy the schemas and push migrations to your local PostgreSQL instance:
   ```bash
   npx prisma db push
   ```

5. **Start Local Development Servers:**
   To run the API, storefront, and admin portal concurrently in development watch modes:
   ```bash
   pnpm run dev
   ```
   Or start the API server individually:
   ```bash
   pnpm run dev:api
   ```

---

## 5. Running Tests

The test suites are divided into Unit, Database Integration, and Fastify HTTP E2E tests.

### Running all tests
Execute Vitest globally across all backend modules:
```bash
pnpm run test
```

### Running a specific module's tests
For isolated development feedback, target a specific module's test directory:
```bash
npx vitest run modules/loyalty/test/
```

### Testing Constraints & Isolation
- Database integration and E2E tests run on a clean database. The global [vitest.setup.ts](file:///C:/Users/TASHEEN/Desktop/Projects/Enterprise-level-E-Commerce-application/vitest.setup.ts) hook truncates all schema tables before each test suite executes.
- Ensure that integration tests seed any parent model dependencies (e.g., creating a `User` record) inside local `beforeEach` blocks before saving child aggregates.

---

## 6. Docker & CI/CD Pipeline

- **Production Docker container:** Build the lightweight, multi-stage Docker image locally:
  ```bash
  docker build -f apps/api/Dockerfile -t slipperze-api:latest .
  ```
- **Local Composition:** Bring up PostgreSQL and the API server together in a unified network:
  ```bash
  docker compose up --build
  ```
- **CI/CD Pipeline:** The automated GitHub Actions workflow [.github/workflows/ci-cd.yml](file:///C:/Users/TASHEEN/Desktop/Projects/Enterprise-level-E-Commerce-application/.github/workflows/ci-cd.yml) runs on every push and pull request to `main` and `develop` branches. It validates the code via ESLint, runs compile-time TypeScript checks across all workspace projects, applies migrations, executes Vitest test runs against a PostgreSQL service container, and packages and pushes verified images to the GitHub Container Registry on success.
