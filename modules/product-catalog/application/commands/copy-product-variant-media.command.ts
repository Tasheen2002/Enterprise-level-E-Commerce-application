import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface CopyProductVariantMediaCommand extends ICommand {
  readonly sourceProductId: string;
  readonly targetProductId: string;
  readonly variantMapping: Record<string, string>;
}

export class CopyProductVariantMediaHandler implements ICommandHandler<CopyProductVariantMediaCommand, CommandResult<void>> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(command: CopyProductVariantMediaCommand): Promise<CommandResult<void>> {
    await this.variantMediaManagementService.copyProductVariantMedia(
      command.sourceProductId,
      command.targetProductId,
      command.variantMapping,
    );
    return CommandResult.success(undefined);
  }
}
