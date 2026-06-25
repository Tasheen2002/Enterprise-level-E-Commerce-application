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
    // Disable parallel execution of test files to prevent PostgreSQL deadlocks
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
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
      "packages/**/*.test.ts"
    ],
  },
});
