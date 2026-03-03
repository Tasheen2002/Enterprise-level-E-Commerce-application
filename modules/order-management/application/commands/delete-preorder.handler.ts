import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { DeletePreorderCommand } from "./delete-preorder.command";
import { PreorderManagementService } from "../services/preorder-management.service";

export class DeletePreorderCommandHandler implements ICommandHandler<
  DeletePreorderCommand,
  CommandResult<boolean>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(
    command: DeletePreorderCommand,
  ): Promise<CommandResult<boolean>> {
    try {
      const deleted = await this.preorderService.deletePreorder(
        command.orderItemId,
      );

      if (!deleted) {
        return CommandResult.failure<boolean>(
          "Preorder not found or could not be deleted",
        );
      }

      return CommandResult.success(true);
    } catch (error) {
      return CommandResult.failure<boolean>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting preorder",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
