import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { RemoveOrderItemCommand } from "./remove-order-item.command";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";

export class RemoveOrderItemCommandHandler implements ICommandHandler<
  RemoveOrderItemCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: RemoveOrderItemCommand): Promise<CommandResult<Order>> {
    try {
      const order = await this.orderService.removeOrderItem({
        orderId: command.orderId,
        itemId: command.itemId,
      });

      return CommandResult.success(order);
    } catch (error) {
      return CommandResult.failure<Order>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while removing order item",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
