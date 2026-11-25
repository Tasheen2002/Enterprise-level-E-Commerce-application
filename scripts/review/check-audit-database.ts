import fs from "node:fs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { requireTestDatabase } from "../testing/database-safety";

dotenv.config({ path: ".env.audit.local", override: true, quiet: true });
const url = requireTestDatabase(process.env);
if (new URL(url).pathname !== "/slipperze_audit_test") {
  throw new Error("This smoke check is restricted to the dedicated audit database");
}
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function check() {
  try {
    const identity = await prisma.$queryRaw<
      Array<{
        database: string;
        role: string;
        superuser: boolean;
        create_db: boolean;
        create_role: boolean;
      }>
    >`
      SELECT current_database() AS database, current_user AS role,
        rolsuper AS superuser, rolcreatedb AS create_db, rolcreaterole AS create_role
      FROM pg_roles WHERE rolname = current_user
    `;
    if (
      identity.length !== 1 ||
      identity[0].role !== "audit_test" ||
      identity[0].superuser ||
      identity[0].create_db ||
      identity[0].create_role
    ) {
      throw new Error("Unexpected audit database role privileges");
    }
    const before = await prisma.$queryRaw<
      Array<{ absent: boolean }>
    >`SELECT to_regclass('public.p00_transaction_probe') IS NULL AS absent`;
    if (!before[0].absent) throw new Error("Probe table already exists; refusing to change it");
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`CREATE TABLE public.p00_transaction_probe (id integer PRIMARY KEY)`;
        await tx.$executeRaw`INSERT INTO public.p00_transaction_probe (id) VALUES (1)`;
        throw new Error("P00_EXPECTED_ROLLBACK");
      });
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "P00_EXPECTED_ROLLBACK") throw error;
    }
    const after = await prisma.$queryRaw<
      Array<{ absent: boolean }>
    >`SELECT to_regclass('public.p00_transaction_probe') IS NULL AS absent`;
    if (!after[0].absent) throw new Error("Transaction did not roll back its probe table");
    const report = {
      date: "2026-10-17",
      container: "slipperze-audit-p00-postgres",
      image: "postgres:15-alpine",
      identity: identity[0],
      connectivity: "passed",
      rollback: "passed",
      application_schema: "not-deployed",
      application_integration_tests: "not-run",
      credentials: "ignored-local-env-only",
    };
    fs.writeFileSync(
      "docs/reviews/p00-database-check.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

check().catch(() => {
  // Provider/driver messages can contain connection details; keep public output safe.
  console.error("Audit database smoke check failed; no application test suite was run.");
  process.exitCode = 1;
});
