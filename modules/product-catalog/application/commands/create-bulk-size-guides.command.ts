import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import {
  SizeGuideManagementService,
  CreateSizeGuideData,
  BatchCreateSizeGuideResult,
} from "../services/size-guide-management.service";

export interface CreateBulkSizeGuidesCommand extends ICommand {
  readonly guides: CreateSizeGuideData[];
}

export class CreateBulkSizeGuidesHandler implements ICommandHandler<CreateBulkSizeGuidesCommand, CommandResult<BatchCreateSizeGuideResult>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: CreateBulkSizeGuidesCommand): Promise<CommandResult<BatchCreateSizeGuideResult>> {
    const result = await this.sizeGuideManagementService.createMultipleSizeGuides(command.guides);
    return CommandResult.success(result);
  }
}
