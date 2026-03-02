import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface UpdateOrderTotalsCommand extends ICommand {
  orderId: string;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
}

export class UpdateOrderTotalsCommandHandler implements ICommandHandler<
  UpdateOrderTotalsCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    command: UpdateOrderTotalsCommand,
  ): Promise<CommandResult<Order>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderId || command.orderId.trim().length === 0) {
        errors.push("orderId: Order ID cannot be empty");
      }

      if (!command.totals) {
        errors.push("totals: Totals are required");
      } else {
        if (
          command.totals.subtotal === undefined ||
          command.totals.subtotal < 0
        ) {
          errors.push("totals.subtotal: Must be a non-negative number");
        }

        if (
          command.totals.discount === undefined ||
          command.totals.discount < 0
        ) {
          errors.push("totals.discount: Must be a non-negative number");
        }

        if (command.totals.tax === undefined || command.totals.tax < 0) {
          errors.push("totals.tax: Must be a non-negative number");
        }

        if (
          command.totals.shipping === undefined ||
          command.totals.shipping < 0
        ) {
          errors.push("totals.shipping: Must be a non-negative number");
        }

        if (command.totals.total === undefined || command.totals.total < 0) {
          errors.push("totals.total: Must be a non-negative number");
        }

        // Validate total calculation
        const calculatedTotal =
          command.totals.subtotal +
          command.totals.tax +
          command.totals.shipping -
          command.totals.discount;

        if (Math.abs(calculatedTotal - command.totals.total) > 0.01) {
          errors.push(
            `totals.total: Total (${command.totals.total}) does not match calculated total (${calculatedTotal.toFixed(2)})`,
          );
        }
      }

      if (errors.length > 0) {
        return CommandResult.failure<Order>("Validation failed", errors);
      }

      // Execute service
      const order = await this.orderService.updateOrderTotals(
        command.orderId,
        command.totals,
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
