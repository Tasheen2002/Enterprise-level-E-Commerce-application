import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { CartManagementService } from "../../modules/cart/application/services/cart-management.service";
import { RESERVATION_DEFAULT_DURATION_MINUTES } from "../../modules/cart/domain/constants";

type CartActions = Pick<CartManagementService, "getCartSummary" | "addToCart">;

/** Verify current add-to-cart renewal semantics with owned fixtures and persisted assertions. */
export async function runCartExpiryProbe(
  prisma: PrismaClient,
  actions: CartActions,
): Promise<void> {
  const ids = {
    user: randomUUID(),
    product: randomUUID(),
    variant: randomUUID(),
    location: randomUUID(),
    cart: randomUUID(),
    item: randomUUID(),
    reservation: randomUUID(),
  };
  const expired = new Date(Date.now() - 60_000);
  const failures: unknown[] = [];
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: { id: ids.user, email: `expiry-${ids.user}@example.invalid`, isGuest: true },
      });
      await tx.product.create({
        data: {
          id: ids.product,
          title: "Isolated cart expiry probe",
          slug: `expiry-${ids.product}`,
          currency: "EUR",
          price: 10,
        },
      });
      await tx.productVariant.create({
        data: {
          id: ids.variant,
          productId: ids.product,
          sku: `EXPIRY-${ids.variant.toUpperCase()}`,
          price: 10,
        },
      });
      await tx.location.create({
        data: { id: ids.location, name: `Expiry probe ${ids.location}`, type: "warehouse" },
      });
      await tx.inventoryStock.create({
        data: { variantId: ids.variant, locationId: ids.location, onHand: 10, reserved: 0 },
      });
      await tx.shoppingCart.create({
        data: { id: ids.cart, userId: ids.user, currency: "EUR", reservationExpiresAt: expired },
      });
      await tx.cartItem.create({
        data: {
          id: ids.item,
          cartId: ids.cart,
          variantId: ids.variant,
          qty: 1,
          unitPriceSnapshot: 10,
        },
      });
      await tx.reservation.create({
        data: {
          id: ids.reservation,
          cartId: ids.cart,
          variantId: ids.variant,
          qty: 1,
          expiresAt: expired,
        },
      });
    });
    const before = await actions.getCartSummary(ids.cart, ids.user);
    if (
      !before ||
      before.cartId !== ids.cart ||
      !before.isReservationExpired ||
      !before.reservationExpiresAt ||
      !Number.isFinite(before.reservationExpiresAt.getTime()) ||
      before.reservationExpiresAt.getTime() >= Date.now()
    ) {
      throw new Error("Expiry probe must start with its own expired cart");
    }
    const started = Date.now();
    await actions.addToCart({
      cartId: ids.cart,
      userId: ids.user,
      variantId: ids.variant,
      quantity: 1,
    });
    const completed = Date.now();
    const after = await actions.getCartSummary(ids.cart, ids.user);
    const cart = await prisma.shoppingCart.findUnique({
      where: { id: ids.cart },
      select: { userId: true, reservationExpiresAt: true },
    });
    const reservation = await prisma.reservation.findUnique({
      where: { cartId_variantId: { cartId: ids.cart, variantId: ids.variant } },
      select: { qty: true, expiresAt: true },
    });
    const items = await prisma.cartItem.findMany({
      where: { cartId: ids.cart, variantId: ids.variant },
      select: { qty: true },
    });
    const duration = RESERVATION_DEFAULT_DURATION_MINUTES * 60_000;
    const expiry = cart?.reservationExpiresAt?.getTime();
    if (
      !after ||
      after.cartId !== ids.cart ||
      after.isReservationExpired ||
      after.itemCount !== 2 ||
      !expiry ||
      cart?.userId !== ids.user ||
      expiry < started + duration ||
      expiry > completed + duration ||
      after.reservationExpiresAt?.getTime() !== expiry ||
      reservation?.expiresAt.getTime() !== expiry ||
      reservation.qty !== 2 ||
      items.length !== 1 ||
      items[0]?.qty !== 2
    ) {
      throw new Error("Cart expiry, reservation expiry or quantity was not renewed consistently");
    }
  } catch (error) {
    failures.push(error);
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.reservation.deleteMany({ where: { cartId: ids.cart } });
      await tx.cartItem.deleteMany({ where: { cartId: ids.cart } });
      await tx.shoppingCart.deleteMany({ where: { id: ids.cart } });
      await tx.inventoryStock.deleteMany({
        where: { variantId: ids.variant, locationId: ids.location },
      });
      await tx.user.deleteMany({ where: { id: ids.user } });
      await tx.product.deleteMany({ where: { id: ids.product } });
      await tx.location.deleteMany({ where: { id: ids.location } });
    });
  } catch (error) {
    failures.push(error);
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(failures, "Cart expiry probe and cleanup failed");
}
