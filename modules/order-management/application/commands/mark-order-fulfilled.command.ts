import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { Order, OrderDTO } from "../../domain/entities/order.entity";

export interface MarkOrderFulfilledCommand extends ICommand {
  orderId: string;
}


export class MarkOrderFulfilledCommandHandler implements ICommandHandler<
  MarkOrderFulfilledCommand,
  CommandResult<OrderDTO>
> {
  constructor(private orderService: OrderManagementService) {}

  async handle(
    command: MarkOrderFulfilledCommand,
  ): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.markOrderAsFulfilled(
        command.orderId,
      );

      return CommandResult.success(Order.toDTO(order));
  }
}
