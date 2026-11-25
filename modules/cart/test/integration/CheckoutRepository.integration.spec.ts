import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { CheckoutRepositoryImpl } from "@modules/cart/infra/persistence/repositories/checkout.repository.impl";
import { Checkout } from "@modules/cart/domain/entities/checkout.entity";
import { CheckoutId, CartId, CartOwnerId, GuestToken } from "@modules/cart/domain/value-objects";

const prisma = new PrismaClient();

describe("CheckoutRepositoryImpl Integration Tests", () => {
  let repository: CheckoutRepositoryImpl;
  let cartIdStr: string;
  let guestTokenStr: string;
  let userIdStr: string;

  beforeAll(() => {
    repository = new CheckoutRepositoryImpl(prisma);
  });

  beforeEach(async () => {
    cartIdStr = randomUUID();
    guestTokenStr = `guest_${randomUUID().replace(/-/g, "").substring(0, 20)}`;
    userIdStr = randomUUID();

    // Create a User directly in the database
    await prisma.user.create({
      data: {
        id: userIdStr,
        email: `checkout-user-${randomUUID()}@example.com`,
        role: "CUSTOMER",
        status: "active",
      },
    });

    // Create a ShoppingCart row so the Checkout foreign key is satisfied
    await prisma.shoppingCart.create({
      data: {
        id: cartIdStr,
        userId: null,
        guestToken: guestTokenStr,
        currency: "USD",
      },
    });
  });

  it("should save and retrieve a guest checkout successfully", async () => {
    // Arrange
    const checkout = Checkout.create({
      cartId: cartIdStr,
      guestToken: guestTokenStr,
      totalAmount: 120.5,
      currency: "USD",
    });

    // Act
    await repository.save(checkout);

    // Assert
    const retrieved = await repository.findById(checkout.checkoutId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.checkoutId.getValue()).toBe(checkout.checkoutId.getValue());
    expect(retrieved!.cartId.getValue()).toBe(cartIdStr);
    expect(retrieved!.guestToken?.getValue()).toBe(guestTokenStr);
    expect(retrieved!.cartOwnerId).toBeNull();
    expect(retrieved!.totalAmount).toBe(120.5);
    expect(retrieved!.status.isPending()).toBe(true);
  });

  it("should support updating and completing a checkout in the database", async () => {
    // Arrange
    const checkout = Checkout.create({
      cartId: cartIdStr,
      guestToken: guestTokenStr,
      totalAmount: 120.5,
      currency: "USD",
    });
    await repository.save(checkout);

    // Act & Assert 1: Update status to Completed
    checkout.markAsCompleted();
    await repository.save(checkout);

    let retrieved = await repository.findById(checkout.checkoutId);
    expect(retrieved!.status.isCompleted()).toBe(true);
    expect(retrieved!.completedAt).not.toBeNull();

    // Act & Assert 2: Delete
    await repository.delete(checkout.checkoutId);
    retrieved = await repository.findById(checkout.checkoutId);
    expect(retrieved).toBeNull();
  });

  it("should support querying checkouts by alternate keys and statuses", async () => {
    // Arrange
    // 1. Create a user cart & checkout
    const userCartId = randomUUID();
    await prisma.shoppingCart.create({
      data: {
        id: userCartId,
        userId: userIdStr,
        currency: "USD",
      },
    });

    const checkoutUser = Checkout.create({
      cartId: userCartId,
      userId: userIdStr,
      totalAmount: 250.0,
      currency: "USD",
    });
    await repository.save(checkoutUser);

    // 2. Create another guest checkout that is expired
    const guestCartId2 = randomUUID();
    const guestTokenStr2 = `guest_${randomUUID().replace(/-/g, "").substring(0, 20)}`;
    await prisma.shoppingCart.create({
      data: {
        id: guestCartId2,
        guestToken: guestTokenStr2,
        currency: "USD",
      },
    });

    const checkoutGuest2 = Checkout.create({
      cartId: guestCartId2,
      guestToken: guestTokenStr2,
      totalAmount: 75.0,
      currency: "USD",
      expiresInMinutes: -10, // already expired
    });
    await repository.save(checkoutGuest2);

    // Act & Assert
    // Test findByCartId
    const byCart = await repository.findByCartId(CartId.fromString(userCartId));
    expect(byCart).not.toBeNull();
    expect(byCart!.checkoutId.getValue()).toBe(checkoutUser.checkoutId.getValue());

    // Test findByCartOwnerId
    const byOwner = await repository.findByCartOwnerId(CartOwnerId.fromString(userIdStr));
    expect(byOwner).toHaveLength(1);
    expect(byOwner[0].checkoutId.getValue()).toBe(checkoutUser.checkoutId.getValue());

    // Test findByGuestToken
    const byGuest = await repository.findByGuestToken(GuestToken.fromString(guestTokenStr2));
    expect(byGuest).toHaveLength(1);
    expect(byGuest[0].checkoutId.getValue()).toBe(checkoutGuest2.checkoutId.getValue());

    // Test findPendingCheckouts
    const pending = await repository.findPendingCheckouts();
    // Both should be pending
    expect(pending.length).toBeGreaterThanOrEqual(2);

    // Test findExpiredCheckouts
    const expired = await repository.findExpiredCheckouts();
    expect(expired.some(c => c.checkoutId.getValue() === checkoutGuest2.checkoutId.getValue())).toBe(true);

    // Test cleanupExpiredCheckouts
    const count = await repository.cleanupExpiredCheckouts();
    expect(count).toBeGreaterThanOrEqual(1);

    const afterCleanup = await repository.findById(checkoutGuest2.checkoutId);
    expect(afterCleanup!.status.isExpired()).toBe(true);
  });
});
