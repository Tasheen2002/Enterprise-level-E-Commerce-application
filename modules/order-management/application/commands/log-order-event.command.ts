import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderEventService } from "../services/order-event.service";
import { OrderEvent, OrderEventDTO } from "../../domain/entities/order-event.entity";

export interface LogOrderEventCommand extends ICommand {
  orderId: string;
  eventType: string;
  payload?: Record<string, unknown>;
}


export class LogOrderEventCommandHandler implements ICommandHandler<
  LogOrderEventCommand,
  CommandResult<OrderEventDTO>
> {
  constructor(private orderEventService: OrderEventService) {}

  async handle(
    command: LogOrderEventCommand,
  ): Promise<CommandResult<OrderEventDTO>> {
    const event = await this.orderEventService.logEvent({
        orderId: command.orderId,
        eventType: command.eventType,
        payload: command.payload || {},
      });

      return CommandResult.success(OrderEvent.toDTO(event));
  }
}
