import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: "node",
    // Run test files sequentially to avoid database conflicts
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
