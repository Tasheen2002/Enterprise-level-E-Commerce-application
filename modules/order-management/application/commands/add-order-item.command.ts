import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";
import { ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH } from "../../domain/constants";

export interface AddOrderItemCommand extends ICommand {
  orderId: string;
  variantId: string;
  quantity: number;
  isGift?: boolean;
  giftMessage?: string;
}

export class AddOrderItemCommandHandler implements ICommandHandler<
  AddOrderItemCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: AddOrderItemCommand): Promise<CommandResult<Order>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderId || command.orderId.trim().length === 0) {
        errors.push("orderId: Order ID is required");
      }

      if (!command.variantId || command.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (!command.quantity || command.quantity <= 0) {
        errors.push("quantity: Quantity must be greater than 0");
      }

      if (
        command.isGift &&
        command.giftMessage &&
        command.giftMessage.length > ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH
      ) {
        errors.push(
          `giftMessage: Gift message cannot exceed ${ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH} characters`,
        );
      }

      if (errors.length > 0) {
        return CommandResult.failure<Order>("Validation failed", errors);
      }

      // Execute service
      const order = await this.orderService.addOrderItem({
        orderId: command.orderId,
        variantId: command.variantId,
        quantity: command.quantity,
        isGift: command.isGift || false,
        giftMessage: command.giftMessage,
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

export { AddOrderItemCommandHandler as AddOrderItemHandler };
