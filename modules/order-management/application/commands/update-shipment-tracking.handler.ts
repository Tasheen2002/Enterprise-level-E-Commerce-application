import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdateShipmentTrackingCommand } from "./update-shipment-tracking.command";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipment } from "../../domain/entities/order-shipment.entity";

export class UpdateShipmentTrackingCommandHandler implements ICommandHandler<
  UpdateShipmentTrackingCommand,
  CommandResult<OrderShipment>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateShipmentTrackingCommand,
  ): Promise<CommandResult<OrderShipment>> {
    try {
      const shipment = await this.orderService.updateShipmentTracking({
        orderId: command.orderId,
        shipmentId: command.shipmentId,
        trackingNumber: command.trackingNumber,
        carrier: command.carrier,
        service: command.service,
      });

      return CommandResult.success(shipment);
    } catch (error) {
      return CommandResult.failure<OrderShipment>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating shipment tracking",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
