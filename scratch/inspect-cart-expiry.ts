import { PrismaClient } from "@prisma/client";
import { inspectCartExpiry } from "../scripts/testing/cart-expiry-inspection";

inspectCartExpiry(
  process.env,
  (url) => new PrismaClient({ datasources: { db: { url } } }),
  (summary) => console.log(JSON.stringify(summary)),
).catch(() => {
  console.error("Cart expiry inspection refused or failed.");
  process.exitCode = 1;
});
