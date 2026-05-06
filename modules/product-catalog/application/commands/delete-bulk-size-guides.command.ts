import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import {
  SizeGuideManagementService,
  BatchDeleteSizeGuideResult,
} from "../services/size-guide-management.service";

export interface DeleteBulkSizeGuidesCommand extends ICommand {
  readonly ids: string[];
}

export class DeleteBulkSizeGuidesHandler implements ICommandHandler<DeleteBulkSizeGuidesCommand, CommandResult<BatchDeleteSizeGuideResult>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: DeleteBulkSizeGuidesCommand): Promise<CommandResult<BatchDeleteSizeGuideResult>> {
    const result = await this.sizeGuideManagementService.deleteMultipleSizeGuides(command.ids);
    return CommandResult.success(result);
  }
}
