// Execute only refusal paths, with a child-process Prisma constructor tripwire.
const cp = require("node:child_process");
const fs = require("node:fs");
const baselineExpiry = process.argv.includes("--baseline-expiry");
const baseline = baselineExpiry || process.argv.includes("--baseline-restock");
const baselineRef = "161dcd13b32ada7aab76f2f73c40cb45cbce6e04";
const scripts = baselineExpiry
  ? ["test-expiry-renewal"]
  : baseline
    ? ["verify-restock-reminder", "verify-restock-dispatcher"]
    : [
        "clear-database",
        "create-test-db",
        "drop-test-db",
        "seed-admin",
        "seed-development-db",
        "inspect-wallets",
        "verify-cart-inventory-check",
        "verify-restock-reminder",
        "verify-restock-dispatcher",
        "test-expiry-renewal",
      ];
const results = [];
for (const script of scripts) {
  const env = { ...process.env, NODE_ENV: "test" };
  for (const key of [
    "DATABASE_URL",
    "TEST_DATABASE_URL",
    "TEST_DATABASE_ADMIN_URL",
    "TEST_DATABASE_HOST",
    "ALLOW_DATABASE_TEST_CLEANUP",
    "ALLOW_OPERATIONAL_DATABASE_WRITES",
    "TEST_ADMIN_EMAIL",
    "TEST_ADMIN_PASSWORD",
  ])
    delete env[key];
  const probe = `
    const Module = require('node:module');
    const original = Module._load;
    Module._load = function(request, ...args) {
      ${baselineExpiry ? "if (request === '../apps/api/src/server') return { createServer: async () => { throw new Error('INJECTED_BOOT_FAILURE'); } };" : ""}
      ${baseline ? "if (request === '../apps/api/src/container') return { container: {} }; // Inert import: only probe pre-client guard ordering." : ""}
      const value = original.call(this, request, ...args);
      if (request !== '@prisma/client') return value;
      return { ...value, PrismaClient: class {
        constructor() { process.stderr.write('UNEXPECTED_PRISMA_CONSTRUCTION'); process.exit(99); }
      }};
    };
    ${
      baseline
        ? `
      const cp = require('node:child_process');
      const path = require('node:path');
      const ts = require('typescript');
      const source = cp.execFileSync('git', ['show', '${baselineRef}:scratch/${script}.ts'], { encoding: 'utf8' });
      const file = path.resolve('scratch/${script}.ts');
      const target = new Module(file, module);
      target.filename = file;
      target.paths = Module._nodeModulePaths(path.dirname(file));
      target._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
    `
        : `require('./scratch/${script}.ts');`
    }
  `;
  const child = cp.spawnSync(process.execPath, ["--import", "tsx", "--eval", probe], {
    env,
    encoding: "utf8",
    timeout: 15_000,
  });
  const passed =
    !child.error &&
    (baselineExpiry
      ? child.status === 0 && child.stderr.includes("INJECTED_BOOT_FAILURE")
      : baseline
        ? child.status === 99 && child.stderr.includes("UNEXPECTED_PRISMA_CONSTRUCTION")
        : child.status === 1 &&
          child.stderr.includes("refused or failed") &&
          !child.stderr.includes("UNEXPECTED_PRISMA_CONSTRUCTION"));
  results.push({
    script: `scratch/${script}.ts`,
    passed,
    exitCode: child.status,
    prismaConstruction: child.status === 99 ? "attempted" : passed ? "not-attempted" : "unverified",
  });
}
console.log(JSON.stringify(results, null, 2));
fs.writeFileSync(
  baselineExpiry
    ? "docs/reviews/p00-expiry-baseline-reproduction.json"
    : baseline
      ? "docs/reviews/p00-restock-baseline-reproduction.json"
      : "docs/reviews/p00-operational-refusal-check.json",
  JSON.stringify(
    {
      date: "2026-10-17",
      mode: baselineExpiry
        ? "Original utility exits successfully after injected server failure; inert imports and no DB access"
        : baseline
          ? "Guard-bypass reproduction with constructor tripwire and inert container import; no DB client/query ran"
          : "Current CLI refusal before client construction",
      sourceCommit: baseline ? baselineRef : "working-tree",
      results,
    },
    null,
    2,
  ) + "\n",
);
if (results.some((result) => !result.passed)) process.exitCode = 1;
