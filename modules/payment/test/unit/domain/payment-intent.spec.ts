import { describe, it, expect } from "vitest";
import { PaymentIntent } from "@modules/payment/domain/entities/payment-intent.entity";
import { PaymentIntentStatus } from "@modules/payment/domain/value-objects/payment-intent-status.vo";
import { Money } from "@modules/payment/domain/value-objects/money.vo";
import { Currency } from "@modules/payment/domain/value-objects/currency.vo";
import { PaymentIntentInvalidStatusError, PaymentIntentNotLinkedToOrderError } from "@modules/payment/domain/errors";

describe("PaymentIntent Aggregate Root", () => {
  it("should create a PaymentIntent successfully and emit PaymentIntentCreatedEvent", () => {
    const intent = PaymentIntent.create({
      orderId: "order-123",
      provider: "stripe",
      amount: 100,
      currency: "USD",
      idempotencyKey: "idem-key-123",
      clientSecret: "secret-123",
      metadata: { key: "value" },
    });

    expect(intent.id).toBeDefined();
    expect(intent.orderId).toBe("order-123");
    expect(intent.provider).toBe("stripe");
    expect(intent.amount.getAmount()).toBe(100);
    expect(intent.amount.getCurrency().getValue()).toBe("USD");
    expect(intent.clientSecret).toBe("secret-123");
    expect(intent.metadata).toEqual({ key: "value" });
    expect(intent.requiresAction()).toBe(true);

    const events = intent.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe("payment_intent.created");
    expect(events[0].getPayload()).toEqual({
      intentId: intent.id.getValue(),
      provider: "stripe",
      amount: 100,
      currency: "USD",
    });
  });

  it("should support updating orderId and checkoutId", () => {
    const intent = PaymentIntent.create({
      provider: "stripe",
      amount: 100,
      currency: "USD",
    });

    expect(intent.orderId).toBeNull();
    intent.attachOrder("order-456");
    expect(intent.orderId).toBe("order-456");

    expect(intent.checkoutId).toBeNull();
    intent.attachCheckout("checkout-456");
    expect(intent.checkoutId).toBe("checkout-456");
  });

  it("should validate link to order", () => {
    const intent = PaymentIntent.create({
      provider: "stripe",
      amount: 100,
      currency: "USD",
    });

    expect(() => intent.requiresOrder()).toThrow(PaymentIntentNotLinkedToOrderError);

    intent.attachOrder("order-123");
    expect(() => intent.requiresOrder()).not.toThrow();
  });

  it("should successfully progress status through authorization and capture", () => {
    const intent = PaymentIntent.create({
      orderId: "order-123",
      provider: "stripe",
      amount: 100,
      currency: "USD",
    });

    expect(intent.canAuthorize()).toBe(true);
    expect(intent.canCapture()).toBe(false);

    // Authorize
    intent.authorize();
    expect(intent.isAuthorized()).toBe(true);
    expect(intent.canCapture()).toBe(true);
    expect(intent.domainEvents.length).toBe(2); // created + authorized
    expect(intent.domainEvents[1].eventType).toBe("payment_intent.authorized");

    // Capture
    intent.capture();
    expect(intent.isCaptured()).toBe(true);
    expect(intent.domainEvents.length).toBe(3); // created + authorized + captured
    expect(intent.domainEvents[2].eventType).toBe("payment_intent.captured");
  });

  it("should throw error if capturing before authorized", () => {
    const intent = PaymentIntent.create({
      orderId: "order-123",
      provider: "stripe",
      amount: 100,
      currency: "USD",
    });

    expect(() => intent.capture()).toThrow(PaymentIntentInvalidStatusError);
  });

  it("should support voiding/cancelling payment intent", () => {
    const intent = PaymentIntent.create({
      orderId: "order-123",
      provider: "stripe",
      amount: 100,
      currency: "USD",
    });

    intent.authorize();
    expect(intent.canCancel()).toBe(true);

    intent.cancel();
    expect(intent.isCancelled()).toBe(true);
    expect(intent.domainEvents.length).toBe(3); // created + authorized + cancelled
    expect(intent.domainEvents[2].eventType).toBe("payment_intent.cancelled");
  });

  it("should support failing payment intent", () => {
    const intent = PaymentIntent.create({
      orderId: "order-123",
      provider: "stripe",
      amount: 100,
      currency: "USD",
    });

    intent.fail();
    expect(intent.isFailed()).toBe(true);
    expect(intent.domainEvents.length).toBe(2); // created + failed
    expect(intent.domainEvents[1].eventType).toBe("payment_intent.failed");
  });

  it("should support updating clientSecret and amount", () => {
    const intent = PaymentIntent.create({
      orderId: "order-123",
      provider: "stripe",
      amount: 100,
      currency: "USD",
    });

    intent.updateClientSecret("new-secret");
    expect(intent.clientSecret).toBe("new-secret");

    intent.updateAmount(150);
    expect(intent.amount.getAmount()).toBe(150);
  });
});
