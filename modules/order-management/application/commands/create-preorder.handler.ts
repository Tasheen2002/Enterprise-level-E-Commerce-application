import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreatePreorderCommand } from "./create-preorder.command";
import { PreorderManagementService } from "../services/preorder-management.service";
import { Preorder } from "../../domain/entities/preorder.entity";

export class CreatePreorderCommandHandler implements ICommandHandler<
  CreatePreorderCommand,
  CommandResult<Preorder>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(
    command: CreatePreorderCommand,
  ): Promise<CommandResult<Preorder>> {
    try {
      const preorder = await this.preorderService.createPreorder({
        orderItemId: command.orderItemId,
        releaseDate: command.releaseDate,
      });

      return CommandResult.success(preorder);
    } catch (error) {
      return CommandResult.failure<Preorder>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating preorder",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
