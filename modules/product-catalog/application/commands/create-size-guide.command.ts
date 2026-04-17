import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO } from "../../domain/entities/size-guide.entity";
import { Region } from "../../domain/enums/product-catalog.enums";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface CreateSizeGuideCommand extends ICommand {
  readonly title: string;
  readonly bodyHtml?: string;
  readonly region: Region;
  readonly category?: string;
}

export class CreateSizeGuideHandler implements ICommandHandler<CreateSizeGuideCommand, CommandResult<SizeGuideDTO>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: CreateSizeGuideCommand): Promise<CommandResult<SizeGuideDTO>> {
    const dto = await this.sizeGuideManagementService.createSizeGuide(command);
    return CommandResult.success(dto);
  }
}
