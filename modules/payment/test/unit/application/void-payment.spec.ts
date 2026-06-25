import { describe, it, expect, vi } from "vitest";
import { VoidPaymentHandler, VoidPaymentCommand } from "@modules/payment/application/commands/void-payment.command";
import { PaymentService } from "@modules/payment/application/services/payment.service";
import { CommandResult } from "@packages/core/src/application/cqrs";
import { PaymentIntentDTO } from "@modules/payment/domain/entities/payment-intent.entity";

describe("VoidPaymentHandler", () => {
  it("should successfully void a payment using PaymentService", async () => {
    // Arrange
    const mockIntent: PaymentIntentDTO = {
      id: "intent-123",
      orderId: "order-123",
      checkoutId: null,
      idempotencyKey: null,
      provider: "stripe",
      status: "voided",
      amount: 100,
      currency: "usd",
      clientSecret: null,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockService = {
      voidPayment: vi.fn().mockResolvedValue(mockIntent),
    } as unknown as PaymentService;

    const handler = new VoidPaymentHandler(mockService);

    const command: VoidPaymentCommand = {
      intentId: "intent-123",
      pspReference: "psp-ref-123",
      userId: "user-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.voidPayment).toHaveBeenCalledWith({
      intentId: "intent-123",
      pspReference: "psp-ref-123",
      userId: "user-123",
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockIntent);
  });
});
