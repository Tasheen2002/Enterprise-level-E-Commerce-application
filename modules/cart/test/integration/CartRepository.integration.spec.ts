import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { CartRepositoryImpl } from "@modules/cart/infra/persistence/repositories/cart.repository.impl";
import { ShoppingCart } from "@modules/cart/domain/entities/shopping-cart.entity";
import { CartId, CartOwnerId, GuestToken } from "@modules/cart/domain/value-objects";

const prisma = new PrismaClient();

describe("CartRepositoryImpl Integration Tests", () => {
  let repository: CartRepositoryImpl;
  let userIdStr: string;
  let productIdStr: string;
  let variantIdStr: string;

  beforeAll(() => {
    repository = new CartRepositoryImpl(prisma);
  });

  beforeEach(async () => {
    userIdStr = randomUUID();
    productIdStr = randomUUID();
    variantIdStr = randomUUID();

    // 1. Create a User in the database
    await prisma.user.create({
      data: {
        id: userIdStr,
        email: `cart-user-${randomUUID()}@example.com`,
        role: "CUSTOMER",
        status: "active",
      },
    });

    // 2. Create a Product & Variant in the database
    await prisma.product.create({
      data: {
        id: productIdStr,
        title: "Cart Test Product",
        slug: `cart-prod-${randomUUID()}`,
        price: 150,
        currency: "USD",
        status: "published",
      },
    });

    await prisma.productVariant.create({
      data: {
        id: variantIdStr,
        productId: productIdStr,
        sku: `SKU-CART-${Date.now()}-${randomUUID()}`,
        price: 150,
      },
    });
  });

  it("should save and retrieve a guest cart with items successfully", async () => {
    // Arrange
    const guestTokenStr = `guest_${randomUUID().replace(/-/g, "").substring(0, 20)}`;
    const cart = ShoppingCart.createForGuest({
      guestToken: guestTokenStr,
      currency: "USD",
    });
    cart.addItem({
      variantId: variantIdStr,
      quantity: 3,
      unitPrice: 150,
    });

    // Act
    await repository.save(cart);

    // Assert
    const retrieved = await repository.findById(cart.cartId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.cartId.getValue()).toBe(cart.cartId.getValue());
    expect(retrieved!.isGuestCart).toBe(true);
    expect(retrieved!.guestToken?.getValue()).toBe(guestTokenStr);
    expect(retrieved!.uniqueItemCount).toBe(1);
    expect(retrieved!.itemCount).toBe(3);
    expect(retrieved!.subtotal).toBe(450);

    const item = retrieved!.findItemByVariantId(variantIdStr);
    expect(item).toBeDefined();
    expect(item!.quantity.getValue()).toBe(3);
    expect(item!.unitPrice).toBe(150);
  });

  it("should support updates, cascade deletes of removed items, and deletion of cart", async () => {
    // Arrange
    const guestTokenStr = `guest_${randomUUID().replace(/-/g, "").substring(0, 20)}`;
    const cart = ShoppingCart.createForGuest({ guestToken: guestTokenStr, currency: "USD" });
    cart.addItem({ variantId: variantIdStr, quantity: 2, unitPrice: 150 });
    await repository.save(cart);

    // Act & Assert 1: Add a second item
    const productId2 = randomUUID();
    const variantId2 = randomUUID();
    await prisma.product.create({
      data: {
        id: productId2,
        title: "Cart Test Product 2",
        slug: `cart-prod-2-${randomUUID()}`,
        price: 80,
        currency: "USD",
        status: "published",
      },
    });
    await prisma.productVariant.create({
      data: {
        id: variantId2,
        productId: productId2,
        sku: `SKU-CART-2-${Date.now()}-${randomUUID()}`,
        price: 80,
      },
    });

    cart.addItem({ variantId: variantId2, quantity: 1, unitPrice: 80 });
    await repository.save(cart);

    let retrieved = await repository.findById(cart.cartId);
    expect(retrieved!.uniqueItemCount).toBe(2);

    // Act & Assert 2: Remove the first item (cascade delete test)
    cart.removeItem(variantIdStr);
    await repository.save(cart);

    retrieved = await repository.findById(cart.cartId);
    expect(retrieved!.uniqueItemCount).toBe(1);
    expect(retrieved!.findItemByVariantId(variantIdStr)).toBeUndefined();
    expect(retrieved!.findItemByVariantId(variantId2)).toBeDefined();

    // Act & Assert 3: Delete cart
    await repository.delete(cart.cartId);
    retrieved = await repository.findById(cart.cartId);
    expect(retrieved).toBeNull();
  });

  it("should support alternate key lookups, address projections, stats, and guest cleanup", async () => {
    // Arrange
    const guestTokenStr = `guest_${randomUUID().replace(/-/g, "").substring(0, 20)}`;
    const guestCart = ShoppingCart.createForGuest({ guestToken: guestTokenStr, currency: "USD" });
    guestCart.addItem({ variantId: variantIdStr, quantity: 1, unitPrice: 150 });
    await repository.save(guestCart);

    const userCart = ShoppingCart.createForUser({ userId: userIdStr, currency: "USD" });
    userCart.addItem({ variantId: variantIdStr, quantity: 2, unitPrice: 150 });
    userCart.updateAddresses({
      shippingFirstName: "Alice",
      shippingLastName: "Smith",
      shippingAddress1: "789 Pine Rd",
      shippingCity: "San Francisco",
      shippingPostalCode: "94101",
      shippingCountryCode: "US",
    });
    await repository.save(userCart);

    // Act & Assert
    // Test findActiveCartByCartOwnerId
    const byOwner = await repository.findActiveCartByCartOwnerId(CartOwnerId.fromString(userIdStr));
    expect(byOwner).not.toBeNull();
    expect(byOwner!.cartId.getValue()).toBe(userCart.cartId.getValue());

    // Test findActiveCartByGuestToken
    const byGuest = await repository.findActiveCartByGuestToken(GuestToken.fromString(guestTokenStr));
    expect(byGuest).not.toBeNull();
    expect(byGuest!.cartId.getValue()).toBe(guestCart.cartId.getValue());

    // Test getCartWithCheckoutInfo
    const checkoutInfo = await repository.getCartWithCheckoutInfo(userCart.cartId);
    expect(checkoutInfo).not.toBeNull();
    expect(checkoutInfo!.shippingFirstName).toBe("Alice");
    expect(checkoutInfo!.shippingLastName).toBe("Smith");

    // Test getCartStatistics
    const stats = await repository.getCartStatistics();
    expect(stats.totalCarts).toBeGreaterThanOrEqual(2);
    expect(stats.userCarts).toBeGreaterThanOrEqual(1);
    expect(stats.guestCarts).toBeGreaterThanOrEqual(1);

    // Test cleanupExpiredGuestCarts
    // Mark the guest cart as expired in DB (must be older than 30 days)
    const expiredDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
    await prisma.shoppingCart.update({
      where: { id: guestCart.cartId.getValue() },
      data: { updatedAt: expiredDate },
    });

    const cleaned = await repository.cleanupExpiredGuestCarts();
    expect(cleaned).toBeGreaterThanOrEqual(1);

    const checkGuestDeleted = await repository.findById(guestCart.cartId);
    expect(checkGuestDeleted).toBeNull();
  });
});
