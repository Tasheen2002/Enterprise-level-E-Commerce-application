import { describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PaymentService } from "../../../application/services/payment.service";
import { PaymentIntent } from "../../../domain/entities/payment-intent.entity";
import { PaymentTransaction } from "../../../domain/entities/payment-transaction.entity";
import { PaymentIntentNotFoundError } from "../../../domain/errors/payment-loyalty.errors";

function harness(
  options: { provider?: string; gateway?: boolean; orderOwner?: string | null } = {},
) {
  const orderId = randomUUID();
  const intent = PaymentIntent.create({
    orderId,
    provider: options.provider ?? "stripe",
    amount: 100,
    currency: "USD",
    clientSecret: "pi_stripe_1",
  });
  intent.authorize();
  intent.capture();
  const transactions: PaymentTransaction[] = [];
  const intents = {
    findById: vi.fn(async () => intent),
    save: vi.fn(),
  };
  const transactionRepo = {
    findByIntentId: vi.fn(async () => transactions),
    save: vi.fn(async (t: PaymentTransaction) => {
      transactions.push(t);
    }),
  };
  const gateway = {
    refund: vi.fn(async () => ({ reference: `re_${transactions.length + 1}` })),
  };
  const owner = options.orderOwner === undefined ? "customer-1" : options.orderOwner;
  const service = new PaymentService(
    { findOrderOwner: vi.fn(async () => ({ userId: owner })) } as never,
    intents as never,
    transactionRepo as never,
    options.gateway === false ? undefined : (gateway as never),
  );
  return { service, intent, transactions, gateway, transactionRepo };
}

describe("refunds", () => {
  it("refunds a Stripe payment through Stripe and keeps the payment captured", async () => {
    const h = harness();
    const result = await h.service.refundPayment({ intentId: h.intent.id.getValue() });
    expect(h.gateway.refund).toHaveBeenCalledWith({
      provider: "stripe",
      providerReference: "pi_stripe_1",
      amount: 100,
      currency: "USD",
    });
    expect(h.transactions).toHaveLength(1);
    expect(h.transactions[0]!.pspReference).toBe("re_1");
    expect(result.status).toBe("captured");
  });

  it("allows partial refunds but never more than was collected", async () => {
    const h = harness();
    await h.service.refundPayment({ intentId: h.intent.id.getValue(), amount: 30 });
    await expect(
      h.service.refundPayment({ intentId: h.intent.id.getValue(), amount: 80 }),
    ).rejects.toThrow("remaining 70.00");
    await h.service.refundPayment({ intentId: h.intent.id.getValue() });
    expect(h.gateway.refund).toHaveBeenLastCalledWith(expect.objectContaining({ amount: 70 }));
    await expect(h.service.refundPayment({ intentId: h.intent.id.getValue() })).rejects.toThrow(
      "remaining 0.00",
    );
  });

  it("records nothing when the provider refuses the refund", async () => {
    const h = harness();
    h.gateway.refund.mockRejectedValueOnce(new Error("card closed"));
    await expect(h.service.refundPayment({ intentId: h.intent.id.getValue() })).rejects.toThrow(
      "card closed",
    );
    expect(h.transactionRepo.save).not.toHaveBeenCalled();
  });

  it("refuses to pretend a Stripe refund happened when Stripe is not configured", async () => {
    const h = harness({ gateway: false });
    await expect(h.service.refundPayment({ intentId: h.intent.id.getValue() })).rejects.toThrow(
      "provider not configured",
    );
    expect(h.transactionRepo.save).not.toHaveBeenCalled();
  });

  it("records refunds of offline payments without a provider", async () => {
    const h = harness({ provider: "cash", gateway: false });
    await h.service.refundPayment({ intentId: h.intent.id.getValue(), amount: 40 });
    expect(h.transactions).toHaveLength(1);
  });
});

describe("customer access to payments", () => {
  it("lets a customer see payments of their own order only", async () => {
    const h = harness();
    await expect(
      h.service.getPaymentIntent(h.intent.id.getValue(), "customer-1"),
    ).resolves.toBeDefined();
    await expect(
      h.service.getPaymentIntent(h.intent.id.getValue(), "someone-else"),
    ).rejects.toBeInstanceOf(PaymentIntentNotFoundError);
  });

  it("does not show payments of guest orders to other customers", async () => {
    const h = harness({ orderOwner: null });
    await expect(
      h.service.getPaymentIntent(h.intent.id.getValue(), "customer-1"),
    ).rejects.toBeInstanceOf(PaymentIntentNotFoundError);
  });

  it("lets staff and internal callers see any payment", async () => {
    const h = harness({ orderOwner: null });
    await expect(h.service.getPaymentIntent(h.intent.id.getValue())).resolves.toBeDefined();
  });
});
