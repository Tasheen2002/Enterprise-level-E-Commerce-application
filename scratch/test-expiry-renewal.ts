import { createServer } from "../apps/api/src/server";
import { container } from "../apps/api/src/container";
import { CartManagementService } from "../modules/cart/application/services/cart-management.service";

async function main() {
  // Boot up the server to trigger container registration
  const server = await createServer();

  const cartManagementService = container.get<CartManagementService>("cartManagementService");

  // Cart for user: b27551c5-a9d4-4287-9ee3-40c9323ae822
  const userId = "b27551c5-a9d4-4287-9ee3-40c9323ae822";
  const cartId = "3f517a87-31e1-4021-82cf-9bcb54b917b7";
  const variantId = "ab30e997-51df-40e3-90db-5220e2a3108a";

  console.log("=== Querying Cart Before Operation ===");
  const cartBefore = await cartManagementService.getCartSummary(cartId, userId);
  console.log("Before: isReservationExpired:", cartBefore?.isReservationExpired);
  console.log("Before: reservationExpiresAt:", cartBefore?.reservationExpiresAt);

  console.log("\n=== Adding Item to Cart (Simulating add-to-cart operation) ===");
  const result = await cartManagementService.addToCart({
    cartId,
    userId,
    variantId,
    quantity: 1
  });

  console.log("\n=== Querying Cart After Operation ===");
  const cartAfter = await cartManagementService.getCartSummary(cartId, userId);
  console.log("After: isReservationExpired:", cartAfter?.isReservationExpired);
  console.log("After: reservationExpiresAt:", cartAfter?.reservationExpiresAt);

  // Close server to release DB connection and exit
  await server.close();
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
