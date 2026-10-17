# Shared backend foundation: detailed review

This is the **pre-fix review snapshot**. Implementation and current verification are tracked in [the remediation record](01-shared-foundation-remediation.md). Defect descriptions and line references below describe the baseline, not the corrected working tree.

Reviewed 17 October 2026 against commit `c8de2c22931d20418d35809f0b7060d99c936815` and the current working tree. Application code was not changed.

## Outcome

The shared foundation contains useful central abstractions and reusable validators, but **the authentication boundary and rate limiting need corrections before relying on their security guarantees**. A successful TypeScript check does not catch these runtime errors.

This pass reads the hand-written files in `packages/core`, `packages/types`, `packages/validation`, `packages/api-client`, `packages/config`, `modules/shared`, `apps/api/src/shared` and API plugins. It also reads API startup/module registration, request declarations and root build/test configuration. Module callers were inspected where needed to establish an actual impact. The large composition root was inspected selectively; the generated API schema was sampled as a generated contract, not manually audited line by line. These two files remain explicitly open for follow-up.

The individual file ledger is [01-shared-foundation-files.md](01-shared-foundation-files.md): **74 files reviewed** (56 static reviews and 18 directly exercised by diagnostic probes), plus **two explicitly incomplete files** for composition/generated-contract follow-up. The master [backend register](backend-file-register.csv) records review statuses. Supporting module files inspected for evidence are not thereby marked fully reviewed.

## Verification and limits

- `node node_modules/typescript/bin/tsc --noEmit --pretty false`: passed, exit code 0.
- Historical diagnostics: 16 checks reproduced baseline defects using real shared implementations, synthetic JWTs, in-process Fastify injection, stubbed persistence and stubbed mail. No real provider, database or email was contacted. Their output remains in `probes/shared-foundation-results.json`; the temporary defect-reproduction script was retired after fixes. Passing regression tests now live in `apps/api/test/unit` and `packages/api-client/test/unit`.
- `turbo run lint type-check test --dry=json`: inspected the resolved task graph. API/module tasks are absent; workspace `test` commands are all nonexistent. CI separately calls `test:vitest`, so its backend tests are not skipped by that particular step.
- No dedicated tests were found under the reviewed core/shared directories before adding these review probes. Some domain tests elsewhere import shared errors, but they do not establish middleware, event-delivery or response-contract coverage.
- Full unit/integration/browser suites, production builds, dependency vulnerability scans, deployed TLS and remote GitHub policy were not verified in this pass. Database suites were not executed because their setup performs unguarded table truncation.

## Confirmed findings and concrete corrections

### SF-01 [P1] Authentication accepts refresh and pending-2FA tokens as access tokens

**Files:** `apps/api/src/plugins/auth.ts:42-52`; supporting `apps/api/src/container.ts:693-697` and `modules/user-management/infra/http/security/jwt.service.ts`.

The authentication decorator verifies the signature and casts the result to a TypeScript interface. It never requires `type === 'access'` or validates the runtime identity claims. Container wiring supplies the same secret for access and refresh tokens; pending-2FA tokens also use the access secret.

**Reproduced:** a real `JwtService.signRefresh(..., true)` token passed `authenticate` plus `ADMIN_ONLY` and received 200. A real pending-2FA token passed an authentication-only route and received 200. A signed token missing user ID/email also passed authentication. The probe uses the actual shared middleware with a minimal HTTP endpoint, not a deployed service.

**Actual callers:** `/auth/me`, `/auth/change-password` and several 2FA endpoints use authentication without a role gate. Pending tokens lack a role, so this finding does not claim they pass every role-protected route. The change-password route also requires the current password; somebody obtaining a pending token after the password step already has that password. A refresh token carries the original role and bypasses the intended refresh/session-validation path when used as a bearer credential.

