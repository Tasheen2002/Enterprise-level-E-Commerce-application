import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface RemoveEditorialLookHeroImageCommand extends ICommand {
  readonly id: string;
}

export class RemoveEditorialLookHeroImageHandler implements ICommandHandler<RemoveEditorialLookHeroImageCommand, CommandResult<void>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: RemoveEditorialLookHeroImageCommand): Promise<CommandResult<void>> {
    await this.editorialLookManagementService.removeHeroImage(command.id);
    return CommandResult.success(undefined);
  }
}
