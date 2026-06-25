import { PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, afterAll } from "vitest";

let prisma: PrismaClient | null = null;

// Clean up all tables in the database
async function cleanDatabase() {
  if (!prisma) return;
  try {
    const tables = await prisma.$queryRaw<Array<{ schemaname: string; tablename: string }>>`
      SELECT schemaname, tablename FROM pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema') 
        AND tablename != '_prisma_migrations';
    `;

    for (const { schemaname, tablename } of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${schemaname}"."${tablename}" CASCADE;`);
    }
  } catch (error) {
    console.error("Failed to clean database tables:", error);
  }
}

// Check if the current test file is a database E2E/Integration test
function isDatabaseTest(): boolean {
  const testPath = expect.getState().testPath;
  return !!testPath && (testPath.includes(".e2e.") || testPath.includes(".integration."));
}

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
