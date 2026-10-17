import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ShipmentService } from "../services/shipment.service";
import { Shipment } from "../../domain/entities/shipment.entity";
import { ShipmentStatus } from "../../domain/value-objects";

// Base interfaces

export interface UpdateShipmentStatusCommand extends ICommand {
  shipmentId: string;
  status: string;
}

export class UpdateShipmentStatusCommandHandler
  implements ICommandHandler<UpdateShipmentStatusCommand, CommandResult<Shipment>>
{
  constructor(private readonly shipmentService: ShipmentService) {}

  async handle(command: UpdateShipmentStatusCommand): Promise<CommandResult<Shipment>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.shipmentId?.trim()) {
        errors.push("Shipment ID is required");
      }

      if (!command.status?.trim()) {
        errors.push("Status is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure("Validation failed", errors);
      }

      // Validate status format
      let shipmentStatus: ShipmentStatus;
      try {
        shipmentStatus = ShipmentStatus.create(command.status);
      } catch (error) {
        return CommandResult.failure(error instanceof Error ? error.message : "Invalid status");
      }

      const shipment = await this.shipmentService.updateShipmentStatus(
        command.shipmentId,
        shipmentStatus,
      );

      return CommandResult.success(shipment);
    } catch (error) {
      return CommandResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
