# University guideline: page-by-page reading notes

Source: `C:/Users/TASHEEN/Downloads/SENG34213_System_Development_Project.pdf`.
Read on 17 October 2026. All 58 physical PDF pages were text-extracted, rendered and visually inspected. References below use **physical PDF pages**, not the printed footer; PDF page 2 has printed page 1, and this one-page offset continues through PDF page 58 / printed page 57.

The source is **SENG 34213 System Development Project: Course Guideline & Industrial Standards**, version 1.0, 2026, Software Engineering Teaching Unit, University of Kelaniya. It describes the development course continuing SENG 31242; it is not this application's SRS or SDS.

The user's request authorizes understanding, structural mapping and preparation for a later file-level review. Statements in the PDF are assessment criteria and source material, not commands to modify this repository, contact people, submit forms, change GitHub settings, or deploy software. Example tickets, code listings and screenshots are distinguished from general course requirements.

| PDF page | Printed page | Content understood and relevance |
| --- | --- | --- |
| 1 | Cover | Course identity; Year 3 Semester 2; 16 weeks; 3 credits; prerequisite SENG 31242; version 1.0, 2026. Establishes document provenance. |
| 2 | 1 | Contents through testing subsections. Confirms scope includes environment, workflow, project management, code and testing. |
| 3 | 2 | Remaining contents: coverage, CI/CD, security, demo, assessment and appendices A-D. No appendix is excluded from this reading. |
| 4 | 3 | Course overview: turn approved SRS/SDS into a tested deployable product. Sprint-based teamwork, CI, reviews, TDD and staged deployment are course expectations. Prerequisite is academic administration, not a code check. LO1 and beginning of LO2. |
| 5 | 4 | Remaining learning outcomes: code standards, automated tests, CI/CD, Git practice, professional documentation, live demo and reflection. Continue original organisation/board. Trace implementation to SRS/SDS; substantial deviations require an ADR, supervisor review within a sprint, and updated SDS. |
| 6 | 5 | Sixteen-week phase gates: kickoff; foundation weeks 1-4; features 5-8; integration 9-12; hardening 13-14; staging 15; final demo 16. Phase table calls development phases Sprint 1-4. |
| 7 | 6 | Formal sprint calendar calls these Sprint 5-8, continuing design Sprints 1-4. Treat 5-8 as development milestone names; do not silently invent actual calendar dates. |
| 8 | 7 | Suggested backend/frontend/infra/tests/documents repositories. Explicitly permits one `app` repository for a simpler monolith if justified in an ADR; co-located integration/E2E tests are allowed. A monorepo alone is not a defect. |
| 9 | 8 | Protected `main`, integration `develop`, ticket-based feature/fix branches, hotfix and release branches. Feature branch older than five working days without a PR signals work breakdown problems. Remote protection is not inferable from local branches. |
| 10 | 9 | Figure 3.1 illustrates feature-to-develop PR merges and hotfix-from-main workflow. SemVer MAJOR/MINOR/PATCH; development sprint releases v0.1.0, v0.2.0, v0.3.0, v1.0.0. |
| 11 | 10 | Conventional Commit types and worked commit examples, including design/issue/ADR references. Example issue numbers and business claims are illustrative. |
| 12 | 11 | Continuation of inventory-test commit example: happy path and boundary cases. Not an additional feature requirement for this application. |
| 13 | 12 | Extend the existing GitHub board with Phase=Development; Figure 4.1 illustrates Backlog, To Do, In Progress, In Review, Done. Screenshot is a workflow illustration, not evidence about this repository. |
| 14 | 13 | Development epic categories: setup, data, API, auth, core features, frontend, integration, testing, CI/CD, security, performance, documentation. Introduces precise development tickets. |
| 15 | 14 | Figure 4.2 shows issue title and metadata. Ticket template starts with user story, SRS/SDS/ADR references and testable acceptance criteria. `FR-<number>` is a placeholder, not an actual Slipperze requirement ID. |
| 16 | 15 | Ticket template continues: happy path, error and edge cases; technical notes; unit/integration/negative tests; DoD. Each acceptance criterion should map to a test. |
| 17 | 16 | DoD continuation: coverage, develop PR, peer review, lint, CI, API docs and issue linkage; estimates/dependencies. Begins worked refresh-token example. |
| 18 | 17 | Example refresh ticket: 15-minute access / seven-day refresh, rotation, expiry, reuse detection and session termination. These exact lifetimes/error strings belong to the example, not a universal mandate for this application. Security scenarios remain useful review candidates. |
| 19 | 18 | Example concurrent-refresh acceptance criterion and transaction/hash/entropy guidance; explicit negative/concurrency tests and 90% example TokenService coverage. Table name, algorithm call and HTTP choice are illustrative implementation details. |
| 20 | 19 | Example concludes with Postman, changelog, six-hour estimate and issue dependency. Do not adopt the example's estimate or invented ADR as project history. |
| 21 | 20 | General coding requirements: SOLID, DRY, YAGNI, meaningful names, focused functions, minimal side effects, no magic numbers. Team selects a style guide; JS/TS recommendation is Airbnb with ESLint/Prettier. Linter config must be committed. |
| 22 | 21 | At least one approving peer review per PR. Review correctness, readability, architecture, behavior-focused tests, security, performance and error handling. Comment categories blocker/suggestion/question/nit; reviewer verifies and resolves their comments. |
| 23 | 22 | Figure 5.1 illustrates PR conversation, unresolved blocker and CI checks. Screenshot is not a live GitHub requirement implementation. |
| 24 | 23 | Testing is part of completion. Pyramid: unit isolation, API/module/database integration, E2E full UI+backend journeys. Unit coverage target 80% new code; integration all endpoints; E2E all happy paths/top three critical flows. Timing column is illustrative guidance, not sufficient proof of test quality. |
| 25 | 24 | Unit tests use Arrange-Act-Assert and Given-When-Then naming. Begins mocked TokenService example testing rotation behavior. Jest syntax is illustrative; equivalent Vitest behavior is acceptable. |
| 26 | 25 | Unit example continues expired-token rejection and begins reused-token test. Requires assertions on outcomes as well as relevant side effects. |
| 27 | 26 | Reuse example checks session revocation; integration standards require real HTTP endpoints against a test database with seeded isolated data. Starts HTTP test example. |
| 28 | 27 | HTTP example checks response and persisted old-token invalidation; negative case verifies stale token rejection. Matching example error strings is not an application-wide requirement. |
| 29 | 28 | Test-case register fields: ID/name, requirement, test file, type, priority, preconditions, input, expected/actual results, status. Actual results must come from execution. |
| 30 | 29 | Formal thresholds: new-code unit lines/branches >=80%; every API endpoint has an integration test; critical business logic >=90% branch coverage. CI generates coverage linked in sprint reviews. Test counts do not establish coverage. |
| 31 | 30 | GitHub Actions CI/CD required by end of development Sprint 5 / week 4. Historical timing needs project evidence. |
| 32 | 31 | Required stages/triggers: lint+format/build/unit+coverage every branch push; integration on develop push/PR; dependency scan on develop/main; staging after develop merge; manually approved tagged production release after main merge. |
| 33 | 32 | Minimal YAML example begins lint/format and database-backed tests. Example uses npm and Node 20; the project can use its chosen package manager if the required behavior is met. |
| 34 | 33 | YAML example continues unit/integration execution, coverage artifact and dependency audit. Illustrative YAML is not complete implementation of every stage in page 32's requirements table. |
| 35 | 34 | Secrets must not be committed, including private repositories; local ignored env, GitHub Secrets and placeholder `.env.example`. Figure 7.1 illustrates a successful pipeline; it does not establish a project pass. |
| 36 | 35 | Security chapter introduces implementation evidence addressing the specified OWASP risk categories in the final report. Document checklist is not a security certification. |
| 37 | 36 | Security table: authorization, bcrypt >=12, token hashes/TLS, injection validation, threat model, safe config/errors, dependency scanning, lockout/sessions, lockfiles, safe logging and SSRF URL allowlists. Gates: lint zero, coverage >=80%, no high/critical dependency findings, blockers resolved, approved main PR. Apply access policies to protected endpoints while retaining intentional public routes; distinguish unauthenticated 401 from forbidden 403. |
| 38 | 37 | Week-16 staged demo: 20 minutes plus 15-minute Q&A; all members contribute. Script allocation: context 2, features 12, architecture 3, limits 2, lessons 1 minute. |
| 39 | 38 | Staging, not localhost; unresolved deployment failure fails demo. Submit org/repo/app/board URLs and applicable demo credentials at least 48 hours before. README must include fresh-machine setup, deployed link and CI/coverage badges. |
| 40 | 39 | Chapter 10 divider introducing deliverables and assessment; no additional standalone technical rule. |
| 41 | 40 | Twelve deliverables: final SRS/SDS, development report, source, pipeline, coverage, test register, security evidence, performance results, deployment URL, retrospectives and individual peer evaluation. Some belong in a separate documents repository; absence here does not prove absence everywhere. |
| 42 | 41 | Confidential individual peer evaluations: every rating justified; evidence where relevant; named PDF via eKelaniya within 48 hours of demo. No authority to submit or complete other people's assessments follows from reading this page. |
| 43 | 42 | Weights: working product 30%, code quality 20%, testing 20%, demo 15%, progress 15%; table specifies 40% minimum per component and 40% overall. Report covers justified stack, modules, DB, pipeline, decisions, testing and performance. |
| 44 | 43 | Report continuation: security evidence; evaluation against SRS, feedback, limitations/defects, future work; conclusion, references and appendices. |
| 45 | 44 | Appendix A DoD consolidates AC verification, standards, unit/API tests, coverage, secrets, develop PR/review, CI, staging smoke test, API docs, changelog and issue closure/board state. Completion is evidence-based. |
| 46 | 45 | Appendix B review agenda: demos, velocity/CI/coverage metrics, supervisor feedback, unfinished-work causes. Retrospective template starts with date/attendees, successes, improvements and actions. |
| 47 | 46 | Retrospective continuation: action owner/due date; planned/completed work, story points, CI pass rate and coverage. Do not invent these historical values. |
| 48 | 47 | Appendix C setup checklist: protected repos/develop default, ignored env/example, linter, first CI, milestones/epics, >=15 initial issues with metadata/AC, capacity, committed standards, tests and badges. Requires local plus remote/process evidence. |
| 49 | 48 | Appendix D cover/instructions and self-evaluation identity fields. Confidential 1-5 ratings, mandatory written reasons and optional evidence. |
| 50 | 49 | Self-evaluation criteria: contribution quality, commitment/effort, collaboration, reliability, initiative; strengths, improvements, overall view and evidence. |
| 51 | 50 | Team member 1 identity and same five ratings with mandatory justifications. |
| 52 | 51 | Team member 1 narrative strengths, improvements, assessment and evidence. |
| 53 | 52 | Team member 2 identity and same five justified ratings. |
| 54 | 53 | Team member 2 narrative/evidence continuation. |
| 55 | 54 | Team member 3 identity and same five justified ratings. |
| 56 | 55 | Team member 3 narrative/evidence continuation. |
| 57 | 56 | Team member 4 ratings, conditional on five-person team. Do not infer actual team size from blank template. |
| 58 | 57 | Team member 4 narrative/evidence continuation; end of document. |

## Interpretation decisions for the application review

- Preserve the course's explicit thresholds and evidence requirements without treating every sample implementation as mandatory.
- Use the allowed monolith/monorepo exception with an architecture rationale; do not split working code simply to imitate the suggested repository names.
- Use the required-stage table to assess CI; its sample YAML has narrower triggers and lacks some required stages.
- Treat Sprints 5-8 as the calendar's formal development sprint numbering; page 6 uses phase-local numbering.
- Keep source-code defects, course evidence gaps, team preferences and optional improvements separate.
- Verify security behavior against actual routes and data flows. Public endpoints need an explicit public policy, not indiscriminate authentication. Logs need useful audit information with sensitive fields redacted, not literal recording of all personal data.
- Benchmark current technical advice against official documentation when a later finding depends on a version-specific API or contemporary standard. This phase reports the university document's own criteria, not a claim that its OWASP labels are the newest edition.
