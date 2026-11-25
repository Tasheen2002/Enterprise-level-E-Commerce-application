import { describe, it, expect, vi } from "vitest";
import { ClearCartHandler, ClearCartCommand } from "@modules/cart/application/commands/clear-cart.command";
import { CartManagementService } from "@modules/cart/application/services/cart-management.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("ClearCartHandler", () => {
  it("should successfully clear the cart using CartManagementService", async () => {
    // Arrange
    const validUserId = "c2d48538-c73d-4ac1-a23e-abbf809cd5ef";
    const mockService = {
      clearCart: vi.fn().mockResolvedValue(undefined),
    } as unknown as CartManagementService;

    const handler = new ClearCartHandler(mockService);

    const command: ClearCartCommand = {
      cartId: "cart-123",
      userId: validUserId,
      guestToken: "guest-token-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.clearCart).toHaveBeenCalledWith("cart-123", validUserId, "guest-token-123");
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
  });
});
