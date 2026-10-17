import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:1234@localhost:5432/enterprise_level_ecommerce"
    }
  }
});

async function main() {
  console.log("=== Inspecting Wallet Products in Database ===");
  const products = await prisma.product.findMany({
    where: {
      title: {
        startsWith: "Mabillon"
      }
    },
    include: {
      media: {
        include: {
          asset: true
        }
      }
    }
  });

  for (const p of products) {
    console.log(`\nProduct: ${p.title} (Slug: ${p.slug})`);
    console.log("Images array in Product table:", p.images);
    console.log("Media relations:");
    for (const m of p.media) {
      console.log(`- Type: ${m.type}, Asset storageKey: ${m.asset.storageKey}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
