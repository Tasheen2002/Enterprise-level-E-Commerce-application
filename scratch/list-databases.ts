import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:1234@localhost:5432/postgres" // Connect to default postgres DB to list all DBs
      }
    }
  });

  console.log("=== Listing All Databases ===");
  try {
    const databases = await prisma.$queryRaw<Array<{ datname: string }>>`
      SELECT datname FROM pg_database WHERE datistemplate = false;
    `;
    databases.forEach((db) => {
      console.log(`- ${db.datname}`);
    });
  } catch (error: any) {
    console.error("Error listing databases:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
