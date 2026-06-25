import { describe, it, expect, vi } from "vitest";
import { AddToCartHandler, AddToCartCommand } from "@modules/cart/application/commands/add-to-cart.command";
import { CartManagementService, CartDto } from "@modules/cart/application/services/cart-management.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("AddToCartHandler", () => {
  it("should successfully add item to cart using CartManagementService", async () => {
    // Arrange
    const validUserId = "c2d48538-c73d-4ac1-a23e-abbf809cd5ef";
    const mockCartDto: CartDto = {
      cartId: "cart-123",
      userId: validUserId,
      currency: "USD",
      items: [],
      summary: {
        cartId: "cart-123",
        isUserCart: true,
        isGuestCart: false,
        currency: "USD",
        itemCount: 0,
        uniqueItemCount: 0,
        subtotal: 0,
        totalDiscount: 0,
        total: 0,
        hasGiftItems: false,
        hasFreeShipping: false,
        isEmpty: true,
        isReservationExpired: false,
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockService = {
      addToCart: vi.fn().mockResolvedValue(mockCartDto),
    } as unknown as CartManagementService;

    const handler = new AddToCartHandler(mockService);

    const command: AddToCartCommand = {
      cartId: "cart-123",
      userId: validUserId,
      variantId: "variant-999",
      quantity: 3,
      isGift: false,
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.addToCart).toHaveBeenCalledWith({
      cartId: "cart-123",
      userId: validUserId,
      guestToken: undefined,
      variantId: "variant-999",
      quantity: 3,
      appliedPromos: undefined,
      isGift: false,
      giftMessage: undefined,
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockCartDto);
  });
});
