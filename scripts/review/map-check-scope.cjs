// Read compiler configuration and prior lint evidence; never import application code.
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const ts = require("typescript");
const root = process.cwd();
const relative = (file) => path.relative(root, file).replace(/\\/g, "/");
const manifest = JSON.parse(fs.readFileSync("package.json", "utf8"));
const projects = ["."];
const extraConfigs = ["tsconfig.tooling.json", "scratch/tsconfig.json"];
for (const group of ["apps", "packages"]) {
  for (const name of fs.readdirSync(group)) {
    const folder = `${group}/${name}`;
    const file = `${folder}/package.json`;
    if (
      fs.existsSync(file) &&
      JSON.parse(fs.readFileSync(file, "utf8")).scripts?.["type-check"] === "tsc --noEmit"
    ) {
      projects.push(folder);
    }
  }
}
const membership = new Map();
const projectSummary = [];
for (const configName of [
  ...projects.map((folder) => path.join(folder, "tsconfig.json")),
  ...extraConfigs,
]) {
  const config = path.resolve(configName);
  const read = ts.readConfigFile(config, ts.sys.readFile);
  if (read.error) throw new Error(`Cannot read ${relative(config)}`);
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(config));
  if (parsed.errors.length) throw new Error(`Cannot parse ${relative(config)}`);
  const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true });
  const files = program
    .getSourceFiles()
    .map((file) => relative(file.fileName))
    .filter(
      (file) =>
        !file.startsWith("../") && !file.includes("node_modules/") && !file.includes("/.next/"),
    );
  for (const file of files) {
    if (!membership.has(file)) membership.set(file, []);
    membership.get(file).push(relative(config));
  }
  projectSummary.push({ config: relative(config), localSourceFiles: files.length });
}
const linted = new Set(
  JSON.parse(fs.readFileSync("docs/reviews/p00-eslint-results.json", "utf8")).map((row) =>
    relative(row.filePath),
  ),
);
const files = [
  ...new Set([
    ...cp.execFileSync("git", ["ls-files"], { encoding: "utf8" }).trim().split(/\r?\n/),
    ...cp
      .execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" })
      .trim()
      .split(/\r?\n/),
  ]),
].filter(
  (file) => /\.[cm]?[jt]sx?$/.test(file) && !file.startsWith("docs/") && fs.existsSync(file),
);
const formatRoots = [
  "apps/api/src/shared/",
  "apps/api/src/plugins/",
  "packages/core/src/",
  "packages/types/src/",
  "packages/validation/src/",
  "scripts/testing/",
  "scripts/review/",
];
const rows = files.sort().map((file) => ({
  file,
  compilerPrograms: membership.get(file) ?? [],
  inRecordedBackendLintRun: linted.has(file),
  inConfiguredFormatRoots:
    formatRoots.some((prefix) => file.startsWith(prefix)) ||
    manifest.scripts["format:check"].split(/\s+/).includes(file),
  generated: file.includes("/generated/"),
}));
const result = {
  date: "2026-10-17",
  projects: projectSummary,
  commands: {
    typeCheck: manifest.scripts["type-check"],
    lint: manifest.scripts.lint,
    formatCheck: manifest.scripts["format:check"],
  },
  note: "Compiler program membership includes imported files outside include roots; this is scope evidence, not a new type-check result. skipLibCheck limits declaration checking. Lint membership is the saved backend run only; Next lint is separate. Formatter membership describes current explicit roots, not a formatting result. JavaScript checkJs is not enabled. Missing coverage requires a deliberate policy, not blanket exclusions.",
  files: rows,
};
fs.writeFileSync("docs/reviews/p00-check-scope.json", JSON.stringify(result, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      projects: projectSummary,
      sourceFiles: rows.length,
      outsideCompilerPrograms: rows
        .filter((row) => !row.compilerPrograms.length)
        .map((row) => row.file),
    },
    null,
    2,
  ),
);
