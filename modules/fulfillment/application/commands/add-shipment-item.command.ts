import { ShipmentService } from "../services/shipment.service";
import { Shipment } from "../../domain/entities/shipment.entity";

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

export interface AddShipmentItemCommand extends ICommand {
  shipmentId: string;
  orderItemId: string;
  qty: number;
}

export class AddShipmentItemCommandHandler
  implements ICommandHandler<AddShipmentItemCommand, CommandResult<Shipment>>
{
  constructor(private readonly shipmentService: ShipmentService) {}

  async handle(
    command: AddShipmentItemCommand
  ): Promise<CommandResult<Shipment>> {
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

      const shipment = await this.shipmentService.addShipmentItem(
        command.shipmentId,
        {
          orderItemId: command.orderItemId,
          qty: command.qty,
        }
      );

      return CommandResult.success(shipment);
    } catch (error) {
      return CommandResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
}
