// Only touches a newly named database inside the labelled, disposable P00 container.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import { requireTestDatabaseAdmin } from "../testing/operational-database";

async function main() {
  const container = "slipperze-audit-p00-postgres";
  const info = JSON.parse(execFileSync("docker", ["inspect", container], { encoding: "utf8" }))[0];
  const port = info.NetworkSettings.Ports["5432/tcp"]?.[0];
  if (
    info.Config.Labels?.["slipperze.audit"] !== "p00-disposable" ||
    !info.State.Running ||
    port?.HostIp !== "127.0.0.1"
  ) {
    throw new Error("Expected the labelled loopback-only disposable container");
  }
  // Keep container credentials in memory; never print driver or subprocess output.
  const config = Object.fromEntries(
    info.Config.Env.map((entry: string) => {
      const index = entry.indexOf("=");
      return [entry.slice(0, index), entry.slice(index + 1)];
    }),
  );
  const maintenance = new URL(`postgresql://127.0.0.1:${port.HostPort}/postgres`);
  maintenance.username = config.POSTGRES_USER;
  maintenance.password = config.POSTGRES_PASSWORD;
  if (maintenance.username !== "audit_admin" || !maintenance.password)
    throw new Error("Unexpected maintenance identity");
  const database = `p00_cli_${randomUUID().replace(/-/g, "")}_test`;
  const target = new URL(maintenance);
  target.pathname = "/" + database;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "test",
    ALLOW_DATABASE_TEST_CLEANUP: "1",
    ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
    DATABASE_URL: target.toString(),
    TEST_DATABASE_URL: target.toString(),
    TEST_DATABASE_ADMIN_URL: maintenance.toString(),
    TEST_ADMIN_EMAIL: "p00-admin@example.invalid",
    TEST_ADMIN_PASSWORD: randomUUID() + randomUUID(),
  };
  requireTestDatabaseAdmin(env);
  const results: Record<string, string> = {};
  const run = (file: string, expected = 0) => {
    console.log(`P00 isolated CLI check: ${file} (expected exit ${expected})`);
    const child = spawnSync(process.execPath, ["--import", "tsx", `scratch/${file}.ts`], {
      env,
      encoding: "utf8",
      timeout: 90_000,
    });
    if (child.error || child.status !== expected) throw new Error(`Unexpected exit: ${file}`);
  };
  const admin = new PrismaClient({ datasources: { db: { url: maintenance.toString() } } });
  let client: PrismaClient | undefined;
  let created = false;
  let failure: unknown;
  try {
    run("create-test-db");
    created = true;
    run("create-test-db");
    results.createAndExisting = "passed";
    // Give only the new database to the existing restricted test role.
    await admin.$executeRawUnsafe(`ALTER DATABASE "${database}" OWNER TO audit_test`);
    const local = dotenv.parse(fs.readFileSync(".env.audit.local"));
    const restricted = new URL(local.TEST_DATABASE_URL);
    if (
      restricted.username !== "audit_test" ||
      restricted.hostname !== maintenance.hostname ||
      restricted.port !== port.HostPort
    ) {
      throw new Error("Unexpected restricted audit identity");
    }
    restricted.pathname = "/" + database;
    env.DATABASE_URL = env.TEST_DATABASE_URL = restricted.toString();
    // Empty, newly created database only. This synchronizes schema, not migration history.
    const schema = spawnSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"],
      { env, encoding: "utf8", timeout: 90_000 },
    );
    if (schema.error || schema.status !== 0)
      throw new Error("Disposable schema synchronization failed");
    results.schemaSynchronization = "passed; migration history not replayed";
    client = new PrismaClient({ datasources: { db: { url: restricted.toString() } } });
    run("verify-restock-reminder");
    run("verify-restock-dispatcher");
    if (
      (await client.product.count()) ||
      (await client.productVariant.count()) ||
      (await client.user.count()) ||
      (await client.location.count()) ||
      (await client.reminder.count())
    ) {
      throw new Error("Restock probes left fixtures in the empty test database");
    }
    results.restockWithoutExistingCatalog =
      "passed; persistence rollback and simulated subscriber cleanup leave no fixtures; SMTP blocked";
    run("seed-development-db");
    const before = await client.product.findMany({ select: { id: true }, orderBy: { id: "asc" } });
    if (
      before.length !== 28 ||
      (await client.category.count()) !== 24 ||
      (await client.productVariant.count()) !== 97
    )
      throw new Error("Unexpected fixture counts");
    const jpg = await client.mediaAsset.findMany({
      where: { storageKey: { endsWith: ".jpg" } },
      select: { mime: true },
    });
    if (!jpg.length || jpg.some((asset) => asset.mime !== "image/jpeg"))
      throw new Error("Incorrect JPEG metadata");
    results.seedAndMediaMetadata = "passed; 28 products, 24 categories, 97 variants";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION product_catalog.p00_reject_variant() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P00 injected seed failure'; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_reject_variant BEFORE INSERT ON product_catalog.product_variants FOR EACH ROW EXECUTE FUNCTION product_catalog.p00_reject_variant()`,
    );
    run("seed-development-db", 1);
    const after = await client.product.findMany({ select: { id: true }, orderBy: { id: "asc" } });
    if (
      JSON.stringify(before) !== JSON.stringify(after) ||
      (await client.productVariant.count()) !== 97
    )
      throw new Error("Failed seed did not preserve original fixtures");
    await client.$executeRawUnsafe(
      `DROP TRIGGER p00_reject_variant ON product_catalog.product_variants`,
    );
    await client.$executeRawUnsafe(`DROP FUNCTION product_catalog.p00_reject_variant()`);
    results.failedSeedRollback = "passed; original product identities and variant count preserved";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION engagement.p00_reject_reminder() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P00 injected reminder failure'; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_reject_reminder BEFORE INSERT ON engagement.reminders FOR EACH ROW EXECUTE FUNCTION engagement.p00_reject_reminder()`,
    );
    run("verify-restock-reminder", 1);
    run("verify-restock-dispatcher", 1);
    const preservedCatalog = await client.product.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });
    if (
      JSON.stringify(before) !== JSON.stringify(preservedCatalog) ||
      (await client.productVariant.count()) !== 97 ||
      (await client.user.count()) ||
      (await client.reminder.count()) ||
      (await client.location.count()) !== 1
    ) {
      throw new Error("Failed restock probes changed the seeded catalog or left fixtures");
    }
    await client.$executeRawUnsafe(`DROP TRIGGER p00_reject_reminder ON engagement.reminders`);
    await client.$executeRawUnsafe(`DROP FUNCTION engagement.p00_reject_reminder()`);
    results.restockInsertFailureRollback =
      "passed; both CLIs fail without leftover fixtures or changes to existing catalog";
    run("seed-admin");
    const user = await client.user.findUniqueOrThrow({ where: { email: env.TEST_ADMIN_EMAIL } });
    if (
      user.role !== "ADMIN" ||
      !user.passwordHash ||
      !(await compare(env.TEST_ADMIN_PASSWORD!, user.passwordHash))
    )
      throw new Error("Invalid test administrator");
    run("seed-admin", 1);
    const existing = await client.user.findUniqueOrThrow({
      where: { email: env.TEST_ADMIN_EMAIL },
    });
    if (user.id !== existing.id || user.passwordHash !== existing.passwordHash)
      throw new Error("Existing administrator was changed");
    results.adminCreateAndConflict = "passed; existing account preserved";
    await client.$executeRawUnsafe(
      `CREATE FUNCTION product_catalog.p00_reject_cleanup() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P00 injected cleanup failure'; END $$`,
    );
    await client.$executeRawUnsafe(
      `CREATE TRIGGER p00_reject_cleanup BEFORE DELETE ON product_catalog.products FOR EACH ROW EXECUTE FUNCTION product_catalog.p00_reject_cleanup()`,
    );
    run("clear-database", 1);
    const preserved = await client.product.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });
    if (
      JSON.stringify(before) !== JSON.stringify(preserved) ||
      (await client.inventoryStock.count()) !== 97 ||
      (await client.productMedia.count()) !== 100
    ) {
      throw new Error("Failed cleanup did not restore deleted fixture relations");
    }
    await client.$executeRawUnsafe(`DROP TRIGGER p00_reject_cleanup ON product_catalog.products`);
    await client.$executeRawUnsafe(`DROP FUNCTION product_catalog.p00_reject_cleanup()`);
    results.failedCleanupRollback = "passed; product identities, stock and media links preserved";
    run("clear-database");
    if (
      (await client.product.count()) ||
      (await client.category.count()) ||
      (await client.inventoryStock.count())
    )
      throw new Error("Catalog cleanup incomplete");
    results.catalogCleanup = "passed";
    await client.$disconnect();
    client = undefined;
  } catch (error) {
    failure = error;
  }
  try {
    await client?.$disconnect();
    if (created) {
      run("drop-test-db");
      run("drop-test-db");
      const remaining = await admin.$queryRaw<
        Array<{ exists: boolean }>
      >`SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${database}) AS exists`;
      if (remaining[0]?.exists) throw new Error("Disposable probe database still exists");
      results.dropAndMissing = "passed; newly created database removed";
    }
  } catch (error) {
    failure ??= error;
  } finally {
    await admin.$disconnect();
  }
  if (failure) throw failure;
  const report = {
    date: "2026-10-17",
    container,
    results,
    productionData: "not accessed",
    externalProviders: "not called",
    verified_source_sha256: Object.fromEntries(
      [
        "scripts/testing/database-safety.ts",
        "scripts/testing/operational-database.ts",
        "scripts/testing/restock-probes.ts",
        ...[
          "create-test-db",
          "drop-test-db",
          "clear-database",
          "seed-admin",
          "seed-development-db",
          "verify-restock-reminder",
          "verify-restock-dispatcher",
        ].map((name) => `scratch/${name}.ts`),
      ].map((file) => [file, createHash("sha256").update(fs.readFileSync(file)).digest("hex")]),
    ),
    limitation:
      "Disposable schema synchronization and operational CLI checks only; not migration replay or business-module integration certification",
  };
  fs.writeFileSync(
    "docs/reviews/p00-operational-database-check.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
}

main().catch(() => {
  console.error(
    "Isolated operational check failed; raw connection and child outputs withheld. Check probe cleanup before retrying.",
  );
  process.exitCode = 1;
});
