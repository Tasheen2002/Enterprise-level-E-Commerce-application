import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { LogOrderEventCommand } from "./log-order-event.command";
import { OrderEventService } from "../services/order-event.service";
import { OrderEvent } from "../../domain/entities/order-event.entity";

export class LogOrderEventCommandHandler implements ICommandHandler<
  LogOrderEventCommand,
  CommandResult<OrderEvent>
> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(
    command: LogOrderEventCommand,
  ): Promise<CommandResult<OrderEvent>> {
    try {
      const event = await this.orderEventService.logEvent({
        orderId: command.orderId,
        eventType: command.eventType,
        payload: command.payload || {},
      });

      return CommandResult.success(event);
    } catch (error) {
      return CommandResult.failure<OrderEvent>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while logging order event",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
