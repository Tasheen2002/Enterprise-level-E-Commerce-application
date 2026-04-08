import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { MarkOrderAsFulfilledCommand } from "./mark-order-fulfilled.command";
import { OrderManagementService } from "../../services/order-management.service";
import { Order } from "../../../domain/entities/order.entity";

export class MarkOrderAsFulfilledCommandHandler implements ICommandHandler<
  MarkOrderAsFulfilledCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: MarkOrderAsFulfilledCommand,
  ): Promise<CommandResult<Order>> {
    try {
      const order = await this.orderService.markOrderAsFulfilled(
        command.orderId,
      );

      return CommandResult.success(order);
    } catch (error) {
      return CommandResult.failure<Order>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while marking order as fulfilled",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
