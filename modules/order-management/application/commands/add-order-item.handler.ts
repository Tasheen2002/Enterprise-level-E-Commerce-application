import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { AddOrderItemCommand } from "./add-order-item.command";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";

export class AddOrderItemCommandHandler implements ICommandHandler<
  AddOrderItemCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: AddOrderItemCommand): Promise<CommandResult<Order>> {
    try {
      const order = await this.orderService.addOrderItem({
        orderId: command.orderId,
        variantId: command.variantId,
        quantity: command.quantity,
        isGift: command.isGift,
        giftMessage: command.giftMessage,
      });

      return CommandResult.success(order);
    } catch (error) {
      return CommandResult.failure<Order>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while adding order item",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
