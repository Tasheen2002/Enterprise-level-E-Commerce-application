// Exercise real CLI source with an inert Prisma substitute; never open a DB connection.
const cp = require("node:child_process");
const fs = require("node:fs");
const sourceCommit = "f8babd21420019fe3cb69209f0441a52e6dc67eb";
const reminders = process.argv.includes("--reminders");
const inventory = process.argv.includes("--inventory");
const admin = process.argv.includes("--admin");
const wallets = process.argv.includes("--wallets");
const loyalty = process.argv.includes("--loyalty");
const baselineOnly = process.argv.includes("--baseline-only");
const catalogs = process.argv.includes("--catalogs");
const files = catalogs
  ? ["scratch/inspect-databases-local.ts", "scratch/list-databases.ts"]
  : loyalty
    ? ["scratch/inspect-loyalty-data.ts"]
    : wallets
      ? ["scratch/inspect-wallets.ts"]
      : admin
        ? ["scratch/verify-admin.ts"]
        : inventory
          ? ["scratch/inspect-inventory-stock.ts"]
          : reminders
            ? ["scratch/inspect-reminders.ts", "scratch/check-db-reminders.ts"]
            : ["scratch/inspect-cart-expiry.ts"];
const results = [];
for (const file of files) {
  for (const mode of [
    "old-success",
    "old-query-failure",
    "current-success",
    "current-query-failure",
    "current-disconnect-failure",
    "current-dual-failure",
    ...(admin
      ? [
          "current-missing",
          "current-wrong-role",
          "current-inactive",
          "current-blocked",
          "current-missing-email",
          "current-invalid-email",
          "current-construction-failure",
        ]
      : []),
    ...(wallets
      ? ["current-missing-prefix", "current-invalid-prefix", "current-construction-failure"]
      : []),
    ...(loyalty ? ["current-construction-failure", "current-second-query-failure"] : []),
    ...(catalogs
      ? [
          "current-construction-failure",
          ...(file.includes("inspect-databases-local") ? ["current-count-failure"] : []),
        ]
      : []),
  ]) {
    const old = mode.startsWith("old-");
    if (baselineOnly && !old) continue;
    const probe = `
    const cp = require('node:child_process'), ts = require('typescript');
    const Module = require('node:module'), path = require('node:path');
    const original = Module._load;
    const records = [], state = { constructed: 0, disconnected: 0, counts: 0, identityReads: 0, explicitDatasource: false, fileWrites: 0 };
    const mode = ${JSON.stringify(mode)};
    const old = ${old};
    const capture = (...args) => records.push(args.map(arg => typeof arg === 'object' && arg !== null ? require('node:util').inspect(arg) : String(arg)).join(' '));
    console.log = capture;
    console.error = capture;
    const secret = 'SENSITIVE_SENTINEL';
    const failsQuery = mode !== 'current-second-query-failure' && (mode.includes('query-failure') || mode.includes('dual-failure'));
    const count = async () => { state.counts++; if (failsQuery) throw new Error(secret); return 1; };
    class InertPrisma {
      constructor(options) { state.constructed++; state.explicitDatasource = options?.datasources?.db?.url === (${catalogs && file === "scratch/list-databases.ts"} ? process.env.TEST_DATABASE_ADMIN_URL : process.env.TEST_DATABASE_URL); if (mode === 'current-construction-failure') throw new Error(secret); }
      async $queryRaw(query) {
        state.counts++;
        if (old) state.identityReads++;
        if (failsQuery) throw new Error(secret);
        const sql = Array.isArray(query) ? query.join('?') : query.sql;
        if (sql.includes('pg_database')) return old ? [{datname:secret}] : [{exists:true}];
        if (sql.includes('pg_tables')) return [{schemaname:'public',tablename:old ? secret : 'fixture_table'}];
        if (mode === 'current-count-failure') throw new Error(secret);
        return [{rows:'9007199254740993'}];
      }
      async $queryRawUnsafe() { return [{count:1n}]; }
      loyaltyAccount = {
        findMany: async () => { state.identityReads++; if (failsQuery) throw new Error(secret); return [{ accountId: secret, users: { firstName: secret, lastName: secret, email: secret }, tier: 'STYLE_LOVER', currentBalance: 7n, lifetimePoints: 9n, totalPointsEarned: 9n, totalPointsRedeemed: 2n }]; },
        aggregate: async () => { state.counts++; if (failsQuery) throw new Error(secret); return { _count: { _all: 1 }, _sum: { currentBalance: 7n, lifetimePoints: 9n, totalPointsEarned: 9n, totalPointsRedeemed: 2n } }; }
      };
      loyaltyTransaction = {
        findMany: async () => { state.identityReads++; return [{ transactionId: secret, accountId: secret, type: 'EARN', points: 9n, balanceAfter: 9n, reason: secret, description: secret, createdAt: new Date(0) }]; },
        aggregate: async () => { state.counts++; if (mode === 'current-second-query-failure') throw new Error(secret); return { _count: { _all: 1 }, _sum: { points: 9n } }; }
      };
      user = { findUnique: async (args) => {
        if (JSON.stringify(args.select) === JSON.stringify({ role: true, status: true })) state.counts++; else state.identityReads++;
        if (failsQuery) throw new Error(secret);
        if (mode === 'current-missing') return null;
        return { role: mode === 'current-wrong-role' ? 'CUSTOMER' : 'ADMIN', status: mode === 'current-inactive' ? 'inactive' : mode === 'current-blocked' ? 'blocked' : 'active', passwordHash: secret, twoFactorSecret: secret, email: secret, id: secret };
      } };
      product = { findMany: async (args) => {
        if (args.select) state.counts++; else state.identityReads++;
        if (failsQuery) throw new Error(secret);
        return [{ title: 'Mabillon synthetic', slug: 'synthetic-wallet', media: [{ position: 0, isCover: true, asset: { mime: 'image/jpeg', storageKey: secret } }] }];
      } };
      shoppingCart = { count, findMany: async () => { state.identityReads++; if (failsQuery) throw new Error(secret); return [{ id: secret, userId: secret, guestToken: secret, reservationExpiresAt: null, items: [], reservations: [] }]; } };
      reservation = { count }; cartItem = { count };
      inventoryStock = {
        findMany: async () => { state.identityReads++; if (failsQuery) throw new Error(secret); return [{ variantId: secret, locationId: secret, location: { name: secret }, onHand: 20, reserved: 5 }]; },
        aggregate: async () => { state.counts++; if (failsQuery) throw new Error(secret); return { _count: { _all: 2 }, _sum: { onHand: 20, reserved: 5 } }; }
      };
      reminder = {
        findMany: async () => { state.identityReads++; if (failsQuery) throw new Error(secret); return [{ id: secret, type: 'restock', status: 'sent', channel: 'email', createdAt: new Date(0), users: { email: secret }, variant: { sku: secret, product: { title: secret } } }]; },
        groupBy: async () => { state.counts++; if (failsQuery) throw new Error(secret); return [{ type: 'restock', status: 'sent', channel: 'email', _count: { _all: 1 } }]; }
      };
      async $transaction(action) { return action(this); }
      async $disconnect() { state.disconnected++; if (mode.includes('disconnect-failure') || mode.includes('dual-failure')) throw new Error(secret); }
    }
    Module._load = function(request, ...args) {
      const value = original.call(this, request, ...args);
      if (${loyalty} && request === 'fs' && args[0]?.filename === path.resolve('${file}')) return { ...value, writeFileSync: (_path, output) => { state.fileWrites++; capture(output); } };
      return request === '@prisma/client' ? { ...value, PrismaClient: InertPrisma } : value;
    };
    process.on('exit', () => process.stdout.write(JSON.stringify({ ...state, sensitiveOutput: records.some(line => line.includes(secret)), safeFailure: records.includes(${JSON.stringify(catalogs ? "Database catalog inspection refused or failed." : loyalty ? "Loyalty inspection refused or failed." : wallets ? "Wallet inspection refused or failed." : admin ? "Test administrator inspection refused or failed." : inventory ? "Inventory stock inspection refused or failed." : reminders ? "Reminder inspection refused or failed." : "Cart expiry inspection refused or failed.")}) })));
    ${
      old
        ? `
      const file = path.resolve('${file}');
      const source = cp.execFileSync('git', ['show', '${sourceCommit}:${file}'], { encoding: 'utf8' });
      const target = new Module(file, module); target.filename = file; target.paths = Module._nodeModulePaths(path.dirname(file));
      target._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
    `
        : `require('./${file}');`
    }
  `;
    const child = cp.spawnSync(process.execPath, ["--import", "tsx", "--eval", probe], {
      env: {
        ...process.env,
        NODE_ENV: "test",
        ALLOW_DATABASE_TEST_CLEANUP: "1",
        ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
        TEST_DATABASE_URL: "postgresql://localhost/inspection_test",
        TEST_DATABASE_ADMIN_URL: "postgresql://localhost/postgres",
        TEST_PRODUCT_TITLE_PREFIX:
          mode === "current-missing-prefix"
            ? ""
            : mode === "current-invalid-prefix"
              ? "%"
              : "Mabillon",
        TEST_ADMIN_EMAIL:
          mode === "current-missing-email"
            ? ""
            : mode === "current-invalid-email"
              ? "SENSITIVE_SENTINEL"
              : "synthetic-admin@example.invalid",
      },
      encoding: "utf8",
      timeout: 15_000,
    });
    let state = {};
    try {
      state = JSON.parse(child.stdout);
    } catch {
      /* Missing safe telemetry fails verification. */
    }
    const success = mode.endsWith("success");
    const beforeConstruction =
      (admin && ["current-missing-email", "current-invalid-email"].includes(mode)) ||
      (wallets && ["current-missing-prefix", "current-invalid-prefix"].includes(mode));
    const constructorFailure = mode === "current-construction-failure";
    const tableCatalog = file.includes("inspect-databases-local");
    const passed = catalogs
      ? !child.error &&
        !child.stderr.includes("SENSITIVE_SENTINEL") &&
        state.constructed === (old && tableCatalog ? 2 : 1) &&
        state.disconnected === (constructorFailure ? 0 : old && tableCatalog ? 2 : 1) &&
        (old
          ? child.status === 0 &&
            state.sensitiveOutput &&
            state.identityReads === (tableCatalog ? 2 : 1)
          : child.status === (success ? 0 : 1) &&
            !state.sensitiveOutput &&
            state.identityReads === 0 &&
            state.explicitDatasource &&
            state.counts ===
              (constructorFailure
                ? 0
                : tableCatalog && !mode.includes("query-failure") && mode !== "current-dual-failure"
                  ? 2
                  : 1) &&
            (success || state.safeFailure))
      : !child.error &&
        !child.stderr.includes("SENSITIVE_SENTINEL") &&
        state.constructed === (beforeConstruction ? 0 : 1) &&
        state.disconnected === (beforeConstruction || constructorFailure ? 0 : 1) &&
        (old
          ? (wallets && !success
              ? child.status === 1 && !state.sensitiveOutput && state.safeFailure
              : child.status === 0 && state.sensitiveOutput) &&
            state.identityReads === (loyalty && success ? 2 : 1) &&
            (!loyalty || state.fileWrites === (success ? 1 : 0))
          : child.status === (success ? 0 : 1) &&
            !state.sensitiveOutput &&
            state.identityReads === 0 &&
            state.fileWrites === 0 &&
            state.counts ===
              (beforeConstruction || constructorFailure
                ? 0
                : loyalty
                  ? mode === "current-query-failure" || mode === "current-dual-failure"
                    ? 1
                    : 2
                  : admin || inventory || reminders || wallets
                    ? 1
                    : 6) &&
            (beforeConstruction || state.explicitDatasource) &&
            (success || state.safeFailure));
    results.push({ file, mode, passed: !!passed, exitCode: child.status, ...state });
  }
}
const report = {
  date: "2026-10-21",
  sourceCommit,
  scope: catalogs
    ? "Pinned source with inert clients: fixed destinations, broad metadata output and swallowed query failure; current selected-test catalog CLI success and lifecycle failures; no real connections"
    : loyalty
      ? "Inert Prisma and file-write interception; original identity/loyalty export and raw error/false success reproduced without DB access or disk export; current aggregate diagnostic verified"
      : wallets
        ? "Inert Prisma substitution; pinned guarded wallet source raw-path output and existing nonzero query failure verified; current bounded metadata CLI success and failure paths verified without DB access"
        : "Inert Prisma substitution; original private-field/error output and false success reproduced; current CLI success/query/disconnect/dual failure verified without DB access",
  results,
};
fs.writeFileSync(
  baselineOnly
    ? catalogs
      ? "coverage/p00-catalog-inspection-baseline.json"
      : "coverage/p00-loyalty-inspection-baseline.json"
    : catalogs
      ? "docs/reviews/p00-database-catalog-inspection-cli.json"
      : loyalty
        ? "docs/reviews/p00-loyalty-inspection-cli.json"
        : wallets
          ? "docs/reviews/p00-wallet-inspection-cli.json"
          : admin
            ? "docs/reviews/p00-admin-inspection-cli.json"
            : inventory
              ? "docs/reviews/p00-inventory-inspection-cli.json"
              : reminders
                ? "docs/reviews/p00-reminder-inspection-cli.json"
                : "docs/reviews/p00-cart-expiry-inspection-cli.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (results.some((result) => !result.passed)) process.exitCode = 1;
