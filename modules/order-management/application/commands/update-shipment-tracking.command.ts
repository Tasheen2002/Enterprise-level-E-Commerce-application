import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipment } from "../../domain/entities/order-shipment.entity";

export interface UpdateShipmentTrackingCommand extends ICommand {
  orderId: string;
  shipmentId: string;
  trackingNumber: string;
  carrier?: string;
  service?: string;
}

export class UpdateShipmentTrackingCommandHandler implements ICommandHandler<
  UpdateShipmentTrackingCommand,
  CommandResult<OrderShipment>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateShipmentTrackingCommand,
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

      if (
        !command.trackingNumber ||
        command.trackingNumber.trim().length === 0
      ) {
        errors.push("trackingNumber: Tracking number is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<OrderShipment>(
          "Validation failed",
          errors,
        );
      }

      // Execute service
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
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

// Alias for backwards compatibility
export { UpdateShipmentTrackingCommandHandler as UpdateShipmentTrackingHandler };
