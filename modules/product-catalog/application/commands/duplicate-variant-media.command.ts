import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface DuplicateVariantMediaCommand extends ICommand {
  readonly sourceVariantId: string;
  readonly targetVariantId: string;
}

export class DuplicateVariantMediaHandler implements ICommandHandler<DuplicateVariantMediaCommand, CommandResult<void>> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(command: DuplicateVariantMediaCommand): Promise<CommandResult<void>> {
    await this.variantMediaManagementService.duplicateVariantMedia(command.sourceVariantId, command.targetVariantId);
    return CommandResult.success(undefined);
  }
}
