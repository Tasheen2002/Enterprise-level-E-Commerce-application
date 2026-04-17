import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { VariantManagementService } from "../services/variant-management.service";

export interface DeleteProductVariantCommand extends ICommand {
  readonly variantId: string;
}

export class DeleteProductVariantHandler implements ICommandHandler<DeleteProductVariantCommand, CommandResult<void>> {
  constructor(private readonly variantManagementService: VariantManagementService) {}

  async handle(command: DeleteProductVariantCommand): Promise<CommandResult<void>> {
    await this.variantManagementService.deleteVariant(command.variantId);
    return CommandResult.success(undefined);
  }
}
