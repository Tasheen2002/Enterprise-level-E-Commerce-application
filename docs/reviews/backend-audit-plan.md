# Complete backend audit and verification plan

Prepared: 17 October 2026. Owner's requested scope: review the entire backend file by file, establish relevant test cases, then make evidence-based corrections. This plan supersedes the earlier suggestion to move into user management before closing the shared foundation. It does not certify the implementation as complete.

Current branch: `fix/shared-backend-foundation`. Current source baseline: `161dcd13b32ada7aab76f2f73c40cb45cbce6e04`. All 15 existing commits are preserved. This records the original planning baseline; subsequent corrections and current evidence are summarized below.

## 1. What “100% complete” means

There are separate measures, and we will report each rather than use a single ambiguous percentage:

1. **File review completeness:** 100% of current backend and supporting files have been individually read, traced to callers, evaluated against applicable criteria, and closed with evidence at their current hash. Every file is accounted for, including tests, exports, declarations, migrations, configurations, lockfiles, utilities and disabled modules.
2. **Behavior/test traceability:** every discovered rule, state transition, entry point, security boundary and important failure path has explicit expected behavior and mapped tests. Every registered method/path has database-backed HTTP integration coverage and applicable authorization/ownership/validation cases. A small seed scenario list is not proof that all behaviors were discovered.
3. **Execution evidence:** required unit, database, HTTP, contract, end-to-end and provider checks have actually run in the intended environment. Planned, skipped, mocked-only, failing and blocked checks remain distinguishable.
4. **Code coverage:** pursue 100% executable line/branch coverage for reviewed handwritten backend logic, with every uncovered item investigated. University minimums are 80% new-code unit lines/branches and 90% critical-business branch coverage; satisfying them alone does not establish a 100% audit. Report overall, per-module, critical-code and changed-code results separately. Types/config/generated code need suitable verification rather than artificial unit tests. Any accepted coverage exception remains visible and changes the completion claim to “complete with exceptions”; no silent exclusions or lower thresholds to produce a green report.
5. **Defect closure:** every confirmed finding is corrected and regression-tested, or explicitly accepted/deferred by the owner with its impact recorded. An unresolved blocker means the strict 100% goal is not complete.

A 100% review and high coverage cannot prove absence of every possible bug. Existing 329 passing unit tests and the earlier 11.66% line / 7.77% branch coverage snapshot are historical measurements, not proof that every file or provider has been verified.

## 2. Auditable scope and inventory

The operational register is [backend-audit-register.csv](backend-audit-register.csv), with a machine summary in [backend-audit-scope.json](backend-audit-scope.json). The older `backend-file-register.csv` remains historical machine-readable evidence. Superseded Markdown reports were removed during owner-requested cleanup; current status and unresolved findings are consolidated below.

The fresh initial inventory contains **1,462 files in backend review scope**:

| Area | Files | Treatment |
| --- | ---: | --- |
| All business modules plus `modules/shared` | 1,263 | Every file, including the three modules absent from production registration |
| `apps/api` | 28 | All host, shared infrastructure, plugins, composition, tests and build files |
| Core/types/validation/API-client/config packages | 40 | All files, including declarations and generated contracts |
| Prisma | 13 | Schema, every migration, lock and additional index SQL |
| Root files and GitHub workflow | 24 | Environment policy, dependency manifests/lockfiles, runtime/test/build/CI config and backend documentation |
| Operational scripts and scratch utilities | 33 | All files; inspect side effects and safeguards before executing anything |
| Storefront/admin server and contract candidates | 61 | Includes Next server endpoints, middleware, server API wrapper and shared-contract consumers |

The initial scan explicitly accounts for 246 frontend/UI/asset files outside detailed backend review. Audit artifacts are counted separately to avoid a register recursively certifying itself. Counts grow when new source/tests are added; refresh the inventory throughout the audit. “Excluded frontend” is a classification candidate: any backend behavior or transitive consumer discovered there must be reclassified into scope.

Important additions compared with the old baseline include operational `scratch/` files, both dependency lockfiles, and Next server endpoints such as `apps/web/app/api/auth/clear/route.ts`, `apps/web/app/api/auth/sync/route.ts` and `apps/web/middleware.ts`. No old count is treated as a permanent denominator.

