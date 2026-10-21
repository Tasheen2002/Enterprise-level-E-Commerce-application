import { PrismaClient } from "@prisma/client";
import { inspectLoyaltyData } from "../scripts/testing/loyalty-inspection";

inspectLoyaltyData(
  process.env,
  (url) => new PrismaClient({ datasources: { db: { url } } }),
  (summary) => console.log(JSON.stringify(summary)),
).catch(() => {
  console.error("Loyalty inspection refused or failed.");
  process.exitCode = 1;
});
