import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { OrderShipmentRepositoryImpl } from "@modules/order-management/infra/persistence/repositories/order-shipment.repository.impl";
import { OrderRepositoryImpl } from "@modules/order-management/infra/persistence/repositories/order.repository.impl";
import { Order } from "@modules/order-management/domain/entities/order.entity";
import { OrderItem } from "@modules/order-management/domain/entities/order-item.entity";
import { OrderShipment } from "@modules/order-management/domain/entities/order-shipment.entity";
import { OrderSource } from "@modules/order-management/domain/value-objects/order-source.vo";
import { OrderTotals } from "@modules/order-management/domain/value-objects/order-totals.vo";
import { ProductSnapshot } from "@modules/order-management/domain/value-objects/product-snapshot.vo";
import { Currency } from "@modules/order-management/domain/value-objects";

const prisma = new PrismaClient();

// Helper to create a dummy product snapshot
const createProductSnapshot = (productId: string, variantId: string) => ProductSnapshot.create({
  productId,
  variantId,
  sku: `SKU-${Date.now()}`,
  name: "Bespoke Shoes",
  price: 150,
});

describe("OrderShipmentRepository Integration Tests", () => {
  let repository: OrderShipmentRepositoryImpl;
  let orderRepository: OrderRepositoryImpl;
  let defaultProductId: string;
  let defaultVariantId: string;

  beforeAll(async () => {
    await prisma.$connect();
    repository = new OrderShipmentRepositoryImpl(prisma);
    orderRepository = new OrderRepositoryImpl(prisma);
  });

  beforeEach(async () => {
    // Create a real product and variant in the DB first
    defaultProductId = randomUUID();
    defaultVariantId = randomUUID();

    await prisma.product.create({
      data: {
        id: defaultProductId,
        title: "Shipment Test Shoes",
        slug: `shipment-test-${randomUUID()}`,
        price: 150,
        currency: "USD",
        status: "published",
      },
    });

    await prisma.productVariant.create({
      data: {
        id: defaultVariantId,
        productId: defaultProductId,
        sku: `SKU-SHIPMENT-TEST-${Date.now()}`,
        price: 150,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should save, retrieve, and delete an order shipment successfully", async () => {
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

    // 2. Create and save the shipment
    const shipment = OrderShipment.create({
      orderId: testOrder.id.getValue(),
      giftReceipt: false,
      carrier: "DHL",
      service: "Express",
      trackingNumber: "DHL-12345",
      shippedAt: new Date(),
    });

    await repository.save(shipment);

    // 3. Retrieve and assert
    const retrieved = await repository.findById(shipment.shipmentId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.shipmentId.getValue()).toBe(shipment.shipmentId.getValue());
    expect(retrieved?.orderId).toBe(testOrder.id.getValue());
    expect(retrieved?.carrier).toBe("DHL");
    expect(retrieved?.service).toBe("Express");
    expect(retrieved?.trackingNumber).toBe("DHL-12345");
    expect(retrieved?.isShipped()).toBe(true);
    expect(retrieved?.isDelivered()).toBe(false);

    // 4. Find by tracking number
    const foundByTracking = await repository.findByTrackingNumber("DHL-12345");
    expect(foundByTracking).toBeDefined();
    expect(foundByTracking?.shipmentId.getValue()).toBe(shipment.shipmentId.getValue());

    // 5. Find by order id
    const foundByOrder = await repository.findByOrderId(testOrder.id);
    expect(foundByOrder.length).toBe(1);

    // 6. Delete
    await repository.delete(shipment.shipmentId);
    const afterDelete = await repository.findById(shipment.shipmentId);
    expect(afterDelete).toBeNull();
  });
});
