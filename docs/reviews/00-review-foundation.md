# Backend review foundation

This document records the initial preparation snapshot. Later source changes and verification are recorded in [the shared-foundation remediation record](01-shared-foundation-remediation.md).

Prepared: 17 October 2026. Baseline commit: `c8de2c22931d20418d35809f0b7060d99c936815` (`feature/wishlist`).

## Scope and completion of this phase

This phase completes the requested preparation: reading the university guideline page by page, understanding its assessment criteria and examples, mapping the current repository, and defining an auditable review procedure. It does **not** claim that every implementation file has already been manually reviewed or that the backend is defect-free.

The university PDF has 58 physical pages. All text and rendered pages, including figures, tables and the peer-evaluation appendix, were inspected. See [the 58-page reading ledger](university-guidelines-page-notes.md). Requirements and their applicability are tracked in [the review criteria](university-requirements-matrix.md).

The backend review baseline contains **1,353 tracked files**, including backend modules, API host, backend/shared packages, generated API contract, Prisma files and selected build/CI configuration. The [file register](backend-file-register.csv) records path, area/layer, line count, byte count, SHA-256 and review status. All detailed file reviews were pending when this foundation was created. The register now tracks progress; see [review 01](01-shared-foundation-review.md) for the completed shared-foundation pass. Reading bytes for an inventory or import scan is not a semantic file review.

The register excludes frontend implementations, scratch utilities, lockfile contents, secret environment contents and installed/generated runtime dependencies. Frontend boundary behavior, scratch utilities and dependency/lockfile consistency must be inspected as supporting evidence when relevant to a module; exclusion from the backend register does not exempt them from those later checks. The generated OpenAPI TypeScript file is included and explicitly identified as generated: verify its generation and contract, rather than manually editing thousands of generated lines.

Application source files were not modified. No migrations, database cleanup, deployment, GitHub changes or dependency updates were performed. The earlier CV review's test results belong to that earlier run; they are not new verification of this snapshot.

## Current architecture

The application is a TypeScript monorepo managed with pnpm and Turborepo:

```text
apps/
  api/                       Fastify API host and composition root
  web/                       Next.js customer storefront
  admin/                     Next.js staff portal
modules/
  <business-module>/
    domain/                  Entities, value objects, errors, contracts, policies
    application/             Services, commands and queries
    infra/                   HTTP, persistence and external adapters
    test/                    Unit, repository and HTTP test suites
  shared/                    Cross-module email port and adapter
packages/
  core/                      Aggregate/events, IDs/currency, CQRS and result types
  types/                     Shared transport types
  validation/                Shared Zod schemas
  api-client/                OpenAPI client and generated contract
  config/                    TypeScript, lint, formatting and frontend presets
  ui/                        Shared frontend components
prisma/                      PostgreSQL schema, migrations and index SQL
.github/workflows/           Delivery pipeline definition
```

This is a **modular monolith**, not a set of independently deployed microservices. The domain/application/infrastructure directories reflect Clean Architecture, DDD and ports/adapters intentions. Actual dependency direction, domain invariants and enforcement remain subjects for file-level evaluation.

The current Prisma schema declares PostgreSQL with eleven database schemas, 72 models and 31 enums. Ten `migration.sql` files plus a migration lock file are tracked. Database schema separation does not make the modules operationally independent.

The storefront has 32 `page.tsx` files; admin has 16. These are route-file counts, not counts of verified features or successful user journeys. The frontends use Next.js/React, Tailwind CSS, shared components, API clients, React Query and form validation. Their contracts must be considered when evaluating backend changes.

## Runtime composition

The API execution path is:

`index.ts -> createServer() -> config/security/database/auth/error/Swagger plugins -> container.register() -> module loader -> routes -> controllers -> command/query handlers -> application services -> domain/repository ports -> infrastructure adapters`.

The composition root is `apps/api/src/container.ts`. It manually constructs objects and exposes service/controller groups. `apps/api/src/modules.ts` registers eight business modules. The shared core event bus is in memory and awaits handlers; durable delivery, queue retries and event replay are not provided by that abstraction.

The local CQRS abstraction separates command and query handlers. It does not imply separate read/write databases or event sourcing. Repository interfaces describe domain persistence contracts, with Prisma implementations in infrastructure. Shared HTTP validation and response helpers live under the API host, while modules re-export the validators.

Those validator re-exports are an important example of **intentional indirection, not duplicated business logic**. A future duplication review must compare behavior and call sites before recommending removal.

## Module inventory and runtime status

Counts are tracked files, including tests and barrel files. `Entry` is a module-level file outside the four layer directories. Counts do not indicate quality or completeness.

