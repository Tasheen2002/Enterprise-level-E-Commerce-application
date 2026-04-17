import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO } from "../../domain/entities/size-guide.entity";
import { Region } from "../../domain/enums/product-catalog.enums";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface CreateBulkSizeGuidesCommand extends ICommand {
  readonly guides: Array<{ title: string; bodyHtml?: string; region: Region; category?: string }>;
}

export interface CreateBulkSizeGuidesResult {
  readonly created: SizeGuideDTO[];
  readonly skipped: Array<{ title: string; reason: string }>;
}

export class CreateBulkSizeGuidesHandler implements ICommandHandler<CreateBulkSizeGuidesCommand, CommandResult<CreateBulkSizeGuidesResult>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: CreateBulkSizeGuidesCommand): Promise<CommandResult<CreateBulkSizeGuidesResult>> {
    const result = await this.sizeGuideManagementService.createMultipleSizeGuides(command.guides);
    return CommandResult.success(result);
  }
}
