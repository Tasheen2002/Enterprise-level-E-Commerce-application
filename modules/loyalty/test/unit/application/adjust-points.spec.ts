import { describe, it, expect, vi } from "vitest";
import { AdjustLoyaltyPointsHandler, AdjustLoyaltyPointsCommand } from "@modules/loyalty/application/commands/adjust-points.command";
import { LoyaltyService } from "@modules/loyalty/application/services/loyalty.service";
import { CommandResult } from "@packages/core/src/application/cqrs";
import { LoyaltyTransactionDTO } from "@modules/loyalty/domain/entities/loyalty-transaction.entity";

describe("AdjustLoyaltyPointsHandler", () => {
  it("should successfully adjust loyalty points using LoyaltyService", async () => {
    // Arrange
    const mockTransaction: LoyaltyTransactionDTO = {
      id: "tx-123",
      accountId: "account-123",
      type: "adjust_add",
      points: 100,
      reason: "Bonus points",
      description: null,
      referenceId: null,
      orderId: null,
      createdBy: "admin-123",
      expiresAt: null,
      balanceAfter: 100,
      createdAt: new Date().toISOString(),
    };

    const mockService = {
      adjustPoints: vi.fn().mockResolvedValue(mockTransaction),
    } as unknown as LoyaltyService;

    const handler = new AdjustLoyaltyPointsHandler(mockService);

    const command: AdjustLoyaltyPointsCommand = {
      userId: "user-123",
      points: 100,
      isAddition: true,
      reason: "Bonus points",
      createdBy: "admin-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.adjustPoints).toHaveBeenCalledWith({
      userId: "user-123",
      points: 100,
      isAddition: true,
      reason: "Bonus points",
      createdBy: "admin-123",
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockTransaction);
  });
});