| Module | Domain | Application | Infrastructure | Tests | Entry | Total | API registration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| user-management | 41 | 59 | 38 | 16 | 1 | 155 | Registered |
| product-catalog | 40 | 134 | 46 | 5 | 1 | 226 | Registered |
| inventory-management | 41 | 61 | 36 | 5 | 1 | 144 | Registered |
| cart | 25 | 49 | 20 | 15 | 0 | 109 | Registered |
| order-management | 34 | 54 | 42 | 12 | 1 | 143 | Registered |
| payment | 45 | 30 | 35 | 11 | 1 | 122 | Registered |
| loyalty | 20 | 13 | 10 | 9 | 1 | 53 | Registered |
| engagement | 39 | 47 | 29 | 14 | 1 | 130 | Registered |
| fulfillment | 7 | 10 | 7 | 1 | 0 | 25 | Not registered separately |
| customer-care | 46 | 59 | 25 | 1 | 1 | 132 | Not registered |
| analytics | 10 | 9 | 3 | 1 | 0 | 23 | Not registered separately |
| shared | 1 | 0 | 1 | 0 | 0 | 2 | Supporting code |

Order management has its own shipment/tracking concepts, so the separate fulfillment registration gap does not imply no shipping functionality. Checkout also directly writes purchase analytics; the analytics module registration gap does not imply no analytics records. These overlapping responsibilities need an explicit ownership review.

Supporting tracked areas include 25 API files, 19 core-package files, six validation-package files, three shared-type files, four API-client files including its generated schema, and seven shared configuration files.

## Cross-module connections to trace

An initial import-text scan found seven cross-module pairs, recorded in [module-import-candidates.csv](module-import-candidates.csv):

- Cart imports catalog domain types and a loyalty application service.
- Inventory imports catalog and order domain identifiers.
- Orders import a loyalty application service.
- Payment imports user-management application services.
- Engagement imports a user-management email interface.

This is discovery evidence, not a complete TypeScript dependency graph. It excludes tests and does not prove which imports execute at runtime. The composition root also connects modules through adapters that are not captured by this pair list. Cross-module imports are not automatically defects; inspect whether they expose internal implementation, share a legitimate contract, introduce cycles, or permit inconsistent business rules.

Trace these workflows across all participants:

1. Registration/verification/login/refresh/2FA/session revocation and staff invitations.
2. Product/variant publication, media, catalog reads and frontend filtering.
3. Guest cart, reservation expiry/renewal, login transfer and concurrent purchases.
4. Checkout totals, promotions, payment intent, card confirmation/webhook, order persistence, stock deduction and loyalty.
5. Procurement/receiving, stock alerts and customer restock notifications.
6. Order cancellation/refund, shipment state, preorders/backorders and returns.

## University criteria versus project conventions

The PDF is a course development guideline, not the application's approved SRS/SDS. Its general engineering and evidence requirements can guide this review. No project SRS, SDS, approved ADR set, acceptance-criteria register or threat model was found in the tracked file inventory. They may exist in a separate university documents repository. Project-specific functional conformance therefore remains unverified; requirement numbers and acceptance criteria will not be invented.

`project_domain_patterns.md` is the repository's stated local architecture convention. It covers IDs/value objects, entities, repository interfaces, services, command/query handlers, controllers and routes. The review will check conformance, but distinguish local preferences (method ordering, naming, constructor layout) from correctness, security or maintainability problems.

Some conventions themselves need evaluation: for example, validation/authorization hook ordering should be examined against actual Fastify behavior and threat boundaries, not copied blindly. A guide's instruction to use a factory or emit an event does not establish that every entity must be an aggregate or every mutation needs the same event behavior.

The earlier architecture/UI audit scores and “production ready” labels are historical opinions, not evidence of correctness. The review will produce reproducible findings rather than another unexplained percentage score.

## Initial structural observations

These are preparation findings, not the completed module audit:

| Observation | Evidence | Interpretation / next verification |
| --- | --- | --- |
| Eight modules registered, three additional business modules not registered | `apps/api/src/modules.ts`; container service groups | Verify intended scope and distinguish incomplete integration from deliberately unused modules. |
| API host lacks its own tracked package manifest | Inventory and root workspace/scripts | Root direct API commands work independently of Turbo. Trace whether workspace lint/build/type-check/test tasks actually include API and modules; a task name alone is insufficient. |
| CI trigger coverage narrower than course requirement | `.github/workflows/ci-cd.yml` | Current push filters main/develop and PR filter main; course requires checks on all branch pushes and integration PRs to develop. |
| Formatter, coverage enforcement/artifact, dependency scan and staging/approved production deployment not defined in inspected workflow | Workflow, root scripts, Vitest config | Container publication is not deployment. Package build prerequisites may execute some builds; verify actual task graph before asserting none run. |
| Tests exist at several levels | 90 tracked test files | 56 unit-directory, 18 integration-directory, 13 HTTP-E2E-named, three other handler tests. Filename categories are not proof of scope or coverage. Representative E2E tests use Fastify injection, not a browser. |
| Database tests can truncate all non-system tables | `vitest.setup.ts` | Establish an isolated test database and verify configuration before execution. Do not run cleanup against existing development/customer data. |
| Shared validation is already consolidated | API HTTP validation plus module validator re-exports | Retain legitimate reuse; inspect actual schemas and error-contract drift instead of flagging wrappers as duplicates. |
| Test env is tracked; placeholder example absent here | `git ls-files .env .env.test .env.example`; `.gitignore` | This establishes file tracking only, not whether values are sensitive. Later inspect configuration without exposing secrets; do not label every test credential a leaked production secret. |
| No local develop branch or release tags listed | Local `git branch --list`, `git tag --list` | Does not prove absent remote branches/tags, protections or PR reviews. Remote/process evidence is unverified. |
| Backend style/format coverage needs verification | Root ESLint config, shared presets, package scripts | Root config extends Next rules; `any` is allowed and unused-vars are warnings. Shared presets do not prove all source is checked. Airbnb/Prettier adherence is not established by config presence alone. |

