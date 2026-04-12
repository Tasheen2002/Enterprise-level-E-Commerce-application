import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO, Region } from "../../domain/entities/size-guide.entity";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface CreateSizeGuideCommand extends ICommand {
  title: string;
  bodyHtml?: string;
  region: Region;
  category?: string;
}

export class CreateSizeGuideHandler implements ICommandHandler<CreateSizeGuideCommand, CommandResult<SizeGuideDTO>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: CreateSizeGuideCommand): Promise<CommandResult<SizeGuideDTO>> {
    const dto = await this.sizeGuideManagementService.createSizeGuide(command);
    return CommandResult.success(dto);
  }
}
