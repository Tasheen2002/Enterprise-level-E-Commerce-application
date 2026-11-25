import { describe, it, expect, vi } from "vitest";
import { CreateShipmentHandler, CreateShipmentCommand } from "@modules/order-management/application/commands/create-shipment.command";
import { OrderManagementService } from "@modules/order-management/application/services/order-management.service";
import { CommandResult } from "@packages/core/src/application/cqrs";
import { OrderShipmentDTO } from "@modules/order-management/domain/entities/order-shipment.entity";

describe("CreateShipmentHandler", () => {
  it("should successfully create a shipment and return successful CommandResult", async () => {
    // Arrange
    const mockShipment: OrderShipmentDTO = {
      shipmentId: "shipment-123",
      orderId: "order-123",
      carrier: "FedEx",
      service: "Ground",
      trackingNumber: "TRACK-123",
      giftReceipt: false,
      isShipped: true,
      isDelivered: false,
    };

    const mockService = {
      createShipment: vi.fn().mockResolvedValue(mockShipment),
    } as unknown as OrderManagementService;

    const handler = new CreateShipmentHandler(mockService);

    const command: CreateShipmentCommand = {
      orderId: "order-123",
      carrier: "FedEx",
      service: "Ground",
      trackingNumber: "TRACK-123",
      giftReceipt: false,
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.createShipment).toHaveBeenCalledWith({
      orderId: "order-123",
      carrier: "FedEx",
      service: "Ground",
      trackingNumber: "TRACK-123",
      giftReceipt: false,
      pickupLocationId: undefined,
    });
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockShipment);
  });
});
