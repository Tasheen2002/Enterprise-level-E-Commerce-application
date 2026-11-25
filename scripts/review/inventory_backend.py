"""Inventory audit scope and preserve evidence; reading/hash collection is not a review."""
from __future__ import annotations

import argparse
import collections
import csv
import datetime
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/reviews/backend-audit-register.csv"
SUMMARY = ROOT / "docs/reviews/backend-audit-scope.json"
OLD = ROOT / "docs/reviews/backend-file-register.csv"
FIELDS = [
    "path", "scope", "scope_reason", "area", "phase", "file_kind", "present",
    "sha256", "lines", "prior_review_status", "prior_finding_ids", "prior_hash_matches",
    "review_status", "reviewed_sha256", "review_evidence", "behavior_ids", "test_files",
    "test_commands", "test_result", "line_coverage", "branch_coverage", "uncovered_cases",
    "finding_ids", "closure_status", "closure_reason",
]
EVIDENCE = FIELDS[12:]
PHASES = {
    "user-management": "P03", "product-catalog": "P04", "inventory-management": "P05",
    "cart": "P06", "order-management": "P07", "payment": "P08", "loyalty": "P09",
    "engagement": "P10", "fulfillment": "P11", "customer-care": "P12", "analytics": "P13",
    "shared": "P01",
}


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True, encoding="utf-8").strip()


