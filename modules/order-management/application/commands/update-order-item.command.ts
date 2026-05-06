import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";

export interface UpdateOrderItemCommand extends ICommand {
  readonly orderId: string;
  readonly itemId: string;
  readonly requestingUserId: string;
  readonly isStaff: boolean;
  readonly quantity?: number;
  readonly isGift?: boolean;
  readonly giftMessage?: string;
}

export class UpdateOrderItemHandler implements ICommandHandler<
  UpdateOrderItemCommand,
  CommandResult<OrderDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: UpdateOrderItemCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.updateOrderItem({
      orderId: command.orderId,
      itemId: command.itemId,
      quantity: command.quantity,
      isGift: command.isGift,
      giftMessage: command.giftMessage,
      requestingUserId: command.requestingUserId,
      isStaff: command.isStaff,
    });
    return CommandResult.success(order);
  }
}
