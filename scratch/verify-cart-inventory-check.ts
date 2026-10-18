import { PrismaClient } from "@prisma/client";
import { requireOperationalTestDatabase } from "../scripts/testing/operational-database";
import { runCartInventoryProbe } from "../scripts/testing/cart-inventory-probe";

async function main() {
  const url = requireOperationalTestDatabase(process.env);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await runCartInventoryProbe(prisma);
    console.log("Sequential cart inventory checks passed; owned fixtures removed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error("Cart inventory probe refused or failed.");
  process.exitCode = 1;
});
