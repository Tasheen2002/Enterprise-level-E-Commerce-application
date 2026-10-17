import { PrismaClient } from "@prisma/client";
import { requireOperationalTestDatabase } from "../scripts/testing/operational-database";

async function main() {
  const url = requireOperationalTestDatabase(process.env);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.inventoryStock.deleteMany({});
      await tx.productCategory.deleteMany({});
      await tx.productMedia.deleteMany({});
      await tx.mediaAsset.deleteMany({});
      await tx.productVariant.deleteMany({});
      await tx.product.deleteMany({});
      await tx.category.deleteMany({});
      await tx.location.deleteMany({});
    });
    console.log("Test catalog cleanup committed.");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(() => {
  console.error("Catalog cleanup refused or failed; check the disposable test settings.");
  process.exitCode = 1;
});
