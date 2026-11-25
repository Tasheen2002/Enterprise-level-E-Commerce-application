import { PrismaClient } from "@prisma/client";
import { withTestDatabaseAdmin } from "../scripts/testing/database-inspection";

async function main() {
  await withTestDatabaseAdmin(
    process.env,
    (url) => new PrismaClient({ datasources: { db: { url } } }),
    async (prisma, database) => {
      const existing = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${database}) AS exists
    `;
      if (!existing[0]?.exists) {
        // Identifiers cannot be parameters; the shared guard restricts this name.
        await prisma.$executeRawUnsafe(`CREATE DATABASE "${database}"`);
      }
    },
  );
  console.log("Selected test database is available.");
}
main().catch(() => {
  console.error("Test database creation refused or failed; check test and maintenance settings.");
  process.exitCode = 1;
});
