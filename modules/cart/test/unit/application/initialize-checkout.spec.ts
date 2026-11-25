import { describe, it, expect, vi } from "vitest";
import { InitializeCheckoutHandler, InitializeCheckoutCommand } from "@modules/cart/application/commands/initialize-checkout.command";
import { CheckoutService, CheckoutDTO } from "@modules/cart/application/services/checkout.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("InitializeCheckoutHandler", () => {
  it("should successfully initialize checkout using CheckoutService", async () => {
    // Arrange
    const validUserId = "c2d48538-c73d-4ac1-a23e-abbf809cd5ef";
    const mockCheckoutDto: CheckoutDTO = {
      checkoutId: "checkout-123",
      cartId: "cart-123",
      userId: validUserId,
      status: "pending",
      totalAmount: 120.0,
      currency: "USD",
      expiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isExpired: false,
      isPending: true,
      isCompleted: false,
    };

    const mockService = {
      initializeCheckout: vi.fn().mockResolvedValue(mockCheckoutDto),
    } as unknown as CheckoutService;

    const handler = new InitializeCheckoutHandler(mockService);

    const command: InitializeCheckoutCommand = {
      cartId: "cart-123",
      userId: validUserId,
      expiresInMinutes: 20,
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.initializeCheckout).toHaveBeenCalledWith({
      cartId: "cart-123",
      userId: validUserId,
      guestToken: undefined,
      expiresInMinutes: 20,
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockCheckoutDto);
  });
});
