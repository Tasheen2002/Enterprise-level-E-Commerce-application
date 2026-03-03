import { OrderManagementService } from "../services/order-management.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface DeleteOrderCommand extends ICommand {
  orderId: string;
}

export class DeleteOrderCommandHandler implements ICommandHandler<
  DeleteOrderCommand,
  CommandResult<boolean>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: DeleteOrderCommand): Promise<CommandResult<boolean>> {
    try {
      // Validation
      if (!command.orderId || command.orderId.trim().length === 0) {
        return CommandResult.failure<boolean>("Order ID is required", [
          "orderId: Order ID cannot be empty",
        ]);
      }

      // Execute service
      const deleted = await this.orderService.deleteOrder(command.orderId);

      if (!deleted) {
        return CommandResult.failure<boolean>("Order not found", [
          "orderId: Order does not exist",
        ]);
      }

      return CommandResult.success(true);
    } catch (error) {
      return CommandResult.failure<boolean>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
