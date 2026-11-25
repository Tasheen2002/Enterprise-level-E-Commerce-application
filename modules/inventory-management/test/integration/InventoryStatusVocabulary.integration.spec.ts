import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { InventoryTransactionRepositoryImpl } from "@modules/inventory-management/infra/persistence/repositories/inventory-transaction.repository.impl";
import { PurchaseOrderRepositoryImpl } from "@modules/inventory-management/infra/persistence/repositories/purchase-order.repository.impl";
import { InventoryTransaction } from "@modules/inventory-management/domain/entities/inventory-transaction.entity";
import { PurchaseOrder } from "@modules/inventory-management/domain/entities/purchase-order.entity";
import { PurchaseOrderStatusVO } from "@modules/inventory-management/domain/value-objects/purchase-order-status.vo";
import { TransactionReason } from "@modules/inventory-management/domain/value-objects/transaction-reason.vo";

// Every value the domain (and the public API validation) can produce must be
// storable in the corresponding PostgreSQL enum.
const prisma = new PrismaClient();
const transactions = new InventoryTransactionRepositoryImpl(prisma);
const purchaseOrders = new PurchaseOrderRepositoryImpl(prisma);

let variantId: string;
let locationId: string;
let supplierId: string;

beforeEach(async () => {
  const productId = randomUUID();
  variantId = randomUUID();
  await prisma.product.create({
    data: { id: productId, title: "Vocabulary", slug: `vocab-${productId}`, price: 5 },
  });
  await prisma.productVariant.create({
    data: { id: variantId, productId, sku: `VOCAB-${variantId}`, price: 5 },
  });
  locationId = (await prisma.location.create({ data: { type: "warehouse", name: "Main" } })).id;
  supplierId = (await prisma.supplier.create({ data: { name: "Supplier" } })).supplierId;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("inventory status vocabulary matches the database enums", () => {
  it.each(Object.values(TransactionReason))(
    "records and reloads an inventory transaction with reason %s",
    async (reason) => {
      const txn = InventoryTransaction.create({ variantId, locationId, qtyDelta: 1, reason });
      await transactions.save(txn);
      const reloaded = await transactions.findById(txn.invTxnId);
      expect(reloaded?.reason.getValue()).toBe(reason);
    },
  );

  it("persists a cancelled purchase order", async () => {
    const po = PurchaseOrder.create({ supplierId });
    await purchaseOrders.save(po);
    po.updateStatus(PurchaseOrderStatusVO.CANCELLED);
    await purchaseOrders.save(po);
    expect((await purchaseOrders.findById(po.poId))?.status.getValue()).toBe("cancelled");
  });
});
