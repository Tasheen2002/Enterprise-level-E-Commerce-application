import { PrismaClient } from "@prisma/client";
import { inspectReminders } from "../scripts/testing/reminder-inspection";

inspectReminders(
  process.env,
  (url) => new PrismaClient({ datasources: { db: { url } } }),
  (summary) => console.log(JSON.stringify(summary)),
).catch(() => {
  console.error("Reminder inspection refused or failed.");
  process.exitCode = 1;
});
