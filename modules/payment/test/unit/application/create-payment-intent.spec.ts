import { describe, it, expect, vi } from "vitest";
import { CreatePaymentIntentHandler, CreatePaymentIntentCommand } from "@modules/payment/application/commands/create-payment-intent.command";
import { PaymentService } from "@modules/payment/application/services/payment.service";
import { CommandResult } from "@packages/core/src/application/cqrs";
import { PaymentIntentDTO } from "@modules/payment/domain/entities/payment-intent.entity";

describe("CreatePaymentIntentHandler", () => {
  it("should successfully create a payment intent using PaymentService", async () => {
    // Arrange
    const mockIntent: PaymentIntentDTO = {
      id: "intent-123",
      orderId: "order-123",
      checkoutId: null,
      idempotencyKey: "idem-123",
      provider: "stripe",
      status: "requires_action",
      amount: 100,
      currency: "USD",
      clientSecret: "secret-123",
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockService = {
      createPaymentIntent: vi.fn().mockResolvedValue(mockIntent),
    } as unknown as PaymentService;

    const handler = new CreatePaymentIntentHandler(mockService);

    const command: CreatePaymentIntentCommand = {
      orderId: "order-123",
      provider: "stripe",
      amount: 100,
      currency: "USD",
      idempotencyKey: "idem-123",
      clientSecret: "secret-123",
      userId: "user-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.createPaymentIntent).toHaveBeenCalledWith({
      orderId: "order-123",
      provider: "stripe",
      amount: 100,
      currency: "USD",
      idempotencyKey: "idem-123",
      clientSecret: "secret-123",
      userId: "user-123",
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockIntent);
  });
});
