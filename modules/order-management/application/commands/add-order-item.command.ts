import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";

export interface AddOrderItemCommand extends ICommand {
  orderId: string;
  variantId: string;
  quantity: number;
  isGift?: boolean;
  giftMessage?: string;
}

export class AddOrderItemCommandHandler implements ICommandHandler<
  AddOrderItemCommand,
  CommandResult<OrderDTO>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: AddOrderItemCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.addOrderItem(command.orderId, {
      variantId: command.variantId,
      quantity: command.quantity,
      isGift: command.isGift,
      giftMessage: command.giftMessage,
    });
    return CommandResult.success(order);
  }
}
