import { describe, it, expect } from "vitest";
import { Order, OrderCreatedEvent, OrderStatusUpdatedEvent, OrderItemAddedEvent, OrderItemRemovedEvent, OrderShipmentCreatedEvent } from "@modules/order-management/domain/entities/order.entity";
import { OrderItem } from "@modules/order-management/domain/entities/order-item.entity";
import { OrderAddress } from "@modules/order-management/domain/entities/order-address.entity";
import { OrderShipment } from "@modules/order-management/domain/entities/order-shipment.entity";
import { OrderSource } from "@modules/order-management/domain/value-objects/order-source.vo";
import { OrderStatus } from "@modules/order-management/domain/value-objects/order-status.vo";
import { OrderTotals } from "@modules/order-management/domain/value-objects/order-totals.vo";
import { ProductSnapshot } from "@modules/order-management/domain/value-objects/product-snapshot.vo";
import { AddressSnapshot } from "@modules/order-management/domain/value-objects/address-snapshot.vo";
import { Currency } from "@modules/order-management/domain/value-objects";
import { DomainValidationError, OrderNotEditableError, OrderItemNotFoundError, OrderAddressRequiredError, InvalidOperationError, OrderCancellationError, OrderRefundError, InvalidOrderStatusTransitionError } from "@modules/order-management/domain/errors/order-management.errors";

// Helper to create a dummy product snapshot
const createProductSnapshot = () => ProductSnapshot.create({
  productId: "prod-123",
  variantId: "var-123",
  sku: "SKU-123",
  name: "Bespoke Shoes",
  price: 150,
});

