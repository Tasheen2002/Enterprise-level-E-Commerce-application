import { PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, afterAll } from "vitest";

const prisma = new PrismaClient();

// Clean up all tables in the database
async function cleanDatabase() {
  try {
    const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
    `;

    for (const { tablename } of tableNames) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
    }
  } catch (error) {
    console.error("Failed to clean database tables:", error);
  }
}

beforeAll(async () => {
  // Connect to the test database
  await prisma.$connect();
});

beforeEach(async () => {
  // Empty tables before each test file starts
  await cleanDatabase();
});

afterAll(async () => {
  // Close database connection
  await prisma.$disconnect();
});
