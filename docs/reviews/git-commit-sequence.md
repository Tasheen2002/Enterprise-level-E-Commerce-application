# Shared backend foundation commit sequence

Prepared 17 October 2026. Branch: `codex/fix/shared-backend-foundation`.

The branch starts from the existing `feature/wishlist` state at `c8de2c22931d20418d35809f0b7060d99c936815`, preserving its prior application work. The owner confirmed this is a personal project without tickets and approved a descriptive branch. Commit bodies reference the review's SF/S finding identifiers; they do not invent GitHub issue numbers or claim to close issues.

University PDF sections 3.2 and 3.4 informed the branch intent and Conventional Commit format. The ticket component is intentionally omitted for this personal workflow; the `codex/` namespace identifies agent-created branches. No `develop` integration branch, approved PR, protected-branch setting, release tag, remote push or deployment is implied by these local commits.

| Step | Commit | Scope |
| --- | --- | --- |
| 1 | `cd305e86` | `refactor(cqrs): use canonical core contracts across modules` |
| 2 | `b23c099b` | `fix(core): protect event queues and normalize value objects` |
| 3 | `9d8a148d` | `style(backend): apply shared formatting and lint corrections` |
| 4 | `7361ee70` | `test(database): guard destructive test cleanup` |
| 5 | `c2db928b` | `build(backend): wire compiler lint and coverage tooling` |
| 6 | `6bc1777f` | `fix(auth): validate access tokens and persist session revocation` |
| 7 | `bc68ccd3` | `fix(api): isolate rate limit policies and verified identities` |
| 8 | `194effb3` | `fix(api): standardize safe error responses and failure statuses` |
| 9 | `9a4017c4` | `fix(validation): unify profile schema and repair package exports` |
| 10 | `d3113828` | `refactor(email): share the mail port and correct frontend links` |
| 11 | `3a78fe49` | `fix(config): validate provider settings and manage API lifecycle` |
| 12 | `76c37ae7` | `fix(api-client): share refresh requests and release retry clones` |
| 13 | `883cd344` | `test(foundation): cover shared backend security and contracts` |
| 14 | `ffdeb548` | `ci(backend): run shared checks and publish unit coverage` |
| 15 | This documentation commit | `docs(review): record backend findings fixes and verification` |

Each group was staged by explicit paths, checked against its planned file list and checked with `git diff --cached --check` before committing. Dependency manifest updates and the synchronized lockfile share one tooling commit. Existing tests whose imports changed are included with the CQRS migration; newly added foundation tests have their own test commit. Earlier TypeScript, lint, formatting, consumer and coverage checks are detailed in the remediation record. The latest full unit run passed **329 tests in 62 files** before recording the commits; each intermediate commit was not independently checked out and retested.

Remaining verification limits and low overall coverage are documented in [the remediation record](01-shared-foundation-remediation.md). These commits do not establish that the whole backend has been reviewed or meets the university coverage targets.

To inspect this sequence locally:

```powershell
git log --reverse --oneline c8de2c22931d20418d35809f0b7060d99c936815..HEAD
git show --stat <commit>
```
