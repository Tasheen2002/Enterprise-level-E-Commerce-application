import { describe, it, expect, vi } from "vitest";
import { RedeemLoyaltyPointsHandler, RedeemLoyaltyPointsCommand } from "@modules/loyalty/application/commands/redeem-loyalty-points.command";
import { LoyaltyService } from "@modules/loyalty/application/services/loyalty.service";
import { CommandResult } from "@packages/core/src/application/cqrs";
import { LoyaltyTransactionDTO } from "@modules/loyalty/domain/entities/loyalty-transaction.entity";
import { LoyaltyTransactionReasonValue } from "@modules/loyalty/domain/value-objects/loyalty-reason.vo";
import { InsufficientPointsError } from "@modules/loyalty/domain/errors";

describe("RedeemLoyaltyPointsHandler", () => {
  it("should successfully redeem loyalty points using LoyaltyService", async () => {
    // Arrange
    const mockTransaction: LoyaltyTransactionDTO = {
      id: "tx-789",
      accountId: "acc-123",
      type: "REDEEM",
      points: 50,
      reason: LoyaltyTransactionReasonValue.DISCOUNT_REDEMPTION,
      description: "Discount code redemption",
      referenceId: null,
      orderId: null,
      createdBy: null,
      expiresAt: null,
      balanceAfter: 100,
      createdAt: new Date().toISOString(),
    };

    const mockService = {
      redeemPoints: vi.fn().mockResolvedValue(mockTransaction),
    } as unknown as LoyaltyService;

    const handler = new RedeemLoyaltyPointsHandler(mockService);

    const command: RedeemLoyaltyPointsCommand = {
      userId: "user-123",
      points: 50,
      reason: LoyaltyTransactionReasonValue.DISCOUNT_REDEMPTION,
      description: "Discount code redemption",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.redeemPoints).toHaveBeenCalledWith({
      userId: "user-123",
      points: 50,
      reason: LoyaltyTransactionReasonValue.DISCOUNT_REDEMPTION,
      orderId: undefined,
      description: "Discount code redemption",
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockTransaction);
  });

  it("should bubble up domain errors if LoyaltyService throws them", async () => {
    // Arrange
    const mockService = {
      redeemPoints: vi.fn().mockRejectedValue(new InsufficientPointsError(200, 50)),
    } as unknown as LoyaltyService;

    const handler = new RedeemLoyaltyPointsHandler(mockService);

    const command: RedeemLoyaltyPointsCommand = {
      userId: "user-123",
      points: 200,
    };

    // Act & Assert
    await expect(handler.handle(command)).rejects.toThrow(InsufficientPointsError);
    expect(mockService.redeemPoints).toHaveBeenCalled();
  });
});
