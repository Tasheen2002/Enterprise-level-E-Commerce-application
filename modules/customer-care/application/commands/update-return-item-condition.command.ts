import {
  type ICommand,
  type ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import { ReturnItemService } from "../services/return-item.service.js";
import { ItemCondition } from "../../domain/value-objects/index.js";

export interface UpdateReturnItemConditionCommand extends ICommand {
  rmaId: string;
  orderItemId: string;
  condition: string;
}

export class UpdateReturnItemConditionHandler
  implements ICommandHandler<UpdateReturnItemConditionCommand, CommandResult<void>>
{
  constructor(private readonly returnItemService: ReturnItemService) {}

  async handle(command: UpdateReturnItemConditionCommand): Promise<CommandResult<void>> {
    try {
      if (!command.rmaId) {
        return CommandResult.failure<void>("RMA ID is required", ["rmaId"]);
      }
      if (!command.orderItemId) {
        return CommandResult.failure<void>("Order Item ID is required", ["orderItemId"]);
      }
      if (!command.condition) {
        return CommandResult.failure<void>("Condition is required", ["condition"]);
      }

      await this.returnItemService.updateItem(command.rmaId, command.orderItemId, {
        condition: ItemCondition.fromString(command.condition),
      });

      return CommandResult.success<void>();
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<void>("Failed to update return item condition", [
          error.message,
        ]);
      }

      return CommandResult.failure<void>(
        "An unexpected error occurred while updating return item condition",
      );
    }
  }
}
