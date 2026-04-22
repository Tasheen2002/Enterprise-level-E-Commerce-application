import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { OrderDTO } from "../../domain/entities/order.entity";

export interface AddOrderItemCommand extends ICommand {
  readonly orderId: string;
  readonly variantId: string;
  readonly quantity: number;
  readonly isGift?: boolean;
  readonly giftMessage?: string;
}

export class AddOrderItemHandler implements ICommandHandler<
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
