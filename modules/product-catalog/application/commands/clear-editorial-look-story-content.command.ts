import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface ClearEditorialLookStoryContentCommand extends ICommand {
  readonly id: string;
}

export class ClearEditorialLookStoryContentHandler implements ICommandHandler<ClearEditorialLookStoryContentCommand, CommandResult<void>> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(command: ClearEditorialLookStoryContentCommand): Promise<CommandResult<void>> {
    await this.editorialLookManagementService.clearStoryContent(command.id);
    return CommandResult.success(undefined);
  }
}
