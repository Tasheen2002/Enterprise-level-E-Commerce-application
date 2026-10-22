// Historical network/local scratch retirement checks; all target I/O is synthetic.
const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const local = process.argv.includes("--local");
const sourceCommit = local
  ? "4a1083ce67be6b052969d9124848f737dd480554"
  : "4e36e447a7fbee24216455cdc0003239255be9fd";
const baselineOnly = process.argv.includes("--baseline-only");
const files = local
  ? [
      ["scratch/find-all-env-keys.ts", "env-walk"],
      ["scratch/list-env-keys.ts", "env"],
      ["scratch/find-images.ts", "images"],
      ["scratch/find-backups.ts", "backups"],
      ["scratch/check-sql-inserts.ts", "sql"],
      ["scratch/find-imagekit.ts", "lines"],
      ["scratch/parse-commands.ts", "commands"],
      ["scratch/search-artifacts.ts", "artifacts"],
    ]
  : [
      ["scratch/test-cdn-images.ts", 99],
      ["scratch/test-cdn-images-v2.ts", 92],
      ["scratch/test-cdn-images-v3.ts", 100],
      ["scratch/list-imagekit-files.ts", 1],
    ];
const results = [];
const sources = [];
function localProbe(file, kind, mode) {
  return `
    const Module = require('node:module'), ts = require('typescript'), cp = require('node:child_process'), path = require('node:path');
    const { Readable } = require('node:stream');
    const file = path.resolve(${JSON.stringify(file)}), original = Module._load;
    const mode = ${JSON.stringify(mode)}, kind = ${JSON.stringify(kind)};
    const valueSentinel = 'SYNTHETIC_VALUE_SECRET', errorSentinel = 'SYNTHETIC_RAW_ERROR';
    const records = [], state = { directoryReads:0, stats:0, syntheticReads:0, hardcodedExternalPathRequested:false, linkTraversalObserved:false, requests:0, errorLines:0 };
    console.log = (...args) => records.push(args.map(String).join(' '));
    console.error = (...args) => { state.errorLines++; records.push(args.map(String).join(' ')); };
    const base = value => path.basename(String(value));
    const fakeFs = {
      readdirSync: directory => {
        state.directoryReads++;
        state.hardcodedExternalPathRequested ||= path.isAbsolute(String(directory));
        if (mode === 'directory-error') throw Error(errorSentinel);
        if (kind === 'artifacts') return ['note.md','ignored.png'];
        if (base(directory) === 'outside-link') { state.linkTraversalObserved = true; return ['.env','outside.png','outside.sql','outside.json']; }
        if (base(directory) === 'folder') return [];
        return mode === 'symlink' ? ['outside-link'] : ['folder','.env','photo.png','dump.sql','snapshot.json'];
      },
      statSync: filename => {
        state.stats++;
        if (mode === 'stat-error') throw Error(errorSentinel);
        return { isDirectory: () => ['folder','outside-link'].includes(base(filename)) };
      },
      readFileSync: () => {
        state.syntheticReads++;
        if (['read-error','env-read-error'].includes(mode)) throw Error(errorSentinel);
        if (kind === 'artifacts') return 'imagekit ' + valueSentinel;
        if (kind === 'sql') return 'INSERT INTO synthetic_table VALUES (1);';
        return mode === 'plain-env' ? 'VISIBLE_KEY=' + valueSentinel + '\\nexport EXPORTED_KEY=example'
          : 'VISIBLE_KEY=' + valueSentinel + '\\nMULTI="start\\n' + valueSentinel + '=literal value line\\nend"';
      },
      createReadStream: filename => {
        state.syntheticReads++;
        state.hardcodedExternalPathRequested ||= path.isAbsolute(String(filename));
        if (mode === 'open-error') throw Error(errorSentinel);
        const content = kind === 'lines' ? '\\nimagekit ' + valueSentinel + (mode === 'long-line' ? 'x'.repeat(2200) : '')
          : mode === 'invalid-json' ? 'not-json' : JSON.stringify({tool_calls:[{name:'run_command',args:{CommandLine:valueSentinel}}],step_index:1,created_at:'synthetic'}) + '\\n' + JSON.stringify({type:'RUN_COMMAND',status:'synthetic',content:'Output: ' + valueSentinel});
        return Readable.from([content + '\\n']);
      }
    };
    Module._load = function(request, ...args) {
      if (['fs','node:fs'].includes(request) && args[0]?.filename === file) return fakeFs;
      return original.call(this, request, ...args);
    };
    global.fetch = async () => { state.requests++; throw Error(errorSentinel); };
    process.on('exit', () => process.stdout.write(JSON.stringify({ ...state, valueLikeContentOutput:records.some(line => line.includes(valueSentinel)), rawErrorOutput:records.some(line => line.includes(errorSentinel)), visibleKeyReported:records.some(line => line.includes('VISIBLE_KEY')), exportedKeyReported:records.some(line => line.includes('EXPORTED_KEY')), truncatedOutput:records.some(line => line.includes('[TRUNCATED]')) })));
    const source = cp.execFileSync('git',['show',${JSON.stringify(`${sourceCommit}:${file}`)}],{encoding:'utf8'});
    const target = new Module(file,module); target.filename=file; target.paths=Module._nodeModulePaths(path.dirname(file));
    target._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
  `;
}
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
  const kind = String(expectedRequests);
  const walking = ["env-walk", "images", "backups", "sql"].includes(kind);
  const modes = local
    ? kind === "env"
      ? ["success", "plain-env", "read-error"]
      : kind === "artifacts"
        ? ["success", "directory-error", "read-error"]
        : kind === "lines"
          ? ["success", "open-error", "long-line"]
          : kind === "commands"
            ? ["success", "open-error", "invalid-json"]
            : [
                "success",
                "directory-error",
                "stat-error",
                "symlink",
                ...(kind === "env-walk" ? ["plain-env", "env-read-error"] : []),
                ...(kind === "sql" ? ["read-error"] : []),
              ]
    : listing
      ? [
          "success",
          "http-error",
          "network-error",
          "invalid-json",
          "invalid-shape",
          "missing-key",
          "env-read-error",
        ]
      : ["success", "not-found", "rate-limited", "network-error"];
  for (const mode of modes) {
    const probe = local
      ? localProbe(file, kind, mode)
      : `
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
    const expectedRawError =
      (kind === "env-walk" && mode === "env-read-error") ||
      (kind === "env" && mode === "read-error") ||
      (["lines", "commands"].includes(kind) && mode === "open-error") ||
      (kind === "artifacts" && mode !== "success");
    const expectedValue =
      (kind === "env-walk" && ["success", "symlink"].includes(mode)) ||
      (kind === "env" && mode === "success") ||
      (kind === "lines" && ["success", "long-line"].includes(mode)) ||
      (["commands", "artifacts"].includes(kind) && mode === "success");
    const passed = local
      ? !child.error &&
        child.status === 0 &&
        !child.stderr.includes("SYNTHETIC_") &&
        state.requests === 0 &&
        state.rawErrorOutput === expectedRawError &&
        state.valueLikeContentOutput === expectedValue &&
        state.hardcodedExternalPathRequested ===
          ["lines", "commands", "artifacts"].includes(kind) &&
        state.linkTraversalObserved === (walking && mode === "symlink") &&
        state.exportedKeyReported === false &&
        state.truncatedOutput === (kind === "lines" && mode === "long-line")
      : !child.error &&
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
  credentials: local
    ? "All target filesystem/stream requests use synthetic fixtures; real env/transcripts/artifacts never read"
    : "synthetic fs response; actual .env never read",
  sources,
  results,
  remainingSourceOrCommandConsumers: consumers,
  checksPassed:
    results.every((row) => row.passed) &&
    consumers.length === 0 &&
    (baselineOnly || sources.every((row) => row.removed)),
  limitation: local
    ? "Retirement evidence only; link traversal uses inert directory fixtures, not real OS symlinks. No production filesystem traversal or application configuration certification."
    : "Retirement evidence only; not live ImageKit listing/upload, redirect, delivery, CDN rendering or application integration certification",
};
fs.writeFileSync(
  baselineOnly
    ? local
      ? "coverage/p00-local-utility-baseline.json"
      : "coverage/p00-network-utility-baseline.json"
    : local
      ? "docs/reviews/p00-local-utility-retirement.json"
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
