import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdateOrderStatusCommand } from "./update-order-status.command";
import { OrderManagementService } from "../../services/order-management.service";
import { Order } from "../../../domain/entities/order.entity";

export class UpdateOrderStatusCommandHandler implements ICommandHandler<
  UpdateOrderStatusCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateOrderStatusCommand,
  ): Promise<CommandResult<Order>> {
    try {
      const order = await this.orderService.updateOrderStatus(
        command.orderId,
        command.status,
      );

      return CommandResult.success(order);
    } catch (error) {
      return CommandResult.failure<Order>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating order status",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
