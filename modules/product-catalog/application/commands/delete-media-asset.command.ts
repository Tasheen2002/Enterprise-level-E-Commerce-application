import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { MediaManagementService } from "../services/media-management.service";

export interface DeleteMediaAssetCommand extends ICommand {
  readonly id: string;
}

export class DeleteMediaAssetHandler implements ICommandHandler<DeleteMediaAssetCommand, CommandResult<void>> {
  constructor(private readonly mediaManagementService: MediaManagementService) {}

  async handle(command: DeleteMediaAssetCommand): Promise<CommandResult<void>> {
    await this.mediaManagementService.deleteAsset(command.id);
    return CommandResult.success(undefined);
  }
}
