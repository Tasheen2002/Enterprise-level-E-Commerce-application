import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { StockRepositoryImpl } from "@modules/inventory-management/infra/persistence/repositories/stock.repository.impl";
import { Stock } from "@modules/inventory-management/domain/entities/stock.entity";
import { StockId } from "@modules/inventory-management/domain/value-objects/stock-id.vo";
import { LocationId } from "@modules/inventory-management/domain/value-objects/location-id.vo";
import { VariantId } from "@modules/product-catalog/domain/value-objects/variant-id.vo";

const prisma = new PrismaClient();

describe("StockRepositoryImpl Database Integration Tests", () => {
  let repository: StockRepositoryImpl;
  let locationId: string;
  let variantId: string;

  beforeAll(async () => {
    repository = new StockRepositoryImpl(prisma);
  });

  beforeEach(async () => {
    // 1. Create Location
    const locId = randomUUID();
    await prisma.location.create({
      data: {
        id: locId,
        name: "Test Repository Location",
        type: "warehouse",
      },
    });
    locationId = locId;

    // 2. Create Product and Variant
    const productId = randomUUID();
    const varId = randomUUID();
    await prisma.product.create({
      data: {
        id: productId,
        title: "Repository Test Product",
        slug: `repo-test-${randomUUID()}`,
        price: 150,
        currency: "SGD",
        status: "published",
      },
    });

    await prisma.productVariant.create({
      data: {
        id: varId,
        productId,
        sku: `SKU-REPO-${Date.now()}-${randomUUID()}`,
        price: 150,
      },
    });
    variantId = varId;
  });

  it("should save and retrieve a stock aggregate successfully", async () => {
    // Arrange
    const stock = Stock.create({
      variantId,
      locationId,
      onHand: 100,
      reserved: 20,
      lowStockThreshold: 10,
      safetyStock: 5,
    });

    // Act
    await repository.save(stock);
    const found = await repository.findByStockId(stock.stockId);

    // Assert
    expect(found).not.toBeNull();
    expect(found!.variantId).toBe(variantId);
    expect(found!.locationId).toBe(locationId);
    expect(found!.stockLevel.onHand).toBe(100);
    expect(found!.stockLevel.reserved).toBe(20);
    expect(found!.stockLevel.available).toBe(80);
    expect(found!.stockLevel.lowStockThreshold).toBe(10);
    expect(found!.stockLevel.safetyStock).toBe(5);
  });

  it("should find stock by variant ID and location ID separately", async () => {
    // Arrange
    const stock = Stock.create({
      variantId,
      locationId,
      onHand: 50,
      reserved: 10,
    });
    await repository.save(stock);

    // Act & Assert
    // 1. findByVariantAndLocation
    const foundCombo = await repository.findByVariantAndLocation(
      VariantId.fromString(variantId),
      LocationId.fromString(locationId)
    );
    expect(foundCombo).not.toBeNull();
    expect(foundCombo!.stockLevel.onHand).toBe(50);

    // 2. findByVariant
    const foundByVar = await repository.findByVariant(VariantId.fromString(variantId));
    expect(foundByVar.length).toBe(1);
    expect(foundByVar[0].locationId).toBe(locationId);

    // 3. findByLocation
    const foundByLoc = await repository.findByLocation(LocationId.fromString(locationId));
    expect(foundByLoc.length).toBe(1);
    expect(foundByLoc[0].variantId).toBe(variantId);

    // 4. exists
    expect(await repository.exists(stock.stockId)).toBe(true);
  });

  it("should find low stock and out of stock items", async () => {
    // Arrange
    // 1. Low stock: onHand (5) <= threshold (10)
    const lowStock = Stock.create({
      variantId,
      locationId,
      onHand: 5,
      lowStockThreshold: 10,
    });
    await repository.save(lowStock);

    const lowStockItems = await repository.findLowStockItems();
    expect(lowStockItems.some((s) => s.variantId === variantId)).toBe(true);

    // 2. Out of stock: onHand = 0
    const outOfStock = Stock.create({
      variantId,
      locationId,
      onHand: 0,
    });
    await repository.save(outOfStock);

    const outOfStockItems = await repository.findOutOfStockItems();
    expect(outOfStockItems.some((s) => s.variantId === variantId)).toBe(true);
  });

  it("should compute stock statistics and total available stock correctly", async () => {
    // Arrange
    const stock = Stock.create({
      variantId,
      locationId,
      onHand: 30,
      reserved: 5,
      lowStockThreshold: 10,
    });
    await repository.save(stock);

    // Act
    const stats = await repository.getStats();
    const totalAvail = await repository.getTotalAvailableStock(VariantId.fromString(variantId));

    // Assert
    expect(stats.totalItems).toBe(30);
    expect(stats.lowStockCount).toBe(0); // available (25) > threshold (10)
    expect(totalAvail).toBe(25);
  });

  it("should delete a stock record", async () => {
    // Arrange
    const stock = Stock.create({
      variantId,
      locationId,
      onHand: 15,
    });
    await repository.save(stock);
    expect(await repository.exists(stock.stockId)).toBe(true);

    // Act
    await repository.delete(stock.stockId);

    // Assert
    expect(await repository.exists(stock.stockId)).toBe(false);
  });
});
