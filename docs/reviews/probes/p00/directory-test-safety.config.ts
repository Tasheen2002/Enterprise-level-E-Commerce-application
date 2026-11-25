import { defineConfig } from "vitest/config";

// Diagnostic only: intentionally omits the production dotenv loader.
// Run only with synthetic URLs and destructive-cleanup opt-in removed.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["docs/reviews/probes/p00/integration/guard-boundary.spec.ts"],
    fileParallelism: false,
  },
});
