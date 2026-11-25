import { describe, it, expect, vi } from "vitest";
import { DeleteCategoryHandler, DeleteCategoryCommand } from "@modules/product-catalog/application/commands/delete-category.command";
import { CategoryManagementService } from "@modules/product-catalog/application/services/category-management.service";
import { CommandResult } from "@packages/core/src/application/cqrs";

describe("DeleteCategoryHandler", () => {
  it("should successfully delete a category using CategoryManagementService", async () => {
    // Arrange
    const mockService = {
      deleteCategory: vi.fn().mockResolvedValue(undefined),
    } as unknown as CategoryManagementService;

    const handler = new DeleteCategoryHandler(mockService);

    const command: DeleteCategoryCommand = {
      categoryId: "cat-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.deleteCategory).toHaveBeenCalledWith("cat-123");
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
  });
});
