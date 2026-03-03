import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipment } from "../../domain/entities/order-shipment.entity";

export interface MarkShipmentDeliveredCommand extends ICommand {
  orderId: string;
  shipmentId: string;
  deliveredAt?: Date;
}

export class MarkShipmentDeliveredCommandHandler implements ICommandHandler<
  MarkShipmentDeliveredCommand,
  CommandResult<OrderShipment>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: MarkShipmentDeliveredCommand,
  ): Promise<CommandResult<OrderShipment>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderId || command.orderId.trim().length === 0) {
        errors.push("orderId: Order ID is required");
      }

      if (!command.shipmentId || command.shipmentId.trim().length === 0) {
        errors.push("shipmentId: Shipment ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<OrderShipment>(
          "Validation failed",
          errors,
        );
      }

      // Execute service
      const shipment = await this.orderService.markShipmentDelivered({
        orderId: command.orderId,
        shipmentId: command.shipmentId,
        deliveredAt: command.deliveredAt || new Date(),
      });

      return CommandResult.success(shipment);
    } catch (error) {
      return CommandResult.failure<OrderShipment>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

// Alias for backwards compatibility
export { MarkShipmentDeliveredCommandHandler as MarkShipmentDeliveredHandler };
