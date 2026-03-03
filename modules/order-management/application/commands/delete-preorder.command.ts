import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PreorderManagementService } from "../services/preorder-management.service";

export interface DeletePreorderCommand extends ICommand {
  orderItemId: string;
}

export class DeletePreorderCommandHandler implements ICommandHandler<
  DeletePreorderCommand,
  CommandResult<boolean>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(
    command: DeletePreorderCommand,
  ): Promise<CommandResult<boolean>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderItemId || command.orderItemId.trim().length === 0) {
        errors.push("orderItemId: Order item ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<boolean>("Validation failed", errors);
      }

      // Execute service
      const deleted = await this.preorderService.deletePreorder(
        command.orderItemId,
      );

      if (!deleted) {
        return CommandResult.failure<boolean>("Preorder not found");
      }

      return CommandResult.success(true);
    } catch (error) {
      return CommandResult.failure<boolean>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

// Alias for backwards compatibility
export { DeletePreorderCommandHandler as DeletePreorderHandler };