Inventory tool: `scripts/review/inventory_backend.py`. It records paths, scope reasons, phase, current hashes, historical review metadata and empty evidence fields. It does not perform semantic review or execute application code. Environment files are hashed locally so changes invalidate evidence, but their contents/secret values are never displayed or exported. An unknown directory becomes `scope-triage`, which must be resolved rather than ignored.

Refresh using Python 3:

```powershell
python scripts/review/inventory_backend.py --refresh --date 2026-10-17
```

Use the actual review date on future runs. Refresh preserves evidence for unchanged content; changed content/scope reopens the file, added files start pending, and removed files require deletion/consumer verification. A closed row must reference the reviewed hash; changed consumers can also require reopening unchanged producers.

## 3. Record keeping before corrections

Maintain four linked evidence sets:

- **File register:** current hash, review notes, behavior IDs, test files/commands/results, applicable coverage, findings and closure status. Prior static reviews are useful inputs; they do not automatically meet the new closure gate.
- **Behavior/test matrix:** [backend-audit-test-matrix.csv](backend-audit-test-matrix.csv). Columns include case ID, rule/requirement, source paths, type, priority, preconditions, input/action, expected result, actual result, test path/command and status. Initial scenarios are planned seeds and must expand from the actual code and specifications.
- The initial matrix contains **93 planned scenario seeds across all 16 phases**. Its unfilled source paths, concrete preconditions/expected results and execution fields are intentional: they must be established during the relevant review, before a correction. At initial planning time these were not implemented or passing cases; current execution status is recorded in the live matrix and section 11.
- **Endpoint and data-model registers:** create during P00/P02. Endpoint rows include registration state, full prefix/method/path, handler/schema/service, public/role/ownership policy, status/envelope, persistence effects and mapped test IDs. Model rows include owning module, constraints, relations/cascade policy, repository, transaction boundaries, migration/index and test IDs. Static route scans must be reconciled with actual configured server registration.
- **Finding records:** stable review ID, severity, exact file/line/hash, trigger, expected versus actual behavior, impact, duplicate-rule callers, reproducer/test, correction proposal, requirement/convention and verification. Clearly distinguish defects, quality suggestions, policy questions and external evidence gaps.

Approved application SRS/SDS and business acceptance criteria have not been established in this repository review. Use the implementation, existing docs, university guideline and owner-confirmed behavior as separate sources. Mark uncertain business rules as questions; do not invent refund, stock, tax, currency, role or shipping policies. Academic board/sprint/peer-review history is not fabricated for a personal project.

## 4. Required cycle for every folder and file

Work through one bounded folder or cohesive workflow at a time. A large composition/service file can be a batch of its own.

1. Refresh scope; pin current source hash and inspect existing review/test history.
2. Read the entire file, including imports, exports, helpers and error paths. For long files, read consecutive chunks and record all covered ranges. Search results and sampled sections do not count as a full read.
3. Trace callers and dependencies in both directions: HTTP/command entry point -> application rule -> domain -> repository/provider -> returned response/event. Check test doubles against actual interfaces.
4. Identify responsibilities, invariants, state transitions and expected outcomes. Compare similar logic across modules before recommending an extraction; preserve legitimate bounded-context differences.
5. Evaluate correctness, SOLID/DRY/YAGNI, type/null/date/money handling, error semantics, validation, authorization/ownership, persistence integrity, concurrency, idempotency, secrets/logging, timeouts, performance and maintainability.
6. Map each relevant behavior to existing tests; read those tests fully. Identify weak assertions, implementation-mirroring tests, skipped cases, unrealistic mocks and missing negative/boundary/concurrent cases.
7. Record findings and write a focused failing regression for a confirmed behavior defect **before changing application behavior**. For static/config/contract issues, use an appropriate compiler, contract or configuration check. Record observed baseline failure without introducing destructive side effects.
8. Propose the smallest correction with its dependent files, compatibility consequences and acceptance cases. Routine confirmed fixes can proceed within the requested audit; unresolved material business-policy choices require owner clarification. A review result of “no correction needed” is valid.
9. Apply only the evidence-supported change. Run the focused test, affected module suite, relevant compiler/lint/format/contract checks and any dependency-driven integration checks. Broaden testing when risk or results justify it.
10. Inspect the final diff, update documentation/contracts where affected, record actual outputs and coverage, and close only qualifying rows. Commit the cohesive fix with tests; record remaining blockers before starting the next batch.

