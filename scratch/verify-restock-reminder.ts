import { PrismaClient } from "@prisma/client";
import { requireOperationalTestDatabase } from "../scripts/testing/operational-database";
import { runRestockReminderProbe } from "../scripts/testing/restock-probes";

async function main() {
  const url = requireOperationalTestDatabase(process.env);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await runRestockReminderProbe(prisma);
    console.log("Restock reminder persistence verified; fixtures rolled back. No delivery tested.");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(() => {
  console.error("Restock reminder probe refused or failed.");
  process.exitCode = 1;
});
