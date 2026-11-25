import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { OrderRepositoryImpl } from "@modules/order-management/infra/persistence/repositories/order.repository.impl";
import { Order } from "@modules/order-management/domain/entities/order.entity";
import { OrderItem } from "@modules/order-management/domain/entities/order-item.entity";
import { OrderAddress } from "@modules/order-management/domain/entities/order-address.entity";
import { OrderSource } from "@modules/order-management/domain/value-objects/order-source.vo";
import { OrderTotals } from "@modules/order-management/domain/value-objects/order-totals.vo";
import { ProductSnapshot } from "@modules/order-management/domain/value-objects/product-snapshot.vo";
import { AddressSnapshot } from "@modules/order-management/domain/value-objects/address-snapshot.vo";
import { Currency } from "@modules/order-management/domain/value-objects";

// Rows owned by other contexts (backorders, preorders, fulfillment shipment
// items, return items, repairs) reference order_items with ON DELETE CASCADE.
// Persisting the order aggregate must therefore never delete and recreate
// items that still exist in the aggregate.
const prisma = new PrismaClient();
const repository = new OrderRepositoryImpl(prisma);

const address = () =>
  AddressSnapshot.create({
    firstName: "Test",
    lastName: "Customer",
    addressLine1: "1 Example Street",
    city: "Example City",
    state: "EX",
    postalCode: "00000",
    country: "SG",
  });

let variantId: string;
let productId: string;

beforeEach(async () => {
  productId = randomUUID();
  variantId = randomUUID();
  await prisma.product.create({
    data: { id: productId, title: "Dependent Rows", slug: `dep-${productId}`, price: 50 },
  });
  await prisma.productVariant.create({
    data: { id: variantId, productId, sku: `DEP-${variantId}`, price: 50 },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function orderWithTwoItems() {
  const item = (quantity: number) =>
    OrderItem.create({
      orderId: randomUUID(),
      variantId,
      quantity,
      productSnapshot: ProductSnapshot.create({
        productId,
        variantId,
        sku: "DEP",
        name: "Dependent Rows",
        price: 50,
      }),
      isGift: false,
    });
  const order = Order.create({
    guestToken: `guest_${randomUUID()}`,
    items: [item(1), item(2)],
    shipments: [],
    totals: OrderTotals.create({ subtotal: 150, tax: 0, shipping: 0, discount: 0, total: 150 }),
    source: OrderSource.create("web"),
    currency: Currency.create("USD"),
  });
  order.setAddress(
    OrderAddress.create({
      orderId: order.id.getValue(),
      billingAddress: address(),
      shippingAddress: address(),
    }),
  );
  await repository.save(order);
  const [first, second] = order.items.map((i) => i.orderItemId.getValue());
  return { order, first: first!, second: second! };
}

async function attachDependents(orderId: string, orderItemId: string) {
  await prisma.backorder.create({ data: { orderItemId } });
  const rma = await prisma.returnRequest.create({ data: { orderId, type: "return" } });
  await prisma.returnItem.create({ data: { rmaId: rma.id, orderItemId, qty: 1 } });
  await prisma.repair.create({ data: { orderItemId, status: "open" } });
  const shipment = await prisma.shipment.create({ data: { orderId } });
  await prisma.shipmentItem.create({
    data: { shipmentId: shipment.shipmentId, orderItemId, qty: 1 },
  });
}

async function dependentCounts(orderItemId: string) {
  const where = { orderItemId };
  return {
    backorders: await prisma.backorder.count({ where }),
    preorders: await prisma.preorder.count({ where }),
    returnItems: await prisma.returnItem.count({ where }),
    repairs: await prisma.repair.count({ where }),
    shipmentItems: await prisma.shipmentItem.count({ where }),
  };
}

describe("Order persistence keeps rows that depend on order items", () => {
  it("keeps backorders, returns, repairs and shipment items through a status change", async () => {
    const { order, first, second } = await orderWithTwoItems();
    await attachDependents(order.id.getValue(), first);
    await prisma.preorder.create({ data: { orderItemId: second } });

    const loaded = (await repository.findById(order.id))!;
    loaded.markAsPaid();
    await repository.save(loaded);

    expect(await dependentCounts(first)).toEqual({
      backorders: 1,
      preorders: 0,
      returnItems: 1,
      repairs: 1,
      shipmentItems: 1,
    });
    expect((await dependentCounts(second)).preorders).toBe(1);
    expect((await prisma.order.findUnique({ where: { id: order.id.getValue() } }))?.status).toBe(
      "paid",
    );
  });

  it("updates an edited item in place without dropping its dependents", async () => {
    const { order, first } = await orderWithTwoItems();
    await prisma.backorder.create({ data: { orderItemId: first } });

    const loaded = (await repository.findById(order.id))!;
    loaded.updateItemQuantity(first, 5);
    await repository.save(loaded);

    expect((await prisma.orderItem.findUnique({ where: { id: first } }))?.qty).toBe(5);
    expect((await dependentCounts(first)).backorders).toBe(1);
  });

  it("deletes only the items removed from the aggregate", async () => {
    const { order, first, second } = await orderWithTwoItems();
    await prisma.backorder.create({ data: { orderItemId: first } });

    const loaded = (await repository.findById(order.id))!;
    loaded.removeItem(second);
    await repository.save(loaded);

    const remaining = await prisma.orderItem.findMany({ where: { orderId: order.id.getValue() } });
    expect(remaining.map((row) => row.id)).toEqual([first]);
    expect((await dependentCounts(first)).backorders).toBe(1);
  });
});
