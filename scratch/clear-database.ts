import { PrismaClient } from "@prisma/client";
import { withOperationalTestDatabase } from "../scripts/testing/database-inspection";

async function main() {
  await withOperationalTestDatabase(
    process.env,
    (url) => new PrismaClient({ datasources: { db: { url } } }),
    (prisma) =>
      prisma.$transaction(async (tx) => {
        await tx.inventoryStock.deleteMany({});
        await tx.productCategory.deleteMany({});
        await tx.productMedia.deleteMany({});
        await tx.mediaAsset.deleteMany({});
        await tx.productVariant.deleteMany({});
        await tx.product.deleteMany({});
        await tx.category.deleteMany({});
        await tx.location.deleteMany({});
      }),
  );
  console.log("Test catalog cleanup committed.");
}
main().catch(() => {
  console.error("Catalog cleanup refused or failed; check the disposable test settings.");
  process.exitCode = 1;
});
