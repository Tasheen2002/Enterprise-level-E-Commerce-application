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

export interface CreateShipmentCommand extends ICommand {
  orderId: string;
  carrier?: string;
  service?: string;
  labelUrl?: string;
  isGift?: boolean;
  giftMessage?: string;
  items?: Array<{
    orderItemId: string;
    qty: number;
  }>;
}

export class CreateShipmentCommandHandler
  implements ICommandHandler<CreateShipmentCommand, CommandResult<Shipment>>
{
  constructor(private readonly shipmentService: ShipmentService) {}

  async handle(
    command: CreateShipmentCommand
  ): Promise<CommandResult<Shipment>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderId?.trim()) {
        errors.push("Order ID is required");
      }

      if (command.items) {
        for (const item of command.items) {
          if (!item.orderItemId?.trim()) {
            errors.push("Order item ID is required for all items");
          }
          if (!item.qty || item.qty <= 0) {
            errors.push("Item quantity must be greater than 0");
          }
        }
      }

      if (errors.length > 0) {
        return CommandResult.failure("Validation failed", errors);
      }

      const shipment = await this.shipmentService.createShipment({
        orderId: command.orderId,
        carrier: command.carrier,
        service: command.service,
        labelUrl: command.labelUrl,
        isGift: command.isGift,
        giftMessage: command.giftMessage,
        items: command.items,
      });

      return CommandResult.success(shipment);
    } catch (error) {
      return CommandResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
}
