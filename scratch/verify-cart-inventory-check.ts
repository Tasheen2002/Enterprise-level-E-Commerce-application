import { PrismaClient } from "@prisma/client";
import { withOperationalTestDatabase } from "../scripts/testing/database-inspection";
import { runCartInventoryProbe } from "../scripts/testing/cart-inventory-probe";

async function main() {
  await withOperationalTestDatabase(
    process.env,
    (url) => new PrismaClient({ datasources: { db: { url } } }),
    runCartInventoryProbe,
  );
  console.log("Sequential cart inventory checks passed; owned fixtures removed.");
}

main().catch(() => {
  console.error("Cart inventory probe refused or failed.");
  process.exitCode = 1;
});
