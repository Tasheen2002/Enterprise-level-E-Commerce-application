import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface MarkOrderAsFulfilledCommand extends ICommand {
  orderId: string;
}

export class MarkOrderAsFulfilledCommandHandler implements ICommandHandler<
  MarkOrderAsFulfilledCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: MarkOrderAsFulfilledCommand,
  ): Promise<CommandResult<Order>> {
    try {
      // Validation
      if (!command.orderId || command.orderId.trim().length === 0) {
        return CommandResult.failure<Order>("Order ID is required", [
          "orderId: Order ID cannot be empty",
        ]);
      }

      // Execute service
      const order = await this.orderService.markOrderAsFulfilled(
        command.orderId,
      );

      if (!order) {
        return CommandResult.failure<Order>("Order not found", [
          "orderId: Order does not exist",
        ]);
      }

      return CommandResult.success(order);
    } catch (error) {
      return CommandResult.failure<Order>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
