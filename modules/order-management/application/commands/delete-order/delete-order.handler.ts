import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { DeleteOrderCommand } from "./delete-order.command";
import { OrderManagementService } from "../../services/order-management.service";
import { OrderNotFoundError } from "../../../domain/errors/order-management.errors";

export class DeleteOrderCommandHandler implements ICommandHandler<
  DeleteOrderCommand,
  CommandResult<void>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: DeleteOrderCommand): Promise<CommandResult<void>> {
    try {
      await this.orderService.deleteOrder(command.orderId);

      return CommandResult.success(undefined);
    } catch (error) {
      if (error instanceof OrderNotFoundError) {
        return CommandResult.failure<void>(error.message);
      }

      return CommandResult.failure<void>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting order",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
