import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreateOrderCommand } from "./create-order.command";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";

export class CreateOrderCommandHandler implements ICommandHandler<
  CreateOrderCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: CreateOrderCommand): Promise<CommandResult<Order>> {
    try {
      const order = await this.orderService.createOrder({
        userId: command.userId,
        guestToken: command.guestToken,
        items: command.items,
        source: command.source || "web",
        currency: command.currency || "USD",
      });

      return CommandResult.success(order);
    } catch (error) {
      return CommandResult.failure<Order>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating order",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

// Alias for backwards compatibility (used by order.controller.ts)
export { CreateOrderCommandHandler as CreateOrderHandler };
