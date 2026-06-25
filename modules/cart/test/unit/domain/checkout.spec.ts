import { describe, it, expect } from "vitest";
import { Checkout } from "@modules/cart/domain/entities/checkout.entity";
import { CheckoutId, CartId, CartOwnerId, GuestToken, CheckoutStatus } from "@modules/cart/domain/value-objects";
import { DomainValidationError, InvalidCheckoutStateError, InvalidOperationError } from "@modules/cart/domain/errors/cart.errors";
import {
  CheckoutCreatedEvent,
  CheckoutCompletedEvent,
  CheckoutCancelledEvent,
  CheckoutExpiredEvent,
} from "@modules/cart/domain/entities/checkout.entity";

describe("Checkout Aggregate Root", () => {
  const cartId = "d3b07384-d113-4956-a5d2-069d30560a6a";
  const userId = "c2d48538-c73d-4ac1-a23e-abbf809cd5ef";
  const guestToken = "guest_abc123123123123123123123123";
  const totalAmount = 150.5;
  const currency = "USD";

  it("should create a Checkout successfully for a user", () => {
    const checkout = Checkout.create({
      cartId,
      userId,
      totalAmount,
      currency,
    });

    expect(checkout.checkoutId).toBeDefined();
    expect(checkout.cartId.getValue()).toBe(cartId);
    expect(checkout.cartOwnerId?.getValue()).toBe(userId);
    expect(checkout.guestToken).toBeNull();
    expect(checkout.status.isPending()).toBe(true);
    expect(checkout.totalAmount).toBe(totalAmount);
    expect(checkout.currency.getValue()).toBe(currency);
    expect(checkout.completedAt).toBeNull();

    expect(checkout.domainEvents).toHaveLength(1);
    expect(checkout.domainEvents[0]).toBeInstanceOf(CheckoutCreatedEvent);
  });

  it("should create a Checkout successfully for a guest", () => {
    const checkout = Checkout.create({
      cartId,
      guestToken,
      totalAmount,
      currency,
    });

    expect(checkout.guestToken?.getValue()).toBe(guestToken);
    expect(checkout.cartOwnerId).toBeNull();
    expect(checkout.status.isPending()).toBe(true);
  });

  it("should throw validation error if ownership is invalid", () => {
    expect(() =>
      Checkout.create({
        cartId,
        userId,
        guestToken,
        totalAmount,
        currency,
      })
    ).toThrow(DomainValidationError);

    expect(() =>
      Checkout.create({
        cartId,
        totalAmount,
        currency,
      })
    ).toThrow(DomainValidationError);
  });

  it("should throw validation error if total amount is negative", () => {
    expect(() =>
      Checkout.create({
        cartId,
        userId,
        totalAmount: -10,
        currency,
      })
    ).toThrow(DomainValidationError);
  });

  it("should support updating total amount", () => {
    const checkout = Checkout.create({ cartId, userId, totalAmount, currency });
    checkout.updateTotalAmount(200.0);
    expect(checkout.totalAmount).toBe(200.0);

    expect(() => checkout.updateTotalAmount(-5)).toThrow(DomainValidationError);
  });

  it("should complete checkout successfully and block subsequent changes", () => {
    const checkout = Checkout.create({ cartId, userId, totalAmount, currency });
    const now = new Date();
    checkout.markAsCompleted(now);

    expect(checkout.status.isCompleted()).toBe(true);
    expect(checkout.completedAt).toEqual(now);
    expect(checkout.isCompleted).toBe(true);
    expect(checkout.domainEvents[1]).toBeInstanceOf(CheckoutCompletedEvent);

    // Cannot complete again
    expect(() => checkout.markAsCompleted()).toThrow(InvalidCheckoutStateError);
    // Cannot expire
    expect(() => checkout.markAsExpired()).toThrow(InvalidCheckoutStateError);
    // Cannot cancel
    expect(() => checkout.markAsCancelled()).toThrow(InvalidCheckoutStateError);
  });

  it("should support cancelling checkout", () => {
    const checkout = Checkout.create({ cartId, userId, totalAmount, currency });
    checkout.markAsCancelled();

    expect(checkout.status.getValue()).toBe("cancelled");
    expect(checkout.domainEvents[1]).toBeInstanceOf(CheckoutCancelledEvent);

    expect(() => checkout.markAsCompleted()).toThrow("Cannot complete a cancelled checkout");
  });

  it("should support expiring checkout", () => {
    const checkout = Checkout.create({ cartId, userId, totalAmount, currency });
    checkout.markAsExpired();

    expect(checkout.status.isExpired()).toBe(true);
    expect(checkout.domainEvents[1]).toBeInstanceOf(CheckoutExpiredEvent);

    expect(() => checkout.markAsCompleted()).toThrow("Cannot complete an expired checkout");
  });

  it("should support guest-to-user checkout transfer", () => {
    const checkout = Checkout.create({ cartId, guestToken, totalAmount, currency });
    expect(checkout.cartOwnerId).toBeNull();

    const targetUserId = "4f215025-d63e-4b9f-83cf-b71d070c7c2e";
    const transferred = checkout.transferToUser(targetUserId);
    expect(transferred.cartOwnerId?.getValue()).toBe(targetUserId);
    expect(transferred.guestToken).toBeNull();
  });

  it("should throw error when transferring a checkout that already has a user", () => {
    const checkout = Checkout.create({ cartId, userId, totalAmount, currency });
    expect(() => checkout.transferToUser("4f215025-d63e-4b9f-83cf-b71d070c7c2e")).toThrow(InvalidOperationError);
  });

  it("should correctly serialize snapshots and DTOs", () => {
    const checkout = Checkout.create({ cartId, userId, totalAmount, currency });
    const snapshot = checkout.toSnapshot();

    expect(snapshot.status).toBe("pending");
    expect(snapshot.totalAmount).toBe(totalAmount);

    const dto = Checkout.toDTO(checkout);
    expect(dto.isPending).toBe(true);
    expect(dto.isCompleted).toBe(false);
  });
});
