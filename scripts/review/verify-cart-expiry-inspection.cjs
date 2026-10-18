// Exercise real CLI source with an inert Prisma substitute; never open a DB connection.
const cp = require("node:child_process");
const fs = require("node:fs");
const sourceCommit = "f8babd21420019fe3cb69209f0441a52e6dc67eb";
const reminders = process.argv.includes("--reminders");
const inventory = process.argv.includes("--inventory");
const files = inventory
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
  ]) {
    const old = mode.startsWith("old-");
    const probe = `
    const cp = require('node:child_process'), ts = require('typescript');
    const Module = require('node:module'), path = require('node:path');
    const original = Module._load;
    const records = [], state = { constructed: 0, disconnected: 0, counts: 0, identityReads: 0, explicitDatasource: false };
    const mode = ${JSON.stringify(mode)};
    console.log = (...args) => records.push(args.map(String).join(' '));
    console.error = (...args) => records.push(args.map(String).join(' '));
    const secret = 'SENSITIVE_SENTINEL';
    const failsQuery = mode.includes('query-failure') || mode.includes('dual-failure');
    const count = async () => { state.counts++; if (failsQuery) throw new Error(secret); return 1; };
    class InertPrisma {
      constructor(options) { state.constructed++; state.explicitDatasource = options?.datasources?.db?.url === process.env.TEST_DATABASE_URL; }
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
      return request === '@prisma/client' ? { ...value, PrismaClient: InertPrisma } : value;
    };
    process.on('exit', () => process.stdout.write(JSON.stringify({ ...state, sensitiveOutput: records.some(line => line.includes(secret)), safeFailure: records.includes(${JSON.stringify(inventory ? "Inventory stock inspection refused or failed." : reminders ? "Reminder inspection refused or failed." : "Cart expiry inspection refused or failed.")}) })));
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
    const passed =
      !child.error &&
      !child.stderr.includes("SENSITIVE_SENTINEL") &&
      state.constructed === 1 &&
      state.disconnected === 1 &&
      (old
        ? child.status === 0 && state.sensitiveOutput && state.identityReads === 1
        : child.status === (success ? 0 : 1) &&
          !state.sensitiveOutput &&
          state.identityReads === 0 &&
          state.counts === (inventory || reminders ? 1 : 6) &&
          state.explicitDatasource &&
          (success || state.safeFailure));
    results.push({ file, mode, passed: !!passed, exitCode: child.status, ...state });
  }
}
const report = {
  date: "2026-10-18",
  sourceCommit,
  scope:
    "Inert Prisma substitution; original private-field/error output and false success reproduced; current CLI success/query/disconnect/dual failure verified without DB access",
  results,
};
fs.writeFileSync(
  inventory
    ? "docs/reviews/p00-inventory-inspection-cli.json"
    : reminders
      ? "docs/reviews/p00-reminder-inspection-cli.json"
      : "docs/reviews/p00-cart-expiry-inspection-cli.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (results.some((result) => !result.passed)) process.exitCode = 1;
