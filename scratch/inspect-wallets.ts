import { PrismaClient } from "@prisma/client";

import { requireOperationalTestDatabase } from "../scripts/testing/operational-database";
let prisma: PrismaClient | undefined;

async function main() {
  const url = requireOperationalTestDatabase(process.env);
  prisma = new PrismaClient({ datasources: { db: { url } } });
  console.log("=== Inspecting Wallet Products in Database ===");
  const products = await prisma.product.findMany({
    where: {
      title: {
        startsWith: "Mabillon",
      },
    },
    include: {
      media: {
        include: {
          asset: true,
        },
      },
    },
  });

  for (const p of products) {
    console.log(`\nProduct: ${p.title} (Slug: ${p.slug})`);
    console.log("Media relations:");
    for (const m of p.media) {
      console.log(`- Type: ${m.asset.mime}, Asset storageKey: ${m.asset.storageKey}`);
    }
  }
}

main()
  .catch(() => {
    console.error("Wallet inspection refused or failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma?.$disconnect());
