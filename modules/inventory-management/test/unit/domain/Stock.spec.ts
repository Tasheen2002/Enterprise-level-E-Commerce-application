import { describe, it, expect } from "vitest";
import { Stock } from "@modules/inventory-management/domain/entities/stock.entity";
import { StockLevel } from "@modules/inventory-management/domain/value-objects/stock-level.vo";
import { DomainValidationError } from "@modules/inventory-management/domain/errors/inventory-management.errors";
import {
  StockAddedEvent,
  StockRemovedEvent,
  StockReservedEvent,
  StockReservationFulfilledEvent,
  StockUnreservedEvent,
  StockThresholdsUpdatedEvent,
} from "@modules/inventory-management/domain/entities/stock.entity";
import {
  STOCK_MIN_QUANTITY,
  STOCK_MAX_QUANTITY,
} from "@modules/inventory-management/domain/constants/inventory-management.constants";

describe("Stock & StockLevel Domain Invariants", () => {
  describe("StockLevel Value Object", () => {
    it("should instantiate StockLevel successfully with valid properties", () => {
      const level = StockLevel.create(100, 20, 10, 5);

      expect(level.onHand).toBe(100);
      expect(level.reserved).toBe(20);
      expect(level.available).toBe(80);
      expect(level.lowStockThreshold).toBe(10);
      expect(level.safetyStock).toBe(5);
      expect(level.isLowStock()).toBe(false);
      expect(level.isOutOfStock()).toBe(false);
      expect(level.isBelowSafetyStock()).toBe(false);
    });

    it("should throw DomainValidationError if onHand is below min quantity", () => {
      expect(() => StockLevel.create(STOCK_MIN_QUANTITY - 1, 0)).toThrow(DomainValidationError);
    });

    it("should throw DomainValidationError if onHand exceeds max quantity", () => {
      expect(() => StockLevel.create(STOCK_MAX_QUANTITY + 1, 0)).toThrow(DomainValidationError);
    });

    it("should throw DomainValidationError if reserved quantity is negative", () => {
      expect(() => StockLevel.create(10, -1)).toThrow(DomainValidationError);
    });

    it("should throw DomainValidationError if reserved quantity exceeds onHand quantity", () => {
      expect(() => StockLevel.create(10, 11)).toThrow(DomainValidationError);
    });

    it("should throw DomainValidationError if lowStockThreshold is negative", () => {
      expect(() => StockLevel.create(10, 0, -1)).toThrow(DomainValidationError);
    });

    it("should throw DomainValidationError if safetyStock is negative", () => {
      expect(() => StockLevel.create(10, 0, 5, -1)).toThrow(DomainValidationError);
    });

    it("should compute isLowStock, isOutOfStock, and isBelowSafetyStock correctly", () => {
      // 1. Low stock: available (100 - 90 = 10) <= threshold (10)
      const lowStockLevel = StockLevel.create(100, 90, 10, 5);
      expect(lowStockLevel.isLowStock()).toBe(true);
      expect(lowStockLevel.isBelowSafetyStock()).toBe(false);

      // 2. Out of stock: available (100 - 100 = 0) <= 0
      const outOfStockLevel = StockLevel.create(100, 100, 10, 5);
      expect(outOfStockLevel.isOutOfStock()).toBe(true);

      // 3. Below safety stock: available (100 - 96 = 4) <= safetyStock (5)
      const belowSafetyStockLevel = StockLevel.create(100, 96, 10, 5);
      expect(belowSafetyStockLevel.isBelowSafetyStock()).toBe(true);
    });
  });

  describe("Stock Aggregate Root", () => {
    it("should create Stock entity and record StockCreatedEvent / check base properties", () => {
      const stock = Stock.create({
        variantId: "variant-123",
        locationId: "location-456",
        onHand: 50,
        reserved: 10,
        lowStockThreshold: 5,
        safetyStock: 2,
      });

      expect(stock.stockId.getValue()).toEqual({
        variantId: "variant-123",
        locationId: "location-456",
      });
      expect(stock.variantId).toBe("variant-123");
      expect(stock.locationId).toBe("location-456");
      expect(stock.stockLevel.onHand).toBe(50);
      expect(stock.stockLevel.reserved).toBe(10);
    });

    it("should perform addStock operation and dispatch event", () => {
      const stock = Stock.create({ variantId: "v", locationId: "l", onHand: 10 });
      stock.clearDomainEvents();

      stock.addStock(15);
      expect(stock.stockLevel.onHand).toBe(25);
      expect(stock.stockLevel.available).toBe(25);

      const events = stock.domainEvents;
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(StockAddedEvent);
      expect(events[0].eventType).toBe("stock.added");
      expect(events[0].getPayload()).toEqual({ variantId: "v", locationId: "l", quantity: 15 });
    });

    it("should perform removeStock operation and dispatch event", () => {
      const stock = Stock.create({ variantId: "v", locationId: "l", onHand: 20, reserved: 5 });
      stock.clearDomainEvents();

      stock.removeStock(10);
      expect(stock.stockLevel.onHand).toBe(10);
      expect(stock.stockLevel.available).toBe(5);

      const events = stock.domainEvents;
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(StockRemovedEvent);
      expect(events[0].eventType).toBe("stock.removed");
    });

    it("should reject removeStock if quantity exceeds available or reduces onHand below reserved", () => {
      const stock = Stock.create({ variantId: "v", locationId: "l", onHand: 20, reserved: 5 });

      expect(() => stock.removeStock(25)).toThrow(DomainValidationError); // exceeds total onHand
      expect(() => stock.removeStock(16)).toThrow(DomainValidationError); // onHand becomes 4, which is less than reserved (5)
    });

    it("should perform reserveStock operation and dispatch event", () => {
      const stock = Stock.create({ variantId: "v", locationId: "l", onHand: 10 });
      stock.clearDomainEvents();

      stock.reserveStock(4);
      expect(stock.stockLevel.reserved).toBe(4);
      expect(stock.stockLevel.available).toBe(6);

      const events = stock.domainEvents;
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(StockReservedEvent);
    });

    it("should reject reserveStock if available stock is insufficient", () => {
      const stock = Stock.create({ variantId: "v", locationId: "l", onHand: 10, reserved: 3 }); // available = 7
      expect(() => stock.reserveStock(8)).toThrow(DomainValidationError);
    });

    it("should perform fulfillReservation operation and dispatch event", () => {
      const stock = Stock.create({ variantId: "v", locationId: "l", onHand: 10, reserved: 4 });
      stock.clearDomainEvents();

      stock.fulfillReservation(3);
      expect(stock.stockLevel.onHand).toBe(7);
      expect(stock.stockLevel.reserved).toBe(1);
      expect(stock.stockLevel.available).toBe(6); // unchanged (onHand and reserved both reduced by 3)

      const events = stock.domainEvents;
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(StockReservationFulfilledEvent);
    });

    it("should reject fulfillReservation if quantity exceeds reserved count", () => {
      const stock = Stock.create({ variantId: "v", locationId: "l", onHand: 10, reserved: 2 });
      expect(() => stock.fulfillReservation(3)).toThrow(DomainValidationError);
    });

    it("should perform unreserveStock operation and dispatch event", () => {
      const stock = Stock.create({ variantId: "v", locationId: "l", onHand: 10, reserved: 4 });
      stock.clearDomainEvents();

      stock.unreserveStock(3);
      expect(stock.stockLevel.reserved).toBe(1);
      expect(stock.stockLevel.available).toBe(9);

      const events = stock.domainEvents;
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(StockUnreservedEvent);
    });

    it("should reject unreserveStock if quantity exceeds reserved count", () => {
      const stock = Stock.create({ variantId: "v", locationId: "l", onHand: 10, reserved: 2 });
      expect(() => stock.unreserveStock(3)).toThrow(DomainValidationError);
    });

    it("should update thresholds and dispatch event", () => {
      const stock = Stock.create({ variantId: "v", locationId: "l", onHand: 10 });
      stock.clearDomainEvents();

      stock.updateThresholds(12, 6);
      expect(stock.stockLevel.lowStockThreshold).toBe(12);
      expect(stock.stockLevel.safetyStock).toBe(6);

      const events = stock.domainEvents;
      expect(events.length).toBe(1);
      expect(events[0]).toBeInstanceOf(StockThresholdsUpdatedEvent);
    });
  });
});
