import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { MarkShipmentDeliveredCommand } from "./mark-shipment-delivered.command";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipment } from "../../domain/entities/order-shipment.entity";

export class MarkShipmentDeliveredCommandHandler implements ICommandHandler<
  MarkShipmentDeliveredCommand,
  CommandResult<OrderShipment>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: MarkShipmentDeliveredCommand,
  ): Promise<CommandResult<OrderShipment>> {
    try {
      const shipment = await this.orderService.markShipmentDelivered({
        orderId: command.orderId,
        shipmentId: command.shipmentId,
        deliveredAt: command.deliveredAt || new Date(),
      });

      return CommandResult.success(shipment);
    } catch (error) {
      return CommandResult.failure<OrderShipment>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while marking shipment as delivered",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
