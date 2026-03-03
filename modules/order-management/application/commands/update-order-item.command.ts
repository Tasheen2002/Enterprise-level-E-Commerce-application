import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";
import { ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH } from "../../domain/constants";

export interface UpdateOrderItemCommand extends ICommand {
  orderId: string;
  itemId: string;
  quantity?: number;
  isGift?: boolean;
  giftMessage?: string;
}

export class UpdateOrderItemCommandHandler implements ICommandHandler<
  UpdateOrderItemCommand,
  CommandResult<Order>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(command: UpdateOrderItemCommand): Promise<CommandResult<Order>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderId || command.orderId.trim().length === 0) {
        errors.push("orderId: Order ID is required");
      }

      if (!command.itemId || command.itemId.trim().length === 0) {
        errors.push("itemId: Item ID is required");
      }

      if (command.quantity !== undefined && command.quantity <= 0) {
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

      // At least one field must be provided for update
      if (
        command.quantity === undefined &&
        command.isGift === undefined &&
        command.giftMessage === undefined
      ) {
        errors.push(
          "At least one field (quantity, isGift, or giftMessage) must be provided",
        );
      }

      if (errors.length > 0) {
        return CommandResult.failure<Order>("Validation failed", errors);
      }

      // Execute service
      const order = await this.orderService.updateOrderItem({
        orderId: command.orderId,
        itemId: command.itemId,
        quantity: command.quantity,
        isGift: command.isGift,
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

export { UpdateOrderItemCommandHandler as UpdateOrderItemHandler };
