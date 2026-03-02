import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";
import { OrderStatusHistory } from "../../domain/entities/order-status-history.entity";

export interface LogOrderStatusChangeCommand extends ICommand {
  orderId: string;
  fromStatus?: string;
  toStatus: string;
  changedBy?: string;
}

export class LogOrderStatusChangeCommandHandler implements ICommandHandler<
  LogOrderStatusChangeCommand,
  CommandResult<OrderStatusHistory>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: LogOrderStatusChangeCommand,
  ): Promise<CommandResult<OrderStatusHistory>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderId || command.orderId.trim().length === 0) {
        errors.push("orderId: Order ID is required");
      }

      if (!command.toStatus || command.toStatus.trim().length === 0) {
        errors.push("toStatus: To status is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<OrderStatusHistory>(
          "Validation failed",
          errors,
        );
      }

      // Execute service
      const statusHistory = await this.orderService.logOrderStatusChange({
        orderId: command.orderId,
        fromStatus: command.fromStatus,
        toStatus: command.toStatus,
        changedBy: command.changedBy,
      });

      return CommandResult.success(statusHistory);
    } catch (error) {
      return CommandResult.failure<OrderStatusHistory>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

// Alias for backwards compatibility
export { LogOrderStatusChangeCommandHandler as LogOrderStatusChangeHandler };
