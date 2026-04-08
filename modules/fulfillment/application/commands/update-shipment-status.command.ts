import { ShipmentService } from "../services/shipment.service";
import { Shipment } from "../../domain/entities/shipment.entity";
import { ShipmentStatus } from "../../domain/value-objects";

// Base interfaces
export interface ICommand {
  readonly commandId?: string;
  readonly timestamp?: Date;
}

export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

export class CommandResult<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string,
    public errors?: string[]
  ) {}

  static success<T>(data?: T): CommandResult<T> {
    return new CommandResult(true, data);
  }

  static failure<T>(error: string, errors?: string[]): CommandResult<T> {
    return new CommandResult<T>(false, undefined, error, errors);
  }
}

export interface UpdateShipmentStatusCommand extends ICommand {
  shipmentId: string;
  status: string;
}

export class UpdateShipmentStatusCommandHandler
  implements
    ICommandHandler<UpdateShipmentStatusCommand, CommandResult<Shipment>>
{
  constructor(private readonly shipmentService: ShipmentService) {}

  async handle(
    command: UpdateShipmentStatusCommand
  ): Promise<CommandResult<Shipment>> {
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
        return CommandResult.failure(
          error instanceof Error ? error.message : "Invalid status"
        );
      }

      const shipment = await this.shipmentService.updateShipmentStatus(
        command.shipmentId,
        shipmentStatus
      );

      return CommandResult.success(shipment);
    } catch (error) {
      return CommandResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
}