**Correct:** centralize access-token validation; enforce token kind and required claims; explicitly restrict accepted algorithms and intended issuer/audience where configured. Keep refresh and challenge validation separate. Using different secrets can add separation but does not replace claim validation. Add tests rejecting refresh/challenge/malformed tokens on every shared authentication path. [JWT BCP section 3.12](https://www.rfc-editor.org/rfc/rfc8725.html#section-3.12) requires distinct validation rules for different token kinds.

**University criteria:** U22, U23, U27. This is a security defect, not a naming convention.

### SF-02 [P1] Logout blacklists tokens, but protected requests ignore the blacklist

**Files:** `apps/api/src/plugins/auth.ts:50-52`; supporting `modules/user-management/application/commands/logout.command.ts:24-35` and `infra/http/security/token-blacklist.ts:62-75`.

Logout explicitly puts the access token into `TokenBlacklistService`. The shared authentication path never queries that service. Only the refresh command consults the blacklist.

**Reproduced:** a valid access token was blacklisted, the blacklist reported true, and the same token still received 200 on the protected admin probe. A stolen logged-out token therefore continues working until its JWT expiry. This differs from a deliberately documented access-token grace window: the application already records access-token revocation but does not enforce it.

**Correct:** enforce the chosen revocation policy on protected requests through an injected access-token verifier. For immediate session revocation, a session identifier/token version and checked session state may also be needed. Do not claim that merely adding a refresh-token database check invalidates existing access tokens. Add logout-then-access and session-revocation tests.

**University criteria:** U22, U27.

### SF-03 [P2] A client-controlled forwarding header bypasses IP rate limiting

**File:** `apps/api/src/shared/middleware/rate-limiter.middleware.ts:91-95,108-115`.

The default and hybrid key generators trust the first raw `x-forwarded-for` value. Server creation does not configure a trusted proxy chain. Changing this request header changes the rate-limit identity, independently of the actual peer address.

**Reproduced:** with a one-request quota, the same header produced 200 then 429; changing only the header immediately produced 200.

**Correct:** use the server's resolved client address and configure trusted proxy addresses/hops explicitly for the deployment. Do not trust arbitrary forwarded headers or set proxy trust indiscriminately. Test direct clients and trusted/untrusted proxy cases.

**University criteria:** U26, U27.

### SF-04 [P2] Rate-limit identity and policy scopes interfere across requests

**Files:** `rate-limiter.middleware.ts:32-40,50,68-69,98-101`; supporting `modules/user-management/infra/http/routes/profile.routes.ts:20-23,42-46,74` and module route registration.

There are two related errors:

1. Module write hooks run in `onRequest`, but `request.user` is populated later by route authentication in `preHandler`. `userKeyGenerator` therefore commonly selects `anonymous` even for valid logged-in users. Their writes share a bucket.
2. Every limiter instance uses the same singleton map, and keys omit a policy/route scope. Different quotas and windows can consume each other's counts and retain whichever reset time was established first. Multiple module route files add hooks to the same Fastify instance, so their scopes also need tracing during module reviews.

**Reproduced:** two different signed users hit a one-write policy; the first got 200 and the second 429. A broad-policy request exhausted a separate narrow policy before its first request, and the narrow policy inherited a retry time longer than its own window.

**Correct:** use an early IP limiter where appropriate, then an authenticated-user limiter after verified identity exists. Namespace buckets by intended policy, and make any shared global quota explicit. Add tests for separate users, policies, windows and module hook scope. Lifecycle ordering is documented in the [Fastify lifecycle reference](https://fastify.dev/docs/v5.5.x/Reference/Lifecycle/).

**University criteria:** U08, U18, U27.

### SF-05 [P2] Production errors expose internal messages through two response paths

**Files:** `apps/api/src/shared/response.helper.ts:35-72`; `apps/api/src/plugins/error.ts:16-24`.

`ResponseHelper.error` always returns `Error.message`, including unexpected errors in production. Controllers commonly catch exceptions and call it, bypassing the global error handler's redaction and structured exception logging. The global error handler also treats any numeric `statusCode < 600` as a domain error before its production-redaction branch, including 500/503 infrastructure failures.

**Reproduced:** in production mode, both a helper-handled Error and a thrown 503 Error returned a synthetic internal database-host message verbatim.

**Correct:** use one central error classifier/serializer; return safe messages for unexpected server failures, preserve deliberate public domain/client errors, and log the original error server-side with request correlation and redaction. Do not expose raw Prisma/provider messages. Restrict trusted status values and distinguish transport errors from known domain errors.

**University criteria:** U10, U26, U29.

### SF-06 [P2] Command failures lose their HTTP status at the shared response boundary

**Files:** `apps/api/src/shared/response.helper.ts:123-128`; `packages/core/src/application/command-result.ts:14-25`.

`CommandResult.failure` preserves a status code, but `fromCommand` always responds with 400. This has active callers: missing sessions and missing admin invitations deliberately return 404 results, then their controllers send them through `fromCommand`.

**Reproduced:** `CommandResult.failure('Missing session', undefined, 404)` became HTTP 400. Clients cannot reliably distinguish not-found from invalid input. `fromQuery` has the same behavior but no active caller was found; it is a latent counterpart, not a separate incident.

**Correct:** validate and preserve result status codes with a safe fallback; carry stable error codes and a consistent validation-detail shape. Test 400/401/403/404/409/500 behavior rather than only success responses.

**University criteria:** U10, U14, U24.

### SF-07 [P2] Shared profile validation has already drifted into three different contracts

**Files:** `packages/validation/src/auth/index.ts:88-105`; `packages/validation/src/user/index.ts:16-39`; supporting `modules/user-management/infra/http/validation/profile.schema.ts:7-33`.

The same profile request is independently declared in two shared subpaths and the backend. The auth subpath accepts a bare `en` locale and arbitrary date-of-birth strings, while the backend requires a region locale and ISO date/date-time. The user subpath omits `avatarUrl`, so Zod silently strips it when parsed. The auth subpath omits the default address/payment-method fields present in the other two.

**Reproduced:** the client auth schema accepts `{ locale: 'en', dateOfBirth: 'not-a-date' }`, while the backend rejects it; the user schema parses an avatar-only update into `{}`. The storefront EditProfileForm currently imports the auth subpath, establishing an active client/server contract relationship; not every illustrative bad value is necessarily enterable in its current UI.

**Correct:** define one transport-level profile schema and infer its types; compose UI-only constraints separately. Keep domain invariant validation at the domain boundary. Review all shared auth/address/payment request mirrors during user-management review and add cross-boundary contract tests.

**University criteria:** U08, U11, U14, U24.

### SF-08 [P3] Four advertised validation-package exports point to nonexistent files

**File:** `packages/validation/package.json:11-14`.

The `./cart`, `./product`, `./order` and `./payment` export targets do not exist. Imports through those advertised subpaths fail. No current consumer of these four subpaths was found, so this is a broken public package surface rather than a demonstrated live screen failure.

**Reproduced:** resolved every export path against the filesystem; these four targets are absent.

**Correct:** remove unimplemented exports until supported, or implement them as part of the relevant module's shared contract. Add an export-resolution check. Update the package-root comment claiming it starts empty; auth/user schemas already exist.

**University criteria:** U08, U09.

### SF-09 [P2] Workspace checks skip the API and backend modules

**Files:** root `package.json:18-25`, `pnpm-workspace.yaml`, `turbo.json`; supporting `.github/workflows/ci-cd.yml` and absence of `apps/api/package.json`.

The API has no workspace package manifest, and modules are compiled through the root tsconfig rather than package scripts. `pnpm type-check` runs only workspace tasks and does not execute the root backend compiler. No backend/module lint script is reached. `pnpm test` delegates to workspace scripts, none of which defines a test command.

**Reproduced:** the installed Turbo dry-run listed no API/module task, only frontend lint commands, and `<NONEXISTENT>` for all workspace test commands. The direct root TypeScript command was run separately and passed.

**Important distinction:** CI uses `pnpm run test:vitest`, which does run backend tests. It still uses the workspace-only type-check/lint commands, so those steps do not establish backend coverage. This is not a claim that the entire pipeline does nothing.

**Correct:** explicitly wire backend compiler/linter/test commands into the root workflow or make API a proper workspace with a complete declared module source scope. Verify the resolved task graph after changing it. Add formatter and coverage gates as specified in the university criteria. [Turbo runs package scripts matching task names](https://turborepo.dev/docs/crafting-your-repository/running-tasks); a task definition does not itself create missing scripts.

**University criteria:** U09, U12, U17, U18.

### SF-10 [P1] Database-test cleanup has no isolation guard

**File:** `vitest.setup.ts:7-24,34-43`; supporting `vitest.config.ts:5`.

For a filename identified as database integration/E2E, the setup connects using the effective environment URL and truncates every table in every non-system schema, excluding the migration table. It does not assert an allowlisted test database, separate credentials or an explicit destructive-test opt-in. Merely setting `NODE_ENV=test` would not prove database isolation. Dotenv's default non-override loading also leaves an already-set DATABASE_URL in effect.

**Evidence:** complete control-flow inspection. No destructive reproduction was attempted. The risk is that a misconfigured environment clears development or production data, not a claim that data has already been lost. Cleanup errors are caught and logged, allowing tests to proceed with dirty state as a second reliability problem.

**Correct:** require an isolated disposable test database, reject non-test destinations before constructing/connecting clients, apply a narrow schema/table scope and fail cleanup errors. Prefer independently provisioned test credentials/database with no access to other environments. Validate the guard using fake clients/URLs before executing database suites.

**University criteria:** U11, U18, U21, U26.

### SF-11 [P2, security concern] Carrier configuration contains credential-like fallbacks

**File:** `apps/api/src/container.ts:1340-1344`.

The FedEx adapter receives hardcoded credential-like values when the environment is missing. This makes absent configuration silently choose credentials from source control instead of failing closed or disabling the capability. Values are intentionally not repeated in this review. Their validity and ownership were not tested.

**Correct:** remove credential-like fallbacks, inject validated provider configuration, and disable shipping with a clear unavailable state when unconfigured. If the values were real credentials, revoke/rotate them and assess repository history. If they are intentional public test fixtures, label and isolate them as such rather than using them as runtime defaults.

**University criteria:** U21, U26. This was found while tracing composition; the complete container is still pending review.

### SF-12 [P2, maintainability] Shared CQRS definitions are repeatedly copied into modules

**Files:** `packages/core/src/application/*`; representative copies in `modules/customer-care/application/commands/close-ticket.command.ts:3-30`, `queries/get-chat-session.query.ts:3-31`, `modules/fulfillment/application/commands/add-shipment-item.command.ts:5-30`, and `modules/analytics/application/commands/track-product-view.command.ts:7-32`.

A source scan found exported local `CommandResult`/`QueryResult` classes in **44 module files**: 39 customer-care, four fulfillment, one analytics. These declarations duplicate the core types; their result contracts already differ (for example optional data/field-error arrays versus core null/status handling). This count is files containing result-class definitions, not 44 fully audited workflows.

**Correct:** migrate these modules to the core contracts during their reviews, with explicit handling of query/null/error semantics. Do not mass-replace symbols without checking consumers and tests. Existing validator/CQRS re-export barrels are legitimate compatibility wrappers, not further result-class copies.

**University criteria:** U08 and local `project_domain_patterns.md` CQRS convention. These modules are not currently registered, limiting immediate runtime impact.

### SF-13 [P2] Configuration validation accepts unusable numeric settings

**File:** `apps/api/src/plugins/config.ts:4-13`.

`z.string().transform(Number)` does not validate the transformed output or require port/rate-limit bounds. Empty required strings also satisfy `z.string()`. Parsed configuration is not consistently used: security/auth plugins and adapters read environment variables again, and the rate-limit presets ignore the parsed rate-limit settings.

**Reproduced:** config registration succeeded with PORT=`not-a-number` (parsed NaN) and a negative rate-limit maximum. An invalid port will fail later at listen time, outside the intended configuration diagnostic. The negative limit is accepted even though current limiter presets do not consume it.

**Correct:** validate finite integers and allowed bounds, nonempty secrets/URLs and supported duration strings; pass one validated configuration to consumers. Throw a startup error rather than terminating the process inside a reusable plugin, so callers/tests can clean up. Production provider requirements should depend explicitly on enabled features.

**University criteria:** U08, U26.

## Additional design and quality observations

These are lower-priority improvements or limitations, not claims of an already observed production incident.

| ID | Files | Observation and recommendation |
| --- | --- | --- |
| S-01 | `prisma-repository.base.ts:19-26`; `in-memory-event-bus.ts:8-19` | Persistence happens before awaited event dispatch. Subscriber failure rejects after data is saved; already delivered events remain queued and repeat on retry. The diagnostic reproduced duplicate delivery across retries. The only currently wired subscriber catches its errors, so an active stock-save failure from this path is not asserted. Define after-commit delivery/retry/idempotency semantics; use an outbox if durable delivery is required. |
| S-02 | `modules/shared/domain/ports/email.service.port.ts`; `modules/shared/infra/email/nodemailer-email.service.ts`; user-management email port/adapter | Two email abstractions/adapters with conflicting signatures, brands, links and failure semantics. Composition uses user-management's adapter; no caller of the shared adapter was found. The shared adapter resolves both missing credentials and SMTP errors, and contains unrelated Modett/Modern Muse content. Remove or deliberately migrate it; do not assume editing it fixes current email delivery. Stubbed diagnostics confirm its failure semantics only. |
| S-03 | `validation.ts`; `response-schemas.ts`; `ResponseHelper`; `packages/types`; storefront request wrapper | Validation failures use `errors: [{field,message}]`, helper Zod failures use `error.format()`, global Zod failures use `details: []`, while shared ApiError declares `details` as an object and the storefront extracts `body.error`. These paths lack one wire contract. A response-schema composition probe drops validator errors because `errorResponse` forbids `errors`; that helper has no current module-route caller, so this particular loss is latent. Standardize shape with existing clients and test serialization. |
| S-04 | `uuid-id.base.ts:12-13,32-34` | Uppercase UUIDs are accepted but equality compares raw spelling; typeName is also ignored. Clarify whether IDs should normalize case and require matching semantic types. No actual cross-type authorization failure is established. UUID-v7 support is not automatically needed because current generation uses v4. |
| S-05 | `aggregate-root.ts:6-7`; `domain-event.ts:47-49`; core barrels | Aggregate exposes a mutable event array; `EventEmittingAggregate.clearEvents()` differs from actual `clearDomainEvents()` and has no caller. InMemoryEventBus is not exported by the events barrel and is imported directly in composition. Tighten the intended public contract and remove unused abstractions as justified. |
| S-06 | core and types pagination interfaces; shared/common and API pagination schemas; duplicated JWT interfaces | Identical contracts are maintained in several places. Consolidate transport types where appropriate, preserving domain-versus-wire boundaries. Pagination has no shared upper limit; inspect actual endpoint limits before declaring a resource-exhaustion defect. |
| S-07 | `rate-limiter.middleware.ts:17-50,63-65` | Cleanup interval is never unref'd/disposed through app shutdown; `destroy()` is inaccessible outside its private singleton. Test mode disables rate limits entirely, so standard test runs cannot validate them. Inject a lifecycle-managed store and opt into testing the actual limiter. Memory-only storage is a scaling limitation, not proof Redis is required for this single-process app. |
| S-08 | `packages/api-client/src/index.ts` and package manifest | Useful single-retry logic exists; a clone is retained per request until a response arrives but no network-error cleanup hook is supplied. Refresh failures/concurrent refresh handling depend on the consumer. Current admin client does not supply the optional refresh hook, so those clone/refresh concerns are latent. Runtime dependency `openapi-fetch` is listed as dev-only; align declared dependencies with the chosen packaging strategy. |
| S-09 | `packages/core/package.json`; shared configs | Core declares an unused Prisma 5 dependency while root uses Prisma 6. Core follows the separate root compiler preset rather than the stricter workspace preset. Shared ESLint/Prettier config files are not proof those tools execute. Remove unused dependencies and document intended compiler/tooling differences. No dependency vulnerability result is claimed. |
| S-10 | `db.ts`; `server.ts`; `index.ts` | Prisma is a module singleton across server instances; /health does not query DB; startup creation precedes the listen try/catch and no signal shutdown handlers are defined. Review lifecycle/isolation/readiness as deployment work. Do not add a mandatory DB query to a liveness endpoint without separating readiness requirements. |
| S-11 | `security.ts`; `swagger.ts` | CORS values are split without trimming and can be read differently from validated config; docs CSP permits inline scripts and no separate docs access policy is present. Public Swagger is not inherently a defect. Check deployment and required documentation access rather than claiming this alone permits API access or proves frontend XSS. |
| S-12 | `currency.vo.ts`, `currency.constants.ts` | Currency validation is centralized and useful. `isCrypto()` can never be true for constructed valid currencies because crypto values are outside the supported set; remove unused crypto API unless required. Currency.fromString's strictness versus create's normalization is a policy choice to document. No currency conversion or processor support is implied by the allowlist. |

## Good decisions to preserve

- Core domain code has no Prisma/Fastify runtime imports; use of domain interfaces supports separation of concerns.
- IDs and currency have centralized validation; command results make service outcomes explicit even though HTTP mapping needs fixing.
- Actual shared HTTP validators are centralized. Module `validator.ts` and shared application re-exports avoid duplicate implementations and support incremental migration.
- Role middleware distinguishes missing identity (401) from disallowed role (403); keep this distinction after fixing token verification.
- API client retries at most once and avoids recursively entering its refresh middleware; generated contracts have a defined regeneration command.
- No recommendation to split the monorepo, deploy microservices, add Redis, or introduce extra layers follows automatically from the university guideline.

## Correction order

1. Fix token-kind/claim validation and access-token revocation; add negative security regression tests.
2. Guard test-database cleanup before running existing database suites.
3. Correct rate-limit address trust, identity timing and policy isolation.
4. Consolidate safe error serialization and preserve failure HTTP status codes.
5. Align profile schemas and package exports; fix backend check coverage in CI.
6. Remove credential-like defaults and consolidate configuration.
7. Resolve lower-priority duplicated contracts, email ownership and event/lifecycle design with their affected modules.

The next business-module review is **user management**, with SF-01/SF-02/SF-07 carried into its auth, session, profile and endpoint tests. The requested work here is a review; fixes have not been silently applied.