Earlier fixes will be revalidated under this process. They are not automatically reverted and are not assumed correct simply because we wrote them.

## 5. Phase order and acceptance evidence

File counts below are initial planning counts, not a promise that counts never change. Shared dependencies are reviewed once at their current hash and rechecked with later callers.

| Phase | Scope / initial files | Required outcomes before closure |
| --- | --- | --- |
| P00 — baseline and test safety | Root, workflow, scripts/scratch: 57 | Resolve scope; define source of business rules; read test setup/cleanup and all operational utility risks; inspect real build/task graph and authoritative lockfile policy; map existing tests, providers and runtime registrations; establish reproducible safe test commands and baseline reports. No blind execution of seed/clear/drop/inspection utilities. |
| P01 — entire shared foundation | 72 | Finish all core/types/validation/shared-mail/API-shared/plugin/config/client files, complete the entire container/server/module-loader read, and review Next server auth routes. Exercise event retry/concurrency semantics, IDs/currency, CQRS/null/status behavior, validation/error serialization, token/session/role/rate-limit boundaries, startup/shutdown/readiness and multi-instance isolation. Regenerate and compare the generated API client against runtime routes. Close original composition/generated-contract follow-ups and revalidate previous fixes. |
| P02 — database foundation | Prisma: 13 | Read schema and each migration/index file; build the 72-model/31-enum baseline map and refresh actual counts; verify constraints, money/date precision, cascades, indexes, ownership and schema/repository agreement. Test clean migration deployment and supported upgrade path on disposable DBs, drift and rejected writes/transaction rollback. `db push` alone is insufficient migration proof. |
| P03 — user management | 155 | Full domain/application/persistence/HTTP/test read; registration and account states, password hashing/reset/verification, login/refresh/reuse/logout/lockout, active/expired/revoked sessions, TOTP/backup-code single use, Firebase identity/phone, admin invitations, profiles/addresses/payment-method ownership, upload authorization, privacy and audit logging. Real DB + full HTTP policy matrix. |
| P04 — product catalog | 226 | Product/variant/category/attribute/tag/media/size/editorial and publication invariants; slug uniqueness/collisions, filtering/sorting/search/pagination and visibility, sanitization and administration/ownership. Real query results, constraints/indexes and HTTP response contracts. Discover the exact subfeatures from all files rather than assume this list exhausts them. |
| P05 — inventory management | 144 | Stock, movements/adjustments, locations, suppliers/procurement and availability; nonnegative/conserved quantities, reservations/release/expiry, transaction rollback, concurrent allocation, duplicate event effects and event consumers. Verify against product/variant lifecycle and database locks/constraints. |
| P06 — cart | 109 | Member/guest ownership, token boundaries, merge, quantity/availability/price snapshots, totals/currency, reservation TTL and checkout orchestration. Validate expiry/time races, repeated requests, cross-user access and failure compensation using actual DB state. |
| P07 — order management | 143 | Creation/line snapshots, totals/discount/tax/shipping policy, state transitions, cancellation/preorder/backorder/shipment paths, carrier failures and cross-module ownership. Validate atomicity, retry behavior and consistency with cart/inventory/payment. |
| P08 — payment | 122 | Provider setup/payment state, amount/currency validation, idempotency, signed raw-body webhooks, duplicate/reordered events, refunds, promotions/gift-card accounting and reconciliation. Separate trusted processor outcomes from client claims; exercise persistence transactions plus Stripe test-mode contracts. |
| P09 — loyalty | 53 | Account/ledger/tier rules, accrual/redemption/expiry, rounding, insufficient balance, duplicate awards and cancellation/refund reversals. Verify concurrent updates and purchase/payment event integration without double effects. |
| P10 — engagement | 130 | Wishlist/sharing, product reviews/moderation, newsletters, reminders/restock, notifications and appointments. Test ownership/privacy, eligibility policy, subscription/single-use delivery semantics, schedule/expiry boundaries and inventory-event integration. |
| P11 — fulfillment | 25 | Read and test all files even though currently unregistered. Resolve ownership compared with order shipments; validate shipment/items/status rules and repository/HTTP contracts in isolated fixtures. Record production registration as a separate decision; do not auto-enable routes. |
| P12 — customer care | 132 | Read/test support tickets/messages/agents/chat, returns/RMA/items/repairs, goodwill/feedback and refund integration; ownership/roles, legal state transitions, repeat processing, partial failure and amount consistency. Registration remains a separate explicit decision. |
| P13 — analytics | 23 | Event payload validation/consent policy, guest/member identity, deduplication, reporting/query boundaries, storage/privacy/retention and failure behavior that cannot corrupt checkout. Test all files despite absent production registration. |
| P14 — system/consumer verification | 58 contract-consumer candidates plus cross-module scenarios | Reconcile every API consumer and transitive server dependency with runtime routes/generated contracts. Execute end-to-end workflows, cross-module races/compensation, authorization/negative contracts, runtime event wiring and provider contracts. Reopen producer files when consumer evidence contradicts them. |
| P15 — final regression and closure | All current scope and evidence | Refresh scope and hashes; rerun complete checks, migration paths, DB/HTTP/E2E/provider suites, measured coverage and security/dependency/performance checks. Verify build/container boot/readiness/shutdown and fresh setup. Resolve every blocker or explicitly report remaining exceptions. Produce final findings/coverage/route/model/provider/file reports and accurate CV claims. |

