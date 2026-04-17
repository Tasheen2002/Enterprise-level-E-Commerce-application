import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO } from "../../domain/entities/size-guide.entity";
import { Region } from "../../domain/enums/product-catalog.enums";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface CreateRegionalSizeGuideCommand extends ICommand {
  readonly region: Region;
  readonly title: string;
  readonly bodyHtml?: string;
  readonly category?: string;
}

export class CreateRegionalSizeGuideHandler implements ICommandHandler<CreateRegionalSizeGuideCommand, CommandResult<SizeGuideDTO>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: CreateRegionalSizeGuideCommand): Promise<CommandResult<SizeGuideDTO>> {
    const { region, ...data } = command;
    const dto = await this.sizeGuideManagementService.createRegionalSizeGuide(region, data);
    return CommandResult.success(dto);
  }
}
