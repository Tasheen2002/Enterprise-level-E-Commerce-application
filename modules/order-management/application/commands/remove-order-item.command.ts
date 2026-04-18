import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";

export interface RemoveOrderItemCommand extends ICommand {
  readonly orderId: string;
  readonly itemId: string;
}

export class RemoveOrderItemHandler implements ICommandHandler<
  RemoveOrderItemCommand,
  CommandResult<OrderDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: RemoveOrderItemCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.removeOrderItem(command.orderId, command.itemId);
    return CommandResult.success(order);
  }
}
