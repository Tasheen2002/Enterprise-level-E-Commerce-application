import { describe, it, expect, vi } from "vitest";
import { RemoveShipmentItemCommandHandler, RemoveShipmentItemCommand, CommandResult } from "@modules/fulfillment/application/commands/remove-shipment-item.command";
import { ShipmentService } from "@modules/fulfillment/application/services/shipment.service";
import { Shipment } from "@modules/fulfillment/domain/entities/shipment.entity";

describe("RemoveShipmentItemCommandHandler", () => {
  it("should successfully remove an item from a shipment", async () => {
    // Arrange
    const mockShipment = {
      id: "shipment-123",
      items: [],
    } as unknown as Shipment;

    const mockService = {
      removeShipmentItem: vi.fn().mockResolvedValue(mockShipment),
    } as unknown as ShipmentService;

    const handler = new RemoveShipmentItemCommandHandler(mockService);

    const command: RemoveShipmentItemCommand = {
      shipmentId: "shipment-123",
      orderItemId: "order-item-123",
    };

    // Act
    const result = await handler.handle(command);

    // Assert
    expect(mockService.removeShipmentItem).toHaveBeenCalledWith("shipment-123", "order-item-123");
    expect(result).toBeInstanceOf(CommandResult);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockShipment);
  });

  it("should fail validation if fields are empty", async () => {
    const mockService = {} as unknown as ShipmentService;
    const handler = new RemoveShipmentItemCommandHandler(mockService);
    const command: RemoveShipmentItemCommand = {
      shipmentId: "",
      orderItemId: "",
    };

    const result = await handler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Validation failed");
    expect(result.errors).toContain("Shipment ID is required");
    expect(result.errors).toContain("Order item ID is required");
  });
});
