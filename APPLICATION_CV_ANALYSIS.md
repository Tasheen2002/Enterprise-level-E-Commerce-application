# Slipperze: Application Analysis and CV Material

Reviewed on 8 October 2026 against the current working tree, including uncommitted changes.

## Overall assessment

Slipperze is an enterprise-style e-commerce application for premium footwear and related fashion products. It combines a customer storefront, a separate staff administration portal, and a TypeScript backend with substantial commerce and operations logic.

The strongest positioning for a Software Engineering CV is **a full-stack e-commerce project with a modular backend, secure account management, inventory workflows, and payment integration**. Its architecture and business rules are stronger evidence of engineering ability than the generic phrase “online shopping website.”

The backend is substantially implemented, but the entire application is not demonstrably finished or production-ready. Eight business modules are wired into the API; three additional business modules contain implementation code but are not registered. Both frontend applications already contain considerable implementation and API integration, so “frontend development and integration in progress” is more accurate than “frontend not started.”

This review inspected the application structure, schema, domain and application layers, API composition, representative repositories and workflows, frontend routes and integrations, testing setup, and delivery configuration. It is a repository-based assessment, not an exhaustive line-by-line security audit or a live purchase/deployment certification.

## Application structure and technology

| Area | Implementation |
| --- | --- |
| Backend | Node.js, TypeScript, Fastify 5; REST endpoints under `/api/v1`; Swagger/OpenAPI documentation |
| Customer storefront | Next.js 15 App Router, React 18, TypeScript, Tailwind CSS |
| Administration portal | Separate Next.js application for staff and operations |
| Database | PostgreSQL, Prisma 6, migrations, relational constraints, compound indexes; 72 Prisma models |
| Frontend data and forms | TanStack Query, React Context, React Hook Form, Zod |
| Authentication | JWT access/refresh tokens, bcrypt, Firebase-backed Google sign-in, TOTP 2FA |
| Payments and delivery | Stripe SDK/Elements/SetupIntents/Tax integration code; FedEx shipment/tracking adapter |
| Media and UI | ImageKit URL helpers, shared UI primitives, Lucide, Framer Motion, Recharts in admin |
| Workspace and delivery | pnpm workspaces, Turborepo, Docker Compose, API Dockerfile, GitHub Actions |
| Testing | Vitest domain/handler unit tests, repository integration tests, Fastify HTTP tests |

The monorepo contains `apps/api`, `apps/web`, `apps/admin`, eleven business modules, a shared module area, and packages for core abstractions, types, validation, API clients, UI, and configuration. Business modules are imported by the root API rather than deployed as separate services.

## Architecture and engineering significance

The backend is a **modular monolith** using Clean Architecture, Domain-Driven Design, and ports/adapters patterns. Each business module generally separates domain entities/value objects/repository interfaces, application services and command/query handlers, and infrastructure such as HTTP controllers and Prisma repositories.

Domain entities implement business invariants and state changes. Shared aggregate roots collect domain events. Repository interfaces allow application logic to work independently of Prisma implementations. The API composition root manually constructs repositories, services, handlers, and controllers.

CQRS is implemented as separate command and query handlers within the same application and database. It does not imply separate read/write databases, event sourcing, or a distributed CQRS system. The event bus is an in-memory implementation that awaits subscribed handlers; it is not Kafka, RabbitMQ, or a durable job queue.

These choices provide useful interview examples of separation of concerns, dependency inversion, testability, and modelling business rules. They should be explained in terms of the concrete responsibilities they separate rather than presented as architecture buzzwords alone.

## Backend capability map

“Registered” below means wired into the API server. It does not certify every route or external integration as working in a production environment.

