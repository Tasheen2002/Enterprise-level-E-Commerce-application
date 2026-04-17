import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface AddMultipleMediaToVariantCommand extends ICommand {
  readonly variantId: string;
  readonly assetIds: string[];
}

export class AddMultipleMediaToVariantHandler implements ICommandHandler<AddMultipleMediaToVariantCommand, CommandResult<void>> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(command: AddMultipleMediaToVariantCommand): Promise<CommandResult<void>> {
    await this.variantMediaManagementService.addMultipleMediaToVariant(command.variantId, command.assetIds);
    return CommandResult.success(undefined);
  }
}
