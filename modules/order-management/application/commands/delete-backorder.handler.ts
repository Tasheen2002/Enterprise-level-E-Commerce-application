import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { DeleteBackorderCommand } from "./delete-backorder.command";
import { BackorderManagementService } from "../services/backorder-management.service";

export class DeleteBackorderCommandHandler implements ICommandHandler<
  DeleteBackorderCommand,
  CommandResult<boolean>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(
    command: DeleteBackorderCommand,
  ): Promise<CommandResult<boolean>> {
    try {
      const deleted = await this.backorderService.deleteBackorder(
        command.orderItemId,
      );

      if (!deleted) {
        return CommandResult.failure<boolean>(
          "Backorder not found or could not be deleted",
        );
      }

      return CommandResult.success(true);
    } catch (error) {
      return CommandResult.failure<boolean>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting backorder",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
