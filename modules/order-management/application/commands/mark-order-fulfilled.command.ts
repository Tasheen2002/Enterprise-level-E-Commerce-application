import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";

export interface MarkOrderFulfilledCommand extends ICommand {
  readonly orderId: string;
}

export class MarkOrderFulfilledCommandHandler implements ICommandHandler<
  MarkOrderFulfilledCommand,
  CommandResult<OrderDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: MarkOrderFulfilledCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.markOrderAsFulfilled(command.orderId);
    return CommandResult.success(order);
  }
}
