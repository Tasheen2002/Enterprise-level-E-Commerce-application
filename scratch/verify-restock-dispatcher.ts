import { PrismaClient } from "@prisma/client";
import { container } from "../apps/api/src/container";
import { StockAddedEvent } from "../modules/inventory-management/domain/entities/stock.entity";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Initializing Restock Alert Dispatcher Verification ===");

  // 1. Initialize container
  container.register(prisma, {
    jwtSecret: "test-secret",
    jwtExpiresIn: "1h",
  });

  const eventBus = (container as any).services.get("eventBus");
  if (!eventBus) {
    throw new Error("eventBus not found in container services");
  }

  // 2. Fetch a product variant to use
  const variant = await prisma.productVariant.findFirst({
    include: { product: true }
  });

  if (!variant) {
    console.error("No variant found in database");
    return;
  }

  console.log(`Using variant: SKU=${variant.sku}, Name=${variant.product?.title}`);

  // 3. Create a test user and a test pending reminder subscription
  const testEmail = `verification-alert-${Date.now()}@tasheen.com`;
  console.log(`Creating test user with email: ${testEmail}`);
  const testUser = await prisma.user.create({
    data: {
      email: testEmail,
      isGuest: true,
    }
  });

  console.log(`Creating test pending reminder alert for user ID: ${testUser.id}`);
  
  const reminder = await prisma.reminder.create({
    data: {
      type: "restock",
      variantId: variant.id,
      userId: testUser.id,
      contact: "email",
      channel: "email",
      status: "pending",
    }
  });

  console.log(`Created pending reminder: ID=${reminder.id}, Status=${reminder.status}`);

  // 4. Publish StockAddedEvent directly to the container's eventBus
  console.log("Publishing StockAddedEvent on EventBus...");
  const location = await prisma.location.findFirst();
  const locationId = location?.id || "d3b07384-d111-4777-a111-dcd3d2c1b2a3";
  
  const event = new StockAddedEvent(variant.id, locationId, 5);
  await eventBus.publish(event);

  // Allow subscriber some time to execute (since it runs in promise chain)
  console.log("Waiting 3 seconds for subscriber to execute...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 5. Verify database state transitions
  const updatedReminder = await prisma.reminder.findUnique({
    where: { id: reminder.id }
  });

  console.log(`Updated reminder status in DB: ${updatedReminder?.status}`);

  if (updatedReminder?.status !== "sent") {
    throw new Error(`State transition verification failed! Expected status 'sent', got '${updatedReminder?.status}'`);
  }

  console.log("State transition verification succeeded! Reminder status updated to 'sent'.");

  // 6. Cleanup test records
  console.log("Cleaning up test reminder record...");
  await prisma.reminder.delete({
    where: { id: reminder.id }
  });

  console.log("Cleaning up test user record...");
  await prisma.user.delete({
    where: { id: testUser.id }
  });

  console.log("=== Verification Completed Successfully ===");
}

main()
  .catch((err) => {
    console.error("Verification failed:", err);
  })
  .finally(() => prisma.$disconnect());
