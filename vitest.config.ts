import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

// Load test environment variables before anything else
dotenv.config({ path: ".env.test" });

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: [
        "apps/api/src/**/*.ts",
        "modules/**/*.ts",
        "packages/core/src/**/*.ts",
        "packages/validation/src/**/*.ts",
        "packages/api-client/src/index.ts",
      ],
      exclude: ["**/test/**", "**/*.spec.ts", "**/*.test.ts", "**/generated/**"],
    },
    // Disable parallel execution of test files to prevent PostgreSQL deadlocks
    fileParallelism: false,
    maxWorkers: 1,
    sequence: {
      concurrent: false,
    },
    // Run database connection/cleanup rules before any test runs
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "apps/**/*.spec.ts",
      "modules/**/*.spec.ts",
      "packages/**/*.spec.ts",
      "apps/**/*.test.ts",
      "modules/**/*.test.ts",
      "packages/**/*.test.ts",
    ],
  },
});
