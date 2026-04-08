import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { DeleteBackorderCommand } from "./delete-backorder.command";
import { BackorderManagementService } from "../../services/backorder-management.service";
import { BackorderNotFoundError } from "../../../domain/errors/order-management.errors";

export class DeleteBackorderCommandHandler implements ICommandHandler<
  DeleteBackorderCommand,
  CommandResult<void>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(command: DeleteBackorderCommand): Promise<CommandResult<void>> {
    try {
      await this.backorderService.deleteBackorder(command.orderItemId);

      return CommandResult.success(undefined);
    } catch (error) {
      if (error instanceof BackorderNotFoundError) {
        return CommandResult.failure<void>(error.message);
      }

      return CommandResult.failure<void>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting backorder",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
