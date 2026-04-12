import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { Order, OrderDTO } from "../../domain/entities/order.entity";

export interface CancelOrderCommand extends ICommand {
  orderId: string;
}


export class CancelOrderCommandHandler implements ICommandHandler<
  CancelOrderCommand,
  CommandResult<OrderDTO>
> {
  constructor(private orderService: OrderManagementService) {}

  async handle(command: CancelOrderCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.cancelOrder(command.orderId);

      return CommandResult.success(Order.toDTO(order));
  }
}
