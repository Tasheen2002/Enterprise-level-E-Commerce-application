import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Querying database reminders ===");
  const reminders = await prisma.reminder.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      users: true,
      variant: {
        include: {
          product: true
        }
      }
    }
  });

  if (reminders.length === 0) {
    console.log("No reminders found in database.");
  } else {
    reminders.forEach((r) => {
      console.log(`- ID: ${r.id}`);
      console.log(`  Type: ${r.type}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Channel: ${r.channel}`);
      console.log(`  User Email: ${r.users?.email || "No User"}`);
      console.log(`  Variant SKU: ${r.variant?.sku}`);
      console.log(`  Created At: ${r.createdAt}`);
      console.log("--------------------------------------");
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
