/**
 * Generate packages/api-client/src/generated/schema.ts from the API's actual
 * route registrations, in-process and offline.
 *
 *   pnpm run generate:api-client   # rewrite the committed client
 *   pnpm run check:api-client      # exit 1 if the committed client has drifted
 *
 * The server is built with an explicit synthetic environment: no listener is
 * opened, the Prisma client stays lazy (no connection to the unreachable
 * placeholder URL), and optional providers are enabled with inert values so
 * every conditionally registered route is part of the contract.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "../../apps/api/src/server";

const repositoryRoot = resolve(__dirname, "../..");
const schemaPath = join(repositoryRoot, "packages/api-client/src/generated/schema.ts");
const generatorCli = join(
  repositoryRoot,
  "packages/api-client/node_modules/openapi-typescript/bin/cli.js",
);

/** Synthetic values only; nothing here is a usable credential or reachable host. */
export const generationEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://openapi:openapi@127.0.0.1:1/openapi_generation_unreachable",
  JWT_SECRET: "openapi-generation-synthetic-secret-not-for-use",
  STRIPE_SECRET_KEY: "sk_test_openapi_generation_synthetic",
};

const normalize = (text: string) => text.replace(/\r\n/g, "\n");

export async function renderSchema(): Promise<string> {
  const app = await createServer(generationEnvironment);
  const directory = mkdtempSync(join(tmpdir(), "api-client-"));
  try {
    const documentPath = join(directory, "openapi.json");
    const outputPath = join(directory, "schema.ts");
    writeFileSync(documentPath, JSON.stringify(app.swagger()));
    execFileSync(process.execPath, [generatorCli, documentPath, "-o", outputPath], {
      stdio: ["ignore", "ignore", "inherit"],
    });
    return normalize(readFileSync(outputPath, "utf8"));
  } finally {
    rmSync(directory, { recursive: true, force: true });
    await app.close();
  }
}

async function main(check: boolean): Promise<void> {
  const generated = await renderSchema();
  const committed = normalize(readFileSync(schemaPath, "utf8"));
  if (check) {
    if (generated !== committed) {
      console.error(
        "API client is out of date with registered routes. Run: pnpm run generate:api-client",
      );
      process.exitCode = 1;
      return;
    }
    console.log("API client matches registered routes.");
    return;
  }
  if (generated === committed) {
    console.log("API client already up to date.");
    return;
  }
  writeFileSync(schemaPath, generated);
  console.log(`Wrote ${schemaPath}`);
}

if (require.main === module) {
  main(process.argv.includes("--check")).catch((error: unknown) => {
    console.error("API client generation failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
