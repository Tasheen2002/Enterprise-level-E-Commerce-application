import { describe, it, expect, vi } from "vitest";
import { AddStockHandler, AddStockCommand } from "@modules/inventory-management/application/commands/add-stock.command";
import { StockManagementService } from "@modules/inventory-management/application/services/stock-management.service";
import { CommandResult } from "@packages/core/src/application/cqrs";
import { StockDTO } from "@modules/inventory-management/domain/entities/stock.entity";

describe("AddStockHandler", () => {
  it("should successfully add stock by calling StockManagementService", async () => {
    // Arrange
    const mockStock: StockDTO = {
      variantId: "variant-1",
      locationId: "location-1",
      onHand: 15,
      reserved: 0,
      available: 15,
      lowStockThreshold: 5,
      safetyStock: 0,
      isLowStock: false,
      isOutOfStock: false,
    };

    const mockService = {
      addStock: vi.fn().mockResolvedValue(mockStock),
    } as unknown as StockManagementService;

    const handler = new AddStockHandler(mockService);

    const command: AddStockCommand = {
      variantId: "variant-1",
      locationId: "location-1",
      quantity: 10,
      reason: "Restock",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.addStock).toHaveBeenCalledWith(
      "variant-1",
      "location-1",
      10,
      "Restock"
    );
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockStock);
  });
});
