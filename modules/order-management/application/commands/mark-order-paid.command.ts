import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";

export interface MarkOrderPaidCommand extends ICommand {
  readonly orderId: string;
  readonly changedBy?: string;
}

export class MarkOrderPaidHandler implements ICommandHandler<
  MarkOrderPaidCommand,
  CommandResult<OrderDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: MarkOrderPaidCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.markOrderAsPaid(command.orderId, command.changedBy);
    return CommandResult.success(order);
  }
}