def load_rows(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return {row["path"]: row for row in csv.DictReader(handle)}


def classify(path: str) -> tuple[str, str, str, str]:
    """Explicit dispositions cover every tracked/nonignored candidate, including exclusions."""
    parts = path.split("/")
    if path.startswith("docs/reviews/"):
        return "audit-record", "Audit evidence is tracked separately from application completion", "audit", "P00"
    if path.startswith("modules/"):
        module = parts[1]
        return "backend", "All business/shared module files, including unregistered modules and tests", f"modules/{module}", PHASES.get(module, "P00")
    if path.startswith("apps/api/"):
        return "backend", "Complete API host, composition, routes, tests and build inputs", "apps/api", "P01"
    if path.startswith(("prisma/", "db/")):
        return "backend", "Schema, migration, index and database support review", parts[0], "P02"
    if path.startswith(("scripts/", "scratch/")):
        return "backend-support", "Inspect all operational utilities/data before any execution", parts[0], "P00"
    if path.startswith("packages/"):
        package = parts[1]
        if package == "ui":
            return "excluded-frontend", "UI implementation deferred; backend contract dependencies still traced", "packages/ui", "frontend"
        if package in {"core", "types", "validation", "api-client", "config"}:
            return "backend", "Complete shared library/config/generated-contract scope", f"packages/{package}", "P01"
        return "scope-triage", "New/unknown package must be classified before closure", f"packages/{package}", "P00"
    if path.startswith(("apps/web/", "apps/admin/")):
        app = "/".join(parts[:2])
        if "/app/api/" in path or path.endswith(("middleware.ts", "/route.ts", "/route.tsx")):
            return "frontend-boundary", "Server route or middleware is backend behavior despite app location", app, "P01"
        if path.endswith(("package.json", "tsconfig.json")) or "/next.config." in path:
            return "frontend-boundary", "App runtime/build configuration affects server and shared contracts", app, "P14"
        if path.endswith((".ts", ".tsx", ".js", ".mjs", ".cjs")):
            content = (ROOT / path).read_text(encoding="utf-8", errors="replace")
            markers = ["server-only", '"use server"', "'use server'", "@tasheen/api-client", "@tasheen/validation", "@tasheen/types", "api-client", "api-server", "fetch(", "fetch (", "axios"]
            if any(marker in content for marker in markers):
                return "frontend-boundary", "Contract/server/client candidate; trace transitive consumers during route review", app, "P14"
        return "excluded-frontend", "Pure frontend/assets candidate; reclassify if dependency tracing finds backend behavior", app, "frontend"
    if path.startswith(".github/"):
        return "backend-support", "Delivery and repository automation affects backend verification", ".github", "P00"
    if "/" not in path:
        if path == "FRONTEND_UI_UX_AUDIT.md":
            return "excluded-frontend", "Frontend-only historical report", "root", "frontend"
        return "backend-support", "Root config, dependency, documentation or environment-policy input", "root", "P00"
    return "scope-triage", "Unclassified directory must be resolved; never silently excluded", parts[0], "P00"


def kind(path: str) -> str:
    name = Path(path).name
    if name.startswith(".env") and name != ".env.example":
        return "sensitive-environment-metadata-only"
    if name in {"package-lock.json", "pnpm-lock.yaml"}:
        return "dependency-lockfile"
    if "/generated/" in path:
        return "generated-contract"
    if "/migrations/" in path or path.endswith(".sql"):
        return "migration-or-sql"
    if "/test/" in path or ".spec." in name or ".test." in name:
        return "test"
    if path.endswith((".md", ".txt")):
        return "documentation-or-data"
    if name == "index.ts" or name.endswith(".d.ts"):
        return "exports-or-declarations"
    return "source-or-configuration"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="Keep evidence for unchanged hashes; reopen changed files")
    parser.add_argument("--date", default=datetime.date.today().isoformat())
    args = parser.parse_args()
    if OUT.exists() and not args.refresh:
        parser.error("Register already exists; use --refresh to preserve evidence rather than overwrite it")
    existing, historical = load_rows(OUT), load_rows(OLD)
    candidates = set(git("ls-files").splitlines()) | set(git("ls-files", "--others", "--exclude-standard").splitlines())
    candidates.update([OUT.relative_to(ROOT).as_posix(), SUMMARY.relative_to(ROOT).as_posix()])
    rows = []
    for path in sorted(candidates):
        file = ROOT / path
        scope, reason, area, phase = classify(path)
        file_kind = kind(path)
        # Hash locally without displaying/exporting environment contents.
        opaque = scope == "audit-record"
        data = file.read_bytes() if file.is_file() and not opaque else b""
        digest = "not-collected" if opaque else hashlib.sha256(data).hexdigest()
        prior = historical.get(path, {})
        row = dict.fromkeys(FIELDS, "")
        row.update(path=path, scope=scope, scope_reason=reason, area=area, phase=phase,
                   file_kind=file_kind, present="yes" if file.is_file() or path in {OUT.relative_to(ROOT).as_posix(), SUMMARY.relative_to(ROOT).as_posix()} else "no",
                   sha256=digest, lines="" if opaque else str(len(data.splitlines())),
                   prior_review_status=prior.get("review_status", "not-in-original-register"),
                   prior_finding_ids=prior.get("finding_ids", ""),
                   prior_hash_matches="not-comparable" if opaque or not prior else str(prior.get("sha256") == digest).lower(),
                   review_status="pending", test_result="not-mapped", closure_status="open")
        if scope.startswith("excluded"):
            row.update(review_status="out-of-backend-scope", test_result="not-applicable", closure_status="excluded", closure_reason=reason)
        elif scope == "audit-record":
            row.update(review_status="audit-artifact", test_result="not-applicable", closure_status="separate-artifact", closure_reason=reason)
        old = existing.get(path)
        if old:
            for field in EVIDENCE:
                row[field] = old.get(field, row[field])
            if old.get("sha256") != digest or old.get("scope") != scope:
                row.update(review_status="needs-revalidation", test_result="stale-evidence", closure_status="open", closure_reason="Content/scope changed; retain evidence as history and reverify current file")
        verified_removal = bool(old and old.get("present") == "no" and old.get("review_status") == "reviewed-removal" and old.get("closure_status") == "closed")
        if row["present"] == "no" and scope != "audit-record" and not verified_removal:
            row.update(review_status="removed-needs-verification", closure_status="open", closure_reason="Verify intended removal and remaining consumers")
        rows.append(row)
    # Preserve an audit trail for removed files without counting them as current scope.
    for path in sorted(set(existing) - candidates):
        old = existing[path].copy()
        if not (old.get("present") == "no" and old.get("review_status") == "reviewed-removal" and old.get("closure_status") == "closed"):
            old.update(present="no", review_status="removed-needs-verification", closure_status="open", closure_reason="Verify intended removal and remaining consumers")
        rows.append(old)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    active = [r for r in rows if r["present"] == "yes"]
    scoped = [r for r in active if r["scope"] in {"backend", "backend-support", "frontend-boundary", "scope-triage"}]
    summary = {
        "date": args.date, "commit": git("rev-parse", "HEAD"), "branch": git("branch", "--show-current"),
        "candidate_files": len(active), "backend_review_scope_files": len(scoped),
        "scope_counts": dict(sorted(collections.Counter(r["scope"] for r in active).items())),
        "area_counts": dict(sorted(collections.Counter(r["area"] for r in scoped).items())),
        "phase_counts": dict(sorted(collections.Counter(r["phase"] for r in scoped).items())),
        "file_kind_counts": dict(sorted(collections.Counter(r["file_kind"] for r in scoped).items())),
        "closure_counts": dict(collections.Counter(r["closure_status"] for r in scoped)),
        "removed_files_requiring_verification": [r["path"] for r in rows if r["present"] == "no" and r["closure_status"] != "closed"],
        "unclassified_files": [r["path"] for r in scoped if r["scope"] == "scope-triage"],
        "note": "Inventory is not semantic review or a test run. Prior findings are historical evidence; no current file is automatically closed. Environment files are hashed locally but their contents/values are never displayed or exported. Frontend candidates are a starting point, not proof of complete transitive contract discovery.",
    }
    SUMMARY.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
