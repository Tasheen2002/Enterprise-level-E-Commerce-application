import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO } from "../../domain/entities/size-guide.entity";
import { Region } from "../../domain/value-objects";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface UpdateSizeGuideCommand extends ICommand {
  readonly id: string;
  readonly title?: string;
  readonly bodyHtml?: string;
  readonly region?: Region;
  readonly category?: string;
}

export class UpdateSizeGuideHandler implements ICommandHandler<UpdateSizeGuideCommand, CommandResult<SizeGuideDTO>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: UpdateSizeGuideCommand): Promise<CommandResult<SizeGuideDTO>> {
    const { id, ...updates } = command;
    const dto = await this.sizeGuideManagementService.updateSizeGuide(id, updates);
    return CommandResult.success(dto);
  }
}
