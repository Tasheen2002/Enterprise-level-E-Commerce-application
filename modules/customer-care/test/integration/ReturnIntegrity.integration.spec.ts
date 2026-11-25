import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ReturnRequestService } from "@modules/customer-care/application/services/return-request.service";
import { ReturnItemService } from "@modules/customer-care/application/services/return-item.service";
import { ReturnRequestRepositoryImpl } from "@modules/customer-care/infra/persistence/repositories/return-request.repository.impl";
import { ReturnItemRepositoryImpl } from "@modules/customer-care/infra/persistence/repositories/return-item.repository.impl";
import { PrismaCustomerCareOrderQuery } from "@modules/customer-care/infra/persistence/order-query.prisma";
import { RmaStatus, RmaType } from "@modules/customer-care/domain/value-objects";

// The customer-care module is not registered in the API; this exercises its
// return services against PostgreSQL: returns follow their lifecycle, contain
// only the order's items, never more than was ordered across returns that
// were not rejected, and are fixed once the goods arrive.
const prisma = new PrismaClient();
const requests = new ReturnRequestRepositoryImpl(prisma);
const returnsService = new ReturnRequestService(requests);
const items = new ReturnItemService(
  new ReturnItemRepositoryImpl(prisma),
  requests,
  new PrismaCustomerCareOrderQuery(prisma),
);

afterAll(async () => {
  await prisma.$disconnect();
});

const orderWith = async (qty: number) => {
  const product = await prisma.product.create({
    data: { title: "Return Product", slug: `return-${randomUUID()}`, price: 15, currency: "USD", status: "published" },
  });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, sku: `SKU-RMA-${randomUUID()}`.toUpperCase(), price: 15 },
  });
  const order = await prisma.order.create({
    data: {
      orderNo: `ORD-RMA-${randomUUID()}`,
      totals: { subtotal: 15, tax: 0, shipping: 0, discount: 0, total: 15 },
      status: "delivered",
      source: "web",
      currency: "USD",
      items: { create: [{ variantId: variant.id, qty }] },
    },
    include: { items: true },
  });
  return { orderId: order.id, orderItemId: order.items[0].id };
};
const newReturn = async (orderId: string) =>
  (await returnsService.createReturnRequest({ orderId, type: RmaType.return() })).getRmaId().getValue();

describe("return integrity", () => {
  it("follows the return lifecycle", async () => {
    const { orderId } = await orderWith(1);
    const rmaId = await newReturn(orderId);
    await expect(returnsService.updateReturnRequest(rmaId, { status: RmaStatus.refunded() })).rejects.toThrow(
      "Cannot move a return from eligibility to refunded",
    );
    for (const status of [RmaStatus.approved(), RmaStatus.inTransit(), RmaStatus.received(), RmaStatus.refunded()]) {
      await returnsService.updateReturnRequest(rmaId, { status });
    }
    expect((await prisma.returnRequest.findUnique({ where: { id: rmaId } }))?.status).toBe("refunded");
  });

  it("never returns more than was ordered across returns", async () => {
    const { orderId, orderItemId } = await orderWith(2);
    const first = await newReturn(orderId);
    await expect(items.createItem({ rmaId: first, orderItemId, quantity: 3 })).rejects.toThrow("can still be returned");
    await items.createItem({ rmaId: first, orderItemId, quantity: 2 });
    await expect(items.createItem({ rmaId: first, orderItemId, quantity: 1 })).rejects.toThrow("already in this return");

    const second = await newReturn(orderId);
    await expect(items.createItem({ rmaId: second, orderItemId, quantity: 1 })).rejects.toThrow("Only 0");

    // A rejected return frees its quantity.
    await returnsService.updateReturnRequest(first, { status: RmaStatus.rejected() });
    await items.createItem({ rmaId: second, orderItemId, quantity: 2 });
    await expect(items.updateItem(second, orderItemId, { quantity: 3 })).rejects.toThrow("can still be returned");
  });

  it("refuses items from other orders and changes after the goods arrive", async () => {
    const { orderId, orderItemId } = await orderWith(1);
    const other = await orderWith(1);
    const rmaId = await newReturn(orderId);
    await expect(items.createItem({ rmaId, orderItemId: other.orderItemId, quantity: 1 })).rejects.toThrow(
      "does not belong",
    );
    await items.createItem({ rmaId, orderItemId, quantity: 1 });
    await returnsService.updateReturnRequest(rmaId, { status: RmaStatus.approved() });
    await returnsService.updateReturnRequest(rmaId, { status: RmaStatus.received() });
    await expect(items.updateItem(rmaId, orderItemId, { quantity: 1 })).rejects.toThrow("received");
  });
});
