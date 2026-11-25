import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ShipmentService } from "../services/shipment.service";
import { Shipment } from "../../domain/entities/shipment.entity";

// Base interfaces

export interface RemoveShipmentItemCommand extends ICommand {
  shipmentId: string;
  orderItemId: string;
}

export class RemoveShipmentItemCommandHandler
  implements ICommandHandler<RemoveShipmentItemCommand, CommandResult<Shipment>>
{
  constructor(private readonly shipmentService: ShipmentService) {}

  async handle(command: RemoveShipmentItemCommand): Promise<CommandResult<Shipment>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.shipmentId?.trim()) {
        errors.push("Shipment ID is required");
      }

      if (!command.orderItemId?.trim()) {
        errors.push("Order item ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure("Validation failed", errors);
      }

      const shipment = await this.shipmentService.removeShipmentItem(
        command.shipmentId,
        command.orderItemId,
      );

      return CommandResult.success(shipment);
    } catch (error) {
      return CommandResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
