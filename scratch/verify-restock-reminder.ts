import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing Restock Reminder Integration Test...");

  // 1. Retrieve a product variant from the database
  const variant = await prisma.productVariant.findFirst({
    include: { product: true }
  });

  if (!variant) {
    console.error("No product variants found in database. Cannot run test.");
    return;
  }

  console.log(`Using product variant: ID=${variant.id}, SKU=${variant.sku}, Name=${variant.product?.title || "Unknown"}`);

  // 2. Query initial reminder count
  const initialCount = await prisma.reminder.count({
    where: { variantId: variant.id }
  });
  console.log(`Initial reminder count for variant: ${initialCount}`);

  // 3. Create a test restock reminder subscription
  console.log("Subscribing dummy user to restock alert...");
  const testEmail = `collector-test-${Date.now()}@tasheen.com`;
  
  const reminder = await prisma.reminder.create({
    data: {
      type: "restock",
      variantId: variant.id,
      contact: "email",
      channel: "email",
      status: "pending",
      // Store custom contact or payload details if needed, but the model has optInAt/channel/contact
    }
  });

  console.log(`Created restock reminder record: ID=${reminder.id}, Type=${reminder.type}, Status=${reminder.status}`);

  // 4. Query new reminder count to verify increment
  const updatedCount = await prisma.reminder.count({
    where: { variantId: variant.id }
  });
  console.log(`Updated reminder count for variant: ${updatedCount} (Expected: ${initialCount + 1})`);

  if (updatedCount !== initialCount + 1) {
    throw new Error(`Count mismatch! Expected ${initialCount + 1}, got ${updatedCount}`);
  }

  // 5. Clean up database record
  console.log("Cleaning up test reminder record...");
  await prisma.reminder.delete({
    where: { id: reminder.id }
  });

  // 6. Verify count is restored
  const finalCount = await prisma.reminder.count({
    where: { variantId: variant.id }
  });
  console.log(`Final reminder count (after cleanup): ${finalCount} (Expected: ${initialCount})`);

  if (finalCount !== initialCount) {
    throw new Error(`Cleanup failed to restore count! Expected ${initialCount}, got ${finalCount}`);
  }

  console.log("Restock Reminder integration test passed successfully!");
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
  })
  .finally(() => prisma.$disconnect());
