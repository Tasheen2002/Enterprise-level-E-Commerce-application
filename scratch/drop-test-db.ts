import { PrismaClient } from "@prisma/client";
import { requireTestDatabaseAdmin } from "../scripts/testing/operational-database";

async function main() {
  const { url, database } = requireTestDatabaseAdmin(process.env);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    // Refuse active databases rather than terminating other sessions implicitly.
    await prisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${database}"`);
    console.log("Selected test database dropped.");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(() => {
  console.error("Test database drop refused or failed; check settings and active connections.");
  process.exitCode = 1;
});
