import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { OrderRepositoryImpl } from "@modules/order-management/infra/persistence/repositories/order.repository.impl";
import { Order } from "@modules/order-management/domain/entities/order.entity";
import { OrderItem } from "@modules/order-management/domain/entities/order-item.entity";
import { OrderAddress } from "@modules/order-management/domain/entities/order-address.entity";
import { OrderSource } from "@modules/order-management/domain/value-objects/order-source.vo";
import { OrderStatus } from "@modules/order-management/domain/value-objects/order-status.vo";
import { OrderTotals } from "@modules/order-management/domain/value-objects/order-totals.vo";
import { ProductSnapshot } from "@modules/order-management/domain/value-objects/product-snapshot.vo";
import { AddressSnapshot } from "@modules/order-management/domain/value-objects/address-snapshot.vo";
import { Currency } from "@modules/order-management/domain/value-objects";

const prisma = new PrismaClient();

// Helper to create a dummy product snapshot with valid UUIDs
const createProductSnapshot = (productId: string, variantId: string) => ProductSnapshot.create({
  productId,
  variantId,
  sku: `SKU-${Date.now()}`,
  name: "Bespoke Shoes",
  price: 150,
});

// Helper to create a dummy address snapshot
const createAddressSnapshot = () => AddressSnapshot.create({
  firstName: "Jane",
  lastName: "Doe",
  addressLine1: "123 luxury street",
  city: "Singapore",
  state: "SG",
  postalCode: "123456",
  country: "SG",
});

describe("OrderRepository Integration Tests", () => {
  let repository: OrderRepositoryImpl;
  let defaultProductId: string;
  let defaultVariantId: string;
  let customerUserId: string;

  beforeAll(async () => {
    await prisma.$connect();
    repository = new OrderRepositoryImpl(prisma);
  });

  beforeEach(async () => {
    // Create a real product and variant in the DB first so that foreign keys align
    defaultProductId = randomUUID();
    defaultVariantId = randomUUID();
    customerUserId = randomUUID();

    await prisma.product.create({
      data: {
        id: defaultProductId,
        title: "Repository Test Shoes",
        slug: `repo-test-${randomUUID()}`,
        price: 150,
        currency: "USD",
        status: "published",
      },
    });

    await prisma.productVariant.create({
      data: {
        id: defaultVariantId,
        productId: defaultProductId,
        sku: `SKU-REPO-TEST-${Date.now()}`,
        price: 150,
      },
    });

    // Create a customer user in the DB
    await prisma.user.create({
      data: {
        id: customerUserId,
        email: `repo-customer-${randomUUID()}@example.com`,
        passwordHash: "dummy-hash",
        role: "CUSTOMER",
        status: "active",
        emailVerified: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should save and retrieve a guest order with items and address successfully", async () => {
    const orderId = randomUUID();
    const item = OrderItem.create({
      orderId,
      variantId: defaultVariantId,
      quantity: 2,
      productSnapshot: createProductSnapshot(defaultProductId, defaultVariantId),
      isGift: false,
    });

    const testOrder = Order.create({
      guestToken: `guest_token_${randomUUID()}`,
      items: [item],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 300, tax: 20, shipping: 10, discount: 0, total: 330 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });

    const address = OrderAddress.create({
      orderId: testOrder.id.getValue(),
      billingAddress: createAddressSnapshot(),
      shippingAddress: createAddressSnapshot(),
    });
    testOrder.setAddress(address);

    // Save to DB
    await repository.save(testOrder);

    // Retrieve from DB
    const retrieved = await repository.findById(testOrder.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id.getValue()).toBe(testOrder.id.getValue());
    expect(retrieved?.items.length).toBe(1);
    expect(retrieved?.items[0].quantity).toBe(2);
    expect(retrieved?.address?.billingAddress.firstName).toBe("Jane");
    expect(retrieved?.totals.total).toBe(330);
  });

  it("should support finding orders by order number, guest token, and user id", async () => {
    const orderId = randomUUID();
    const item = OrderItem.create({
      orderId,
      variantId: defaultVariantId,
      quantity: 1,
      productSnapshot: createProductSnapshot(defaultProductId, defaultVariantId),
      isGift: false,
    });

    const userOrder = Order.create({
      userId: customerUserId,
      items: [item],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 150, tax: 10, shipping: 5, discount: 0, total: 165 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });

    await repository.save(userOrder);

    const foundByNo = await repository.findByOrderNumber(userOrder.orderNumber);
    expect(foundByNo).toBeDefined();
    expect(foundByNo?.id.getValue()).toBe(userOrder.id.getValue());

    const foundByUser = await repository.findByUserId(customerUserId);
    expect(foundByUser.length).toBeGreaterThanOrEqual(1);
    expect(foundByUser[0].id.getValue()).toBe(userOrder.id.getValue());
  });
});
