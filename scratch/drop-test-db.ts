import { PrismaClient } from "@prisma/client";
import { withTestDatabaseAdmin } from "../scripts/testing/database-inspection";

async function main() {
  await withTestDatabaseAdmin(
    process.env,
    (url) => new PrismaClient({ datasources: { db: { url } } }),
    async (prisma, database) => {
      // Refuse active databases rather than terminating other sessions implicitly.
      await prisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${database}"`);
    },
  );
  console.log("Selected test database dropped.");
}
main().catch(() => {
  console.error("Test database drop refused or failed; check settings and active connections.");
  process.exitCode = 1;
});
