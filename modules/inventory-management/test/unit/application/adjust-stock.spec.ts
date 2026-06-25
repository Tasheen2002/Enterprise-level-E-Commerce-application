import { describe, it, expect, vi } from "vitest";
import { AdjustStockHandler, AdjustStockCommand } from "@modules/inventory-management/application/commands/adjust-stock.command";
import { StockManagementService } from "@modules/inventory-management/application/services/stock-management.service";
import { CommandResult } from "@packages/core/src/application/cqrs";
import { StockDTO } from "@modules/inventory-management/domain/entities/stock.entity";

describe("AdjustStockHandler", () => {
  it("should successfully adjust stock by calling StockManagementService", async () => {
    // Arrange
    const mockStock: StockDTO = {
      variantId: "variant-1",
      locationId: "location-1",
      onHand: 15,
      reserved: 2,
      available: 13,
      lowStockThreshold: 5,
      safetyStock: 1,
      isLowStock: false,
      isOutOfStock: false,
    };

    const mockService = {
      adjustStock: vi.fn().mockResolvedValue(mockStock),
    } as unknown as StockManagementService;

    const handler = new AdjustStockHandler(mockService);

    const command: AdjustStockCommand = {
      variantId: "variant-1",
      locationId: "location-1",
      quantityDelta: -5,
      reason: "Shrinkage",
      referenceId: "ref-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.adjustStock).toHaveBeenCalledWith(
      "variant-1",
      "location-1",
      -5,
      "Shrinkage",
      "ref-123"
    );
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockStock);
  });
});
