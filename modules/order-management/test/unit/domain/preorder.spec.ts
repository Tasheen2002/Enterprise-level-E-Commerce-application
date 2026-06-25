import { describe, it, expect } from "vitest";
import { Preorder, PreorderCreatedEvent, PreorderReleaseDateUpdatedEvent, PreorderNotifiedEvent } from "@modules/order-management/domain/entities/preorder.entity";
import { OrderItemId } from "@modules/order-management/domain/value-objects/order-item-id.vo";
import { DomainValidationError, InvalidOperationError } from "@modules/order-management/domain/errors/order-management.errors";

describe("Preorder Entity", () => {
  it("should successfully create a preorder and emit PreorderCreatedEvent", () => {
    const orderItemId = OrderItemId.create();
    const futureDate = new Date(Date.now() + 86400000 * 5); // 5 days in the future
    const preorder = Preorder.create({
      orderItemId,
      releaseDate: futureDate,
    });

    expect(preorder.orderItemId.equals(orderItemId)).toBe(true);
    expect(preorder.releaseDate).toEqual(futureDate);
    expect(preorder.notifiedAt).toBeUndefined();
    expect(preorder.hasReleaseDate()).toBe(true);
    expect(preorder.isCustomerNotified()).toBe(false);
    expect(preorder.isReleased()).toBe(false);

    const events = preorder.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(PreorderCreatedEvent);
  });

  it("should throw DomainValidationError if releaseDate is in the past or now on creation", () => {
    const orderItemId = OrderItemId.create();
    const pastDate = new Date(Date.now() - 1000);
    expect(() => {
      Preorder.create({
        orderItemId,
        releaseDate: pastDate,
      });
    }).toThrow(DomainValidationError);
  });

  it("should support updating release date and emit PreorderReleaseDateUpdatedEvent", () => {
    const orderItemId = OrderItemId.create();
    const preorder = Preorder.create({ orderItemId });

    const futureDate = new Date(Date.now() + 86400000 * 10);
    preorder.updateReleaseDate(futureDate);

    expect(preorder.releaseDate).toEqual(futureDate);

    const events = preorder.domainEvents;
    expect(events.find(e => e instanceof PreorderReleaseDateUpdatedEvent)).toBeDefined();
  });

  it("should support marking as notified only after release date", () => {
    const orderItemId = OrderItemId.create();
    const futureDate = new Date(Date.now() + 86400000 * 5);
    const preorder = Preorder.create({
      orderItemId,
      releaseDate: futureDate,
    });

    // Try notifying before release date (should fail)
    expect(() => {
      preorder.markAsNotified();
    }).toThrow(InvalidOperationError);

    // Set release date in the past to simulate item is released
    const pastDate = new Date(Date.now() - 86400000 * 2);
    preorder.updateReleaseDate(pastDate);
    expect(preorder.isReleased()).toBe(true);

    preorder.markAsNotified();
    expect(preorder.isCustomerNotified()).toBe(true);
    expect(preorder.notifiedAt).toBeInstanceOf(Date);

    // Notify again (should fail)
    expect(() => {
      preorder.markAsNotified();
    }).toThrow(InvalidOperationError);
  });
});
