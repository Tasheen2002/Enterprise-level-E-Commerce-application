import { OrderManagementService } from "../services/order-management.service";
import { OrderShipment } from "../../domain/entities/order-shipment.entity";

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
    public errors?: string[],
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
  trackingNumber?: string;
  giftReceipt?: boolean;
  pickupLocationId?: string;
}

export class CreateShipmentCommandHandler implements ICommandHandler<
  CreateShipmentCommand,
  CommandResult<OrderShipment>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: CreateShipmentCommand,
  ): Promise<CommandResult<OrderShipment>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderId || command.orderId.trim().length === 0) {
        errors.push("orderId: Order ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<OrderShipment>(
          "Validation failed",
          errors,
        );
      }

      // Execute service
      const shipment = await this.orderService.createShipment({
        orderId: command.orderId,
        carrier: command.carrier,
        service: command.service,
        trackingNumber: command.trackingNumber,
        giftReceipt: command.giftReceipt ?? false,
        pickupLocationId: command.pickupLocationId,
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
export { CreateShipmentCommandHandler as CreateShipmentHandler };
