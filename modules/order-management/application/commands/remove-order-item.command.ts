import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";

export interface RemoveOrderItemCommand extends ICommand {
  orderId: string;
  itemId: string;
}

export class RemoveOrderItemCommandHandler implements ICommandHandler<
  RemoveOrderItemCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: RemoveOrderItemCommand): Promise<CommandResult<Order>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderId || command.orderId.trim().length === 0) {
        errors.push("orderId: Order ID is required");
      }

      if (!command.itemId || command.itemId.trim().length === 0) {
        errors.push("itemId: Item ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<Order>("Validation failed", errors);
      }

      // Execute service
      const order = await this.orderService.removeOrderItem({
        orderId: command.orderId,
        itemId: command.itemId,
      });

      return CommandResult.success(order);
    } catch (error) {
      return CommandResult.failure<Order>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
