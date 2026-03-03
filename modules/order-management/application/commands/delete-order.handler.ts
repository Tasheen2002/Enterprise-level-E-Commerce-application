import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { DeleteOrderCommand } from "./delete-order.command";
import { OrderManagementService } from "../services/order-management.service";

export class DeleteOrderCommandHandler implements ICommandHandler<
  DeleteOrderCommand,
  CommandResult<boolean>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: DeleteOrderCommand): Promise<CommandResult<boolean>> {
    try {
      const deleted = await this.orderService.deleteOrder(command.orderId);

      if (!deleted) {
        return CommandResult.failure<boolean>(
          "Order not found or could not be deleted",
        );
      }

      return CommandResult.success(true);
    } catch (error) {
      return CommandResult.failure<boolean>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting order",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
