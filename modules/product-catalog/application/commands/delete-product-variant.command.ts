import { VariantManagementService } from "../services/variant-management.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface DeleteProductVariantCommand extends ICommand {
  variantId: string;
}

export class DeleteProductVariantHandler implements ICommandHandler<
  DeleteProductVariantCommand,
  CommandResult<boolean>
> {
  constructor(
    private readonly variantManagementService: VariantManagementService,
  ) {}

  async handle(
    command: DeleteProductVariantCommand,
  ): Promise<CommandResult<boolean>> {
    try {
      if (!command.variantId) {
        return CommandResult.failure<boolean>("Variant ID is required", [
          "variantId",
        ]);
      }

      await this.variantManagementService.deleteVariant(command.variantId);
      return CommandResult.success<boolean>(true);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<boolean>("Variant deletion failed", [
          error.message,
        ]);
      }

      return CommandResult.failure<boolean>(
        "An unexpected error occurred during variant deletion",
      );
    }
  }
}
