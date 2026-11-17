import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { StockManagementService } from "@modules/inventory-management/application/services/stock-management.service";
import { StockRepositoryImpl } from "@modules/inventory-management/infra/persistence/repositories/stock.repository.impl";
import { InventoryTransactionRepositoryImpl } from "@modules/inventory-management/infra/persistence/repositories/inventory-transaction.repository.impl";

// Stock is changed concurrently by checkouts, staff adjustments, transfers
// and purchase-order receipts. Every change must be counted, stock must never
// be oversold, and the ledger must always explain the stock level.
const prisma = new PrismaClient();
const service = new StockManagementService(
  new StockRepositoryImpl(prisma),
  new InventoryTransactionRepositoryImpl(prisma),
);

let variantId: string;
let locationId: string;
let secondLocationId: string;

beforeEach(async () => {
  const productId = randomUUID();
  variantId = randomUUID();
  await prisma.product.create({
    data: { id: productId, title: "Stock", slug: `stock-${productId}`, price: 5 },
  });
  await prisma.productVariant.create({
    data: { id: variantId, productId, sku: `STOCK-${variantId.toUpperCase()}`, price: 5 },
  });
  locationId = (await prisma.location.create({ data: { type: "warehouse", name: "A" } })).id;
  secondLocationId = (await prisma.location.create({ data: { type: "warehouse", name: "B" } })).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const level = async (location = locationId) =>
  prisma.inventoryStock.findUnique({
    where: { variantId_locationId: { variantId, locationId: location } },
  });
const ledgerTotal = async (location = locationId) =>
  (
    await prisma.inventoryTransaction.aggregate({
      where: { variantId, locationId: location },
      _sum: { qtyDelta: true },
    })
  )._sum.qtyDelta ?? 0;

describe("concurrent stock changes", () => {
  it("counts every one of ten simultaneous additions", async () => {
    await service.addStock(variantId, locationId, 1, "po");
    await Promise.all(
      Array.from({ length: 10 }, () => service.adjustStock(variantId, locationId, 1, "adjustment")),
    );
    expect((await level())?.onHand).toBe(11);
    expect(await ledgerTotal()).toBe(11);
  });

  it("never sells the last unit twice", async () => {
    await service.addStock(variantId, locationId, 1, "po");
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => service.adjustStock(variantId, locationId, -1, "order")),
    );

    const stock = await level();
    expect(stock?.onHand).toBeGreaterThanOrEqual(0);
    expect(results.filter((r) => r.status === "fulfilled").length).toBeLessThanOrEqual(1);
    // The ledger explains the stock level exactly.
    expect(await ledgerTotal()).toBe(stock?.onHand);
  });

  it("never reserves more than is on hand", async () => {
    await service.addStock(variantId, locationId, 2, "po");
    await Promise.allSettled(
      Array.from({ length: 6 }, () => service.reserveStock(variantId, locationId, 1)),
    );
    const stock = await level();
    expect(stock?.reserved).toBeLessThanOrEqual(stock?.onHand ?? 0);
  });

  it("keeps stock and ledger consistent across simultaneous transfers", async () => {
    await service.addStock(variantId, locationId, 3, "po");
    await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        service.transferStock(variantId, locationId, secondLocationId, 1),
      ),
    );
    const from = await level();
    const to = await level(secondLocationId);
    expect(from?.onHand).toBeGreaterThanOrEqual(0);
    expect((from?.onHand ?? 0) + (to?.onHand ?? 0)).toBe(3);
    expect(await ledgerTotal()).toBe(from?.onHand);
    expect(await ledgerTotal(secondLocationId)).toBe(to?.onHand ?? 0);
  });
});
