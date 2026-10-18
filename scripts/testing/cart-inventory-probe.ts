import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { ReservationRepositoryImpl } from "../../modules/cart/infra/persistence/repositories/reservation.repository.impl";
import { StockRepositoryImpl } from "../../modules/inventory-management/infra/persistence/repositories/stock.repository.impl";
import { InventoryTransactionRepositoryImpl } from "../../modules/inventory-management/infra/persistence/repositories/inventory-transaction.repository.impl";
import { StockManagementService } from "../../modules/inventory-management/application/services/stock-management.service";
import { VariantId } from "../../modules/product-catalog/domain/value-objects/variant-id.vo";
import { CartId } from "../../modules/cart/domain/value-objects/cart-id.vo";

/** Sequential availability probe only; does not certify concurrent reservation writes. */
export async function runCartInventoryProbe(prisma: PrismaClient): Promise<void> {
  const ids = {
    product: randomUUID(),
    variant: randomUUID(),
    locations: [randomUUID(), randomUUID()],
    carts: [randomUUID(), randomUUID(), randomUUID()],
  };
  const failures: unknown[] = [];
  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.create({
        data: {
          id: ids.product,
          title: "Isolated cart inventory probe",
          slug: `inventory-${ids.product}`,
          price: 10,
        },
      });
      await tx.productVariant.create({
        data: {
          id: ids.variant,
          productId: ids.product,
          sku: `CART-${ids.variant.toUpperCase()}`,
          price: 10,
          allowPreorder: false,
          allowBackorder: false,
        },
      });
      for (const [index, location] of ids.locations.entries()) {
        await tx.location.create({
          data: { id: location, name: `Inventory probe ${location}`, type: "warehouse" },
        });
        await tx.inventoryStock.create({
          data: {
            variantId: ids.variant,
            locationId: location,
            onHand: index === 0 ? 4 : 3,
            reserved: 1,
          },
        });
      }
      for (const id of ids.carts) await tx.shoppingCart.create({ data: { id, currency: "EUR" } });
    });
    const stock = new StockManagementService(
      new StockRepositoryImpl(prisma),
      new InventoryTransactionRepositoryImpl(prisma),
    );
    const repository = new ReservationRepositoryImpl(prisma, {
      getTotalAvailableStock: (variant) => stock.getTotalAvailableStock(variant),
      adjustStock: (...args) => stock.adjustStock(...args),
      findWarehouseId: async () => ids.locations[0],
    });
    const variant = VariantId.fromString(ids.variant);
    const cartA = CartId.fromString(ids.carts[0]);
    const cartB = CartId.fromString(ids.carts[1]);
    const assertAvailability = async (
      quantity: number,
      available: boolean,
      totalReserved: number,
      activeReserved: number,
      remaining: number,
      excludeCart?: CartId,
    ) => {
      const actual = await repository.checkAvailability(variant, quantity, excludeCart);
      if (
        actual.available !== available ||
        actual.totalReserved !== totalReserved ||
        actual.activeReserved !== activeReserved ||
        actual.availableForReservation !== remaining
      ) {
        throw new Error("Cart inventory availability assertion failed");
      }
    };
    await assertAvailability(6, false, 0, 0, 5);
    await assertAvailability(5, true, 0, 0, 5);
    await prisma.$transaction(async (tx) => {
      await tx.reservation.create({
        data: {
          id: randomUUID(),
          cartId: ids.carts[0],
          variantId: ids.variant,
          qty: 3,
          expiresAt: new Date(Date.now() + 600_000),
        },
      });
      await tx.reservation.create({
        data: {
          id: randomUUID(),
          cartId: ids.carts[2],
          variantId: ids.variant,
          qty: 7,
          expiresAt: new Date(Date.now() - 60_000),
        },
      });
    });
    // Total includes expired holds; active excludes them and optionally the current cart.
    await assertAvailability(5, true, 10, 0, 5, cartA);
    await assertAvailability(6, false, 10, 0, 5, cartA);
    await assertAvailability(3, false, 10, 3, 2, cartB);
    await assertAvailability(2, true, 10, 3, 2, cartB);
    await assertAvailability(3, false, 10, 3, 2);
  } catch (error) {
    failures.push(error);
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.reservation.deleteMany({ where: { cartId: { in: ids.carts } } });
      await tx.shoppingCart.deleteMany({ where: { id: { in: ids.carts } } });
      await tx.inventoryStock.deleteMany({ where: { variantId: ids.variant } });
      await tx.product.deleteMany({ where: { id: ids.product } });
      await tx.location.deleteMany({ where: { id: { in: ids.locations } } });
    });
  } catch (error) {
    failures.push(error);
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(failures, "Cart inventory probe and cleanup failed");
}
