const { spawnSync } = require("node:child_process");
const env = {
  ...process.env,
  DATABASE_URL: "postgresql://synthetic:synthetic@127.0.0.1:1/never_connect",
};
delete env.TEST_DATABASE_URL;
delete env.ALLOW_DATABASE_TEST_CLEANUP;
const result = spawnSync(
  process.execPath,
  [
    "node_modules/vitest/vitest.mjs",
    "run",
    "--config",
    "docs/reviews/probes/p00/directory-test-safety.config.ts",
  ],
  { env, encoding: "utf8", timeout: 30_000 },
);
const output = (result.stdout ?? "") + (result.stderr ?? "");
if (
  result.status !== null &&
  result.status !== 0 &&
  output.includes("Database tests require TEST_DATABASE_URL and ALLOW_DATABASE_TEST_CLEANUP=1") &&
  output.includes("no tests")
) {
  console.log(
    "PASS: actual setup rejected the integration-directory fixture before its test body; no DB client/query ran.",
  );
} else {
  console.error("FAIL: setup did not reject the integration-directory fixture as expected.");
  console.error(output);
  process.exitCode = 1;
}
