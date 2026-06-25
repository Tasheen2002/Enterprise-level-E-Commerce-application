import { describe, it, expect } from "vitest";
import { Backorder, BackorderCreatedEvent, BackorderEtaUpdatedEvent, BackorderNotifiedEvent } from "@modules/order-management/domain/entities/backorder.entity";
import { OrderItemId } from "@modules/order-management/domain/value-objects/order-item-id.vo";
import { DomainValidationError, InvalidOperationError } from "@modules/order-management/domain/errors/order-management.errors";

describe("Backorder Entity", () => {
  it("should successfully create a backorder and emit BackorderCreatedEvent", () => {
    const orderItemId = OrderItemId.create();
    const futureDate = new Date(Date.now() + 86400000 * 5); // 5 days in the future
    const backorder = Backorder.create({
      orderItemId,
      promisedEta: futureDate,
    });

    expect(backorder.orderItemId.equals(orderItemId)).toBe(true);
    expect(backorder.promisedEta).toEqual(futureDate);
    expect(backorder.notifiedAt).toBeUndefined();
    expect(backorder.hasPromisedEta()).toBe(true);
    expect(backorder.isCustomerNotified()).toBe(false);

    const events = backorder.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(BackorderCreatedEvent);
  });

  it("should throw DomainValidationError if promisedEta is in the past or now", () => {
    const orderItemId = OrderItemId.create();
    const pastDate = new Date(Date.now() - 1000);
    expect(() => {
      Backorder.create({
        orderItemId,
        promisedEta: pastDate,
      });
    }).toThrow(DomainValidationError);
  });

  it("should support updating promised ETA and emit BackorderEtaUpdatedEvent", () => {
    const orderItemId = OrderItemId.create();
    const backorder = Backorder.create({ orderItemId });

    const futureDate = new Date(Date.now() + 86400000 * 10);
    backorder.updatePromisedEta(futureDate);

    expect(backorder.promisedEta).toEqual(futureDate);

    const events = backorder.domainEvents;
    expect(events.find(e => e instanceof BackorderEtaUpdatedEvent)).toBeDefined();
  });

  it("should throw DomainValidationError if updating promised ETA to past", () => {
    const orderItemId = OrderItemId.create();
    const backorder = Backorder.create({ orderItemId });

    const pastDate = new Date(Date.now() - 1000);
    expect(() => {
      backorder.updatePromisedEta(pastDate);
    }).toThrow(DomainValidationError);
  });

  it("should support marking as notified and emit BackorderNotifiedEvent", () => {
    const orderItemId = OrderItemId.create();
    const backorder = Backorder.create({ orderItemId });

    backorder.markAsNotified();

    expect(backorder.isCustomerNotified()).toBe(true);
    expect(backorder.notifiedAt).toBeInstanceOf(Date);

    const events = backorder.domainEvents;
    expect(events.find(e => e instanceof BackorderNotifiedEvent)).toBeDefined();

    // Secondary notify should throw
    expect(() => {
      backorder.markAsNotified();
    }).toThrow(InvalidOperationError);
  });
});
