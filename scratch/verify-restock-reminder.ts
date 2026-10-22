import { PrismaClient } from "@prisma/client";
import { withOperationalTestDatabase } from "../scripts/testing/database-inspection";
import { runRestockReminderProbe } from "../scripts/testing/restock-probes";

async function main() {
  await withOperationalTestDatabase(
    process.env,
    (url) => new PrismaClient({ datasources: { db: { url } } }),
    runRestockReminderProbe,
  );
  console.log("Restock reminder persistence verified; fixtures rolled back. No delivery tested.");
}
main().catch(() => {
  console.error("Restock reminder probe refused or failed.");
  process.exitCode = 1;
});
