import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { MarkPreorderNotifiedCommand } from "./mark-preorder-notified.command";
import { PreorderManagementService } from "../services/preorder-management.service";
import { Preorder } from "../../domain/entities/preorder.entity";

export class MarkPreorderNotifiedCommandHandler implements ICommandHandler<
  MarkPreorderNotifiedCommand,
  CommandResult<Preorder>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(
    command: MarkPreorderNotifiedCommand,
  ): Promise<CommandResult<Preorder>> {
    try {
      const preorder = await this.preorderService.markAsNotified(
        command.orderItemId,
      );

      if (!preorder) {
        return CommandResult.failure<Preorder>("Preorder not found");
      }

      return CommandResult.success(preorder);
    } catch (error) {
      return CommandResult.failure<Preorder>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while marking preorder as notified",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
