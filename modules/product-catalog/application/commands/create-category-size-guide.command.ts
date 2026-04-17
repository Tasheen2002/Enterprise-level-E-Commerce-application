import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO } from "../../domain/entities/size-guide.entity";
import { Region } from "../../domain/enums/product-catalog.enums";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface CreateCategorySizeGuideCommand extends ICommand {
  readonly category: string;
  readonly region: Region;
  readonly title: string;
  readonly bodyHtml?: string;
}

export class CreateCategorySizeGuideHandler implements ICommandHandler<CreateCategorySizeGuideCommand, CommandResult<SizeGuideDTO>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: CreateCategorySizeGuideCommand): Promise<CommandResult<SizeGuideDTO>> {
    const { category, region, ...data } = command;
    const dto = await this.sizeGuideManagementService.createCategorySizeGuide(
      decodeURIComponent(category),
      region,
      data,
    );
    return CommandResult.success(dto);
  }
}
