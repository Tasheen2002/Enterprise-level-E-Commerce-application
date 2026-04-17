import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface DeleteSizeGuideCommand extends ICommand {
  readonly id: string;
}

export class DeleteSizeGuideHandler implements ICommandHandler<DeleteSizeGuideCommand, CommandResult<void>> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(command: DeleteSizeGuideCommand): Promise<CommandResult<void>> {
    await this.sizeGuideManagementService.deleteSizeGuide(command.id);
    return CommandResult.success(undefined);
  }
}
