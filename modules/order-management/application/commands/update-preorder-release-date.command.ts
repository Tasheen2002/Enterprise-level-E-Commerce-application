import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PreorderManagementService } from "../services/preorder-management.service";
import { Preorder } from "../../domain/entities/preorder.entity";

export interface UpdatePreorderReleaseDateCommand extends ICommand {
  orderItemId: string;
  releaseDate: Date;
}

export class UpdatePreorderReleaseDateCommandHandler implements ICommandHandler<
  UpdatePreorderReleaseDateCommand,
  CommandResult<Preorder>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(
    command: UpdatePreorderReleaseDateCommand,
  ): Promise<CommandResult<Preorder>> {
    try {
      const errors: string[] = [];

      // Validation
      if (!command.orderItemId || command.orderItemId.trim().length === 0) {
        errors.push("orderItemId: Order item ID is required");
      }

      if (!command.releaseDate) {
        errors.push("releaseDate: Release date is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<Preorder>("Validation failed", errors);
      }

      // Execute service
      const preorder = await this.preorderService.updateReleaseDate(
        command.orderItemId,
        command.releaseDate,
      );

      if (!preorder) {
        return CommandResult.failure<Preorder>("Preorder not found");
      }

      return CommandResult.success(preorder);
    } catch (error) {
      return CommandResult.failure<Preorder>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

// Alias for backwards compatibility
export { UpdatePreorderReleaseDateCommandHandler as UpdatePreorderReleaseDateHandler };
