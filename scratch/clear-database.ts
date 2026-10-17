import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:1234@localhost:5432/enterprise_level_ecommerce"
    }
  }
});

async function main() {
  console.log("=== Clearing Seeded Product Catalog Data from Dev Database ===");
  try {
    await prisma.inventoryStock.deleteMany({});
    await prisma.productCategory.deleteMany({});
    await prisma.productMedia.deleteMany({});
    await prisma.mediaAsset.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.location.deleteMany({});
    console.log("All product catalog data and images cleared successfully!");
  } catch (error: any) {
    console.error("Error clearing database:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
