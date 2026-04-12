import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO, Region } from "../../domain/entities/size-guide.entity";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface CreateRegionalSizeGuideCommand extends ICommand {
  region: Region;
  title: string;
  bodyHtml?: string;
  category?: string;
}

export class CreateRegionalSizeGuideHandler implements ICommandHandler<CreateRegionalSizeGuideCommand, CommandResult<SizeGuideDTO>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: CreateRegionalSizeGuideCommand): Promise<CommandResult<SizeGuideDTO>> {
    const { region, ...data } = command;
    const dto = await this.sizeGuideManagementService.createRegionalSizeGuide(region, data);
    return CommandResult.success(dto);
  }
}
