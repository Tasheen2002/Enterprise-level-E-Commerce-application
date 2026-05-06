import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderEventService } from "../services/order-event.service";
import { OrderEventDTO } from "../../domain/entities/order-event.entity";

export interface LogOrderEventCommand extends ICommand {
  readonly orderId: string;
  readonly eventType: string;
  readonly payload?: Record<string, unknown>;
  // Required at the API boundary — every API-logged event must record who
  // logged it (route is staff-gated, so request.user.userId is always set).
  // Internal/system callers go through OrderEventService.logEvent directly
  // and may omit it.
  readonly loggedBy: string;
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
      payload: command.payload,
      loggedBy: command.loggedBy,
    });
    return CommandResult.success(event);
  }
}
