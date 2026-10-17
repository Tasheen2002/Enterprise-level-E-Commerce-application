import { PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, afterAll } from "vitest";
import { requireTestDatabase } from "./scripts/testing/database-safety";

let prisma: PrismaClient | null = null;

// Clean up all tables in the database
async function cleanDatabase() {
  if (!prisma) return;
  const tables = await prisma.$queryRaw<Array<{ schemaname: string; tablename: string }>>`
      SELECT schemaname, tablename FROM pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema') 
        AND tablename != '_prisma_migrations';
    `;

  for (const { schemaname, tablename } of tables) {
    const schemas = [
      "public",
      "analytics",
      "cart",
      "customer_care",
      "engagement",
      "fulfillment",
      "inventory_management",
      "order_management",
      "payment_loyalty",
      "product_catalog",
      "user_management",
    ];
    if (!schemas.includes(schemaname)) continue;
    if (!/^[a-zA-Z0-9_]+$/.test(tablename)) throw new Error("Unexpected test table identifier");
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${schemaname}"."${tablename}" CASCADE;`);
  }
}

// Check if the current test file is a database E2E/Integration test
function isDatabaseTest(): boolean {
  const testPath = expect.getState().testPath;
  return !!testPath && (testPath.includes(".e2e.") || testPath.includes(".integration."));
}

// Setup files run before test modules create their own Prisma clients.
if (isDatabaseTest()) process.env.DATABASE_URL = requireTestDatabase(process.env);

beforeAll(async () => {
  if (isDatabaseTest()) {
    prisma = new PrismaClient();
    await prisma.$connect();
  }
});

beforeEach(async () => {
  if (isDatabaseTest() && prisma) {
    await cleanDatabase();
  }
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});
