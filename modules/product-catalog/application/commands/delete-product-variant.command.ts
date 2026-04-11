import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { VariantManagementService } from "../services/variant-management.service";

export interface DeleteProductVariantInput extends ICommand {
  variantId: string;
}

export class DeleteProductVariantHandler implements ICommandHandler<DeleteProductVariantInput, CommandResult<void>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(input: DeleteProductVariantInput): Promise<CommandResult<void>> {
    await this.variantManagementService.deleteVariant(input.variantId);
    return CommandResult.success(undefined);
  }
}
