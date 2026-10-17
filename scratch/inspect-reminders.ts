import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Querying Active Reminders ===");
  const reminders = await prisma.reminder.findMany({
    include: {
      variant: {
        include: {
          product: true
        }
      }
    }
  });

  console.log(`Total reminders in DB: ${reminders.length}`);
  for (const r of reminders) {
    console.log(`ID: ${r.id}`);
    console.log(`Type: ${r.type}`);
    console.log(`Channel: ${r.channel}`);
    console.log(`Status: ${r.status}`);
    console.log(`Variant: SKU=${r.variant?.sku}, Product=${r.variant?.product?.title}`);
    console.log(`Created At: ${r.createdAt}`);
    console.log("---------------------------------------");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
