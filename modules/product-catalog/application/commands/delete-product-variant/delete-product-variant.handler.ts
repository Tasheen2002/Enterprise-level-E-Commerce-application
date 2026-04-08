import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { VariantManagementService } from "../../services/variant-management.service";
import { DeleteProductVariantCommand } from "./delete-product-variant.command";

export class DeleteProductVariantHandler implements ICommandHandler<DeleteProductVariantCommand, CommandResult<boolean>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(command: DeleteProductVariantCommand): Promise<CommandResult<boolean>> {
    try {
      await this.variantManagementService.deleteVariant(command.variantId);
      return CommandResult.success<boolean>(true);
    } catch (error) {
      return CommandResult.failure<boolean>(
        error instanceof Error ? error.message : "Variant deletion failed",
      );
    }
  }
}
