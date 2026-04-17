import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface AddMediaToVariantCommand extends ICommand {
  readonly variantId: string;
  readonly assetId: string;
}

export class AddMediaToVariantHandler implements ICommandHandler<AddMediaToVariantCommand, CommandResult<void>> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(command: AddMediaToVariantCommand): Promise<CommandResult<void>> {
    await this.variantMediaManagementService.addMediaToVariant(command.variantId, command.assetId);
    return CommandResult.success(undefined);
  }
}
