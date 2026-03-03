import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { UpdatePreorderReleaseDateCommand } from "./update-preorder-release-date.command";
import { PreorderManagementService } from "../services/preorder-management.service";
import { Preorder } from "../../domain/entities/preorder.entity";

export class UpdatePreorderReleaseDateCommandHandler implements ICommandHandler<
  UpdatePreorderReleaseDateCommand,
  CommandResult<Preorder>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(
    command: UpdatePreorderReleaseDateCommand,
  ): Promise<CommandResult<Preorder>> {
    try {
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
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating preorder release date",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
