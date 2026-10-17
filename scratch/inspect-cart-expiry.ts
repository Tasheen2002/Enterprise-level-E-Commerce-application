import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Querying Shopping Carts ===");
  const carts = await prisma.shoppingCart.findMany({
    include: {
      items: true,
      reservations: true,
    }
  });
  
  for (const cart of carts) {
    console.log(`Cart ID: ${cart.id}`);
    console.log(`User ID: ${cart.userId}`);
    console.log(`Guest Token: ${cart.guestToken}`);
    console.log(`Reservation Expires At: ${cart.reservationExpiresAt}`);
    console.log(`Items count: ${cart.items.length}`);
    console.log(`Reservations count: ${cart.reservations.length}`);
    for (const res of cart.reservations) {
      console.log(`  - Res ID: ${res.id}, Variant: ${res.variantId}, Expires At: ${res.expiresAt}`);
    }
    console.log("---------------------------------------");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
