import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdateOrderItemCommand } from "./update-order-item.command";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";

export class UpdateOrderItemCommandHandler implements ICommandHandler<
  UpdateOrderItemCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: UpdateOrderItemCommand): Promise<CommandResult<Order>> {
    try {
      const order = await this.orderService.updateOrderItem({
        orderId: command.orderId,
        itemId: command.itemId,
        quantity: command.quantity,
        isGift: command.isGift,
        giftMessage: command.giftMessage,
      });

      return CommandResult.success(order);
    } catch (error) {
      return CommandResult.failure<Order>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating order item",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
