// Run the committed utility with inert imports and synthetic records only; no DB access.
const cp = require("node:child_process");
const fs = require("node:fs");
const sourceCommit = "f8babd21";
const results = [];
for (const mode of ["heterogeneous-stock", "setup-failure", "empty-catalog"]) {
  const probe = `
    const cp = require('node:child_process');
    const ts = require('typescript');
    const Module = require('node:module');
    const path = require('node:path');
    const mode = ${JSON.stringify(mode)};
    const state = { stocks: [{ onHand: 11, reserved: 2 }, { onHand: 23, reserved: 4 }],
      variant: { id: 'synthetic-variant', sku: 'SYNTHETIC', allowPreorder: true, allowBackorder: true }, carts: 0 };
    const initial = JSON.stringify(state.stocks);
    const prisma = {
      productVariant: { findFirst: async () => mode === 'empty-catalog' ? null : { ...state.variant },
        update: async ({ data }) => Object.assign(state.variant, data) },
      inventoryStock: { findFirst: async () => ({ ...state.stocks[0] }),
        updateMany: async ({ data }) => { if (mode === 'setup-failure') throw new Error('injected');
          state.stocks.forEach(row => Object.assign(row, data)); } },
      reservation: { deleteMany: async () => {}, create: async () => {} },
      shoppingCart: { deleteMany: async () => { state.carts = 0; }, create: async () => { state.carts++; } },
      $disconnect: async () => {
        const reproduced = mode === 'heterogeneous-stock' ? JSON.stringify(state.stocks) !== initial
          : mode === 'setup-failure' ? !state.variant.allowPreorder && state.carts === 2 && process.exitCode === 1
          : !process.exitCode;
        process.stdout.write('RESULT:' + JSON.stringify({ reproduced, exitCode: process.exitCode || 0 }));
      }
    };
    const vo = { fromString: value => ({ getValue: () => value }) };
    const fakeRequire = request => {
      if (request === '@prisma/client') return { PrismaClient: class { constructor() { return prisma; } } };
      if (request.includes('operational-database')) return { requireOperationalTestDatabase: () => 'inert' };
      if (request.includes('variant-id')) return { VariantId: vo };
      if (request.includes('cart-id')) return { CartId: vo };
      if (request.includes('reservation.repository.impl')) return { ReservationRepositoryImpl: class {
        async checkAvailability(_variant, qty, cart) {
          return { available: qty <= (cart?.getValue().startsWith('a809') ? 2 : 5) };
        }
      } };
      throw new Error('Unexpected import');
    };
    const file = path.resolve('scratch/verify-cart-inventory-check.ts');
    const source = cp.execFileSync('git', ['show', '${sourceCommit}:scratch/verify-cart-inventory-check.ts'], { encoding: 'utf8' });
    const target = new Module(file, module);
    target.filename = file;
    target.require = fakeRequire;
    target._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
  `;
  const child = cp.spawnSync(process.execPath, ["--eval", probe], {
    encoding: "utf8",
    timeout: 15_000,
  });
  const match = child.stdout?.match(/RESULT:(\{[^\n]+\})/);
  const result = match ? JSON.parse(match[1]) : {};
  results.push({
    mode,
    reproduced: !child.error && result.reproduced === true,
    exitCode: child.status,
  });
}
const report = {
  date: "2026-10-17",
  sourceCommit,
  mode: "Inert imports and synthetic state; no database access",
  results,
};
fs.writeFileSync(
  "docs/reviews/p00-cart-inventory-baseline-reproduction.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (results.some((result) => !result.reproduced)) process.exitCode = 1;
