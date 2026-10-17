# Shared foundation: individual file ledger

This ledger describes the original review baseline. Current corrections and regression tests are tracked in [the remediation record](01-shared-foundation-remediation.md).

Review date: 17 October 2026. Findings and observations refer to [01-shared-foundation-review.md](01-shared-foundation-review.md). Paths are relative to repository root. A static review does not imply executed test coverage. Only files directly exercised by the diagnostics are marked `reviewed-with-tests`; the diagnostics confirm current behavior, including bugs.

| File | Status | References | Individual review note |
| --- | --- | --- | --- |
| packages/core/package.json | reviewed-static | S-09 | Source entrypoints are consistent with direct TypeScript consumption; unused Prisma 5 dependency differs from root Prisma 6; no lint/test scripts. |
| packages/core/tsconfig.json | reviewed-static | S-09 | Compiles own src against root base rather than stricter shared preset; test exclusion covers test.ts but not spec.ts; no current package tests found. |
| packages/core/src/index.ts | reviewed-static | — | Application/domain barrel; no independent business logic. |
| packages/core/src/application/index.ts | reviewed-static | SF-12 | Re-exports core results twice through compatible paths; same implementation, not duplicated result classes. |
| packages/core/src/application/cqrs.ts | reviewed-static | SF-12 | Shared structural contracts; any query default weakens type checking; duplicate module definitions should migrate here. |
| packages/core/src/application/command-result.ts | reviewed-with-tests | SF-06, SF-12 | Preserves failure status but downstream mapper loses it; public constructor permits inconsistent result states and fromError trusts arbitrary statusCode. |
| packages/core/src/application/query-result.ts | reviewed-static | SF-06 | Similar status trust; failure/null is explicit; fromQuery has no active caller and discards status. |
| packages/core/src/domain/index.ts | reviewed-static | — | Domain barrel exports all declared domain subareas. |
| packages/core/src/domain/aggregate-root.ts | reviewed-with-tests | S-01, S-05 | Mutable event queue is directly exposed; clearDomainEvents differs from unused event-emitter interface. |
| packages/core/src/domain/domain-error.ts | reviewed-static | SF-05 | Framework-independent errors carry transport status; validation/error classes repeat metadata; actual exposure issue is in HTTP serialization. |
| packages/core/src/domain/events/domain-event.ts | reviewed-with-tests | S-05 | UUID/time/payload serialization is clear; Date/array immutability shallow; unused clearEvents interface mismatches aggregate. |
| packages/core/src/domain/events/in-memory-event-bus.ts | reviewed-with-tests | S-01 | Sequential awaited dispatch; partial subscriber failure repeats earlier effects on retry; no durable delivery or handler deduplication. |
| packages/core/src/domain/events/index.ts | reviewed-static | S-05 | Exports contracts but not InMemoryEventBus; composition imports implementation directly. |
| packages/core/src/domain/interfaces/index.ts | reviewed-static | — | Pure pagination re-export; no duplicate implementation. |
| packages/core/src/domain/interfaces/paginated-result.interface.ts | reviewed-static | S-06 | Clear result shape; sortBy unbounded string; duplicate wire interface maintained in types package. |
| packages/core/src/domain/value-objects/index.ts | reviewed-static | S-12 | Correct current exports; exposes unused crypto-related surface. |
| packages/core/src/domain/value-objects/uuid-id.base.ts | reviewed-static | S-04 | Checks current v1-v5 UUID syntax; preserves accepted case; equals ignores semantic ID type and spelling normalization. |
| packages/core/src/domain/value-objects/currency.constants.ts | reviewed-static | S-12 | Names/symbols/regions cover current supported set; broad string maps lack compile-time exhaustiveness; crypto list is outside supported set. |
| packages/core/src/domain/value-objects/currency.vo.ts | reviewed-static | S-12 | Useful strict validation and create normalization; fromString stricter by policy; crypto predicate unreachable for valid instances. |
| packages/types/package.json | reviewed-static | — | Source-only type package is coherent; no runtime external dependencies; type-check script present. |
| packages/types/tsconfig.json | reviewed-static | — | Shared library preset with no emit; composite/incremental may create build-info file; intended type-only boundary. |
| packages/types/src/index.ts | reviewed-static | S-03, S-06 | Pagination repeated from core; ApiSuccess requires data despite valid void envelopes; ApiError differs from actual validation paths. |
| packages/validation/package.json | reviewed-with-tests | SF-08 | Four export targets absent; auth/user/common exist; no package tests or lint script. |
| packages/validation/tsconfig.json | reviewed-static | — | Source-only type-check against shared library config; no issue specific to this file established. |
| packages/validation/src/index.ts | reviewed-static | SF-08 | Only exports common; comment incorrectly describes empty package despite auth/user implementation. |
| packages/validation/src/common/index.ts | reviewed-static | S-06 | Input pagination repeats API helper; no upper bound; response schema has sensible nonnegative fields. |
| packages/validation/src/auth/index.ts | reviewed-with-tests | SF-07 | Reviewed all auth/form schemas and inferred types; profile mirror diverges from user subpath/backend, including ISO dates and locale. |
| packages/validation/src/user/index.ts | reviewed-with-tests | SF-07 | Profile/address/payment schemas read; avatar missing and stripped; default fields differ from auth profile; API schemas still independently owned. |
| modules/shared/domain/ports/email.service.port.ts | reviewed-static | S-02 | Port duplicates user-management email ownership with different methods/optional body shape; unused by current composition. |
| modules/shared/infra/email/nodemailer-email.service.ts | reviewed-with-tests | S-02 | Entire transport/template adapter read; wrong brand/domain, unencoded template interpolation, silent skip/errors; no runtime caller found. |
| apps/api/src/shared/application/index.ts | reviewed-static | SF-12 | Compatibility re-export of core contracts; preserve during incremental migration. |
| apps/api/src/shared/http/response-schemas.ts | reviewed-with-tests | S-03 | Success/action/204/pagination schema helpers coherent; error detail contract differs from middleware and clients; serializer drops unsupported errors. |
| apps/api/src/shared/http/validation.ts | reviewed-with-tests | S-03, S-06 | Body/query/params parsed with Zod; errors use noncanonical shape; JSON-schema conversion drops unrepresentable refinements so Zod execution remains essential. |
| apps/api/src/shared/infrastructure/persistence/index.ts | reviewed-static | — | Correct base/helper exports; no separate logic. |
| apps/api/src/shared/infrastructure/persistence/prisma-repository.base.ts | reviewed-with-tests | S-01 | Events dispatched after persistence; no bus means queue not cleared; partial dispatch failure can reject after commit and repeat effects. |
| apps/api/src/shared/infrastructure/persistence/prisma-repository.helper.ts | reviewed-static | S-06 | Generic pagination uses any and independent count/data snapshots; no callers found; don't refactor all repositories toward an unused abstraction. |
| apps/api/src/shared/interfaces/authenticated-request.interface.ts | reviewed-static | SF-01, S-06 | JWT identity duplicated; default any and always-present user hide unauthenticated states; runtime validation missing elsewhere. |
| apps/api/src/shared/middleware/index.ts | reviewed-static | S-07 | Middleware barrel exports functions; import transitively constructs singleton rate-limit timer. |
| apps/api/src/shared/middleware/authenticate.middleware.ts | reviewed-with-tests | SF-01, SF-02 | Delegates to shared plugin and returns generic 401 on failure; underlying verifier accepts wrong token kinds and ignores blacklist. |
| apps/api/src/shared/middleware/optional-auth.middleware.ts | reviewed-static | SF-01 | Swallows auth failures and continues as guest; deliberate optional behavior needs explicit guest policy; inherits wrong-kind acceptance. |
| apps/api/src/shared/middleware/rate-limiter.middleware.ts | reviewed-with-tests | SF-03, SF-04, S-07 | Raw header trust, shared counts/windows, early anonymous bucket, in-memory lifecycle and test bypass confirmed/read. |
| apps/api/src/shared/middleware/role-authorization.middleware.ts | reviewed-with-tests | SF-01 | 401/403 distinction correct; trusts verified identity/role from upstream; static role string sets should be shared without framework coupling. |
| apps/api/src/shared/response.helper.ts | reviewed-with-tests | SF-05, SF-06, S-03 | Every method read; production leaks, lost result status, divergent field errors; safe 204 path and success omission behavior understood. |
| apps/api/src/plugins/auth.ts | reviewed-with-tests | SF-01, SF-02 | Entire plugin read; duplicate JWT verification/signing surface; no token-kind, runtime claim or blacklist checks. |
| apps/api/src/plugins/config.ts | reviewed-with-tests | SF-13 | Entire env contract read; invalid numeric settings accepted; required strings may be empty; process.exit and env re-reading hinder consistent startup. |
| apps/api/src/plugins/db.ts | reviewed-static | S-10 | Module-scoped Prisma shared among server instances; onClose disconnects singleton; no eager connection/readiness verification. |
| apps/api/src/plugins/error.ts | reviewed-with-tests | SF-05, S-03 | Full classifier read; broad numeric status branch precedes redaction; Prisma cases exist but controller catch paths bypass them. |
| apps/api/src/plugins/security.ts | reviewed-static | S-11 | Explicit origins/methods/headers and Helmet present; origin trimming/config consistency and docs CSP policy need deployment decision. |
| apps/api/src/plugins/swagger.ts | reviewed-static | S-11 | OpenAPI and UI registration correct structurally; static metadata, optional response fields and docs access should match deployed intent. |
| apps/api/src/types/fastify.d.ts | reviewed-static | SF-01, S-06 | Always-present identity declaration hides guest/null state; request rawBody declaration does not itself implement body capture. |
| apps/api/src/index.ts | reviewed-static | S-10 | Listen failure handled; createServer failure outside try; no signal-based graceful shutdown defined. |
| apps/api/src/server.ts | reviewed-static | SF-01, SF-13, S-10 | Complete plugin/config/composition startup read; /health is liveness only; actual verifier is plugin implementation; composition constructor reviewed separately. |
| apps/api/src/modules.ts | reviewed-static | — | All route registrations read; eight registered modules, three separate business modules absent; functionality overlap requires later review. |
| apps/api/src/container.ts | needs-follow-up | SF-01, SF-11, S-01, S-02 | Selective wiring and full stock listener inspected; same JWT secrets, selected email adapter, credential-like carrier defaults established; full 1,800+ line file not yet audited. |
| packages/api-client/package.json | reviewed-static | S-08 | Generation script exists; runtime openapi-fetch dev-only; packaging/install strategy needs alignment. |
| packages/api-client/tsconfig.json | reviewed-static | — | Shared library config and noEmit; generated schema included for client typing. |
| packages/api-client/src/index.ts | reviewed-static | S-03, S-08 | Complete wrapper read; auth forwarding, retry-clone lifecycle, refresh callback and unwrap; optional refresh not enabled by current admin caller. |
| packages/api-client/src/generated/schema.ts | needs-follow-up | S-03 | Generated schema headers/profile/auth/order route samples inspected; no line-by-line generated-code audit or fresh runtime regeneration claimed. |
| packages/config/package.json | reviewed-static | S-09 | Preset exports resolve; compiler/linter plugin dependencies partly rely on consumers; no quality-gate scripts. |
| packages/config/tsconfig.base.json | reviewed-static | S-09 | Strict/noUncheckedIndexedAccess/noImplicitOverride enabled; root/core use a different preset. |
| packages/config/tsconfig.lib.json | reviewed-static | — | Composite/declaration config; consumers override noEmit; intended source packaging should be documented. |
| packages/config/tsconfig.next.json | reviewed-static | — | Next plugin and JSX settings isolated from backend usage. |
| packages/config/eslint.preset.cjs | reviewed-static | SF-09, S-09 | Rule choices read; optional warnings and Next rules; no proof consumers execute this unused preset. |
| packages/config/prettier.preset.cjs | reviewed-static | SF-09, S-09 | Formatting conventions coherent; preset/plugin presence does not enforce formatting without script/config adoption. |
| packages/config/tailwind.preset.ts | reviewed-static | — | Entire preset read as config inventory; frontend design tokens only, no backend business logic. |
| package.json | reviewed-static | SF-09 | Root direct API compiler differs from workspace type-check; test delegates to no package test scripts; direct test:vitest remains usable. |
| pnpm-workspace.yaml | reviewed-static | SF-09 | Includes apps/packages, not modules; API directory has no package manifest. |
| turbo.json | reviewed-static | SF-09 | Task definitions and dependency builds read; dry-run proves absent backend tasks; no automatic task creation from task names. |
| tsconfig.json | reviewed-static | SF-09 | Root backend compiler includes modules/shared packages and tests; explicitly excludes frontends/API client/config. Direct check passed. |
| tsconfig.base.json | reviewed-static | S-09 | Separate ES2021/CommonJS strict base; differs from packages/config base; not by itself a bug. |
| .eslintrc.json | reviewed-static | SF-09 | Root Next-oriented configuration allows any and warns unused vars; backend invocation missing. |
| vitest.config.ts | reviewed-static | SF-10 | File patterns and single-worker settings read; dotenv default precedence; no coverage thresholds/report configured. |
| vitest.setup.ts | reviewed-static | SF-10 | Full setup read; table truncation unguarded, cleanup exceptions swallowed; no destructive execution performed. |
| .github/workflows/ci-cd.yml | reviewed-static | SF-09 | Complete workflow read; direct Vitest step does run backend tests; lint/type-check skip backend; no current deployed-run result claimed. |
| apps/api/Dockerfile | reviewed-static | S-09, S-10 | Copies TypeScript/dependencies for tsx runtime; not compiled/pruned backend; builder includes full context and package strategy needs verification. |
| .dockerignore | reviewed-static | — | Build/runtime output exclusions read; environment files not excluded from builder context, although root .env isn't copied explicitly into final runner. Do not equate that alone with a proven published-secret leak. |

## Files outside this completed ledger

User-management JWT, logout, session/invitation handlers, schemas and routes; newsletter caller; sample stock repository; copied CQRS definitions; storefront/admin client consumers were read as supporting evidence. Their whole modules remain pending. Database schema/migrations and frontend implementation remain for their planned stages.
