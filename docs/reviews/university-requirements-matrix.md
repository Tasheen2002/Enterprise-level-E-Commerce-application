# University requirements translated into review criteria

Source: SENG 34213 guideline, version 1.0, 2026. Page references use physical PDF pages (printed footer is one lower after the cover). This is a review baseline, not a completed compliance certificate.

Status meanings: **present** = artifact/code observed, behavior still needs verification; **partial** = some evidence with an identified gap; **not found here** = absent from inspected local tracked scope, may be elsewhere; **unverified** = requires later code/runtime/remote/process evidence. Suggested adoption is not authorization to change branches, deploy or create historical records.

| ID | Pages | Requirement or criterion | Current evidence / status | Review action |
| --- | --- | --- | --- | --- |
| U01 | 4-5 | Implement approved SRS/SDS; trace design changes through ADRs and updated SDS | Project SRS/SDS/ADR set not found here | Map real requirement IDs to modules/tests once available; do not invent IDs. |
| U02 | 5, 13, 48 | Continue organisation/project board; Development phase and sprint metadata | Unverified remotely | Inspect existing board/organisation evidence when supplied or accessible. |
| U03 | 6-7, 10 | Sixteen-week plan, development Sprints 5-8, milestone releases | Local release tags not listed; actual schedule unverified | Record project dates and release evidence, not retrospective invented sprints. |
| U04 | 8 | Justified repository structure; monolith and co-located tests permitted | Monorepo and co-located tests present; rationale ADR not found here | Preserve suitable architecture; document its rationale if used for course submission. |
| U05 | 9, 22, 45, 48 | Protected main, develop flow, short-lived ticket branches, approved PRs | Local feature/main branches observed; remote protections/reviews unverified | Inspect actual remote policy/history separately; don't infer compliance from branch names. |
| U06 | 10-12 | SemVer release tags and Conventional Commits with issue links | Recent commits use conventional prefixes; no local tags listed | Audit actual release/commit/issue linkage later. |
| U07 | 14-17, 48 | Technical tickets: story, design references, BDD AC, tests, DoD, estimate/dependencies and metadata | No issue evidence inspected | Use as an issue template when remediation work is requested; no fictional history. |
| U08 | 21 | SOLID, DRY, YAGNI and clean code | Architecture conventions and layers present; file-level conformance pending | Evaluate responsibilities, duplicate rules, unused abstractions and maintainability with concrete impact. |
| U09 | 21-22 | Agreed language style and committed linter configuration | Root ESLint and shared lint/Prettier presets present; enforcement partial/unverified | Trace actual scripts/config resolution for API, modules and packages. Airbnb is a recommended choice, not the only imaginable standard. |
| U10 | 22-23 | Peer review checks correctness/readability/architecture/tests/security/performance/errors; blockers resolved | Remote review evidence unverified | Use dimensions for findings; separate blocker/suggestion/question/nit. |
| U11 | 24-28 | Unit AAA and behavior-oriented naming/assertions; real DB/HTTP integration | Vitest and test directories present; representative HTTP suites use injection | Examine test quality and negative/edge behavior file by file; mock call assertions alone aren't enough. |
| U12 | 24, 30, 37, 45 | >=80% new-code unit line/branch coverage | Vitest tests present; coverage configuration/report not found in inspected setup | Measure with explicit include/exclude scope, enforce threshold and publish report when implementation work begins. |
| U13 | 30 | >=90% branch coverage of critical business logic | Critical-code map/coverage report not found here | Identify critical auth, stock, checkout, payment and loyalty logic; confirm against SDS. |
| U14 | 24, 30 | Integration test for every API endpoint | HTTP suites present; complete endpoint/test mapping unverified | Build method+route register including negative authorization, ownership and invalid-input tests. |
| U15 | 24 | E2E UI+backend journeys for happy paths/top three critical flows | Inspected E2E-named suite uses Fastify injection; browser framework not found in targeted tracked search | Verify real browser journeys separately. Authentication, purchase and staff order processing are candidate critical flows pending SRS. |
| U16 | 29, 41 | Test-case register tied to requirement and test file, expected/actual results and status | Register not found here | Produce from actual tests/executions; expected output is not actual output. |
| U17 | 30, 32-34 | CI produces coverage reports and sprint links | Workflow runs Vitest without coverage/artifact publication | Add explicit reporting/enforcement in a later change; current test count proves no coverage percentage. |
| U18 | 31-32 | GitHub Actions; lint/format/build/unit on every branch push; integration develop push/PR | Workflow present but push main/develop and PR main only; no dedicated formatter check | Audit full Turbo task graph and extend triggers/stages as needed. Type-check and container packaging are not sufficient evidence of all production builds. |
| U19 | 32, 34, 37 | Dependency scan on develop/main; no high/critical known vulnerabilities | Scan not defined in inspected workflow; current audit result unverified | Run an appropriate current dependency audit later; no assertion that dependencies are safe or vulnerable now. |
| U20 | 32, 35, 45 | Auto staging after develop merge; approved tagged production release after main merge; smoke test | Workflow publishes API image to GHCR; staging/production deployment stages absent | Distinguish package publication from running deployment; retain explicit approval boundaries. |
| U21 | 35, 45, 48 | No committed secrets; ignored local env; GitHub Secrets; placeholder example | `.env` ignored; `.env.test` tracked; `.env.example` not found here | Inspect sensitivity and CI env precedence without printing secrets; test placeholders alone aren't proof of a leak. |
| U22 | 37 | Broken-access-control mitigation with authorization tests | Auth/role middleware and domain services exist; endpoint ownership behavior pending | Establish public/protected policy per route; test 401/403 and cross-user/guest access correctly. |
| U23 | 37 | bcrypt >=12, token hashes, TLS | Hasher default 12 and default construction observed; hashing/TLS completeness unverified | Trace effective constructor/config, token types, reset/verification storage, staging transport and session lifecycle. |
| U24 | 37 | Input validation/sanitization and parameterized persistence | Zod/Prisma present; all entry points/raw SQL not reviewed | Inspect injection, HTML sanitization, uploads, query coercion and response serialization. ORM use alone is insufficient proof. |
| U25 | 37 | Threat model in SDS and review against it | Threat model not found here | Identify assets/trust boundaries and abuse cases; map to approved design when available. |
| U26 | 37 | Safe production configuration/errors; no default credentials | Error/config/security plugins present; deployment behavior pending | Review fail-closed configuration, error redaction, CORS, headers and provider secret requirements. |
| U27 | 37 | Account lockout and secure sessions; MFA optional | Auth/token blacklist/session/TOTP implementation files present | Verify expiry, rotation/reuse/concurrency, revoke behavior, lockout and backup-code single use. |
| U28 | 37 | Package integrity/lockfiles | pnpm and npm lockfiles present | Determine authoritative install path and version alignment; presence alone does not prove deterministic CI. |
| U29 | 37 | Useful auth/error/data-access logging without PII/secrets | Fastify/Pino and other logs present; completeness/redaction unverified | Trace sensitive tokens, addresses, webhook payloads and external errors; audit logging proportional to risk. |
| U30 | 37 | SSRF mitigation and external URL allowlists | External integration/media code present; URL-input boundaries pending | Identify server-fetched user-controlled URLs; do not invent SSRF where no server request exists. |
| U31 | 38-39 | Staging demo, 20+15 minutes, all members; URLs/credentials >=48 hours before | Deployment/demo evidence unverified | Prepare realistic seeded journeys and actual staging evidence later. |
| U32 | 39 | README fresh-machine setup, env prerequisites, deployed URL and CI/coverage badges | README has description/setup; required example file/link/badges not observed | Verify setup from a clean environment and replace aspirational claims with tested instructions. |
| U33 | 41, 43-44 | Updated design/report, security evidence, measured performance and test artifacts | General audit/plan markdown exists; formal artifacts not found here | Distinguish plans/opinions from actual results and document implemented architecture. |
| U34 | 45 | Per-issue DoD includes AC/tests/coverage/review/CI/staging/docs/changelog/issue closure | Full issue evidence unverified; changelog not found here | Record proof for remediation tasks rather than marking everything done by code presence. |
| U35 | 46-48 | Reviews/retrospectives with metrics, owners and due dates; initial sprint setup evidence | Not found here; may be wiki/documents repository | Use existing genuine history; do not fabricate past meetings or approvals. |
| U36 | 42, 49-58 | Confidential individual peer evaluation with justified ratings and evidence; within 48 hours of demo | Outside backend code review scope | User/team academic responsibility; no automated ratings or submission inferred. |

## Severity and applicability

- **Confirmed code defect:** demonstrate a concrete incorrect/unsafe outcome and the responsible file/caller.
- **Quality improvement:** explain maintainability or performance benefit; distinguish measured behavior from a hypothesis.
- **Course evidence gap:** required proof is missing here or not inspected; do not call it a runtime defect.
- **Project convention mismatch:** compare with `project_domain_patterns.md`; do not imply method order or naming is a universal industry rule.
- **Unverified requirement:** evidence depends on the approved project specification, remote settings, runtime measurements or external artifacts.

No numerical compliance score is assigned until the applicable evidence has been examined. The university's assessment weights are product 30%, quality 20%, testing 20%, demonstration 15%, progress 15% (PDF page 43); they are grading weights, not a proposed automatic code-quality scoring formula.
