import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface RemoveAllVariantMediaCommand extends ICommand {
  readonly variantId: string;
}

export class RemoveAllVariantMediaHandler implements ICommandHandler<RemoveAllVariantMediaCommand, CommandResult<void>> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(command: RemoveAllVariantMediaCommand): Promise<CommandResult<void>> {
    await this.variantMediaManagementService.removeAllVariantMedia(command.variantId);
    return CommandResult.success(undefined);
  }
}
