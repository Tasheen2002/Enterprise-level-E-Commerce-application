import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface RemoveMediaFromVariantCommand extends ICommand {
  readonly variantId: string;
  readonly assetId: string;
}

export class RemoveMediaFromVariantHandler implements ICommandHandler<RemoveMediaFromVariantCommand, CommandResult<void>> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(command: RemoveMediaFromVariantCommand): Promise<CommandResult<void>> {
    await this.variantMediaManagementService.removeMediaFromVariant(command.variantId, command.assetId);
    return CommandResult.success(undefined);
  }
}
