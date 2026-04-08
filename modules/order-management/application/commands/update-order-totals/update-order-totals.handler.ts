import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdateOrderTotalsCommand } from "./update-order-totals.command";
import { OrderManagementService } from "../../services/order-management.service";
import { Order } from "../../../domain/entities/order.entity";

export class UpdateOrderTotalsCommandHandler implements ICommandHandler<
  UpdateOrderTotalsCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateOrderTotalsCommand,
  ): Promise<CommandResult<Order>> {
    try {
      const order = await this.orderService.updateOrderTotals(
        command.orderId,
        command.totals,
      );

      return CommandResult.success(order);
    } catch (error) {
      return CommandResult.failure<Order>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating order totals",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
