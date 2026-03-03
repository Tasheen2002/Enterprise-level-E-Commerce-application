import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { BackorderManagementService } from "../services/backorder-management.service";
import { Backorder } from "../../domain/entities/backorder.entity";

export interface MarkBackorderNotifiedCommand extends ICommand {
  orderItemId: string;
}

export class MarkBackorderNotifiedCommandHandler implements ICommandHandler<
  MarkBackorderNotifiedCommand,
  CommandResult<Backorder>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(
    command: MarkBackorderNotifiedCommand,
  ): Promise<CommandResult<Backorder>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderItemId || command.orderItemId.trim().length === 0) {
        errors.push("orderItemId: Order item ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<Backorder>("Validation failed", errors);
      }

      // Execute service
      const backorder = await this.backorderService.markAsNotified(
        command.orderItemId,
      );

      if (!backorder) {
        return CommandResult.failure<Backorder>("Backorder not found");
      }

      return CommandResult.success(backorder);
    } catch (error) {
      return CommandResult.failure<Backorder>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

// Alias for backwards compatibility
export { MarkBackorderNotifiedCommandHandler as MarkBackorderNotifiedHandler };
