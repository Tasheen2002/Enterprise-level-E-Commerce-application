import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    // Native tsconfig paths resolution
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        globals: true,
        environment: "node",
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: ["node_modules/", "dist/"],
        },
        include: ["**/*.test.ts", "**/*.spec.ts"],
        exclude: ["node_modules", "dist", ".idea", ".git", ".cache", ".turbo"],
    },
});
