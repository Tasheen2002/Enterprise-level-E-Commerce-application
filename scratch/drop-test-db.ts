import { PrismaClient } from "@prisma/client";

async function main() {
  // Connect to the default 'postgres' database to run administrative commands
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:1234@localhost:5432/postgres"
      }
    }
  });

  console.log("=== Terminating active connections to the test database ===");
  try {
    await prisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'enterprise_level_ecommerce_test'
        AND pid <> pg_backend_pid();
    `);
    console.log("Connections terminated successfully.");
  } catch (err: any) {
    console.warn("Notice: Could not terminate connections (database might not exist or be active):", err.message);
  }

  console.log("=== Dropping database 'enterprise_level_ecommerce_test' ===");
  try {
    await prisma.$executeRawUnsafe("DROP DATABASE IF EXISTS enterprise_level_ecommerce_test;");
    console.log("Test database dropped successfully!");
  } catch (error: any) {
    console.error("Error dropping test database:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
