import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Querying Inventory Stock ===");
  const stocks = await prisma.inventoryStock.findMany({
    include: {
      location: true,
    }
  });
  
  for (const s of stocks) {
    console.log(`Variant ID: ${s.variantId}`);
    console.log(`Location: ${s.location?.name ?? s.locationId}`);
    console.log(`On Hand: ${s.onHand}`);
    console.log(`Reserved: ${s.reserved}`);
    console.log("---------------------------------------");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
