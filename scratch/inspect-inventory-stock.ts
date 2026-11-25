import { PrismaClient } from "@prisma/client";
import { inspectInventoryStock } from "../scripts/testing/inventory-stock-inspection";

inspectInventoryStock(
  process.env,
  (url) => new PrismaClient({ datasources: { db: { url } } }),
  (summary) => console.log(JSON.stringify(summary)),
).catch(() => {
  console.error("Inventory stock inspection refused or failed.");
  process.exitCode = 1;
});
