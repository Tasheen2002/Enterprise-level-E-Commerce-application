import { describe, it, expect, vi } from "vitest";
import { CreateOrderHandler, CreateOrderCommand } from "@modules/order-management/application/commands/create-order.command";
import { OrderManagementService } from "@modules/order-management/application/services/order-management.service";
import { CommandResult } from "@packages/core/src/application/cqrs";
import { OrderDTO } from "@modules/order-management/domain/entities/order.entity";

describe("CreateOrderHandler", () => {
  it("should successfully create an order and return successful CommandResult", async () => {
    // Arrange
    const mockOrder: OrderDTO = {
      id: "order-123",
      orderNumber: "ORD-123",
      userId: "user-123",
      status: "created",
      items: [],
      totals: { subtotal: 150, tax: 10, shipping: 5, total: 165, discount: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "web",
      currency: "USD",
      shipments: [],
    };

    const mockService = {
      createOrder: vi.fn().mockResolvedValue(mockOrder),
    } as unknown as OrderManagementService;

    const handler = new CreateOrderHandler(mockService);

    const command: CreateOrderCommand = {
      userId: "user-123",
      items: [{ variantId: "var-123", quantity: 1 }],
      shippingAddress: {
        firstName: "Jane",
        lastName: "Doe",
        addressLine1: "123 luxury street",
        city: "Singapore",
        state: "SG",
        postalCode: "123456",
        country: "SG",
      },
      source: "web",
      currency: "USD",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.createOrder).toHaveBeenCalledWith({
      userId: "user-123",
      guestToken: undefined,
      items: [{ variantId: "var-123", quantity: 1 }],
      shippingAddress: command.shippingAddress,
      billingAddress: undefined,
      source: "web",
      currency: "USD",
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockOrder);
  });
});
