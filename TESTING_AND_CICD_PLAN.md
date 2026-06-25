# Master Plan: Backend Testing & CI/CD Strategy

This document provides the complete, end-to-end plan to set up backend module tests with **Vitest**, run automated checks in **GitHub Actions** with an isolated database, and package the application into a lightweight **Docker Container** on success.

---

## 1. Directory Structure

This architecture divides tests into **Unit Tests** (testing business logic in isolation) and **Integration/E2E Tests** (testing routes, HTTP requests, and the database).

```text
tasheen-monorepo/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # GitHub Actions workflow script
├── apps/
│   └── api/
│       ├── src/
│       │   ├── modules/             # Backend Domain Modules
│       │   │   └── inventory/
│       │   │       ├── application/
│       │   │       │   └── commands/
│       │   │       │       ├── add-stock.ts
│       │   │       │       └── add-stock.spec.ts  # UNIT TEST (No Database)
│       │   │       └── test/
│       │   │           └── stock.e2e.spec.ts      # INTEGRATION TEST (With Database)
│       │   └── index.ts
│       └── Dockerfile               # Production multi-stage docker packaging
├── prisma/
│   └── schema.prisma
├── package.json
├── vitest.config.ts                 # Main Vitest configuration
└── vitest.setup.ts                  # Database connection & cleanup setup
```

---

## 2. Vitest Test Runner Configuration

To make database tests stable, we configure Vitest to run test files **one-by-one** (sequentially) instead of in parallel. This prevents database tables from locking or clashing.

### Root Config: `vitest.config.ts`
Create this file in the root folder of the project:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    // Run test files sequentially to avoid database conflicts
    sequence: {
      concurrent: false,
    },
    // Run database connection/cleanup rules before any test runs
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "apps/**/*.spec.ts", 
      "modules/**/*.spec.ts", 
      "packages/**/*.spec.ts"
    ],
  },
});
```

### Database Cleanups: `vitest.setup.ts`
To keep tests reliable, every test file must run on a clean database. We truncate (clear) all database tables before running each test suite.

Create this file in the root folder of the project:

```ts
import { PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, afterAll } from "vitest";

const prisma = new PrismaClient();

// Clean up all tables in the database
async function cleanDatabase() {
  const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
  `;

  for (const { tablename } of tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
  }
}

beforeAll(async () => {
  // Connect to the test database
  await prisma.$connect();
});

beforeEach(async () => {
  // Empty tables before each test file starts
  await cleanDatabase();
});

afterAll(async () => {
  // Close database connection
  await prisma.$disconnect();
});
```

---

## 3. Writing a Sample API Integration Test

Here is a template for testing your API endpoints in-memory without starting a server on a real port:

```ts
// apps/api/src/modules/inventory/test/stock.e2e.spec.ts
import { createServer } from "../../../server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Inventory API Endpoints", () => {
  let app;

  beforeAll(async () => {
    app = await createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should update stock levels for a product", async () => {
    // 1. Arrange: Insert a dummy product in the database
    const product = await prisma.product.create({
      data: {
        id: "prod-123",
        name: "Running Shoes",
        slug: "running-shoes",
        price: 120,
        description: "Test description",
        gender: "unisex",
        stock: 10,
      },
    });

    // 2. Act: Send an in-memory HTTP POST request to update stock
    const response = await app.inject({
      method: "POST",
      url: `/api/v1/inventory/products/${product.id}/stock`,
      payload: { quantity: 15 },
    });

    // 3. Assert: Check the API status code and database changes
    expect(response.statusCode).toBe(200);
    expect(response.json().success).toBe(true);

    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(updatedProduct?.stock).toBe(25); // 10 initial + 15 added
  });
});
```

---

## 4. Automatic CI/CD Pipeline (GitHub Actions)

This configuration automates everything. Every time you push code to GitHub:
1. It spins up a fresh Postgres database in the cloud.
2. It compiles your TypeScript code to ensure there are no type errors.
3. It pushes database migrations.
4. It runs your Vitest test suites.
5. If everything passes, it compiles a production-ready container and pushes it to your registry.

Create this file at `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate-and-test:
    runs-on: ubuntu-latest

    # Setup a fresh Postgres database for integration tests
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: ecommerce_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9.12.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Linter & Formatter
        run: pnpm run lint

      - name: Type-Check (TypeScript compiler)
        run: pnpm run type-check

      - name: Migrate Database Schema
        run: npx prisma db push
        env:
          DATABASE_URL: "postgresql://postgres:test_password@localhost:5432/ecommerce_test"

      - name: Run Tests (Vitest)
        run: pnpm run test
        env:
          DATABASE_URL: "postgresql://postgres:test_password@localhost:5432/ecommerce_test"
          NODE_ENV: test
          JWT_SECRET: temp-secret-key-for-tests

  build-and-package:
    needs: validate-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry (GHCR)
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/api/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/api:latest
            ghcr.io/${{ github.repository }}/api:${{ github.sha }}
```

---

## 5. Lightweight Production Containerization (Docker)

To deploy the app securely and keep the size small, we use **Docker Multi-Stage Build** to build and prune code.

Create this file at `apps/api/Dockerfile`:

```dockerfile
# --- Stage 1: Base Environment ---
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# --- Stage 2: Builder (Compile & Prune) ---
FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile

# Generate Prisma database client
RUN npx prisma generate

# Compile TypeScript to JavaScript
RUN pnpm run build

# Remove development-only tools to save memory
RUN pnpm prune --prod

# --- Stage 3: Runner (Production execution) ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy ONLY necessary production artifacts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
```
