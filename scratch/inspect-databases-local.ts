import { PrismaClient } from "@prisma/client";

async function countTableRows(prisma: PrismaClient, label: string) {
  console.log(`\n=== Counting rows in ${label} ===`);
  try {
    const tables = await prisma.$queryRaw<Array<{ schemaname: string; tablename: string }>>`
      SELECT schemaname, tablename FROM pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema') 
        AND tablename != '_prisma_migrations';
    `;

    if (tables.length === 0) {
      console.log("No tables found.");
      return;
    }

    for (const { schemaname, tablename } of tables) {
      const fullTableName = `"${schemaname}"."${tablename}"`;
      try {
        const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
          SELECT COUNT(*) as count FROM ${fullTableName};
        `);
        const count = countResult[0]?.count ?? 0n;
        if (Number(count) > 0) {
          console.log(`- ${fullTableName}: ${count} rows`);
        } else {
          console.log(`- ${fullTableName}: 0 rows`);
        }
      } catch (err: any) {
        console.log(`- ${fullTableName}: Error counting - ${err.message}`);
      }
    }
  } catch (error: any) {
    console.error(`Error querying tables for ${label}:`, error.message);
  }
}

async function main() {
  const devUrl = "postgresql://postgres:1234@localhost:5432/enterprise_level_ecommerce";
  const testUrl = "postgresql://postgres:1234@localhost:5432/enterprise_level_ecommerce_test";

  console.log("Connecting to Dev Database...");
  const devPrisma = new PrismaClient({
    datasources: {
      db: { url: devUrl }
    }
  });

  console.log("Connecting to Test Database...");
  const testPrisma = new PrismaClient({
    datasources: {
      db: { url: testUrl }
    }
  });

  await countTableRows(devPrisma, "Development Database (enterprise_level_ecommerce)");
  await countTableRows(testPrisma, "Test Database (enterprise_level_ecommerce_test)");

  await devPrisma.$disconnect();
  await testPrisma.$disconnect();
}

main().catch(console.error);
