import { describe, it, expect, vi } from "vitest";
import { AwardLoyaltyPointsHandler, AwardLoyaltyPointsCommand } from "@modules/loyalty/application/commands/award-loyalty-points.command";
import { LoyaltyService } from "@modules/loyalty/application/services/loyalty.service";
import { CommandResult } from "@packages/core/src/application/cqrs";
import { LoyaltyTransactionDTO } from "@modules/loyalty/domain/entities/loyalty-transaction.entity";
import { LoyaltyTransactionReasonValue } from "@modules/loyalty/domain/value-objects/loyalty-reason.vo";

describe("AwardLoyaltyPointsHandler", () => {
  it("should successfully award loyalty points using LoyaltyService", async () => {
    // Arrange
    const mockTransaction: LoyaltyTransactionDTO = {
      id: "tx-456",
      accountId: "acc-123",
      type: "EARN",
      points: 150,
      reason: LoyaltyTransactionReasonValue.PURCHASE,
      description: "Order purchase",
      referenceId: null,
      orderId: "order-999",
      createdBy: null,
      expiresAt: new Date().toISOString(),
      balanceAfter: 150,
      createdAt: new Date().toISOString(),
    };

    const mockService = {
      earnPoints: vi.fn().mockResolvedValue(mockTransaction),
    } as unknown as LoyaltyService;

    const handler = new AwardLoyaltyPointsHandler(mockService);

    const command: AwardLoyaltyPointsCommand = {
      userId: "user-123",
      points: 100,
      reason: LoyaltyTransactionReasonValue.PURCHASE,
      orderId: "order-999",
      description: "Order purchase",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.earnPoints).toHaveBeenCalledWith({
      userId: "user-123",
      points: 100,
      reason: LoyaltyTransactionReasonValue.PURCHASE,
      orderId: "order-999",
      description: "Order purchase",
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockTransaction);
  });
});
