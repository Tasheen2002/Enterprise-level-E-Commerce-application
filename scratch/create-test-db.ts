import { PrismaClient } from "@prisma/client";
import { requireTestDatabaseAdmin } from "../scripts/testing/operational-database";

async function main() {
  const { url, database } = requireTestDatabaseAdmin(process.env);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const existing = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${database}) AS exists
    `;
    if (!existing[0]?.exists) {
      // Identifiers cannot be parameters; the shared guard restricts this name.
      await prisma.$executeRawUnsafe(`CREATE DATABASE "${database}"`);
    }
    console.log("Selected test database is available.");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(() => {
  console.error("Test database creation refused or failed; check test and maintenance settings.");
  process.exitCode = 1;
});