P06–P09 receive individual reviews, but their checkout/cancel/refund/accounting integration gate closes together. Earlier shared/database corrections can cause a bounded return to P01/P02. External prerequisites that block one lane do not stop independent static/unit review; they do prevent final closure.

## 6. Mandatory test design

For each applicable behavior, cover success, failure, validation boundaries, empty/null/missing/duplicate inputs, zero/negative/maximum/rounding/timezone values, unauthorized/forbidden/cross-user cases, missing/deleted relations and unexpected infrastructure errors. Add retries, replay, expiry, ordering, rollback and concurrent requests where state or money can change. Specify expected persisted state, response and side effects, including absence of unwanted side effects.

| File/behavior type | Required verification |
| --- | --- |
| Domain entity/value object/policy | Isolated behavior and invariant tests; legal/illegal transitions and relevant boundaries |
| Application command/query/service | Outcomes plus state/side effects, missing dependencies, failure propagation and orchestration; integration for transaction-dependent behavior |
| Repository/mapper/raw SQL | Real PostgreSQL CRUD/query/pagination, null mapping, constraints, isolation/cascades, rollback and races; mocked Prisma calls alone do not close it |
| Route/controller/schema/auth hook | Full prefix/method/path through HTTP injection with real disposable DB; public/auth/role/ownership matrix, body/query/params, error/status/envelope and persisted effects |
| Integration adapter | Deterministic fake/local-server error contracts plus actual supported provider sandbox/emulator checks; validate signatures, retry/timeout/redaction/idempotency |
| Event publisher/subscriber | Missing/duplicate handlers, subscriber failure, concurrent/replayed delivery, state consistency, retry and durability assumptions |
| Barrel/types/constants/generated SDK | Compile/export/consumer checks and regeneration/schema comparison; runtime tests only where executable behavior exists |
| Config/CI/build/operational utility | Config acceptance/rejection, task scope, disposable environment smoke and side-effect safeguards; review all code before running utilities |
| Existing test files | Independent expected outcome, realistic setup, deterministic clock/IDs, isolation/cleanup, no false-positive or swallowed failure; avoid tests that merely mirror an implementation |

Backend HTTP E2E and browser E2E are distinct. The university's full UI+backend journeys require browser-level checks as a later acceptance lane, even while detailed UI code review remains deferred. Cover all supported happy-path workflows and at least the three agreed critical journeys: account security/session lifecycle, checkout/payment/stock, and cancellation/refund/loyalty reversal. Confirm the application's actual flow/policies before implementing assertions.

## 7. Environments, commands and provider evidence

