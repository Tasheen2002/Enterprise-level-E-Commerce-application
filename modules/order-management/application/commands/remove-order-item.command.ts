import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { Order, OrderDTO } from "../../domain/entities/order.entity";

export interface RemoveOrderItemCommand extends ICommand {
  orderId: string;
  itemId: string;
}


export class RemoveOrderItemCommandHandler implements ICommandHandler<
  RemoveOrderItemCommand,
  CommandResult<OrderDTO>
> {
  constructor(private orderService: OrderManagementService) {}

  async handle(command: RemoveOrderItemCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.removeOrderItem({
        orderId: command.orderId,
        itemId: command.itemId,
      });

      return CommandResult.success(Order.toDTO(order));
  }
}
