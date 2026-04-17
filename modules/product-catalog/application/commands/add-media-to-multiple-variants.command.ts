import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface AddMediaToMultipleVariantsCommand extends ICommand {
  readonly variantIds: string[];
  readonly assetId: string;
}

export class AddMediaToMultipleVariantsHandler implements ICommandHandler<AddMediaToMultipleVariantsCommand, CommandResult<void>> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(command: AddMediaToMultipleVariantsCommand): Promise<CommandResult<void>> {
    await this.variantMediaManagementService.addMediaToMultipleVariants(command.variantIds, command.assetId);
    return CommandResult.success(undefined);
  }
}
