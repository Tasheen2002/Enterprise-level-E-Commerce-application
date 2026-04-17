import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface SetVariantMediaCommand extends ICommand {
  readonly variantId: string;
  readonly assetIds: string[];
}

export class SetVariantMediaHandler implements ICommandHandler<SetVariantMediaCommand, CommandResult<void>> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(command: SetVariantMediaCommand): Promise<CommandResult<void>> {
    await this.variantMediaManagementService.setVariantMedia(command.variantId, command.assetIds);
    return CommandResult.success(undefined);
  }
}
