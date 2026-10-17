// Static evidence collection only. Candidates are not reviewed behaviors or coverage proof.
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const ts = require("typescript");
const root = process.cwd();
const out = path.join(root, "docs/reviews");
const files = [
  ...new Set([
    ...cp.execFileSync("git", ["ls-files"], { encoding: "utf8" }).trim().split(/\r?\n/),
    ...cp
      .execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" })
      .trim()
      .split(/\r?\n/),
  ]),
].filter(
  (file) =>
    /\.[cm]?[jt]sx?$/.test(file) && !file.startsWith("docs/") && !file.includes("/generated/"),
);
const liveModules = new Set([
  "user-management",
  "product-catalog",
  "inventory-management",
  "cart",
  "order-management",
  "payment",
  "loyalty",
  "engagement",
]);
const area = (file) =>
  file.match(/^modules\/([^/]+)/)?.[1] ??
  (file.startsWith("apps/api/") ? "api-host" : file.split("/").slice(0, 2).join("/"));
const literal = (node) =>
  node && (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : null;
const prop = (node, key) =>
  node && ts.isObjectLiteralExpression(node)
    ? node.properties.find((p) => p.name && p.name.getText().replace(/["']/g, "") === key)
        ?.initializer
    : undefined;
const excerpt = (node) => node?.getText().replace(/\s+/g, " ").slice(0, 1200) ?? "";
const resolveImport = (file, spec) => {
  let result;
  if (spec.startsWith("@modules/")) result = "modules/" + spec.slice(9);
  else if (spec.startsWith("@packages/")) result = "packages/" + spec.slice(10);
  else if (spec.startsWith("@/")) result = "apps/" + spec.slice(2);
  else if (spec.startsWith("@tasheen/"))
    result =
      "packages/" +
      spec.slice(9).replace(/\//, "/src/") +
      (spec.slice(9).includes("/") ? "" : "/src/index");
  else if (spec.startsWith("."))
    result = path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
  else return null;
  result = result.replace(/\.[cm]?js$/, "");
  return (
    [result, result + ".ts", result + ".tsx", result + "/index.ts"].find(
      (p) => fs.existsSync(p) && fs.statSync(p).isFile(),
    ) ?? "unresolved:" + result
  );
};
const routes = [],
  tests = [],
  subjects = [],
  registration = [],
  outbound = [];
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  const isTest =
    /\.(?:spec|test)\.[jt]sx?$/.test(file) && /^(?:apps|modules|packages)\//.test(file);
  const imports = [],
    literals = [];
  let testDeclarations = 0,
    assertions = 0;
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && literal(node.moduleSpecifier)) {
      const imported = literal(node.moduleSpecifier);
      const target = resolveImport(file, imported);
      if (target) imports.push(target);
      if (["stripe", "nodemailer", "firebase-admin/app", "firebase-admin/auth"].includes(imported))
        outbound.push({
          file,
          line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          dependency: imported,
          status: "static-provider-candidate",
        });
    }
    if (ts.isStringLiteralLike(node) && node.text.startsWith("/")) literals.push(node.text);
    if (ts.isCallExpression(node)) {
      const expression = node.expression.getText(source);
      if (
        /^(?:it|test)(?:\.|\()/.test(expression) ||
        expression === "it" ||
        expression === "test"
      ) {
        if (node.arguments[0] && literal(node.arguments[0]) !== null) testDeclarations++;
      }
      if (expression === "expect") assertions++;
      if (
        /^(?:fastify|instance|server|app)\.(?:get|post|put|patch|delete|head|options|all|route)$/.test(
          expression,
        ) &&
        !isTest
      ) {
        const method = expression.split(".").pop();
        const options = method === "route" ? node.arguments[0] : node.arguments[1];
        const localPath =
          method === "route" ? literal(prop(options, "url")) : literal(node.arguments[0]);
        if (localPath?.startsWith("/")) {
          const owner = area(file);
          const registered = liveModules.has(owner) || owner === "api-host";
          const conditional = /modules\/payment\/.*\/(?:webhook|stripe-card-setup)\.routes/.test(
            file,
          );
          routes.push({
            file,
            line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            area: owner,
            method:
              method === "route"
                ? (literal(prop(options, "method")) ?? "dynamic-method")
                : method.toUpperCase(),
            local_path: localPath,
            full_path_candidate: (liveModules.has(owner) ? "/api/v1" : "") + localPath,
            registration: conditional
              ? "conditional-stripe-config"
              : registered
                ? "declared-under-registered-module"
                : "unregistered-or-needs-tracing",
            preHandler_declared: excerpt(prop(options, "preHandler")),
            preValidation_declared: excerpt(prop(options, "preValidation")),
            effective_authorization: "unverified-inherited-hooks-and-controller-policy",
            runtime_verified: "no",
            http_test_candidates: "",
          });
        }
      }
      if (/\.register$/.test(expression) && node.arguments[1]) {
        const prefix = literal(prop(node.arguments[1], "prefix"));
        if (prefix !== null)
          registration.push({
            file,
            line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            prefix,
            registration_target: excerpt(node.arguments[0]),
            verification: "static-prefix-declaration",
          });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (isTest) {
    const db = /new\s+PrismaClient\s*\(/.test(content);
    const mocks = /vi\.(?:mock|fn|spyOn)/.test(content);
    const inject = /\.inject\s*\(/.test(content);
    const classifiedBySetup = /(?:^|[/.])(?:integration|e2e)(?:[/.]|$)/.test(
      file.replace(/\\/g, "/").toLowerCase(),
    );
    const row = {
      file,
      area: area(file),
      test_declarations: testDeclarations,
      assertion_calls: assertions,
      directory_category: /\/test\/integration\//.test(file)
        ? "integration"
        : /\/test\/e2e\//.test(file)
          ? "e2e"
          : "unit-or-other",
      inferred_behavior_type: db
        ? inject
          ? "database-backed-http-candidate"
          : "database-repository-candidate"
        : inject
          ? "in-process-http-candidate"
          : mocks
            ? "mocked-unit-candidate"
            : "unit-candidate",
      direct_prisma_client: db,
      inject_calls_present: inject,
      classified_by_current_setup: classifiedBySetup,
      included_by_default_unit_command: !/\/test\/(?:integration|e2e)\//.test(file),
      imports_resolved_candidates: [...new Set(imports)].join(";"),
      literal_path_candidates: [...new Set(literals)].join(";"),
      semantic_test_review: "pending",
      actual_last_result: "not-individually-mapped",
    };
    tests.push(row);
    for (const target of new Set(imports))
      subjects.push({
        source_file_candidate: target,
        test_file: file,
        evidence_type: "direct-import-only-not-proof-of-behavior-coverage",
      });
  }
}
for (const route of routes) {
  const pattern = new RegExp(
    "^" +
      route.full_path_candidate
        .split("/")
        .map((segment) =>
          segment.startsWith(":") ? "[^/?]+" : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        )
        .join("/") +
      "(?:\\?.*)?$",
  );
  route.http_test_candidates = tests
    .filter(
      (test) =>
        test.inject_calls_present &&
        test.literal_path_candidates.split(";").some((value) => pattern.test(value)),
    )
    .map((test) => test.file)
    .join(";");
}
// Next server handlers are included explicitly, without claiming Fastify registration.
for (const file of files.filter((file) =>
  /^apps\/(?:web|admin)\/app\/api\/.+\/route\.tsx?$/.test(file),
)) {
  const content = fs.readFileSync(file, "utf8");
  for (const match of content.matchAll(
    /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g,
  )) {
    routes.push({
      file,
      line: content.slice(0, match.index).split("\n").length,
      area: area(file),
      method: match[1],
      local_path: "/" + file.split("/app/")[1].replace(/\/route\.tsx?$/, ""),
      full_path_candidate: "/" + file.split("/app/")[1].replace(/\/route\.tsx?$/, ""),
      registration: "next-filesystem-route",
      effective_authorization: "unverified",
      runtime_verified: "no",
    });
  }
}
function csv(name, rows) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (value) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
  fs.writeFileSync(
    path.join(out, name),
    [
      keys.map(escape).join(","),
      ...rows.map((row) => keys.map((key) => escape(row[key])).join(",")),
    ].join("\n") + "\n",
  );
}
csv("p00-endpoint-register.csv", routes);
csv("p00-test-register.csv", tests);
csv("p00-source-test-candidates.csv", subjects);
csv("p00-route-prefixes.csv", registration);
csv("p00-provider-imports.csv", outbound);
const by = (rows, key) =>
  rows.reduce((acc, row) => ((acc[row[key]] = (acc[row[key]] ?? 0) + 1), acc), {});
const summary = {
  source_commit: cp.execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  static_route_declarations: routes.length,
  route_areas: by(routes, "area"),
  route_registration_candidates: by(routes, "registration"),
  test_files: tests.length,
  test_type_candidates: by(tests, "inferred_behavior_type"),
  default_unit_files: tests.filter((test) => test.included_by_default_unit_command).length,
  direct_database_files: tests.filter((test) => test.direct_prisma_client).length,
  database_files_without_current_setup_guard: tests
    .filter((test) => test.direct_prisma_client && !test.classified_by_current_setup)
    .map((test) => test.file),
  routes_without_literal_http_test_candidate: routes.filter((route) => !route.http_test_candidates)
    .length,
  route_options_requiring_inheritance_trace: routes.length,
  semantic_files_closed: 0,
  limitations:
    "Static candidates only. Parameterized/dynamic URLs, inherited plugin hooks, conditional registration, controller authorization, transitive test imports and actual route mounting require runtime/manual reconciliation. Test declarations/assertions are not actual executed test-case counts. No endpoint is marked fully tested from a string/import match.",
};
fs.writeFileSync(
  path.join(out, "p00-static-baseline.json"),
  JSON.stringify(summary, null, 2) + "\n",
);
console.log(JSON.stringify(summary, null, 2));