| Module | Implemented responsibilities | Current integration status |
| --- | --- | --- |
| User management | Registration/login, verification/reset flows, Google identity verification, guest identity, JWT refresh, database-backed sessions/revocation, profile/address/payment-method management, TOTP and backup codes, staff invitations and roles | Registered |
| Product catalog | Products, variants/SKUs, categories, media, tags, size guides, editorial looks, publication fields, search and enriched product responses | Registered |
| Inventory management | Stock by variant/location, stock adjustments/transfers, movement ledger, suppliers, purchase orders and receiving, stock alerts, pickup reservations | Registered |
| Cart | Guest/customer carts, cart transfer, quantity/gift fields, inventory availability and timed reservations, checkout sessions and order completion | Registered |
| Order management | Order items and product snapshots, status/history/events, address snapshots, preorders/backorders, shipments/tracking, admin notifications and dashboard metrics | Registered |
| Payment | Intent/transaction state management, Stripe intent and webhook endpoints, saved-card setup, gift cards, promotion rules/usage, BNPL transaction modelling | Registered; external behavior needs live validation |
| Loyalty | Accounts, tier progression/multipliers, purchase points, redemption, adjustments, point expiry methods and transaction history | Registered |
| Engagement | Guest/customer and public/shared wishlists, reviews/moderation, restock subscriptions, notification records, appointments, newsletter subscriptions | Registered; some delivery is simulated |
| Fulfillment | Shipment and shipment-item business logic and persistence | Separate module not registered; order-management shipment functionality exists independently |
| Customer care | Support tickets/messages, agents, chat sessions/messages, returns/items, repairs, goodwill and feedback | Not registered |
| Analytics | Commerce funnel event models and tracking handlers/services | Not registered as a module; checkout directly records purchase analytics |

Primary evidence: `apps/api/src/modules.ts`, `apps/api/src/container.ts`, module directories, and `prisma/schema.prisma`.

## Frontend implementation

The customer storefront includes home/marketing pages, category and product routes, catalog search, product galleries and variants, cart, checkout/confirmation, order tracking, authentication pages, shared wishlists, and an account area.

Account implementation includes order history, addresses, payment methods, wishlists, loyalty, settings, security and account deletion. Providers manage authentication, cart and wishlist state. The request wrapper forwards authentication, unwraps the backend response format, and retries once after refreshing an expired access token. Account middleware redirects visitors without a token cookie; backend requests perform actual authorization.

Checkout uses Stripe Elements/CardElement, initializes backend checkout/payment sessions, confirms a card payment, and requests server-side order creation. Promotions, tax calculation and loyalty redemption have integration code. These are meaningful implemented workflows, but a source-level flow is not proof that a live checkout succeeds across all failure cases.

The admin application includes dashboard metrics/charts, products and variants, categories, review moderation, customers, orders/details, inventory/purchase orders, preorder/backorder management, profile and staff invitations. It uses API clients and TanStack Query hooks, plus shared components and forms. Some dashboard widgets substitute example values when real data is absent.

No dedicated frontend automated test suites were found in the inspected frontend feature directories. Responsive classes, loading/error states and reusable UI are present; verified WCAG compliance, performance improvements and conversion gains cannot be inferred from those alone.

## Representative commerce workflow

1. A customer discovers a product and chooses its variant.
2. A guest or authenticated cart stores quantities, prices and optional gift information; reservation logic checks availability and creates timed holds.
3. Checkout establishes an expiring session and collects addresses. The storefront requests promotion and tax calculations.
4. The backend creates a local payment-intent record and a Stripe intent; Stripe Elements confirms the card payment.
5. Checkout completion validates local state and persists the order, item/address snapshots, payment linkage, checkout completion, history/events and cart cleanup in a Prisma transaction.
6. Inventory deduction, reservation cleanup and purchase loyalty awards occur afterward.
7. Staff can inspect/manage the order and shipment information; customers can view orders and tracking.

This is a useful interview narrative because it connects domain modelling, HTTP integration, persistence and UI. The transaction covers core order records, but later inventory and loyalty effects are not all part of that transaction.

## Verified checks

| Check | Result |
| --- | --- |
| Backend/root TypeScript check | Passed |
| Storefront TypeScript check | Passed |
| Admin TypeScript check | Passed |
| Unit tests in the eight registered modules | 56 test files passed; 296 tests passed |
| Database integration and API HTTP tests | Present, not executed during this analysis |
| Production builds, lint, container build, deployed CI and live integrations | Not verified during this analysis |

The repository contains 90 backend test files: 56 under unit directories, 18 under integration directories, 13 under E2E directories, and three other handler test files. The 296 passing tests are the explicitly executed unit subset, not the entire test suite or a coverage percentage.

Database tests use cleanup hooks that truncate tables. They were not run against the user's configured databases during this review. Tests have different depths: some exercise real domain behavior, while some application-handler tests mainly verify calls to mocked services.

## Remaining gaps and claim boundaries

