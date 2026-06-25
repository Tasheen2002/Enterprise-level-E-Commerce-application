import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PaymentIntentRepositoryImpl } from "@modules/payment/infra/persistence/repositories/payment-intent.repository.impl";
import { PaymentIntent } from "@modules/payment/domain/entities/payment-intent.entity";
import { PaymentIntentId } from "@modules/payment/domain/value-objects/payment-intent-id.vo";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

describe("PaymentIntentRepository Integration Tests", () => {
  let repository: PaymentIntentRepositoryImpl;

  beforeEach(async () => {
    repository = new PaymentIntentRepositoryImpl(prisma);
  });

  it("should save and retrieve a PaymentIntent successfully", async () => {
    // 1. Arrange: Create domain entity
    const intent = PaymentIntent.create({
      provider: "stripe",
      amount: 100.50,
      currency: "USD",
      idempotencyKey: `idem-${randomUUID()}`,
      clientSecret: `sec-${randomUUID()}`,
      metadata: { order_type: "retail" },
    });

    // 2. Act: Save to database
    await repository.save(intent);

    // 3. Assert: Retrieve from database
    const found = await repository.findById(intent.id);
    expect(found).not.toBeNull();
    expect(found!.id.getValue()).toBe(intent.id.getValue());
    expect(found!.provider).toBe("stripe");
    expect(found!.amount.getAmount()).toBe(100.50);
    expect(found!.amount.getCurrency().getValue()).toBe("USD");
    expect(found!.clientSecret).toBe(intent.clientSecret);
    expect(found!.metadata).toEqual({ order_type: "retail" });
    expect(found!.status.getValue()).toBe("requires_action");
  });

  it("should support updating and deleting a PaymentIntent", async () => {
    const intent = PaymentIntent.create({
      provider: "stripe",
      amount: 50,
      currency: "USD",
    });

    await repository.save(intent);

    // Update status to authorized
    intent.authorize();
    await repository.save(intent);

    const updated = await repository.findById(intent.id);
    expect(updated!.status.getValue()).toBe("authorized");

    // Delete
    await repository.delete(intent.id);
    const deleted = await repository.findById(intent.id);
    expect(deleted).toBeNull();
  });

  it("should support finding by idempotencyKey, clientSecret, and filters", async () => {
    const key = `idem-${randomUUID()}`;
    const secret = `sec-${randomUUID()}`;
    const intent = PaymentIntent.create({
      provider: "stripe",
      amount: 250,
      currency: "USD",
      idempotencyKey: key,
      clientSecret: secret,
    });

    await repository.save(intent);

    // Find by key
    const foundByKey = await repository.findByIdempotencyKey(key);
    expect(foundByKey).not.toBeNull();
    expect(foundByKey!.id.getValue()).toBe(intent.id.getValue());

    // Find by client secret
    const foundBySecret = await repository.findByClientSecret(secret);
    expect(foundBySecret).not.toBeNull();
    expect(foundBySecret!.id.getValue()).toBe(intent.id.getValue());

    // Find with filters
    const paginated = await repository.findWithFilters({
      provider: "stripe",
    });
    expect(paginated.items.length).toBeGreaterThan(0);
    const hasIntent = paginated.items.some(
      (item) => item.id.getValue() === intent.id.getValue()
    );
    expect(hasIntent).toBe(true);
  });
});
