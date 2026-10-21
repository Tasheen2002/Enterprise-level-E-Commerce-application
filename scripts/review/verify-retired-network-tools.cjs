// Execute pinned obsolete tools with inert fetch and synthetic .env reads; no provider access.
const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const sourceCommit = "4e36e447a7fbee24216455cdc0003239255be9fd";
const baselineOnly = process.argv.includes("--baseline-only");
const files = [
  ["scratch/test-cdn-images.ts", 99],
  ["scratch/test-cdn-images-v2.ts", 92],
  ["scratch/test-cdn-images-v3.ts", 100],
  ["scratch/list-imagekit-files.ts", 1],
];
const results = [];
const sources = [];
for (const [file, expectedRequests] of files) {
  const source = cp.execFileSync("git", ["show", `${sourceCommit}:${file}`], { encoding: "utf8" });
  if (
    baselineOnly &&
    fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n") !== source.replace(/\r\n/g, "\n")
  )
    throw new Error("Pinned retirement source differs from working tree");
  sources.push({
    file,
    gitSourceSha256: createHash("sha256").update(source).digest("hex"),
    removed: !fs.existsSync(file),
  });
  const listing = file.includes("list-imagekit");
  for (const mode of listing
    ? [
        "success",
        "http-error",
        "network-error",
        "invalid-json",
        "invalid-shape",
        "missing-key",
        "env-read-error",
      ]
    : ["success", "not-found", "rate-limited", "network-error"]) {
    const probe = `
      const Module = require('node:module'), ts = require('typescript'), cp = require('node:child_process'), path = require('node:path');
      const file = path.resolve(${JSON.stringify(file)}), original = Module._load;
      const mode = ${JSON.stringify(mode)}, listing = ${listing}, sentinel = 'SYNTHETIC_PRIVATE_SENTINEL';
      const records = [], state = { requests:0, syntheticEnvReads:0, usesSyntheticAuth:false, timeoutConfigured:false, redirectPolicyConfigured:false, errorLines:0 };
      console.log = (...args) => records.push(args.join(' '));
      console.error = (...args) => { state.errorLines++; records.push(args.join(' ')); };
      Module._load = function(request, ...args) {
        const value = original.call(this, request, ...args);
        if (request !== 'fs' || args[0]?.filename !== file) return value;
        return { ...value, readFileSync: () => {
          state.syntheticEnvReads++;
          if (mode === 'env-read-error') throw Error(sentinel);
          return mode === 'missing-key' ? '' : 'IMAGEKIT_PRIVATE_KEY=' + sentinel;
        } };
      };
      global.fetch = async (_url, options) => {
        state.requests++;
        state.usesSyntheticAuth ||= options?.headers?.Authorization === 'Basic ' + Buffer.from(sentinel + ':').toString('base64');
        state.timeoutConfigured ||= !!options?.signal;
        state.redirectPolicyConfigured ||= !!options?.redirect;
        if (mode === 'network-error') throw Error(sentinel);
        return {
          ok: !['http-error','not-found','rate-limited'].includes(mode),
          status: mode === 'rate-limited' ? 429 : mode === 'not-found' ? 404 : mode === 'http-error' ? 401 : 200,
          text: async () => sentinel,
          json: async () => {
            if (mode === 'invalid-json') throw Error(sentinel);
            return mode === 'invalid-shape' ? {} : [{ name:sentinel, filePath:sentinel, url:sentinel, createdAt:sentinel }];
          }
        };
      };
      process.on('exit', () => process.stdout.write(JSON.stringify({ ...state, outputLines:records.length, sensitiveOutput:records.some(line => line.includes(sentinel)) })));
      const source = cp.execFileSync('git', ['show', ${JSON.stringify(`${sourceCommit}:${file}`)}], {encoding:'utf8'});
      const target = new Module(file, module); target.filename = file; target.paths = Module._nodeModulePaths(path.dirname(file));
      target._compile(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
    `;
    const child = cp.spawnSync(process.execPath, ["--eval", probe], {
      encoding: "utf8",
      timeout: 15_000,
    });
    let state = {};
    try {
      state = JSON.parse(child.stdout);
    } catch {
      /* Missing telemetry fails the probe. */
    }
    const requests =
      listing && ["missing-key", "env-read-error"].includes(mode) ? 0 : expectedRequests;
    const expectedSensitive =
      listing &&
      ["success", "http-error", "network-error", "invalid-json", "env-read-error"].includes(mode);
    const passed =
      !child.error &&
      child.status === 0 &&
      !child.stderr.includes("SYNTHETIC_PRIVATE_SENTINEL") &&
      state.requests === requests &&
      state.syntheticEnvReads === (listing ? 1 : 0) &&
      state.usesSyntheticAuth === (listing && requests > 0) &&
      state.sensitiveOutput === expectedSensitive &&
      state.timeoutConfigured === false &&
      state.redirectPolicyConfigured === false;
    results.push({ file, mode, passed, exitCode: child.status, ...state });
  }
}
const consumers = [];
const candidates = [
  ...new Set([
    ...cp.execFileSync("git", ["ls-files"], { encoding: "utf8" }).trim().split(/\r?\n/),
    ...cp
      .execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" })
      .trim()
      .split(/\r?\n/),
  ]),
];
for (const candidate of candidates) {
  if (
    !/\.(?:[cm]?[jt]sx?|json|ya?ml)$/.test(candidate) ||
    candidate.startsWith("docs/") ||
    candidate === "scripts/review/verify-retired-network-tools.cjs" ||
    !fs.existsSync(candidate) ||
    files.some(([file]) => file === candidate)
  )
    continue;
  const content = fs.readFileSync(candidate, "utf8");
  if (
    files.some(([file]) => content.includes(file) || content.includes(path.basename(file, ".ts")))
  )
    consumers.push(candidate);
}
const report = {
  date: "2026-10-21",
  sourceCommit,
  mode: baselineOnly
    ? "inert pre-removal reproduction"
    : "inert reproduction and removal verification",
  network: "global fetch replaced; no provider contacted",
  credentials: "synthetic fs response; actual .env never read",
  sources,
  results,
  remainingSourceOrCommandConsumers: consumers,
  checksPassed:
    results.every((row) => row.passed) &&
    consumers.length === 0 &&
    (baselineOnly || sources.every((row) => row.removed)),
  limitation:
    "Retirement evidence only; not live ImageKit listing/upload, redirect, delivery, CDN rendering or application integration certification",
};
fs.writeFileSync(
  baselineOnly
    ? "coverage/p00-network-utility-baseline.json"
    : "docs/reviews/p00-network-utility-retirement.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      passed: report.checksPassed,
      probes: results.length,
      failures: results.filter((row) => !row.passed).map(({ file, mode }) => ({ file, mode })),
      remainingConsumers: consumers,
      removed: sources.filter((row) => row.removed).length,
    },
    null,
    2,
  ),
);
if (!report.checksPassed) process.exitCode = 1;
