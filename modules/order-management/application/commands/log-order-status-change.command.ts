import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderStatusHistoryDTO } from "../../domain/entities/order-status-history.entity";

export interface LogOrderStatusChangeCommand extends ICommand {
  readonly orderId: string;
  readonly toStatus: string;
  // Required at the API boundary — every API-logged status change must record
  // who logged it (route is staff-gated; controller derives from session).
  // Internal callers (sagas, system events) pass "system" or a service id.
  readonly changedBy: string;
}

export class LogOrderStatusChangeHandler implements ICommandHandler<
  LogOrderStatusChangeCommand,
  CommandResult<OrderStatusHistoryDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: LogOrderStatusChangeCommand): Promise<CommandResult<OrderStatusHistoryDTO>> {
    const history = await this.orderService.logOrderStatusChange({
      orderId: command.orderId,
      toStatus: command.toStatus,
      changedBy: command.changedBy,
    });
    return CommandResult.success(history);
  }
}
