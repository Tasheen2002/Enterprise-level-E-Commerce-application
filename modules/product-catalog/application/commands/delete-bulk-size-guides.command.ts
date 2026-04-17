import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface DeleteBulkSizeGuidesCommand extends ICommand {
  readonly ids: string[];
}

export class DeleteBulkSizeGuidesHandler implements ICommandHandler<DeleteBulkSizeGuidesCommand, CommandResult<void>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: DeleteBulkSizeGuidesCommand): Promise<CommandResult<void>> {
    await this.sizeGuideManagementService.deleteMultipleSizeGuides(command.ids);
    return CommandResult.success(undefined);
  }
}
