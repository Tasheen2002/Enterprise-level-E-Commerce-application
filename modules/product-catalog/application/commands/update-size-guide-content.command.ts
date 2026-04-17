import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO } from "../../domain/entities/size-guide.entity";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface UpdateSizeGuideContentCommand extends ICommand {
  readonly id: string;
  readonly htmlContent: string;
}

export class UpdateSizeGuideContentHandler implements ICommandHandler<UpdateSizeGuideContentCommand, CommandResult<SizeGuideDTO>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: UpdateSizeGuideContentCommand): Promise<CommandResult<SizeGuideDTO>> {
    const dto = await this.sizeGuideManagementService.updateSizeGuideContent(command.id, command.htmlContent);
    return CommandResult.success(dto);
  }
}
