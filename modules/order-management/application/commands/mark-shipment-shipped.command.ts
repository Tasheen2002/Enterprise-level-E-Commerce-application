import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";
import { OrderShipment } from "../../domain/entities/order-shipment.entity";

export interface MarkShipmentShippedCommand extends ICommand {
  orderId: string;
  shipmentId: string;
  carrier: string;
  service: string;
  trackingNumber: string;
}

export class MarkShipmentShippedCommandHandler implements ICommandHandler<
  MarkShipmentShippedCommand,
  CommandResult<OrderShipment>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: MarkShipmentShippedCommand,
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

      if (!command.carrier || command.carrier.trim().length === 0) {
        errors.push("carrier: Carrier is required");
      }

      if (!command.service || command.service.trim().length === 0) {
        errors.push("service: Service is required");
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
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

// Alias for backwards compatibility
export { MarkShipmentShippedCommandHandler as MarkShipmentShippedHandler };
