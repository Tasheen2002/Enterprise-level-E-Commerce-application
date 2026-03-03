import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { LogOrderStatusChangeCommand } from "./log-order-status-change.command";
import { OrderManagementService } from "../services/order-management.service";
import { OrderStatusHistory } from "../../domain/entities/order-status-history.entity";

export class LogOrderStatusChangeCommandHandler implements ICommandHandler<
  LogOrderStatusChangeCommand,
  CommandResult<OrderStatusHistory>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: LogOrderStatusChangeCommand,
  ): Promise<CommandResult<OrderStatusHistory>> {
    try {
      const history = await this.orderService.logOrderStatusChange({
        orderId: command.orderId,
        fromStatus: command.fromStatus,
        toStatus: command.toStatus,
        changedBy: command.changedBy,
      });

      return CommandResult.success(history);
    } catch (error) {
      return CommandResult.failure<OrderStatusHistory>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while logging status change",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
