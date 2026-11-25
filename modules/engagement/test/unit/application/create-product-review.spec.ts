import { describe, it, expect, vi } from "vitest";
import { CreateProductReviewHandler, CreateProductReviewCommand } from "@modules/engagement/application/commands/create-product-review.command";
import { ProductReviewService } from "@modules/engagement/application/services/product-review.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("CreateProductReviewHandler", () => {
  it("should successfully create a product review using ProductReviewService", async () => {
    // Arrange
    const mockDto = {
      id: "review-123",
      productId: "product-123",
      userId: "user-456",
      rating: 5,
      status: "pending",
      title: "Good",
      body: "Very good",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockService = {
      createReview: vi.fn().mockResolvedValue(mockDto)
    } as unknown as ProductReviewService;

    const handler = new CreateProductReviewHandler(mockService);

    const command: CreateProductReviewCommand = {
      productId: "product-123",
      userId: "user-456",
      rating: 5,
      title: "Good",
      body: "Very good"
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.createReview).toHaveBeenCalledWith({
      productId: "product-123",
      userId: "user-456",
      rating: 5,
      title: "Good",
      body: "Very good"
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toBe(mockDto);
  });
});
