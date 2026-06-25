import { describe, it, expect, vi } from "vitest";
import { AddToWishlistHandler, AddToWishlistCommand } from "@modules/engagement/application/commands/add-to-wishlist.command";
import { WishlistManagementService } from "@modules/engagement/application/services/wishlist-management.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("AddToWishlistHandler", () => {
  it("should successfully add an item to wishlist using WishlistManagementService", async () => {
    // Arrange
    const mockDto = {
      wishlistId: "wishlist-123",
      variantId: "variant-abc",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockService = {
      addToWishlist: vi.fn().mockResolvedValue(mockDto)
    } as unknown as WishlistManagementService;

    const handler = new AddToWishlistHandler(mockService);

    const command: AddToWishlistCommand = {
      wishlistId: "wishlist-123",
      variantId: "variant-abc",
      userId: "user-456"
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.addToWishlist).toHaveBeenCalledWith(
      "wishlist-123",
      "variant-abc",
      { userId: "user-456", guestToken: undefined }
    );
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toBe(mockDto);
  });
});
