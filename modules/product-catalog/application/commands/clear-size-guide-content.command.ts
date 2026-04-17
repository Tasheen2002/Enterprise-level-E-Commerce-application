import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface ClearSizeGuideContentCommand extends ICommand {
  readonly id: string;
}

export class ClearSizeGuideContentHandler implements ICommandHandler<ClearSizeGuideContentCommand, CommandResult<void>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: ClearSizeGuideContentCommand): Promise<CommandResult<void>> {
    await this.sizeGuideManagementService.clearSizeGuideContent(command.id);
    return CommandResult.success(undefined);
  }
}