P00 inspects available local tools and provisions a disposable PostgreSQL environment with least-privilege test credentials; prefer isolated per-run databases or namespaces where supported. Require `TEST_DATABASE_URL`, `ALLOW_DATABASE_TEST_CLEANUP=1`, an allowed test-named database/host and validation before any client connection or cleanup. Review test setup to verify filename/path detection cannot bypass safeguards. Do not run existing `scratch/clear-database.ts`, drop/seed tools or production migrations blindly.

Current non-destructive local entry points:

```powershell
pnpm test
pnpm run test:coverage
pnpm run type-check
pnpm run lint
pnpm run format:check
```

These are baseline commands, not proof that every scope file is currently linted/formatted or covered. Audit their actual include/exclude/task graphs and extend only after reviewing and testing the change. `build:api` currently checks types; verify real deployable builds separately. Run database suites (`pnpm run test:vitest`) only after P00 has validated the separate disposable database, migrations and cleanup. Add focused commands and deterministic isolation as each phase requires them; record exact versions and commands used.

Provider lanes discovered so far: Stripe, FedEx, Firebase, Nodemailer/SMTP and ImageKit. Reconcile all remaining outbound integrations during the audit. Use provider test mode, supported emulator or a controlled local SMTP capture service for real adapter/protocol checks. Where hosted validation needs credentials/account setup or may create external effects, identify the exact prerequisite and obtain the appropriate authorization. Do not send real customer emails, place paid orders, purchase postage or manipulate production accounts as tests. Local doubles never get labelled a live-provider pass. Unsupported emulator capabilities and inaccessible sandboxes remain explicit limitations.

Migration/DB checks, external sandboxes and browser workflows are separate test results. A passing unit report does not close them. Record provider mode, command, case IDs, timestamp and safe output; never commit tokens, passwords, private keys or customer data.

## 8. Risk, performance and security completion

Security work covers authentication, role/object ownership, secret/token lifecycle, safe logs, input/HTML/URL boundaries, webhook authenticity/replay and dependency integrity. Trace actual server-side fetches before claiming SSRF. Include unknown/disabled routes and guest/member privilege transitions. Static scanners supplement manual review and executable security tests.

Map transaction and event boundaries across stock, carts, orders, payments and loyalty. Run deterministic real-DB concurrency tests (last-unit purchase, simultaneous reservation/release, duplicate refund/webhook/redemption) and verify final state and compensation. Define durable delivery requirements before changing event infrastructure; in-memory deduplication is not an outbox guarantee.

Inspect query plans/indexes and query counts on representative seeded volumes; measure relevant throughput, p50/p95/p99 latency, errors and resource usage under agreed workloads. Establish budgets from project expectations and measured baseline. Do not call a change a performance fix without evidence or invent an acceptable SLA. Run a current dependency audit during execution; record actual high/critical issues and resolutions rather than extrapolate from lockfile presence.

## 9. File, phase and final closure gates

A file can be `closed` only if its whole content has been reviewed at `reviewed_sha256 == sha256`, its callers/contracts are checked, applicable behaviors/tests are mapped, relevant tests/checks pass, uncovered cases are explained, and findings are resolved. Non-executable files record the exact compile/export/config/migration/documentation verification instead of fake test coverage. Secret environment files use private policy checks without exported values. A deleted file closes only after intended removal and consumer verification.

A phase closes when all its current files qualify, test/matrix/route/model links are complete, critical integration effects have passed, and no blocking question or defect remains. Valid test exceptions require a specific reason and owner's acceptance; keep the original denominator and distinguish them from fully verified files. Review independence/peer approval is reported honestly for this personal project.

Final dashboard must show: current scoped files; fully closed/pending/blocked/reopened files; mapped/passing/failing/blocked behavior cases; registered endpoints with complete integration evidence; models/migrations verified; provider lanes verified; overall/module/critical/changed-code coverage with uncovered items; unresolved findings and accepted exceptions; and clean reproducible build/runtime evidence. A row marked `reviewed-static` alone never contributes to “100% verified.”

## 10. Git workflow and session handoff

Use application-oriented names without an agent namespace: current `fix/shared-backend-foundation`; later examples `fix/user-management-review`, `fix/inventory-reservations`, `test/checkout-integration` and `docs/backend-audit-plan`. No tickets are required for the owner's personal workflow and none will be fabricated. Do not create a `develop` branch, rewrite old commits, push, merge, release or deploy merely to imitate the university example.

