import { PrismaClient } from "@prisma/client";
import { inspectSelectedTestDatabase } from "../scripts/testing/database-catalog-inspection";

inspectSelectedTestDatabase(
  process.env,
  (url) => new PrismaClient({ datasources: { db: { url } } }),
  (summary) => console.log(JSON.stringify(summary)),
).catch(() => {
  console.error("Database catalog inspection refused or failed.");
  process.exitCode = 1;
});
