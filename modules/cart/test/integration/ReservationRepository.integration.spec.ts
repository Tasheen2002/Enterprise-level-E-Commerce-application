import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ReservationRepositoryImpl } from "@modules/cart/infra/persistence/repositories/reservation.repository.impl";
import { Reservation } from "@modules/cart/domain/entities/reservation.entity";
import { ReservationId, CartId } from "@modules/cart/domain/value-objects";
import { VariantId } from "@modules/product-catalog/domain/value-objects/variant-id.vo";

const prisma = new PrismaClient();

describe("ReservationRepositoryImpl Integration Tests", () => {
  let repository: ReservationRepositoryImpl;
  let cartIdStr: string;
  let productIdStr: string;
  let variantIdStr: string;

  beforeAll(() => {
    repository = new ReservationRepositoryImpl(prisma);
  });

  beforeEach(async () => {
    cartIdStr = randomUUID();
    productIdStr = randomUUID();
    variantIdStr = randomUUID();

    // 1. Create a Product & Variant in the database
    await prisma.product.create({
      data: {
        id: productIdStr,
        title: "Reservation Test Product",
        slug: `res-prod-${randomUUID()}`,
        price: 50,
        currency: "USD",
        status: "published",
      },
    });

    await prisma.productVariant.create({
      data: {
        id: variantIdStr,
        productId: productIdStr,
        sku: `SKU-RES-${Date.now()}-${randomUUID()}`,
        price: 50,
      },
    });

    // 2. Create a ShoppingCart row
    await prisma.shoppingCart.create({
      data: {
        id: cartIdStr,
        guestToken: `guest_${randomUUID().replace(/-/g, "").substring(0, 20)}`,
        currency: "USD",
      },
    });
  });

  it("should save and retrieve a reservation successfully", async () => {
    // Arrange
    const reservation = Reservation.create({
      cartId: cartIdStr,
      variantId: variantIdStr,
      quantity: 3,
      durationMinutes: 20,
    });

    // Act
    await repository.save(reservation);

    // Assert
    const retrieved = await repository.findById(reservation.reservationId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.reservationId.getValue()).toBe(reservation.reservationId.getValue());
    expect(retrieved!.cartId.getValue()).toBe(cartIdStr);
    expect(retrieved!.variantId.getValue()).toBe(variantIdStr);
    expect(retrieved!.quantity.getValue()).toBe(3);
    expect(retrieved!.isExpired).toBe(false);
  });

  it("should support updating and deleting a reservation", async () => {
    // Arrange
    const reservation = Reservation.create({
      cartId: cartIdStr,
      variantId: variantIdStr,
      quantity: 3,
    });
    await repository.save(reservation);

    // Act & Assert 1: Update quantity
    reservation.updateQuantity(5);
    await repository.save(reservation);

    let retrieved = await repository.findById(reservation.reservationId);
    expect(retrieved!.quantity.getValue()).toBe(5);

    // Act & Assert 2: Delete
    await repository.delete(reservation.reservationId);
    retrieved = await repository.findById(reservation.reservationId);
    expect(retrieved).toBeNull();
  });

  it("should support alternate key lookups and active status queries", async () => {
    // Arrange
    const activeRes = Reservation.create({
      cartId: cartIdStr,
      variantId: variantIdStr,
      quantity: 2,
      durationMinutes: 30, // active
    });
    await repository.save(activeRes);

    // Create an expired reservation on a different cart (same variant)
    const otherCartId = randomUUID();
    await prisma.shoppingCart.create({
      data: {
        id: otherCartId,
        guestToken: `guest_${randomUUID().replace(/-/g, "").substring(0, 20)}`,
        currency: "USD",
      },
    });

    const expiredRes = Reservation.create({
      cartId: otherCartId,
      variantId: variantIdStr,
      quantity: 1,
      durationMinutes: -10, // expired
    });
    await repository.save(expiredRes);

    // Act & Assert
    // Test findByCartId
    const byCart = await repository.findByCartId(CartId.fromString(cartIdStr));
    expect(byCart).toHaveLength(1);
    expect(byCart[0].reservationId.getValue()).toBe(activeRes.reservationId.getValue());

    // Test findActiveByCartId
    const activeByCart = await repository.findActiveByCartId(CartId.fromString(cartIdStr));
    expect(activeByCart).toHaveLength(1);

    const activeByOtherCart = await repository.findActiveByCartId(CartId.fromString(otherCartId));
    expect(activeByOtherCart).toHaveLength(0); // none active

    // Test findByCartAndVariant
    const byCartAndVariant = await repository.findByCartAndVariant(
      CartId.fromString(cartIdStr),
      VariantId.fromString(variantIdStr)
    );
    expect(byCartAndVariant).not.toBeNull();
    expect(byCartAndVariant!.reservationId.getValue()).toBe(activeRes.reservationId.getValue());

    // Test findByVariantId
    const byVariant = await repository.findByVariantId(VariantId.fromString(variantIdStr));
    // Should return both
    expect(byVariant.length).toBeGreaterThanOrEqual(2);
  });
});
