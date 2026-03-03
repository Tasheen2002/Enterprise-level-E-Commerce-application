import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { OrderEventService } from "../services/order-event.service";
import { OrderEvent } from "../../domain/entities/order-event.entity";

export interface LogOrderEventCommand extends ICommand {
  orderId: string;
  eventType: string;
  payload?: Record<string, any>;
}

export class LogOrderEventCommandHandler implements ICommandHandler<
  LogOrderEventCommand,
  CommandResult<OrderEvent>
> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(
    command: LogOrderEventCommand,
  ): Promise<CommandResult<OrderEvent>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderId || command.orderId.trim().length === 0) {
        errors.push("orderId: Order ID is required");
      }

      if (!command.eventType || command.eventType.trim().length === 0) {
        errors.push("eventType: Event type is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<OrderEvent>("Validation failed", errors);
      }

      // Execute service
      const event = await this.orderEventService.logEvent({
        orderId: command.orderId,
        eventType: command.eventType,
        payload: command.payload || {},
      });

      return CommandResult.success(event);
    } catch (error) {
      return CommandResult.failure<OrderEvent>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

// Alias for backwards compatibility
export { LogOrderEventCommandHandler as LogOrderEventHandler };
