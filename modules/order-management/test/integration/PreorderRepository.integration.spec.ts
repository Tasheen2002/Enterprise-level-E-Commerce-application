import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PreorderRepositoryImpl } from "@modules/order-management/infra/persistence/repositories/preorder.repository.impl";
import { OrderRepositoryImpl } from "@modules/order-management/infra/persistence/repositories/order.repository.impl";
import { Order } from "@modules/order-management/domain/entities/order.entity";
import { OrderItem } from "@modules/order-management/domain/entities/order-item.entity";
import { Preorder } from "@modules/order-management/domain/entities/preorder.entity";
import { OrderSource } from "@modules/order-management/domain/value-objects/order-source.vo";
import { OrderTotals } from "@modules/order-management/domain/value-objects/order-totals.vo";
import { ProductSnapshot } from "@modules/order-management/domain/value-objects/product-snapshot.vo";
import { Currency } from "@modules/order-management/domain/value-objects";

const prisma = new PrismaClient();

const createProductSnapshot = (productId: string, variantId: string) => ProductSnapshot.create({
  productId,
  variantId,
  sku: `SKU-${Date.now()}`,
  name: "Bespoke Shoes",
  price: 150,
});

describe("PreorderRepository Integration Tests", () => {
  let repository: PreorderRepositoryImpl;
  let orderRepository: OrderRepositoryImpl;
  let defaultProductId: string;
  let defaultVariantId: string;

  beforeAll(async () => {
    await prisma.$connect();
    repository = new PreorderRepositoryImpl(prisma);
    orderRepository = new OrderRepositoryImpl(prisma);
  });

  beforeEach(async () => {
    // Create a real product and variant in the DB first
    defaultProductId = randomUUID();
    defaultVariantId = randomUUID();

    await prisma.product.create({
      data: {
        id: defaultProductId,
        title: "Preorder Test Shoes",
        slug: `preorder-test-${randomUUID()}`,
        price: 150,
        currency: "USD",
        status: "published",
      },
    });

    await prisma.productVariant.create({
      data: {
        id: defaultVariantId,
        productId: defaultProductId,
        sku: `SKU-PREORDER-TEST-${Date.now()}`,
        price: 150,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should save, retrieve, and delete a preorder successfully", async () => {
    const orderId = randomUUID();
    const item = OrderItem.create({
      orderId,
      variantId: defaultVariantId,
      quantity: 1,
      productSnapshot: createProductSnapshot(defaultProductId, defaultVariantId),
      isGift: false,
    });

    const testOrder = Order.create({
      guestToken: `guest_token_${randomUUID()}`,
      items: [item],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 150, tax: 10, shipping: 5, discount: 0, total: 165 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });

    await orderRepository.save(testOrder);

    // Get the saved item from DB to get its generated ID
    const savedOrder = await orderRepository.findById(testOrder.id);
    expect(savedOrder).toBeDefined();
    const savedItem = savedOrder!.items[0];

    // 2. Create and save the preorder
    const futureDate = new Date(Date.now() + 86400000 * 5);
    const preorder = Preorder.create({
      orderItemId: savedItem.orderItemId,
      releaseDate: futureDate,
    });

    await repository.save(preorder);

    // 3. Retrieve and assert
    const retrieved = await repository.findByOrderItemId(savedItem.orderItemId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.orderItemId.getValue()).toBe(savedItem.orderItemId.getValue());
    expect(retrieved?.releaseDate?.toDateString()).toBe(futureDate.toDateString());
    expect(retrieved?.isReleased()).toBe(false);

    // 4. Assert queries
    const unnotified = await repository.findUnnotified();
    expect(unnotified.length).toBeGreaterThanOrEqual(1);

    // 5. Delete
    await repository.delete(savedItem.orderItemId);
    const afterDelete = await repository.findByOrderItemId(savedItem.orderItemId);
    expect(afterDelete).toBeNull();
  });
});
