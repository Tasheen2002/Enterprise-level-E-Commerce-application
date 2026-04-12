import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { OrderManagementService } from "../services/order-management.service";
import { Order, OrderDTO } from "../../domain/entities/order.entity";

export interface CreateOrderCommand extends ICommand {
  userId?: string;
  guestToken?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    isGift?: boolean;
    giftMessage?: string;
  }>;
  source?: string;
  currency?: string;
}

export class CreateOrderCommandHandler implements ICommandHandler<
  CreateOrderCommand,
  CommandResult<OrderDTO>
> {
  constructor(private orderService: OrderManagementService) {}

  async handle(command: CreateOrderCommand): Promise<CommandResult<OrderDTO>> {
    const order = await this.orderService.createOrder({
        userId: command.userId,
        guestToken: command.guestToken,
        items: command.items,
        source: command.source || "web",
        currency: command.currency || "USD",
      });

      return CommandResult.success(Order.toDTO(order));
  }
}