No new test pass, coverage percentage, dependency-security result, production build or deployment status is asserted in this phase.

## File-by-file review procedure

For each module, work through **all files in each directory**, including barrel exports, types, constants, adapters, schemas and tests. The following order exposes rules before transport details while still tracing actual entry points:

1. Inventory, requirements and public exports; identify actual callers and registrations.
2. Domain constants, IDs/value objects, errors, entities, aggregate boundaries, ports and repository contracts.
3. Application services, commands, queries and orchestration.
4. Prisma mappings/repositories and external adapters; compare against model and migration history.
5. Request/response schemas, validators, controllers, routes, authentication/authorization hooks and Swagger contract.
6. Unit/integration/HTTP tests and frontend consumers for the same behavior.
7. Cross-module workflows, duplicate rules, race conditions and partial-failure paths.
8. Run appropriate isolated checks and record reproducible evidence, then update every reviewed file's register entry.

A file is not marked reviewed because an adjacent file looks correct, a search found no TODO, TypeScript passed, or a class has a test with its name. Review status should progress through `pending-file-level-review`, `reviewed-static`, `reviewed-with-tests`, or `needs-follow-up`. “No actionable finding” is an acceptable documented result; it does not certify every possible behavior.

Each finding records ID, priority, exact path/line, concrete trigger, observed/expected behavior, impact, supporting caller/test, proposed correction, relevant course criterion or project convention, and verification status. Separate confirmed defects, maintainability suggestions, course-evidence gaps and open questions. Do not rewrite code merely to satisfy a stylistic preference.

### Review dimensions

| Dimension | Questions to answer with evidence |
| --- | --- |
| Correctness | Do inputs, state transitions, edge cases and failure paths satisfy defined behavior? Are business rules enforced server-side? |
| Duplication | Is the same business rule implemented in multiple places with drift? Is similarity intentional across bounded contexts? Would extraction increase coupling? |
| Architecture / SOLID | Are responsibilities coherent, contracts narrow and dependency direction appropriate? Are abstractions used, or speculative boilerplate? |
| Types / API contracts | Are nullability, money, dates, unions, DTOs, pagination and error envelopes consistent across API, DB and consumers? |
| Data integrity | Are keys, constraints, migrations, transactions, rollback and retries correct? Can concurrent requests oversell, double-charge, double-award or lose updates? |
| Security | Authentication, object ownership, role checks, input sanitization, token lifecycle, webhook verification, secret handling, safe logs and URL validation. |
| Performance | N+1 queries, unbounded lists, repeated reads, indexes, batching, synchronous work and external-call timeouts. Measure before claiming an optimization. |
| Reliability | External failures, idempotency, event delivery, post-commit effects, reconciliation, cleanup, shutdown and test isolation. |
| Tests | Behavior-focused positive/negative/boundary/concurrency tests, useful assertions, real DB/HTTP integration, browser journeys and measured coverage. |
| Maintainability / docs | Naming, focused functions, dead exports, duplicated policy, configuration contracts, useful comments, fresh setup and requirement/test traceability. |

### Suggested module sequence

0. Shared foundation: core packages, shared HTTP/auth/error/persistence behavior, API composition, Prisma and CI/test safety.
1. User management: identities, ownership, sessions and role contracts used by the rest.
2. Product catalog: variant/product contracts consumed by inventory and carts.
3. Inventory management: stock, procurement and reservations' availability source.
4. Cart, orders and payment: review each module individually, then verify their joint checkout/cancel/refund workflows before closing any of them.
5. Loyalty: accounting, tiers, redemption and purchase/cancellation integration.
6. Engagement: wishlist/reviews/newsletters/notifications and stock-event integration.
7. Fulfillment: ownership compared with order shipments and intended runtime wiring.
8. Customer care: support/returns/refunds and intended runtime wiring.
9. Analytics: event ownership, privacy, failure behavior and intended runtime wiring.
10. Final integration pass: frontend contracts, full route-to-test register, build/runtime delivery and university evidence.

## What remains outside the evidence available here

- Approved SRS/SDS, ADRs and current sprint acceptance criteria.
- Organisation/board/milestone history, actual approved PRs and branch protections.
- Fresh coverage, full API integration coverage and actual browser-journey results.
- Measured load/performance and current dependency audit results.
- Staging/production configuration, TLS, deployments and external provider behavior.
- Supervisor reviews, client feedback, retrospective history and confidential peer evaluations.

These should be labelled **unverified**, not fabricated or automatically failed. They do not prevent reviewing code correctness; they limit claims of formal requirement compliance.
