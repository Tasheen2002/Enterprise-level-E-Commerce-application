import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { BackorderManagementService } from "../services/backorder-management.service";

export interface DeleteBackorderCommand extends ICommand {
  orderItemId: string;
}

export class DeleteBackorderCommandHandler implements ICommandHandler<
  DeleteBackorderCommand,
  CommandResult<boolean>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(
    command: DeleteBackorderCommand,
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
      const deleted = await this.backorderService.deleteBackorder(
        command.orderItemId,
      );

      if (!deleted) {
        return CommandResult.failure<boolean>("Backorder not found");
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
export { DeleteBackorderCommandHandler as DeleteBackorderHandler };
