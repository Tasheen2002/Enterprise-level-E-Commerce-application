import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ShipmentService } from "../services/shipment.service";
import { Shipment } from "../../domain/entities/shipment.entity";

// Base interfaces

export interface AddShipmentItemCommand extends ICommand {
  shipmentId: string;
  orderItemId: string;
  qty: number;
}

export class AddShipmentItemCommandHandler
  implements ICommandHandler<AddShipmentItemCommand, CommandResult<Shipment>>
{
  constructor(private readonly shipmentService: ShipmentService) {}

  async handle(command: AddShipmentItemCommand): Promise<CommandResult<Shipment>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.shipmentId?.trim()) {
        errors.push("Shipment ID is required");
      }

      if (!command.orderItemId?.trim()) {
        errors.push("Order item ID is required");
      }

      if (!command.qty || command.qty <= 0) {
        errors.push("Quantity must be greater than 0");
      }

      if (errors.length > 0) {
        return CommandResult.failure("Validation failed", errors);
      }

      const shipment = await this.shipmentService.addShipmentItem(command.shipmentId, {
        orderItemId: command.orderItemId,
        qty: command.qty,
      });

      return CommandResult.success(shipment);
    } catch (error) {
      return CommandResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
