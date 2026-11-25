import { describe, it, expect, vi } from "vitest";
import { ProcessPaymentHandler, ProcessPaymentCommand } from "@modules/payment/application/commands/process-payment.command";
import { PaymentService } from "@modules/payment/application/services/payment.service";
import { CommandResult } from "@packages/core/src/application/cqrs";
import { PaymentIntentDTO } from "@modules/payment/domain/entities/payment-intent.entity";

describe("ProcessPaymentHandler", () => {
  it("should successfully process payment by authorizing and capturing via PaymentService", async () => {
    // Arrange
    const mockAuthorizedIntent: PaymentIntentDTO = {
      id: "intent-123",
      orderId: "order-123",
      checkoutId: null,
      idempotencyKey: "idem-123",
      provider: "stripe",
      status: "authorized",
      amount: 100,
      currency: "USD",
      clientSecret: "secret-123",
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockCapturedIntent: PaymentIntentDTO = {
      ...mockAuthorizedIntent,
      status: "captured",
    };

    const mockService = {
      authorizePayment: vi.fn().mockResolvedValue(mockAuthorizedIntent),
      capturePayment: vi.fn().mockResolvedValue(mockCapturedIntent),
    } as unknown as PaymentService;

    const handler = new ProcessPaymentHandler(mockService);

    const command: ProcessPaymentCommand = {
      intentId: "intent-123",
      pspReference: "psp-ref-123",
      userId: "user-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.authorizePayment).toHaveBeenCalledWith({
      intentId: "intent-123",
      pspReference: "psp-ref-123",
      userId: "user-123",
    });
    expect(mockService.capturePayment).toHaveBeenCalledWith(
      "intent-123",
      "psp-ref-123",
      "user-123"
    );
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockCapturedIntent);
  });
});
