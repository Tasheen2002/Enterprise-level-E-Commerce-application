import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ShipmentService } from "@modules/fulfillment/application/services/shipment.service";
import { ShipmentRepositoryImpl } from "@modules/fulfillment/infra/persistence/repositories/shipment.repository.impl";
import { ShipmentItemRepositoryImpl } from "@modules/fulfillment/infra/persistence/repositories/shipment-item.repository.impl";
import { PrismaShipmentAllocation } from "@modules/fulfillment/infra/persistence/repositories/shipment-allocation.prisma";
import { ShipmentStatus } from "@modules/fulfillment/domain/value-objects";

// The fulfillment module is not registered in the API; this exercises its
// services and repositories against PostgreSQL so its rules hold if it is
// ever enabled: shipments belong to a real order, contain only that order's
// items, never more than was ordered, and are fixed once the parcel leaves.
const prisma = new PrismaClient();
const service = new ShipmentService(
  new ShipmentRepositoryImpl(prisma),
  new ShipmentItemRepositoryImpl(prisma),
  new PrismaShipmentAllocation(prisma),
);

afterAll(async () => {
  await prisma.$disconnect();
});

const orderWith = async (...quantities: number[]) => {
  const product = await prisma.product.create({
    data: { title: "Fulfillment Product", slug: `fulfil-${randomUUID()}`, price: 20, currency: "USD", status: "published" },
  });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, sku: `SKU-FUL-${randomUUID()}`.toUpperCase(), price: 20 },
  });
  const order = await prisma.order.create({
    data: {
      orderNo: `ORD-FUL-${randomUUID()}`,
      totals: { subtotal: 20, tax: 0, shipping: 0, discount: 0, total: 20 },
      status: "paid",
      source: "web",
      currency: "USD",
      items: { create: quantities.map((qty) => ({ variantId: variant.id, qty })) },
    },
    include: { items: true },
  });
  return { orderId: order.id, itemIds: order.items.map((item) => item.id) };
};

describe("fulfillment shipment rules", () => {
  it("stores a shipment and its items for the order's own items", async () => {
    const { orderId, itemIds } = await orderWith(2, 1);
    const shipment = await service.createShipment({
      orderId,
      carrier: "fedex",
      items: [
        { orderItemId: itemIds[0], qty: 2 },
        { orderItemId: itemIds[1], qty: 1 },
      ],
    });
    const stored = await service.getShipment(shipment.getShipmentId().getValue());
    expect(stored?.getItems().map((i) => i.getQty()).sort()).toEqual([1, 2]);
    expect(stored?.getStatus().toString()).toBe("created");
  });

  it("refuses unknown orders, other orders' items, duplicates and more than was ordered", async () => {
    const { orderId, itemIds } = await orderWith(2);
    const other = await orderWith(1);
    await expect(service.createShipment({ orderId: randomUUID(), items: [] })).rejects.toThrow("Order not found");
    await expect(
      service.createShipment({ orderId, items: [{ orderItemId: other.itemIds[0], qty: 1 }] }),
    ).rejects.toThrow("does not belong");
    await expect(
      service.createShipment({
        orderId,
        items: [
          { orderItemId: itemIds[0], qty: 1 },
          { orderItemId: itemIds[0], qty: 1 },
        ],
      }),
    ).rejects.toThrow("more than once");
    await expect(
      service.createShipment({ orderId, items: [{ orderItemId: itemIds[0], qty: 3 }] }),
    ).rejects.toThrow("can still be shipped");
    expect(await prisma.shipment.count({ where: { orderId } })).toBe(0);
  });

  it("counts quantities across shipments and frees them when a shipment fails", async () => {
    const { orderId, itemIds } = await orderWith(2);
    const first = await service.createShipment({ orderId, items: [{ orderItemId: itemIds[0], qty: 2 }] });
    await expect(
      service.createShipment({ orderId, items: [{ orderItemId: itemIds[0], qty: 1 }] }),
    ).rejects.toThrow("Only 0");

    await service.updateShipmentStatus(first.getShipmentId().getValue(), ShipmentStatus.failed());
    const retry = await service.createShipment({ orderId, items: [{ orderItemId: itemIds[0], qty: 2 }] });
    expect(retry.getItems()).toHaveLength(1);
  });

  it("fixes the items once the parcel is in transit and records when it shipped", async () => {
    const { orderId, itemIds } = await orderWith(3);
    const shipment = await service.createShipment({ orderId, items: [{ orderItemId: itemIds[0], qty: 1 }] });
    const id = shipment.getShipmentId().getValue();

    // Still editable before it leaves, within the ordered quantity.
    await service.updateItemQuantity(id, itemIds[0], 3);
    await expect(service.updateItemQuantity(id, itemIds[0], 4)).rejects.toThrow("can still be shipped");

    await service.updateShipmentStatus(id, ShipmentStatus.labelPrinted());
    await service.updateShipmentStatus(id, ShipmentStatus.inTransit());
    await expect(service.updateItemQuantity(id, itemIds[0], 2)).rejects.toThrow("in_transit");
    await expect(service.removeShipmentItem(id, itemIds[0])).rejects.toThrow("in_transit");

    const stored = await service.getShipment(id);
    expect(stored?.getShippedAt()).toBeInstanceOf(Date);
    expect(stored?.getItems()[0].getQty()).toBe(3);
  });
});
