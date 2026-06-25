import { describe, it, expect, vi } from "vitest";
import { CancelOrderHandler, CancelOrderCommand } from "@modules/order-management/application/commands/cancel-order.command";
import { OrderManagementService } from "@modules/order-management/application/services/order-management.service";
import { CommandResult } from "@packages/core/src/application/cqrs";
import { OrderDTO } from "@modules/order-management/domain/entities/order.entity";

describe("CancelOrderHandler", () => {
  it("should successfully cancel the order using OrderManagementService", async () => {
    // Arrange
    const mockOrder: OrderDTO = {
      id: "order-123",
      orderNumber: "ORD-123",
      userId: "user-123",
      status: "cancelled",
      items: [],
      totals: { subtotal: 100, tax: 10, shipping: 5, total: 115, discount: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "web",
      currency: "USD",
      shipments: [],
    };

    const mockService = {
      cancelOrder: vi.fn().mockResolvedValue(mockOrder),
    } as unknown as OrderManagementService;

    const handler = new CancelOrderHandler(mockService);

    const command: CancelOrderCommand = {
      orderId: "order-123",
      requestingUserId: "user-123",
      isStaff: false,
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.cancelOrder).toHaveBeenCalledWith("order-123", "user-123", false);
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockOrder);
  });
});
