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

  const dbName = "enterprise_level_ecommerce_test";
  console.log(`=== Checking if database '${dbName}' exists ===`);

  try {
    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    );

    if (result.length > 0) {
      console.log(`Database '${dbName}' already exists.`);
    } else {
      console.log(`Database '${dbName}' does not exist. Creating...`);
      // CREATE DATABASE cannot be executed inside a transaction block, $executeRawUnsafe handles this
      await prisma.$executeRawUnsafe(`CREATE DATABASE ${dbName};`);
      console.log(`Database '${dbName}' created successfully!`);
    }
  } catch (error: any) {
    console.error("Error creating test database:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
