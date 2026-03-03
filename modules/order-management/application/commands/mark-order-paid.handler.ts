import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { MarkOrderAsPaidCommand } from "./mark-order-paid.command";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";

export class MarkOrderAsPaidCommandHandler implements ICommandHandler<
  MarkOrderAsPaidCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: MarkOrderAsPaidCommand): Promise<CommandResult<Order>> {
    try {
      const order = await this.orderService.markOrderAsPaid(command.orderId);

      if (!order) {
        return CommandResult.failure<Order>("Order not found");
      }

      return CommandResult.success(order);
    } catch (error) {
      return CommandResult.failure<Order>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while marking order as paid",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
