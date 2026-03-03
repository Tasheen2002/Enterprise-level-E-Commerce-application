import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { MarkShipmentShippedCommand } from "./mark-shipment-shipped.command";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipment } from "../../domain/entities/order-shipment.entity";

export class MarkShipmentShippedCommandHandler implements ICommandHandler<
  MarkShipmentShippedCommand,
  CommandResult<OrderShipment>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: MarkShipmentShippedCommand,
  ): Promise<CommandResult<OrderShipment>> {
    try {
      const shipment = await this.orderService.markShipmentShipped({
        orderId: command.orderId,
        shipmentId: command.shipmentId,
        carrier: command.carrier,
        service: command.service,
        trackingNumber: command.trackingNumber,
      });

      return CommandResult.success(shipment);
    } catch (error) {
      return CommandResult.failure<OrderShipment>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while marking shipment as shipped",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