1. **API integration:** Register and compose fulfillment, customer care and analytics before describing every backend module as finished.
2. **Simulated functionality:** The contact form waits and shows a success toast without sending an inquiry. Restock dispatch contains simulated email/SMS/WhatsApp logging, although an SMTP email path also exists. Dashboard fallback numbers are demo content, not measured business results.
3. **Payment consistency:** The intent endpoint accepts an amount supplied by the caller. Checkout completion accepts local `requires_action` alongside authorized/captured statuses and persists a paid order. Server-derived totals, payment verification and checkout ownership should be reviewed together before production use.
4. **Post-payment recovery:** Stock changes run after core order persistence. Loyalty redemption is requested from the browser after order creation, and failures are logged. These paths need reconciliation and retry behavior to prevent a successful payment/order from leaving inconsistent stock or loyalty balances.
5. **Reservations and concurrency:** Availability checking and reservation saving are separate operations in the inspected orchestrator. Do not claim proven prevention of overselling under concurrent requests without transaction/locking verification and meaningful concurrency tests.
6. **Reservation duration:** README describes a 15-minute cart hold, but the current reservation default constant is one minute; checkout defaults to 15 minutes. Use “time-limited inventory reservations” on the CV until the intended durations are reconciled.
7. **Tax behavior:** Checkout uses an 8% simulated fallback, including when Stripe returns zero tax. This should be corrected before claiming production tax accuracy.
8. **Webhook behavior:** Stripe signature validation can be skipped when the webhook secret is absent. Provider/configuration validation and repeated-event behavior need stronger verification before claiming production payment resilience.
9. **Feature scope:** Catalog search uses case-insensitive substring matching; “full-text search engine” would overstate the inspected implementation. BNPL records/state methods do not demonstrate a complete live lending-provider integration. Refund adapter code does not alone prove a completed end-to-end refund workflow.
10. **Delivery evidence:** GitHub Actions defines lint/type checks, database setup, Vitest and an API container publish job. This is configuration evidence, not proof of a successful deployment. The Docker runner executes TypeScript via `tsx` and copies dependencies; README claims of a compiled/pruned lightweight runtime overstate the current Dockerfile.

The existing audit documents contain scores, production-ready labels, ranking claims and UX gains that are not supported by measurements shown in the repository. They should not be used as CV evidence.

## Recommended CV entry

**Slipperze — Full-Stack E-Commerce Platform**  
**Personal Project | Backend implemented; frontend and integration in progress**  
**Technologies:** TypeScript, Node.js, Fastify, Next.js, React, PostgreSQL, Prisma, Tailwind CSS, Stripe, Vitest, Docker, GitHub Actions.

- Developed a modular TypeScript backend with eight integrated business modules covering authentication, catalog, inventory, cart, orders, payments, loyalty and customer engagement using Clean Architecture, DDD and CQRS patterns.
- Implemented JWT authentication, role-based authorization, Google sign-in, TOTP two-factor authentication and database-backed session management.
- Built inventory reservation and purchase-order workflows, transactional order persistence, and Stripe payment integration with promotions and loyalty features.
- Developed Next.js storefront and admin interfaces with shared UI components and API integration; added backend unit, integration and HTTP tests, with 296 unit tests passing in the reviewed version.

If space is limited, replace the four bullets with:

> Developed an enterprise-style e-commerce platform using TypeScript, Fastify, Next.js and PostgreSQL, featuring eight integrated backend modules, JWT/2FA authentication, inventory reservations, transactional order creation and Stripe payments. Implemented storefront and admin interfaces and automated backend tests; frontend integration remains in progress.

Use these as statements of your contribution only where you personally implemented the work. Add actual project dates and the repository link. Avoid invented traffic, performance, coverage or revenue metrics. For a backend-focused role, prioritize architecture, security, persistence and tests; for a full-stack role, retain both customer and admin UI work.

## Interview preparation

Be ready to explain these with a concrete example from the code:

- Why a modular monolith fits this project and what would change if a module became a separate service.
- How entities/value objects enforce rules and repositories separate domain logic from Prisma.
- How command and query handlers are organized without claiming separate databases.
- How access/refresh tokens, session revocation, TOTP and backup codes work together.
- How guest carts become customer carts and how reservation expiry affects availability.
- Which order records are committed together and which side effects can fail later.
- How Stripe frontend confirmation, webhooks and server-side reconciliation should interact.
- What unit, repository and HTTP tests verify and what still needs end-to-end validation.

A concise spoken description:

> Slipperze is a full-stack commerce project with a customer storefront and staff admin portal. I built a modular TypeScript backend with domain-driven modules for accounts, products, inventory, carts, orders, payments, loyalty and engagement. It uses Fastify, PostgreSQL and Prisma, with JWT and two-factor authentication and Stripe payment integration. I have also implemented substantial Next.js frontend screens and API connections. My current focus is completing integration and hardening checkout consistency and the remaining operational modules.
