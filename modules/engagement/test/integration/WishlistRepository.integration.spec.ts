import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { WishlistRepositoryImpl } from "@modules/engagement/infra/persistence/repositories/wishlist.repository.impl";
import { Wishlist } from "@modules/engagement/domain/entities/wishlist.entity";

const prisma = new PrismaClient();

describe("WishlistRepositoryImpl Database Integration Tests", () => {
  let repository: WishlistRepositoryImpl;
  let userId: string;
  let variantId: string;

  beforeAll(() => {
    repository = new WishlistRepositoryImpl(prisma);
  });

  beforeEach(async () => {
    // 1. Create a Product & Variant
    const productId = randomUUID();
    const varId = randomUUID();
    await prisma.product.create({
      data: {
        id: productId,
        title: "Integration Test Product",
        slug: `integration-wishlist-${randomUUID()}`,
        price: 100,
        currency: "USD",
        status: "published"
      }
    });

    await prisma.productVariant.create({
      data: {
        id: varId,
        productId,
        sku: `SKU-WL-${Date.now()}-${randomUUID()}`,
        price: 100
      }
    });
    variantId = varId;

    // 2. Create a User
    const uId = randomUUID();
    await prisma.user.create({
      data: {
        id: uId,
        email: `wishlist-user-${randomUUID()}@example.com`,
        role: "CUSTOMER",
        status: "active"
      }
    });
    userId = uId;
  });

  it("should save and retrieve a wishlist with items successfully", async () => {
    // Arrange
    const wishlist = Wishlist.create({
      userId,
      name: "My Collection",
      description: "Favorite items"
    });
    wishlist.addItem(variantId);

    // Act
    await repository.save(wishlist);

    // Assert
    const retrieved = await repository.findById(wishlist.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe("My Collection");
    expect(retrieved!.description).toBe("Favorite items");
    expect(retrieved!.userId).toBe(userId);
    expect(retrieved!.items).toHaveLength(1);
    expect(retrieved!.items[0].variantId).toBe(variantId);
  });

  it("should support updating and clearing wishlist items in database", async () => {
    const wishlist = Wishlist.create({
      userId,
      name: "Update Test Wishlist"
    });
    await repository.save(wishlist);

    // 1. Add item
    wishlist.addItem(variantId);
    await repository.save(wishlist);

    let retrieved = await repository.findById(wishlist.id);
    expect(retrieved!.items).toHaveLength(1);

    // 2. Clear items
    wishlist.clearItems();
    await repository.save(wishlist);

    retrieved = await repository.findById(wishlist.id);
    expect(retrieved!.items).toHaveLength(0);
  });

  it("should support deleting a wishlist record", async () => {
    const wishlist = Wishlist.create({
      userId,
      name: "Delete Test Wishlist"
    });
    await repository.save(wishlist);

    let retrieved = await repository.findById(wishlist.id);
    expect(retrieved).not.toBeNull();

    await repository.delete(wishlist.id);

    retrieved = await repository.findById(wishlist.id);
    expect(retrieved).toBeNull();
  });
});
