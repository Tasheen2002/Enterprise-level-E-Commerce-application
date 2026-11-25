import { PrismaClient } from "@prisma/client";
import { verifyTestAdmin } from "../scripts/testing/admin-inspection";

verifyTestAdmin(
  process.env,
  (url) => new PrismaClient({ datasources: { db: { url } } }),
  (summary) => console.log(JSON.stringify(summary)),
).catch(() => {
  console.error("Test administrator inspection refused or failed.");
  process.exitCode = 1;
});
