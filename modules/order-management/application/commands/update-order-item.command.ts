import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { Order, OrderDTO } from "../../domain/entities/order.entity";

export interface UpdateOrderItemCommand extends ICommand {
  orderId: string;
  itemId: string;
  quantity?: number;
  isGift?: boolean;
  giftMessage?: string;
}


export class UpdateOrderItemCommandHandler implements ICommandHandler<
  UpdateOrderItemCommand,
  CommandResult<OrderDTO>
> {
  constructor(private orderService: OrderManagementService) {}

  async handle(command: UpdateOrderItemCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.updateOrderItem({
        orderId: command.orderId,
        itemId: command.itemId,
        quantity: command.quantity,
        isGift: command.isGift,
        giftMessage: command.giftMessage,
      });

      return CommandResult.success(Order.toDTO(order));
  }
}
