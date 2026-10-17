import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ReturnItemService } from "../services/return-item.service.js";
import { ItemCondition, ItemDisposition } from "../../domain/value-objects/index.js";

export interface AddReturnItemCommand extends ICommand {
  rmaId: string;
  orderItemId: string;
  quantity: number;
  condition?: string;
  disposition?: string;
  fees?: number;
  currency?: string;
}

export interface ReturnItemResult {
  rmaId: string;
  orderItemId: string;
  quantity: number;
  condition?: string;
  disposition?: string;
  fees?: number;
  currency?: string;
}

export class AddReturnItemHandler
  implements ICommandHandler<AddReturnItemCommand, CommandResult<ReturnItemResult>>
{
  constructor(private readonly returnItemService: ReturnItemService) {}

  async handle(command: AddReturnItemCommand): Promise<CommandResult<ReturnItemResult>> {
    try {
      if (!command.rmaId) {
        return CommandResult.failure<ReturnItemResult>("RMA ID is required", ["rmaId"]);
      }
      if (!command.orderItemId) {
        return CommandResult.failure<ReturnItemResult>("Order Item ID is required", [
          "orderItemId",
        ]);
      }
      if (!command.quantity || command.quantity <= 0) {
        return CommandResult.failure<ReturnItemResult>("Quantity must be greater than 0", [
          "quantity",
        ]);
      }

      const item = await this.returnItemService.createItem({
        rmaId: command.rmaId,
        orderItemId: command.orderItemId,
        quantity: command.quantity,
        condition: command.condition ? ItemCondition.fromString(command.condition) : undefined,
        disposition: command.disposition
          ? ItemDisposition.fromString(command.disposition)
          : undefined,
        fees: command.fees,
        currency: command.currency,
      });

      const result: ReturnItemResult = {
        rmaId: item.getRmaId(),
        orderItemId: item.getOrderItemId(),
        quantity: item.getQuantity(),
        condition: item.getCondition()?.getValue(),
        disposition: item.getDisposition()?.getValue(),
        fees: item.getFees()?.getAmount(),
        currency: item.getFees()?.getCurrency(),
      };

      return CommandResult.success<ReturnItemResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<ReturnItemResult>("Failed to add return item", [
          error.message,
        ]);
      }

      return CommandResult.failure<ReturnItemResult>(
        "An unexpected error occurred while adding return item",
      );
    }
  }
}