Keep fix and its regression together when feasible; include necessary shared-contract dependencies in a coherent commit. Separate pure formatting, unrelated refactors, tooling and documentation where useful. Conventional Commit messages describe actual behavior and review/test-case IDs. Inspect staged scope and diff; record what was tested. Do not claim that every intermediate commit was independently tested unless it was.

At each session end, report exact files read/closed, cases added/run, findings and decisions, coverage change, blockers and the next file/folder. Do not skip unfinished foundation work to make the progress count look better. Refresh the inventory after source/test changes. Maintain one current evidence ledger rather than start a new unlinked audit on each continuation.

**Immediate next execution:** P00 scope/test-environment validation and a route/provider/test inventory, followed by P01's remaining composition-root and generated-contract review. No application fix starts without its recorded review and acceptance evidence. Progress is measured by verified closure; calendar estimates will be based on observed review throughput and actual environment availability rather than an invented completion date.


## 11. Current review status and retained evidence

Updated: 17 October 2026. Current inventory after cleanup: **1,472 backend-related files**. **P00 remains open.** Current verified results: 66 unit test files / 409 tests passed. The most recent broad coverage measurement remains 11.76% lines and 7.84% branches from the earlier 367-test run; the latest unit run did not remeasure that denominator. The dedicated two-guard suite passed 38 tests with 100% line/branch coverage for those helpers only. Expanded type-check, lint, formatting and frozen offline pnpm checks passed; warnings and hosted Node 20/provider equivalence remain unverified.

Ten reviewed utility entry points now require an explicit disposable test destination before constructing Prisma. Create/drop also require same-server maintenance credentials and no longer terminate unrelated connections. Catalog seed/cleanup use transactions; admin seed preserves existing accounts; JPEG metadata and stale utility schema references were corrected. Real PostgreSQL checks verified successful operations, trigger-injected seed/cleanup rollback, bcrypt hashing, duplicate admin preservation and idempotent create/drop. A uniquely named temporary database inside `slipperze-audit-p00-postgres` was removed afterward. Base audit database `slipperze_audit_test` remains separate, with restricted `audit_test` role. Credentials remain in ignored local environment files and are never included in evidence.

Current evidence:

- [File register](backend-audit-register.csv), [scope summary](backend-audit-scope.json), [test matrix](backend-audit-test-matrix.csv).
- [Unit results](p00-unit-results.json), [broad coverage](p00-unit-coverage-current.json), [separate guard coverage](p00-database-safety-coverage.json).
- [Actual CLI/database checks and verified source hashes](p00-operational-database-check.json), [constructor-tripwire refusal checks](p00-operational-refusal-check.json), [fixture checks](p00-seed-fixture-check.json).
- [Compiler/lint/format scope](p00-check-scope.json), [installer decision](p00-lockfile-check.json), [operational utility register](p00-operational-script-register.csv).
- [Endpoint candidates](p00-endpoint-register.csv), [inert route registration](p00-route-registration.json), [test register](p00-test-register.csv), [provider register](p00-provider-register.csv).
- [University page notes](university-guidelines-page-notes.md) and [requirements matrix](university-requirements-matrix.md).

Open findings and next work:

| ID | Current status and remaining work |
| --- | --- |
| P00-01 | Integration-directory classification corrected; actual setup refusal verified. Application-table cleanup and module-specific database suites still require their own evidence. |
| P00-02 | Ten utility refusal paths and eight operational CLIs verified. Restock probes now use isolated fixtures, public event-bus access, awaited completion and rollback/cleanup; no actual notification delivery is certified. Remaining scratch utilities need destination, logging, outbound-call and retain/replace/remove decisions. Expiry/renewal probe now verified with owned fixtures and failure cleanup; remaining cart inventory restoration and diagnostic/outbound utilities are next. Cart inventory probe restoration assumptions remain open; its body is not certified. |
| P00-03 | Compiler/lint scope expanded; CJS files receive lint/execution checks rather than a claimed TypeScript pass. Generated contract semantics, effective authorization, production composition, hosted CI, concurrency and provider checks remain in owning phases. |
| P00-04 | Resolved: obsolete npm lock removed, pnpm-only consumers checked and frozen offline validation passed without upgrades. |
| P00-05 | README claims corrected; obsolete architecture/CV/testing/index reports removed. Historical scores, performance estimates and proposed indexes are not verification evidence. |
| P00-06 | Newly exposed Vitest/schema diagnostic errors corrected; explicit tooling compiler is part of root type-check. |
| P00-07 / P10 follow-up | The restock subscriber logs simulated delivery, marks missing-contact reminders sent, filters pending reminders without restricting type, uses a default 50-item page and catches processing failures. Its delivery, filtering, pagination and retry policies require dedicated engagement tests/review; the operational state probe does not close these findings. |