// Helper to create a dummy order item
const createOrderItem = (quantity = 1) => OrderItem.create({
  orderId: "order-123",
  variantId: "var-123",
  quantity,
  productSnapshot: createProductSnapshot(),
  isGift: false,
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

describe("Order Aggregate Root", () => {
  it("should successfully create an order and emit OrderCreatedEvent", () => {
    const item = createOrderItem(2);
    const order = Order.create({
      userId: "user-123",
      items: [item],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 300, tax: 20, shipping: 10, discount: 0, total: 330 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });

    expect(order.id).toBeDefined();
    expect(order.orderNumber).toBeDefined();
    expect(order.status.getValue()).toBe("created");
    expect(order.totals.total).toBe(330);
    expect(order.items.length).toBe(1);

    const events = order.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(OrderCreatedEvent);
    expect((events[0] as OrderCreatedEvent).total).toBe(330);
  });

  it("should throw DomainValidationError if items is empty on creation", () => {
    expect(() => {
      Order.create({
        userId: "user-123",
        items: [],
        shipments: [],
        totals: OrderTotals.create({ subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 }),
        source: OrderSource.create("web"),
        currency: Currency.create("USD"),
      });
    }).toThrow(DomainValidationError);
  });

  it("should throw DomainValidationError if both userId and guestToken are provided or if both are missing", () => {
    const item = createOrderItem();
    expect(() => {
      Order.create({
        items: [item],
        shipments: [],
        totals: OrderTotals.create({ subtotal: 150, tax: 0, shipping: 0, discount: 0, total: 150 }),
        source: OrderSource.create("web"),
        currency: Currency.create("USD"),
      });
    }).toThrow(DomainValidationError);

    expect(() => {
      Order.create({
        userId: "user-123",
        guestToken: "guest-token-abc",
        items: [item],
        shipments: [],
        totals: OrderTotals.create({ subtotal: 150, tax: 0, shipping: 0, discount: 0, total: 150 }),
        source: OrderSource.create("web"),
        currency: Currency.create("USD"),
      });
    }).toThrow(DomainValidationError);
  });

  it("should support adding order items and recalculating totals when status is created", () => {
    const item1 = createOrderItem(1);
    const order = Order.create({
      userId: "user-123",
      items: [item1],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 150, tax: 10, shipping: 5, discount: 0, total: 165 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });

    const item2 = OrderItem.create({
      orderId: order.id.getValue(),
      variantId: "var-456",
      quantity: 2,
      productSnapshot: ProductSnapshot.create({
        productId: "prod-456",
        variantId: "var-456",
        sku: "SKU-456",
        name: "Cat Sandals",
        price: 100,
      }),
      isGift: false,
    });

    order.addItem(item2);

    expect(order.items.length).toBe(2);
    // subtotal is now 150 + 200 = 350. tax = 10, shipping = 5, total = 365
    expect(order.totals.subtotal).toBe(350);
    expect(order.totals.total).toBe(365);

    const events = order.domainEvents;
    expect(events.find(e => e instanceof OrderItemAddedEvent)).toBeDefined();
  });

  it("should support removing order items and throw error if empty or not found", () => {
    const item1 = createOrderItem(1);
    const item2 = OrderItem.create({
      orderId: "order-123",
      variantId: "var-456",
      quantity: 1,
      productSnapshot: ProductSnapshot.create({
        productId: "prod-456",
        variantId: "var-456",
        sku: "SKU-456",
        name: "Sandals",
        price: 50,
      }),
      isGift: false,
    });

    const order = Order.create({
      userId: "user-123",
      items: [item1, item2],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 200, tax: 10, shipping: 5, discount: 0, total: 215 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });

    order.removeItem(item2.orderItemId.getValue());

    expect(order.items.length).toBe(1);
    expect(order.totals.subtotal).toBe(150);
    expect(order.totals.total).toBe(165);

    // Try removing the last item (should fail)
    expect(() => {
      order.removeItem(item1.orderItemId.getValue());
    }).toThrow(DomainValidationError);

    // Try removing a non-existent item (should fail)
    expect(() => {
      order.removeItem("non-existent-id");
    }).toThrow(OrderItemNotFoundError);
  });

  it("should update order item quantity", () => {
    const item = createOrderItem(1);
    const order = Order.create({
      userId: "user-123",
      items: [item],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 150, tax: 10, shipping: 5, discount: 0, total: 165 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });

    order.updateItemQuantity(item.orderItemId.getValue(), 3);

    expect(order.items[0].quantity).toBe(3);
    expect(order.totals.subtotal).toBe(450);
    expect(order.totals.total).toBe(465);
  });

  it("should throw OrderAddressRequiredError on pay if no address is set", () => {
    const item = createOrderItem(1);
    const order = Order.create({
      userId: "user-123",
      items: [item],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 150, tax: 10, shipping: 5, discount: 0, total: 165 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });

    expect(() => order.markAsPaid()).toThrow(OrderAddressRequiredError);
  });

  it("should transition status successfully through paid, shipped/fulfilled, and emit events", () => {
    const item = createOrderItem(1);
    const order = Order.create({
      userId: "user-123",
      items: [item],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 150, tax: 10, shipping: 5, discount: 0, total: 165 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });

    const address = OrderAddress.create({
      orderId: order.id.getValue(),
      billingAddress: createAddressSnapshot(),
      shippingAddress: createAddressSnapshot(),
    });
    order.setAddress(address);
    expect(order.address).toBe(address);

    order.markAsPaid();
    expect(order.status.getValue()).toBe("paid");

    const shipment = OrderShipment.create({
      orderId: order.id.getValue(),
      giftReceipt: false,
    });
    order.createShipment(shipment);
    expect(order.shipments.length).toBe(1);

    order.markAsFulfilled();
    expect(order.status.getValue()).toBe("fulfilled");

    const events = order.domainEvents;
    expect(events.filter(e => e instanceof OrderStatusUpdatedEvent).length).toBe(2);
  });

  it("should support order cancellation and throw error if already fulfilled", () => {
    const item = createOrderItem(1);
    const order = Order.create({
      userId: "user-123",
      items: [item],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 150, tax: 10, shipping: 5, discount: 0, total: 165 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });

    order.cancel();
    expect(order.status.getValue()).toBe("cancelled");

    // Re-creating a fulfilled order to test cancellation block
    const order2 = Order.create({
      userId: "user-123",
      items: [item],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 150, tax: 10, shipping: 5, discount: 0, total: 165 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });
    const address = OrderAddress.create({
      orderId: order2.id.getValue(),
      billingAddress: createAddressSnapshot(),
      shippingAddress: createAddressSnapshot(),
    });
    order2.setAddress(address);
    order2.markAsPaid();
    const shipment = OrderShipment.create({
      orderId: order2.id.getValue(),
      giftReceipt: false,
    });
    order2.createShipment(shipment);
    order2.markAsFulfilled();

    expect(() => order2.cancel()).toThrow(OrderCancellationError);
  });

  it("should support order refund and throw error if order is not paid or fulfilled", () => {
    const item = createOrderItem(1);
    const order = Order.create({
      userId: "user-123",
      items: [item],
      shipments: [],
      totals: OrderTotals.create({ subtotal: 150, tax: 10, shipping: 5, discount: 0, total: 165 }),
      source: OrderSource.create("web"),
      currency: Currency.create("USD"),
    });

    expect(() => order.refund()).toThrow(OrderRefundError);
  });
});
