import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CancelOrderCommand } from "./cancel-order.command";
import { OrderManagementService } from "../../services/order-management.service";
import { Order } from "../../../domain/entities/order.entity";

export class CancelOrderCommandHandler implements ICommandHandler<
  CancelOrderCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: CancelOrderCommand): Promise<CommandResult<Order>> {
    try {
      const order = await this.orderService.cancelOrder(command.orderId);

      return CommandResult.success(order);
    } catch (error) {
      return CommandResult.failure<Order>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while cancelling order",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
