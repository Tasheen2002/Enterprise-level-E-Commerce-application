import { PrismaClient } from "@prisma/client";
import { ReservationRepositoryImpl as ResRepo } from "../modules/cart/infra/persistence/repositories/reservation.repository.impl";
import { VariantId } from "../modules/product-catalog/domain/value-objects/variant-id.vo";
import { CartId } from "../modules/cart/domain/value-objects/cart-id.vo";

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing Cart Inventory Enforcement Test...");

  const mockStockService = {
    getTotalAvailableStock: async (variantId: string) => {
      const stock = await prisma.inventoryStock.findFirst({
        where: { variantId }
      });
      return stock ? (stock.onHand - stock.reserved) : 0;
    }
  };

  const resRepo = new ResRepo(prisma, mockStockService as any);

  // 1. Get any product variant
  const variant = await prisma.productVariant.findFirst();

  if (!variant) {
    console.error("No product variant found in database. Cannot run test.");
    return;
  }

  console.log(`Found variant: ${variant.sku}, ID: ${variant.id}`);

  // Let's check the inventory stocks for this variant, or create one if missing
  let stock = await prisma.inventoryStock.findFirst({
    where: { variantId: variant.id }
  });

  if (!stock) {
    console.log("No stock record found for variant. Creating mock stock record.");
    // Find a valid location
    const location = await prisma.location.findFirst();
    if (!location) {
      console.error("No locations found in DB. Cannot create mock stock.");
      return;
    }
    stock = await prisma.inventoryStock.create({
      data: {
        id: "d3b07384-d111-4777-a111-dcd3d2c1b2a3",
        variantId: variant.id,
        locationId: location.id,
        onHand: 10,
        reserved: 0
      }
    });
  }

  console.log(`Inventory Stock: OnHand=${stock.onHand}, Reserved=${stock.reserved}, Available (OnHand-Reserved)=${stock.onHand - stock.reserved}`);

  const variantVO = VariantId.fromString(variant.id);
  // Using valid v4 UUIDs
  const cartIdA = CartId.fromString("f47ac10b-58cc-4372-a567-0e02b2c3d479");
  const cartIdB = CartId.fromString("a8097c1a-6415-4df3-aa6a-f864e4307a0c");

  // Clear existing test records first
  await prisma.reservation.deleteMany({
    where: { cartId: { in: [cartIdA.getValue(), cartIdB.getValue()] } }
  });
  await prisma.shoppingCart.deleteMany({
    where: { id: { in: [cartIdA.getValue(), cartIdB.getValue()] } }
  });

  // Create mock shopping carts so reservations fkey constraint is satisfied
  console.log("Creating mock Shopping Carts...");
  await prisma.shoppingCart.create({
    data: { id: cartIdA.getValue(), currency: "EUR" }
  });
  await prisma.shoppingCart.create({
    data: { id: cartIdB.getValue(), currency: "EUR" }
  });

  // Temporarily disable preorder and backorder on this variant to enforce stock limits
  console.log("Temporarily disabling preorder and backorder on variant...");
  const originalAllowPreorder = variant.allowPreorder;
  const originalAllowBackorder = variant.allowBackorder;

  await prisma.productVariant.update({
    where: { id: variant.id },
    data: { allowPreorder: false, allowBackorder: false }
  });

  // Temporarily set variant stock to: onHand = 5, reserved = 0 (so available = 5)
  console.log("Temporarily setting stock to OnHand=5, Reserved=0 for clean testing...");
  const originalOnHand = stock.onHand;
  const originalReserved = stock.reserved;

  await prisma.inventoryStock.updateMany({
    where: { variantId: variant.id },
    data: { onHand: 5, reserved: 0 }
  });

  try {
    // 2. Check availability for Cart A when there are no reservations for Cart A
    // Suppose we want to reserve 6 items (exceeds inventory).
    const req6 = await resRepo.checkAvailability(variantVO, 6);
    console.log(`Is 6 available initially? ${req6.available} (Expected: false since stock is 5)`);

    if (req6.available) {
      throw new Error("Validation failed: 6 items should not be available.");
    }

    // Check available: should be 5
    const availInit = await resRepo.checkAvailability(variantVO, 5);
    console.log(`Is 5 available? ${availInit.available} (Expected: true)`);

    // Create reservation for Cart A: qty = 3
    const testResId = "e5b8dcd3-10e0-474c-a110-333d4e0e9ab7";
    await prisma.reservation.deleteMany({ where: { id: testResId } });
    await prisma.reservation.create({
      data: {
        id: testResId,
        cartId: cartIdA.getValue(),
        variantId: variant.id,
        qty: 3,
        expiresAt: new Date(Date.now() + 60000)
      }
    });
    console.log("Created reservation for Cart A: Qty = 3");

    // 4. Test availability for Cart A updating from 3 to 5
    // Excluding Cart A, activeReserved is 0. So availableForReservation = 5 - 0 = 5.
    // 5 >= 5, so it should be AVAILABLE!
    const checkA = await resRepo.checkAvailability(variantVO, 5, cartIdA);
    console.log(`Cart A updating to 5: is available? ${checkA.available} (Expected: true)`);

    if (!checkA.available) {
      throw new Error("Update check failed: Cart A should be allowed to increase to 5.");
    }

    // 5. Test availability for Cart A updating from 3 to 6
    // Excluding Cart A, activeReserved is 0. So availableForReservation = 5.
    // 5 >= 6 is false. Should be NOT AVAILABLE!
    const checkA_fail = await resRepo.checkAvailability(variantVO, 6, cartIdA);
    console.log(`Cart A updating to 6: is available? ${checkA_fail.available} (Expected: false)`);

    if (checkA_fail.available) {
      throw new Error("Update check failed: Cart A should NOT be allowed to increase to 6.");
    }

    // 6. Test availability for Cart B (different cart) trying to reserve 3
    // Excluding Cart B, activeReserved is 3 (from Cart A). So availableForReservation = 5 - 3 = 2.
    // 2 >= 3 is false. Should be NOT AVAILABLE!
    const checkB = await resRepo.checkAvailability(variantVO, 3, cartIdB);
    console.log(`Cart B trying to reserve 3: is available? ${checkB.available} (Expected: false)`);

    if (checkB.available) {
      throw new Error("Validation failed: Cart B should not be allowed to reserve 3 when Cart A holds 3 out of 5.");
    }

  } finally {
    // Restore original variant options, stock and clean up reservations & carts
    console.log("Restoring original variant options, stock levels and cleaning up test records...");
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { allowPreorder: originalAllowPreorder, allowBackorder: originalAllowBackorder }
    });
    await prisma.inventoryStock.updateMany({
      where: { variantId: variant.id },
      data: { onHand: originalOnHand, reserved: originalReserved }
    });
    await prisma.reservation.deleteMany({
      where: { cartId: { in: [cartIdA.getValue(), cartIdB.getValue()] } }
    });
    await prisma.shoppingCart.deleteMany({
      where: { id: { in: [cartIdA.getValue(), cartIdB.getValue()] } }
    });
  }

  console.log("Cart inventory enforcement test passed successfully!");
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
  })
  .finally(() => prisma.$disconnect());
