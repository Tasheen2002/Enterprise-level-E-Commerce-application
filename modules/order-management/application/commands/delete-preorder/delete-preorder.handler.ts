import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { DeletePreorderCommand } from "./delete-preorder.command";
import { PreorderManagementService } from "../../services/preorder-management.service";
import { PreorderNotFoundError } from "../../../domain/errors/order-management.errors";

export class DeletePreorderCommandHandler implements ICommandHandler<
  DeletePreorderCommand,
  CommandResult<void>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(command: DeletePreorderCommand): Promise<CommandResult<void>> {
    try {
      await this.preorderService.deletePreorder(command.orderItemId);

      return CommandResult.success(undefined);
    } catch (error) {
      if (error instanceof PreorderNotFoundError) {
        return CommandResult.failure<void>(error.message);
      }

      return CommandResult.failure<void>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting preorder",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