P01 still requires complete shared foundations, composition/container and generated-contract review. P02 must verify migration history; the operational test used schema synchronization, not migration replay. Do not skip to user management. Eight current safety/probe source and test files now meet strict closure; all other files retain their actual evidence state. Refresh inventory after cleanup and reopen changed evidence as required.

The owner requested removal of generated/obsolete prose while retaining essential project and audit documents. Historical Markdown reports and the unused loyalty data export are intentionally removed. Relevant CSV/JSON evidence remains so ongoing verification does not restart from assumptions. Removal is housekeeping, not resolution of unrelated application findings.


Restock utility batch (17 October): complete reads of both original utilities, their shared probe replacement and test file, and traced subscriber/event-bus/reminder persistence behavior. Original committed utilities reached the Prisma constructor without safe settings in a blocked-constructor diagnostic; current utilities refuse before construction. The dispatcher uses `container.get<IEventBus>("eventBus")` (the event bus is registered), not private-map access. Fourteen helper tests pass with 100% line/branch coverage for that helper only. Real PostgreSQL checks pass on an empty catalog and under injected reminder-insert failure: all fixture tables remain empty or the prior seeded catalog remains unchanged. Temporary database deletion is verified. See [restock coverage](p00-restock-coverage.json), [baseline diagnostic](p00-restock-baseline-reproduction.json), and the updated operational DB/refusal evidence. No new Markdown reports were created.


Expiry/renewal utility batch (17 October): read the entire original script and new probe/test implementations; traced add-to-cart, cart summary/persistence, reservation mapping, expiry synchronization and the current duration constant. Reproduced the original forced exit code 0 after an injected server boot failure using inert imports, without opening a DB client. The replacement guards before client/container setup, uses generated fixtures, asserts expired-to-active state, configured expiry timing, persisted cart/reservation alignment, quantity 2 and exactly one cart line, then removes only its fixture IDs. No HTTP server is started and process termination is not forced.

Twenty-eight new expiry cases pass; the combined 42-case expiry/restock helper suite reaches 100% lines/branches for those helpers only. Corrected synthetic SKU generation to uppercase in both probes, with assertions, after the first real-DB run exposed fixture invalidity against the catalog SKU value object. A table-driven test initially spread an empty array into no arguments; its case data now wraps arrays explicitly. These were probe/test issues, not production renewal defects. Positive PostgreSQL renewal passes, as do injected reservation insertion failure and expiry-sync failure after cart persistence. All cases remove owned fixtures/preserve the prior catalog; the new temporary database is checked absent afterward. [Focused coverage](p00-expiry-coverage.json), [original failure-exit diagnostic](p00-expiry-baseline-reproduction.json), current unit results and operational DB/source-hash evidence retain exact limits.

P00-08: original expiry utility's unguarded server boot, fixed IDs, print-only checks, missing guaranteed cleanup and forced successful exit are corrected in the bounded probe. P00-09: removing the server import revealed that tooling acquired Fastify authentication augmentation accidentally; `tsconfig.tooling.json` now includes existing plugin sources explicitly. Root/tooling compilers and focused lint/format pass. No notification provider or live application database was used.

P06 follow-ups remain open: cart/reservation updates span separate persistence operations, expiry-sync failure can occur after cart save, and cart lines have a non-unique composite index rather than an enforced uniqueness constraint. The probe's cleanup and rejection assertions do not fix or certify application transactionality/concurrency. Add failure/concurrency regression tests during the cart review. The production adapter's catch-all mapping of catalog errors to missing products/variants also needs P01/P04/P06 error-boundary review. The configured reservation default is currently one minute; intended business duration remains to be reconciled during P06.
