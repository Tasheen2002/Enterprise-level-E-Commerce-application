import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderEventService } from "../services/order-event.service";
import { OrderEventDTO } from "../../domain/entities/order-event.entity";

export interface LogOrderEventCommand extends ICommand {
  readonly orderId: string;
  readonly eventType: string;
  readonly payload?: Record<string, unknown>;
}

export class LogOrderEventHandler implements ICommandHandler<
  LogOrderEventCommand,
  CommandResult<OrderEventDTO>
> {
  constructor(private readonly orderEventService: OrderEventService) {}

  async handle(command: LogOrderEventCommand): Promise<CommandResult<OrderEventDTO>> {
    const event = await this.orderEventService.logEvent({
      orderId: command.orderId,
      eventType: command.eventType,
      payload: command.payload || {},
    });
    return CommandResult.success(event);
  }
}
