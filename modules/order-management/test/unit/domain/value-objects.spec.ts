import { describe, it, expect } from "vitest";
import { OrderId } from "@modules/order-management/domain/value-objects/order-id.vo";
import { OrderItemId } from "@modules/order-management/domain/value-objects/order-item-id.vo";
import { ShipmentId } from "@modules/order-management/domain/value-objects/shipment-id.vo";
import { OrderNumber } from "@modules/order-management/domain/value-objects/order-number.vo";
import { OrderStatus, OrderStatusValue } from "@modules/order-management/domain/value-objects/order-status.vo";
import { OrderTotals } from "@modules/order-management/domain/value-objects/order-totals.vo";
import { OrderSource } from "@modules/order-management/domain/value-objects/order-source.vo";
import { AddressSnapshot } from "@modules/order-management/domain/value-objects/address-snapshot.vo";
import { ProductSnapshot } from "@modules/order-management/domain/value-objects/product-snapshot.vo";
import { Currency } from "@modules/order-management/domain/value-objects";
import { DomainValidationError } from "@modules/order-management/domain/errors/order-management.errors";

describe("Order Management Value Objects", () => {
  describe("IDs", () => {
    it("should generate valid unique OrderId, OrderItemId, and ShipmentId", () => {
      const orderId1 = OrderId.create();
      const orderId2 = OrderId.create();
      expect(orderId1.getValue()).toBeDefined();
      expect(orderId1.equals(orderId2)).toBe(false);

      const itemId = OrderItemId.create();
      expect(itemId.getValue()).toBeDefined();

      const shipmentId = ShipmentId.create();
      expect(shipmentId.getValue()).toBeDefined();
    });
  });

  describe("OrderNumber", () => {
    it("should generate order number with prefix, timestamp, and random", () => {
      const ordNum = OrderNumber.generate("ORD");
      expect(ordNum.getValue()).toContain("ORD-");
      expect(ordNum.toString()).toBe(ordNum.getValue());
    });

    it("should throw DomainValidationError if value is empty or exceeds 50 chars", () => {
      expect(() => OrderNumber.create("")).toThrow(DomainValidationError);
      expect(() => OrderNumber.create("a".repeat(51))).toThrow(DomainValidationError);
    });
  });

  describe("OrderStatus", () => {
    it("should maintain reference equality for same statuses", () => {
      const status1 = OrderStatus.create("created");
      const status2 = OrderStatus.created();
      expect(status1).toBe(status2); // Should be exactly the same static reference
      expect(status1.getValue()).toBe(OrderStatusValue.CREATED);
    });

    it("should support correct transitions", () => {
      const created = OrderStatus.created();
      const paid = OrderStatus.paid();
      const cancelled = OrderStatus.cancelled();
      const refunded = OrderStatus.refunded();

      expect(created.canTransitionTo(paid)).toBe(true);
      expect(created.canTransitionTo(cancelled)).toBe(true);
      expect(cancelled.canTransitionTo(refunded)).toBe(false); // Cancelled is terminal
    });

    it("should throw DomainValidationError on invalid status", () => {
      expect(() => OrderStatus.create("invalid-status")).toThrow(DomainValidationError);
    });
  });

  describe("OrderTotals", () => {
    it("should create valid totals and prevent negative values", () => {
      const totals = OrderTotals.create({
        subtotal: 100,
        tax: 10,
        shipping: 5,
        discount: 15,
        total: 100,
      });

      expect(totals.subtotal).toBe(100);
      expect(totals.total).toBe(100);
    });

    it("should throw DomainValidationError on negative totals", () => {
      expect(() => {
        OrderTotals.create({
          subtotal: -10,
          tax: 0,
          shipping: 0,
          discount: 0,
          total: -10,
        });
      }).toThrow(DomainValidationError);
    });
  });

  describe("OrderSource", () => {
    it("should support valid sources and throw for invalid ones", () => {
      const web = OrderSource.create("web");
      expect(web.getValue()).toBe("web");

      expect(() => OrderSource.create("invalid-source")).toThrow(DomainValidationError);
    });
  });

  describe("AddressSnapshot", () => {
    it("should validate and create address snapshot", () => {
      const addr = AddressSnapshot.create({
        firstName: "Jack",
        lastName: "Smith",
        addressLine1: "456 Avenue",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "US",
      });

      expect(addr.fullName).toBe("Jack Smith");
    });

    it("should throw DomainValidationError on missing required fields", () => {
      expect(() => {
        AddressSnapshot.create({
          firstName: "",
          lastName: "Smith",
          addressLine1: "456 Avenue",
          city: "New York",
          state: "NY",
          postalCode: "10001",
          country: "US",
        });
      }).toThrow(DomainValidationError);
    });
  });

  describe("ProductSnapshot", () => {
    it("should validate and create product snapshot", () => {
      const snap = ProductSnapshot.create({
        productId: "prod-999",
        variantId: "var-999",
        sku: "SKU-999",
        name: "Classic Purple Bag",
        price: 1200,
      });

      expect(snap.fullName).toBe("Classic Purple Bag");
      expect(snap.price).toBe(1200);
    });
  });
});
